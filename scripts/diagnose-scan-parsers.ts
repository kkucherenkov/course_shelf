#!/usr/bin/env node
/**
 * Diagnostic runner for the library scan parsers.
 *
 * Walks a real library tree (default: /Volumes/Shared2/Courses) and exercises
 * the same domain parsers RunScanHandler would call:
 *   - parseFolderName     (top-level course folders + section folders)
 *   - parseLessonFileName (every video-looking file)
 *   - stemMatch           (every non-course.json file)
 *   - parseCourseJson     (every course.json found)
 *
 * No DB, no HTTP, no ffmpeg. Pure offline parse-only sanity check.
 *
 * Usage:
 *   node --experimental-strip-types scripts/diagnose-scan-parsers.ts [rootPath]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

const PARSER_PATH = path.join(
  repo,
  'apps/backend/src/modules/catalog/domain/scan/folder-name.parser.ts',
);
const STEM_PATH = path.join(repo, 'apps/backend/src/modules/catalog/domain/scan/stem-match.ts');

const { parseFolderName, parseLessonFileName } = (await import(
  PARSER_PATH
)) as typeof import('../apps/backend/src/modules/catalog/domain/scan/folder-name.parser');
const { stemMatch } = (await import(
  STEM_PATH
)) as typeof import('../apps/backend/src/modules/catalog/domain/scan/stem-match');

const ROOT = path.resolve(process.argv[2] ?? '/Volumes/Shared2/Courses');

if (!safeStat(ROOT)?.isDirectory()) {
  console.error(`Root not found or not a directory: ${ROOT}`);
  process.exit(1);
}

interface FolderResult {
  name: string;
  parsed: ReturnType<typeof parseFolderName>;
}

interface FileResult {
  name: string;
  ext: string;
  stem: ReturnType<typeof stemMatch>;
  lesson?: ReturnType<typeof parseLessonFileName>;
}

interface CourseSummary {
  topFolder: string;
  topParsed: FolderResult['parsed'];
  hasCourseJson: boolean;
  courseJsonStatus: 'absent' | 'ok' | 'invalid';
  courseJsonError?: string;
  sectionFolders: FolderResult[];
  files: FileResult[];
  rootFiles: FileResult[];
}

const courses: CourseSummary[] = [];
const rootLooseFiles: FileResult[] = [];

for (const entry of readdirSync(ROOT)) {
  const full = path.join(ROOT, entry);
  const st = safeStat(full);
  if (!st) continue;

  if (st.isFile()) {
    rootLooseFiles.push(makeFileResult(full));
    continue;
  }

  if (!st.isDirectory()) continue;

  const summary: CourseSummary = {
    topFolder: entry,
    topParsed: parseFolderName(entry),
    hasCourseJson: false,
    courseJsonStatus: 'absent',
    sectionFolders: [],
    files: [],
    rootFiles: [],
  };

  walkCourse(full, summary);
  courses.push(summary);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const w = (s: string) => process.stdout.write(`${s}\n`);

const totalCourses = courses.length;
const courseTitleSources = {
  fromCourseJson: courses.filter((c) => c.courseJsonStatus === 'ok').length,
  invalidCourseJson: courses.filter((c) => c.courseJsonStatus === 'invalid').length,
  fromFolderOnly: courses.filter((c) => c.courseJsonStatus === 'absent').length,
};

const allFiles = courses.flatMap((c) => [...c.rootFiles, ...c.files]);
const allSectionFolders = courses.flatMap((c) => c.sectionFolders);

const fileKindCounts = {
  video: 0,
  material: 0,
  subtitle: 0,
  unsupported: 0,
  ignored: 0,
};
for (const f of allFiles) fileKindCounts[f.stem.kind]++;

const unsupportedExtTally = new Map<string, number>();
for (const f of allFiles) {
  if (f.stem.kind === 'unsupported') {
    unsupportedExtTally.set(f.ext, (unsupportedExtTally.get(f.ext) ?? 0) + 1);
  }
}
const unsupportedExtSorted = [...unsupportedExtTally.entries()].sort((a, b) => b[1] - a[1]);

const topFoldersWithOrdinal = courses.filter((c) => c.topParsed.ordinal !== undefined).length;
const sectionFoldersWithOrdinal = allSectionFolders.filter(
  (s) => s.parsed.ordinal !== undefined,
).length;
const lessonFilesWithOrdinal = allFiles.filter((f) => f.lesson?.ordinal !== undefined).length;
const lessonFilesTotal = allFiles.filter((f) => f.stem.kind === 'video').length;

// "Suspicious" — looks like it has an ordinal pattern that the parser missed.
const SUSPICIOUS_RE = /^\s*\d+\b/;
const suspiciousFolders = [
  ...courses
    .filter((c) => SUSPICIOUS_RE.test(c.topFolder) && c.topParsed.ordinal === undefined)
    .map((c) => ({ where: 'top', name: c.topFolder })),
  ...allSectionFolders
    .filter((s) => SUSPICIOUS_RE.test(s.name) && s.parsed.ordinal === undefined)
    .map((s) => ({ where: 'section', name: s.name })),
];
const suspiciousFiles = allFiles.filter((f) => {
  if (f.stem.kind !== 'video') return false;
  if (f.lesson?.ordinal !== undefined) return false;
  if (f.lesson?.sectionOrdinal !== undefined) return false;
  return SUSPICIOUS_RE.test(f.name);
});

w('');
w(`════════════════════════════════════════════════════════════════════════════`);
w(`  Library scan parser diagnostic — ${ROOT}`);
w(`════════════════════════════════════════════════════════════════════════════`);
w('');
w(`Top-level course folders : ${totalCourses}`);
w(`  with parsed ordinal     : ${topFoldersWithOrdinal}`);
w(`  bare title (no ordinal) : ${totalCourses - topFoldersWithOrdinal}`);
w(`  course.json present/ok  : ${courseTitleSources.fromCourseJson}`);
w(`  course.json invalid     : ${courseTitleSources.invalidCourseJson}`);
w(`  course.json absent      : ${courseTitleSources.fromFolderOnly}`);
w('');
w(`Section folders          : ${allSectionFolders.length}`);
w(`  with parsed ordinal    : ${sectionFoldersWithOrdinal}`);
w(`  bare                    : ${allSectionFolders.length - sectionFoldersWithOrdinal}`);
w('');
w(`Files (across all courses): ${allFiles.length}`);
w(
  `  videos      : ${fileKindCounts.video}  (with ordinal: ${lessonFilesWithOrdinal} / ${lessonFilesTotal})`,
);
w(`  materials   : ${fileKindCounts.material}`);
w(`  subtitles   : ${fileKindCounts.subtitle}`);
w(`  ignored     : ${fileKindCounts.ignored}`);
w(`  UNSUPPORTED : ${fileKindCounts.unsupported}`);
w('');

if (rootLooseFiles.length > 0) {
  w(`Loose files at library root (skipped by scanner): ${rootLooseFiles.length}`);
  for (const f of rootLooseFiles.slice(0, 8)) {
    w(`  - ${f.name}  [${f.ext || '<no-ext>'}]`);
  }
  if (rootLooseFiles.length > 8) w(`  … +${rootLooseFiles.length - 8} more`);
  w('');
}

if (unsupportedExtSorted.length > 0) {
  w(`Top unsupported extensions (would emit ScanError):`);
  for (const [ext, n] of unsupportedExtSorted.slice(0, 15)) {
    w(`  ${ext.padEnd(10)} ${n}`);
  }
  w('');
}

if (suspiciousFolders.length > 0) {
  w(`SUSPICIOUS folders — leading digit but no ordinal extracted (${suspiciousFolders.length}):`);
  for (const f of dedupeBy(suspiciousFolders, (x) => x.name).slice(0, 30)) {
    w(`  [${f.where}] ${f.name}`);
  }
  if (suspiciousFolders.length > 30) {
    w(`  … +${suspiciousFolders.length - 30} more`);
  }
  w('');
}

if (suspiciousFiles.length > 0) {
  w(
    `SUSPICIOUS lesson files — leading digit but no ordinal extracted (${suspiciousFiles.length}):`,
  );
  const sample = dedupeBy(suspiciousFiles, (x) => x.name).slice(0, 30);
  for (const f of sample) {
    w(`  ${f.name}`);
  }
  if (suspiciousFiles.length > 30) {
    w(`  … +${suspiciousFiles.length - 30} more`);
  }
  w('');
}

// Detailed per-course view (compact).
w(`────── Per-course breakdown ──────`);
for (const c of courses) {
  const topOrd = c.topParsed.ordinal ?? '·';
  const cj =
    c.courseJsonStatus === 'ok'
      ? 'json:ok'
      : c.courseJsonStatus === 'invalid'
        ? `json:INVALID(${c.courseJsonError ?? '?'})`
        : 'json:—';
  const kindCounts = countKinds([...c.rootFiles, ...c.files]);
  const summary =
    `vid=${kindCounts.video}` +
    ` mat=${kindCounts.material}` +
    ` sub=${kindCounts.subtitle}` +
    (kindCounts.unsupported ? ` UNS=${kindCounts.unsupported}` : '') +
    (kindCounts.ignored ? ` ign=${kindCounts.ignored}` : '') +
    ` sec=${c.sectionFolders.length}`;

  w(`  [${String(topOrd).padStart(3)}] ${c.topFolder}`);
  w(`        ${cj}  ${summary}  parsedTitle="${c.topParsed.label}"`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StatLike {
  isDirectory(): boolean;
  isFile(): boolean;
}

function safeStat(p: string): StatLike | null {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function makeFileResult(absPath: string): FileResult {
  const name = path.basename(absPath);
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot === -1 ? '' : name.slice(lastDot).toLowerCase();
  const stem = stemMatch(absPath);
  const lesson = ext ? parseLessonFileName(name) : undefined;
  return { name, ext, stem, lesson };
}

function walkCourse(courseDir: string, summary: CourseSummary): void {
  let children: string[];
  try {
    children = readdirSync(courseDir);
  } catch {
    return;
  }

  for (const child of children) {
    const full = path.join(courseDir, child);
    const st = safeStat(full);
    if (!st) continue;

    if (st.isFile()) {
      if (child === 'course.json') {
        summary.hasCourseJson = true;
        try {
          const raw = readFileSync(full, 'utf8');
          const parsed = JSON.parse(raw) as unknown;
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'schemaVersion' in parsed &&
            (parsed as Record<string, unknown>)['schemaVersion'] === 1 &&
            typeof (parsed as Record<string, unknown>)['title'] === 'string'
          ) {
            summary.courseJsonStatus = 'ok';
          } else {
            summary.courseJsonStatus = 'invalid';
            summary.courseJsonError = 'shape mismatch';
          }
        } catch (e) {
          summary.courseJsonStatus = 'invalid';
          summary.courseJsonError = e instanceof Error ? e.message : String(e);
        }
        continue;
      }
      summary.rootFiles.push(makeFileResult(full));
      continue;
    }

    if (st.isDirectory()) {
      summary.sectionFolders.push({ name: child, parsed: parseFolderName(child) });
      // Recurse one more level (sections often hold lesson files; deeper trees
      // exist but are rare — we still recurse so the file totals are accurate).
      walkSection(full, summary);
    }
  }
}

function walkSection(dir: string, summary: CourseSummary): void {
  let children: string[];
  try {
    children = readdirSync(dir);
  } catch {
    return;
  }
  for (const child of children) {
    const full = path.join(dir, child);
    const st = safeStat(full);
    if (!st) continue;
    if (st.isFile()) {
      summary.files.push(makeFileResult(full));
    } else if (st.isDirectory()) {
      summary.sectionFolders.push({ name: child, parsed: parseFolderName(child) });
      walkSection(full, summary);
    }
  }
}

function countKinds(files: FileResult[]): Record<string, number> {
  const out = { video: 0, material: 0, subtitle: 0, unsupported: 0, ignored: 0 };
  for (const f of files) out[f.stem.kind]++;
  return out;
}

function dedupeBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}
