import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import * as os from "os";

export interface CachedField {
  id: number;
  name: string;
  display_name: string;
  base_type: string;
  semantic_type: string | null;
}

export interface CachedTable {
  id: number;
  name: string;
  display_name: string;
  schema: string | null;
  fields: CachedField[];
}

export interface DatabaseSchema {
  cached_at: string;
  metabase_url: string;
  database_id: number;
  database_name: string;
  tables: CachedTable[];
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCacheDir(metabaseUrl: string): string {
  const urlHash = crypto
    .createHash("sha256")
    .update(metabaseUrl)
    .digest("hex")
    .slice(0, 12);
  return path.join(os.homedir(), ".easecloud", "metabase-mcp", "cache", urlHash);
}

function getCacheFilePath(metabaseUrl: string, databaseId: number): string {
  return path.join(getCacheDir(metabaseUrl), `database_${databaseId}.json`);
}

// Fix 5: moved above readSchemaCache so it is defined before use
export function isCacheStale(schema: DatabaseSchema): boolean {
  return Date.now() - new Date(schema.cached_at).getTime() > TTL_MS;
}

export async function readSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<DatabaseSchema | null> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const schema: DatabaseSchema = JSON.parse(raw);

    // Fix 3: minimal shape validation before trusting the payload
    if (
      typeof schema.cached_at !== "string" ||
      typeof schema.database_id !== "number" ||
      !Array.isArray(schema.tables)
    ) {
      return null;
    }

    // Fix 2: guard against NaN (unparseable date) and delegate to isCacheStale (Fix 5)
    const age = Date.now() - new Date(schema.cached_at).getTime();
    if (isNaN(age) || isCacheStale(schema)) return null;

    return schema;
  } catch (err: unknown) {
    // Fix 2: distinguish ENOENT from unexpected errors
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      // unexpected error (permission denied, malformed JSON, etc.) — log or handle upstream
    }
    return null;
  }
}

export async function writeSchemaCache(
  metabaseUrl: string,
  schema: DatabaseSchema
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, schema.database_id);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Fix 1: write to a .tmp file first, then atomically rename to the real path
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(schema, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function deleteSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    // Fix 4: only swallow ENOENT; re-throw anything unexpected
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}

export function getCachePath(metabaseUrl: string): string {
  return getCacheDir(metabaseUrl);
}
