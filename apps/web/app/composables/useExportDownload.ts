/**
 * useExportDownload
 *
 * One-shot helper that downloads a lesson or course Markdown ZIP
 * (E28-F01-S01) and triggers a browser save. Unlike useMaterialDownload,
 * export is not behind a signed URL — it is an ordinary session-authed GET
 * (design §7: "access mirrors getLesson/getCourse"), so a plain `<a href>`
 * click cannot carry the bearer token api.client.ts's interceptor attaches.
 * The generated client fetches the bytes instead — `application/zip` gets
 * auto-parsed as a Blob by @hey-api/client-fetch's content-type sniffer —
 * and a transient object-URL anchor drives the actual download, same click
 * mechanics useMaterialDownload already uses.
 *
 * Failure modes are surfaced to the caller as a returned error — no
 * exceptions thrown, no toasts emitted — so the page can pick its own UX.
 */

import { exportCourse, exportLesson } from '@app/api-client-ts';

export interface UseExportDownloadReturn {
  downloadLessonExport: (input: { lessonId: string; filename: string }) => Promise<Error | null>;
  downloadCourseExport: (input: { courseId: string; filename: string }) => Promise<Error | null>;
}

function clickBlobAnchor(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // Anchor must be in the DOM for Firefox to honour the click.
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadLessonExport(input: {
  lessonId: string;
  filename: string;
}): Promise<Error | null> {
  const res = await exportLesson({ path: { lessonId: input.lessonId } });
  if (res.error) {
    return new Error(`HTTP ${String(res.response.status)}`);
  }
  clickBlobAnchor(res.data as Blob, input.filename);
  return null;
}

async function downloadCourseExport(input: {
  courseId: string;
  filename: string;
}): Promise<Error | null> {
  const res = await exportCourse({ path: { courseId: input.courseId } });
  if (res.error) {
    return new Error(`HTTP ${String(res.response.status)}`);
  }
  clickBlobAnchor(res.data as Blob, input.filename);
  return null;
}

export function useExportDownload(): UseExportDownloadReturn {
  return { downloadLessonExport, downloadCourseExport };
}
