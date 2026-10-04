-- One daily post per market per day; one weekly post per market per week.
CREATE UNIQUE INDEX ux_posts_daily ON posts(market_id, post_date) WHERE type = 'daily';
CREATE UNIQUE INDEX ux_posts_weekly ON posts(market_id, week_start_date) WHERE type = 'weekly';

CREATE INDEX ix_posts_type ON posts(type);
CREATE INDEX ix_posts_market ON posts(market_id);
CREATE INDEX ix_posts_post_date ON posts(post_date);
CREATE INDEX ix_posts_week ON posts(week_start_date);
CREATE INDEX ix_posts_bias ON posts(bias);
CREATE INDEX ix_posts_confidence ON posts(confidence);
CREATE INDEX ix_posts_sentiment ON posts(sentiment);
CREATE INDEX ix_posts_access ON posts(access);
CREATE INDEX ix_posts_status ON posts(status);
CREATE INDEX ix_posts_publish_at ON posts(publish_at);
CREATE INDEX ix_posts_valid_until ON posts(valid_until);
CREATE INDEX ix_posts_analyst ON posts(analyst_id);

CREATE INDEX ix_notes_market ON killzone_notes(market_id);
CREATE INDEX ix_notes_killzone ON killzone_notes(killzone);
CREATE INDEX ix_notes_date ON killzone_notes(note_date);
CREATE INDEX ix_notes_linked ON killzone_notes(linked_post_id);
CREATE INDEX ix_notes_status ON killzone_notes(status);
CREATE INDEX ix_notes_confidence ON killzone_notes(confidence);
CREATE INDEX ix_notes_access ON killzone_notes(access);
CREATE INDEX ix_notes_publish_status ON killzone_notes(publish_status);
CREATE INDEX ix_notes_publish_at ON killzone_notes(publish_at);
CREATE INDEX ix_notes_analyst ON killzone_notes(analyst_id);

CREATE INDEX ix_results_outcome ON results(outcome);
CREATE INDEX ix_results_evaluated_at ON results(evaluated_at);
CREATE INDEX ix_corrections_result ON result_corrections(result_id);

CREATE INDEX ix_attach_owner ON attachments(owner_type, owner_id);
CREATE INDEX ix_attach_sha ON attachments(sha256);
CREATE INDEX ix_attach_uploaded_at ON attachments(uploaded_at);

CREATE INDEX ix_revisions_entity ON post_revisions(entity_type, entity_id);
CREATE INDEX ix_post_tags_tag ON post_tags(tag_id);
CREATE INDEX ix_note_tags_tag ON note_tags(tag_id);
CREATE INDEX ix_events_starts ON events(starts_at);

CREATE INDEX ix_sessions_user ON sessions(user_id);
CREATE INDEX ix_sessions_expires ON sessions(expires_at);
CREATE INDEX ix_magic_email ON magic_link_tokens(email);

CREATE INDEX ix_users_role ON users(role);
CREATE UNIQUE INDEX ux_payments_provider_pid ON payments(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE INDEX ix_payments_user ON payments(user_id);
CREATE INDEX ix_payments_status ON payments(status);
CREATE INDEX ix_payments_created ON payments(created_at);
CREATE INDEX ix_subs_status ON subscriptions(status);
CREATE INDEX ix_subs_expires ON subscriptions(expires_at);

CREATE INDEX ix_bookmarks_entity ON bookmarks(entity_type, entity_id);
CREATE INDEX ix_viewlog_entity ON view_log(entity_type, entity_id);
CREATE INDEX ix_viewlog_user ON view_log(user_id);
CREATE INDEX ix_viewlog_viewed ON view_log(viewed_at);
CREATE INDEX ix_saved_views_user ON saved_views(user_id, scope);
CREATE INDEX ix_audit_user ON audit_log(user_id);
CREATE INDEX ix_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX ix_audit_created ON audit_log(created_at);
