import type { Database } from 'better-sqlite3';
import type { SpecVersionRow } from '../../../shared/ipc-payloads';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import * as yaml from 'js-yaml';

/* ── Row mapper ── */

interface RawVersionRow {
  id: string;
  spec_file_id: string;
  version_number: number;
  version_label: string | null;
  content: string;
  content_hash: string;
  change_summary: string | null;
  created_at: number;
  created_by: string;
}

function rowToVersion(r: RawVersionRow): SpecVersionRow {
  return {
    id: r.id,
    specFileId: r.spec_file_id,
    versionNumber: r.version_number,
    versionLabel: r.version_label,
    content: r.content,
    contentHash: r.content_hash,
    changeSummary: r.change_summary,
    createdAt: r.created_at,
    createdBy: r.created_by,
  };
}

/* ── SHA-256 helper ── */
function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/* ── Auto change summary ── */
function generateChangeSummary(prev: string | null, next: string): string {
  if (!prev) return 'Initial version';

  try {
    const prevParsed = yaml.load(prev) as Record<string, unknown> | null;
    const nextParsed = yaml.load(next) as Record<string, unknown> | null;
    if (!prevParsed || !nextParsed) return 'Content updated';

    const changes: string[] = [];

    // Paths diff
    const prevPaths = Object.keys((prevParsed.paths ?? {}) as Record<string, unknown>);
    const nextPaths = Object.keys((nextParsed.paths ?? {}) as Record<string, unknown>);
    const addedPaths = nextPaths.filter((p) => !prevPaths.includes(p));
    const removedPaths = prevPaths.filter((p) => !nextPaths.includes(p));
    if (addedPaths.length) changes.push(`Added paths: ${addedPaths.join(', ')}`);
    if (removedPaths.length) changes.push(`Removed paths: ${removedPaths.join(', ')}`);

    // Version diff
    const prevInfo = (prevParsed.info ?? {}) as Record<string, unknown>;
    const nextInfo = (nextParsed.info ?? {}) as Record<string, unknown>;
    if (prevInfo.version !== nextInfo.version) {
      changes.push(`Version: ${String(prevInfo.version ?? '?')} → ${String(nextInfo.version ?? '?')}`);
    }

    // Schemas diff
    const prevComponents = (prevParsed.components ?? {}) as Record<string, unknown>;
    const nextComponents = (nextParsed.components ?? {}) as Record<string, unknown>;
    const prevSchemas = Object.keys((prevComponents.schemas ?? {}) as Record<string, unknown>);
    const nextSchemas = Object.keys((nextComponents.schemas ?? {}) as Record<string, unknown>);
    const addedSchemas = nextSchemas.filter((s) => !prevSchemas.includes(s));
    const removedSchemas = prevSchemas.filter((s) => !nextSchemas.includes(s));
    if (addedSchemas.length) changes.push(`Added schemas: ${addedSchemas.join(', ')}`);
    if (removedSchemas.length) changes.push(`Removed schemas: ${removedSchemas.join(', ')}`);

    // Line diff
    const prevLines = prev.split('\n').length;
    const nextLines = next.split('\n').length;
    const lineDelta = nextLines - prevLines;
    if (lineDelta !== 0) {
      changes.push(`${lineDelta > 0 ? '+' : ''}${lineDelta} lines`);
    }

    return changes.length > 0 ? changes.join('; ') : 'Minor changes';
  } catch {
    return 'Content updated';
  }
}

/* ── Repository functions ── */

export function getNextVersionNumber(db: Database, specFileId: string): number {
  const row = db
    .prepare('SELECT MAX(version_number) AS max_num FROM spec_versions WHERE spec_file_id = ?')
    .get(specFileId) as { max_num: number | null } | undefined;
  return (row?.max_num ?? 0) + 1;
}

export function getLatestVersion(db: Database, specFileId: string): SpecVersionRow | null {
  const row = db
    .prepare(
      `SELECT id, spec_file_id, version_number, version_label, content, content_hash,
              change_summary, created_at, created_by
       FROM spec_versions WHERE spec_file_id = ?
       ORDER BY version_number DESC LIMIT 1`,
    )
    .get(specFileId) as RawVersionRow | undefined;
  return row ? rowToVersion(row) : null;
}

export function createVersion(
  db: Database,
  specFileId: string,
  content: string,
  label?: string,
  createdBy?: string,
): SpecVersionRow {
  const id = randomUUID();
  const now = Date.now();
  const versionNumber = getNextVersionNumber(db, specFileId);
  const contentHash = sha256(content);

  // Check if content is identical to latest version (skip duplicate)
  const latest = getLatestVersion(db, specFileId);
  if (latest && latest.contentHash === contentHash) {
    return latest; // No change, return existing
  }

  const changeSummary = generateChangeSummary(latest?.content ?? null, content);

  db.prepare(
    `INSERT INTO spec_versions (
       id, spec_file_id, version_number, version_label, content, content_hash,
       change_summary, created_at, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    specFileId,
    versionNumber,
    label ?? null,
    content,
    contentHash,
    changeSummary,
    now,
    createdBy ?? 'local',
  );

  const created = getVersionById(db, id);
  if (!created) throw new Error('Failed to read version after insert');
  return created;
}

export function listVersions(db: Database, specFileId: string): SpecVersionRow[] {
  const rows = db
    .prepare(
      `SELECT id, spec_file_id, version_number, version_label, content, content_hash,
              change_summary, created_at, created_by
       FROM spec_versions WHERE spec_file_id = ?
       ORDER BY version_number DESC`,
    )
    .all(specFileId) as RawVersionRow[];
  return rows.map(rowToVersion);
}

export function getVersionById(db: Database, versionId: string): SpecVersionRow | null {
  const row = db
    .prepare(
      `SELECT id, spec_file_id, version_number, version_label, content, content_hash,
              change_summary, created_at, created_by
       FROM spec_versions WHERE id = ?`,
    )
    .get(versionId) as RawVersionRow | undefined;
  return row ? rowToVersion(row) : null;
}

export function deleteVersion(db: Database, versionId: string): void {
  db.prepare('DELETE FROM spec_versions WHERE id = ?').run(versionId);
}

export function countVersions(db: Database, specFileId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS cnt FROM spec_versions WHERE spec_file_id = ?')
    .get(specFileId) as { cnt: number };
  return row.cnt;
}
