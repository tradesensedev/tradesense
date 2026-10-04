-- ===== RESULTS: immutable, only on published + expired posts =====
CREATE TRIGGER trg_results_no_update BEFORE UPDATE ON results
BEGIN SELECT RAISE(ABORT, 'immutable: results cannot be updated, add a correction instead'); END;

CREATE TRIGGER trg_results_no_delete BEFORE DELETE ON results
BEGIN SELECT RAISE(ABORT, 'immutable: results cannot be deleted'); END;

CREATE TRIGGER trg_results_post_published BEFORE INSERT ON results
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id AND status = 'published')
BEGIN SELECT RAISE(ABORT, 'rule: result requires a published post'); END;

CREATE TRIGGER trg_results_post_expired BEFORE INSERT ON results
WHEN EXISTS (
  SELECT 1 FROM posts
  WHERE id = NEW.post_id AND valid_until IS NOT NULL
    AND valid_until > strftime('%Y-%m-%dT%H:%M:%fZ','now')
)
BEGIN SELECT RAISE(ABORT, 'rule: result allowed only after valid_until'); END;

CREATE TRIGGER trg_corrections_no_update BEFORE UPDATE ON result_corrections
BEGIN SELECT RAISE(ABORT, 'immutable: corrections cannot be updated'); END;

CREATE TRIGGER trg_corrections_no_delete BEFORE DELETE ON result_corrections
BEGIN SELECT RAISE(ABORT, 'immutable: corrections cannot be deleted'); END;

-- ===== APPEND-ONLY LOGS =====
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'immutable: audit_log is append-only'); END;

CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'immutable: audit_log is append-only'); END;

CREATE TRIGGER trg_revisions_no_update BEFORE UPDATE ON post_revisions
BEGIN SELECT RAISE(ABORT, 'immutable: revisions are append-only'); END;

CREATE TRIGGER trg_revisions_no_delete BEFORE DELETE ON post_revisions
BEGIN SELECT RAISE(ABORT, 'immutable: revisions are append-only'); END;

-- ===== POSTS: lock core fields after publish =====
CREATE TRIGGER trg_posts_lock_core BEFORE UPDATE ON posts
WHEN OLD.status = 'published' AND (
  NEW.market_id IS NOT OLD.market_id OR
  NEW.type IS NOT OLD.type OR
  NEW.post_date IS NOT OLD.post_date OR
  NEW.week_start_date IS NOT OLD.week_start_date OR
  NEW.bias IS NOT OLD.bias OR
  NEW.confidence IS NOT OLD.confidence OR
  NEW.valid_from IS NOT OLD.valid_from OR
  NEW.valid_until IS NOT OLD.valid_until OR
  NEW.status IS NOT 'published'
)
BEGIN SELECT RAISE(ABORT, 'locked: core fields of a published post cannot change'); END;

CREATE TRIGGER trg_posts_no_delete_published BEFORE DELETE ON posts
WHEN OLD.status = 'published'
BEGIN SELECT RAISE(ABORT, 'locked: published posts cannot be deleted'); END;

-- ===== NOTES: validate link, lock after publish =====
CREATE TRIGGER trg_notes_link_insert BEFORE INSERT ON killzone_notes
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.linked_post_id AND market_id = NEW.market_id)
BEGIN SELECT RAISE(ABORT, 'rule: linked post must exist and belong to the same market'); END;

CREATE TRIGGER trg_notes_link_update BEFORE UPDATE OF linked_post_id, market_id ON killzone_notes
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.linked_post_id AND market_id = NEW.market_id)
BEGIN SELECT RAISE(ABORT, 'rule: linked post must exist and belong to the same market'); END;

CREATE TRIGGER trg_notes_lock_core BEFORE UPDATE ON killzone_notes
WHEN OLD.publish_status = 'published' AND (
  NEW.status IS NOT OLD.status OR
  NEW.linked_post_id IS NOT OLD.linked_post_id OR
  NEW.market_id IS NOT OLD.market_id OR
  NEW.killzone IS NOT OLD.killzone OR
  NEW.publish_status IS NOT 'published'
)
BEGIN SELECT RAISE(ABORT, 'locked: core fields of a published note cannot change'); END;

CREATE TRIGGER trg_notes_no_delete_published BEFORE DELETE ON killzone_notes
WHEN OLD.publish_status = 'published'
BEGIN SELECT RAISE(ABORT, 'locked: published notes cannot be deleted'); END;

-- ===== ATTACHMENTS: lock rules =====
CREATE TRIGGER trg_attach_no_delete_locked BEFORE DELETE ON attachments
WHEN OLD.locked = 1
BEGIN SELECT RAISE(ABORT, 'locked: attachment cannot be deleted'); END;

CREATE TRIGGER trg_attach_lock_fields BEFORE UPDATE ON attachments
WHEN OLD.locked = 1 AND (
  NEW.r2_key IS NOT OLD.r2_key OR
  NEW.sha256 IS NOT OLD.sha256 OR
  NEW.mime IS NOT OLD.mime OR
  NEW.size IS NOT OLD.size OR
  NEW.owner_type IS NOT OLD.owner_type OR
  NEW.owner_id IS NOT OLD.owner_id OR
  NEW.kind IS NOT OLD.kind OR
  NEW.uploaded_at IS NOT OLD.uploaded_at OR
  NEW.locked IS NOT 1
)
BEGIN SELECT RAISE(ABORT, 'locked: attachment file cannot be replaced or unlocked'); END;

-- New attachments on result, or on an already-published post/note, are locked at once.
CREATE TRIGGER trg_attach_autolock_insert AFTER INSERT ON attachments
WHEN NEW.owner_type = 'result'
  OR (NEW.owner_type = 'post' AND EXISTS (SELECT 1 FROM posts WHERE id = NEW.owner_id AND status = 'published'))
  OR (NEW.owner_type = 'note' AND EXISTS (SELECT 1 FROM killzone_notes WHERE id = NEW.owner_id AND publish_status = 'published'))
BEGIN UPDATE attachments SET locked = 1 WHERE id = NEW.id; END;

-- When a post/note becomes published, lock all its attachments.
CREATE TRIGGER trg_post_publish_lock_attach AFTER UPDATE OF status ON posts
WHEN OLD.status <> 'published' AND NEW.status = 'published'
BEGIN UPDATE attachments SET locked = 1 WHERE owner_type = 'post' AND owner_id = NEW.id; END;

CREATE TRIGGER trg_note_publish_lock_attach AFTER UPDATE OF publish_status ON killzone_notes
WHEN OLD.publish_status <> 'published' AND NEW.publish_status = 'published'
BEGIN UPDATE attachments SET locked = 1 WHERE owner_type = 'note' AND owner_id = NEW.id; END;
