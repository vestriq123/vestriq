import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class BaseRepository {
  protected db = db;
  protected logger = logger;

  // Global helper to filter out soft-deleted records.
  protected excludeDeleted<T extends Record<string, unknown>>(whereClause: T): T & { deletedAt: null } {
    return {
      ...whereClause,
      deletedAt: null,
    };
  }

  protected logQueryDuration(action: string, durationMs: number) {
    if (durationMs > 100) {
      this.logger.warn(`Slow query detected | ${action} took ${durationMs}ms`);
    } else {
      this.logger.debug(`Query completed | ${action} took ${durationMs}ms`);
    }
  }
}
export default BaseRepository;
