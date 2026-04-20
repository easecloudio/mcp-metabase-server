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

export async function readSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<DatabaseSchema | null> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const schema: DatabaseSchema = JSON.parse(raw);
    const age = Date.now() - new Date(schema.cached_at).getTime();
    if (age > TTL_MS) return null;
    return schema;
  } catch {
    return null;
  }
}

export async function writeSchemaCache(
  metabaseUrl: string,
  schema: DatabaseSchema
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, schema.database_id);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(schema, null, 2), "utf-8");
}

export async function deleteSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    await fs.unlink(filePath);
  } catch {
    // already gone
  }
}

export function isCacheStale(schema: DatabaseSchema): boolean {
  return Date.now() - new Date(schema.cached_at).getTime() > TTL_MS;
}

export function getCachePath(metabaseUrl: string): string {
  return getCacheDir(metabaseUrl);
}
