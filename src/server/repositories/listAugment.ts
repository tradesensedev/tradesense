import type { ListRepository } from "./listTypes";

// Adds `lists` to the Repositories interface declared in ./types (Phase 3). Declaration merging, so types.ts stays untouched.
declare module "./types" {
  interface Repositories {
    lists: ListRepository;
  }
}
