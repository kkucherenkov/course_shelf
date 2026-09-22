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

export function streamZip(res: Response, bundle: ExportBundle, filename: string): void {
  const zip = new ZipFile();

  for (const directory of bundle.directories) {
    zip.addEmptyDirectory(directory);
  }
  for (const file of bundle.files) {
    zip.addBuffer(Buffer.from(file.content, 'utf8'), file.path);
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200);
  zip.outputStream.pipe(res);
  zip.end();
}
