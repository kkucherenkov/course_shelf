/**
 * useMaterialDownload
 *
 * One-shot helper that fetches a signed material download URL and triggers
 * a browser download via a transient `<a download>` click. Mirrors the same
 * "resolve relative URL against apiBaseUrl" trick `useStreamUrl` uses so the
 * download works in both same-origin (proxy) and cross-origin (bare 3001 →
 * 3000) dev setups.
 *
 * Failure modes are surfaced to the caller as a returned error — no
 * exceptions thrown, no toasts emitted — so the page can pick its own UX.
 */

import { issueMaterialDownloadUrl } from '@app/api-client-ts';

export interface UseMaterialDownloadReturn {
  /**
   * Fetch a signed URL and trigger a browser download for the file.
   * `filename` becomes the suggested name in the Save dialog (the backend
   * also stamps Content-Disposition so this is mostly belt-and-braces).
   * Returns `null` on success, an Error on failure.
   */
  download: (input: {
    lessonId: string;
    materialId: string;
    filename: string;
  }) => Promise<Error | null>;
}

function resolveDownloadUrl(raw: string, apiBaseUrl: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  return new URL(raw, apiOrigin).toString();
}

function clickAnchor(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // Anchor must be in the DOM for Firefox to honour the click.
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
}

export function useMaterialDownload(): UseMaterialDownloadReturn {
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl as string;

  async function download(input: {
    lessonId: string;
    materialId: string;
    filename: string;
  }): Promise<Error | null> {
    const res = await issueMaterialDownloadUrl({
      path: { lessonId: input.lessonId, materialId: input.materialId },
    });
    if (res.error) {
      return new Error(`HTTP ${String(res.response.status)}`);
    }
    const dto = res.data as { url: string };
    const absoluteUrl = resolveDownloadUrl(dto.url, apiBaseUrl);
    clickAnchor(absoluteUrl, input.filename);
    return null;
  }

  return { download };
}
