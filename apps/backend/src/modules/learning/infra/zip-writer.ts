/**
 * WHY this file exists:
 * Streams an ExportBundle into an HTTP response as a ZIP archive (D7:
 * `yazl` — Node ships `zlib`, which compresses bytes but writes no ZIP
 * container). No port/adapter pair here: there is exactly one call site and
 * no reason to fake this in a test — the ExportController tests below
 * exercise the real `yazl` output and unzip it back, same as
 * PrismaService's raw `createReadStream` calls elsewhere in this codebase
 * (StreamingController) are never abstracted behind a token either.
 *
 * Streams straight into `res` — never buffers a whole course export into a
 * Buffer first, which matters once a course export means dozens of lesson
 * files.
 */
import { ZipFile } from 'yazl';

import type { ExportBundle } from '../domain/export/export-bundle';
import type { Response } from 'express';

// A header value may only carry latin1 bytes; Node throws ERR_INVALID_CHAR on
// anything else. `slugifyForFilename` deliberately keeps `\p{L}\p{N}` — letters
// of any script — because that slug names files *inside* the archive, where
// UTF-8 is unremarkable. Sending the same slug raw in `Content-Disposition`
// therefore 500s every non-ASCII title: 32 of the 68 courses in the production
// dump (#790), on a library that is roughly half Russian.
//
// RFC 6266 §4.1 answers exactly this: send both parameters. `filename=` carries
// an ASCII-only fallback for clients that predate the extension, `filename*=`
// carries the real name percent-encoded per RFC 5987, and every current browser
// prefers the latter. The slug is left alone — mangling it to satisfy a header
// would degrade the names inside the archive too.
const NON_ASCII_RE = /[^\u0020-\u007E]/g;
// `"` and `\` would terminate or escape out of the quoted-string.
const QUOTED_STRING_UNSAFE_RE = /["\\]/g;
// RFC 5987's attr-char set excludes these four and `encodeURIComponent` leaves
// them bare, so they are spelled out rather than computed: the set is fixed by
// the RFC, and a literal table needs no `codePointAt` that TypeScript then has
// to be told cannot be undefined.
const NOT_ATTR_CHAR_RE = /['()*]/g;
const ATTR_CHAR_ESCAPES: Readonly<Record<string, string>> = {
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
};

function asciiFallback(filename: string): string {
  const stem = filename.replace(/\.zip$/u, '');
  const ascii = stem
    .replaceAll(NON_ASCII_RE, '')
    .replaceAll(QUOTED_STRING_UNSAFE_RE, '')
    .replaceAll(/-+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');
  // A wholly non-ASCII title leaves nothing behind; name it generically rather
  // than serving a file called `.zip` or `-.zip`.
  return ascii.length > 0 ? `${ascii}.zip` : 'export.zip';
}

export function contentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replaceAll(
    NOT_ATTR_CHAR_RE,
    (c) => ATTR_CHAR_ESCAPES[c] ?? c,
  );
  return `attachment; filename="${asciiFallback(filename)}"; filename*=UTF-8''${encoded}`;
}

export function streamZip(res: Response, bundle: ExportBundle, filename: string): void {
  const zip = new ZipFile();

  for (const directory of bundle.directories) {
    zip.addEmptyDirectory(directory);
  }
  for (const file of bundle.files) {
    zip.addBuffer(Buffer.from(file.content, 'utf8'), file.path);
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', contentDisposition(filename));
  res.status(200);
  zip.outputStream.pipe(res);
  zip.end();
}
