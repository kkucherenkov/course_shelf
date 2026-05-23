/**
 * WHY this file exists:
 * Scrapes course metadata from YouTube via the Data API v3. Playlists map to a
 * course (channel → studio, title/description, thumbnail → poster). name-kind
 * uses search.list. Constructed only when an API key is configured; the
 * registry omits it otherwise. All external ids are namespaced
 * "youtube:playlist:<id>" / "youtube:video:<id>".
 */
import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScrapedCourseFragment,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

const API = 'https://www.googleapis.com/youtube/v3';

interface YtSnippet {
  title?: string;
  description?: string;
  channelTitle?: string;
  defaultLanguage?: string;
  thumbnails?: Record<string, { url?: string }>;
}
interface YtItem {
  id?: string;
  snippet?: YtSnippet;
}
interface YtListResponse {
  items?: YtItem[];
}

interface YtSearchItem {
  id?: { playlistId?: string };
  snippet?: YtSnippet;
}

export class YouTubeScraper implements Scraper {
  readonly id = 'youtube';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'name', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly apiKey: string,
  ) {}

  canHandle(url: string): boolean {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    } catch {
      return false;
    }
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') {
      const playlistId = this.playlistId(request.url);
      if (playlistId) return this.scrapePlaylist(playlistId);
      const videoId = this.videoId(request.url);
      if (videoId) return this.scrapeVideo(videoId);
      return [];
    }
    if (request.kind === 'name') return this.search(request.query);
    // kind === 'fragment': treat a raw fragment as a bare URL or playlist id.
    const id =
      this.playlistId(request.raw) ?? (/^PL[\w-]+$/.test(request.raw) ? request.raw : undefined);
    return id ? this.scrapePlaylist(id) : [];
  }

  private playlistId(url: string): string | undefined {
    try {
      return new URL(url).searchParams.get('list') ?? undefined;
    } catch {
      return undefined;
    }
  }

  private videoId(url: string): string | undefined {
    try {
      const u = new URL(url);
      if (u.hostname.replace(/^www\./, '') === 'youtu.be') return u.pathname.slice(1) || undefined;
      return u.searchParams.get('v') ?? undefined;
    } catch {
      return undefined;
    }
  }

  private async getJson<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const fullUrl = `${API}${path}${sep}key=${this.apiKey}`;
    const safeUrl = `${API}${path}`; // key-free — used in all error messages
    let result;
    try {
      result = await this.fetcher.fetchText(fullUrl);
    } catch (error) {
      throw new ScrapeFetchError(safeUrl, error);
    }
    if (result.status < 200 || result.status >= 300) {
      throw new ScrapeFetchError(
        safeUrl,
        new Error(`YouTube API returned HTTP ${String(result.status)}`),
      );
    }
    try {
      return JSON.parse(result.body) as T;
    } catch (error) {
      throw new ScrapeFetchError(safeUrl, error);
    }
  }

  private async scrapePlaylist(id: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<YtListResponse>(`/playlists?part=snippet&id=${id}`);
    const item = res.items?.[0];
    if (!item?.snippet) return [];
    const url = `https://www.youtube.com/playlist?list=${id}`;
    return [
      {
        fragment: this.toFragment(item.snippet, 'playlist', id, url),
        source: this.id,
        sourceUrl: url,
      },
    ];
  }

  private async scrapeVideo(id: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<YtListResponse>(`/videos?part=snippet&id=${id}`);
    const item = res.items?.[0];
    if (!item?.snippet) return [];
    const url = `https://www.youtube.com/watch?v=${id}`;
    return [
      {
        fragment: this.toFragment(item.snippet, 'video', id, url),
        source: this.id,
        sourceUrl: url,
      },
    ];
  }

  private async search(query: string): Promise<ScrapeCandidate[]> {
    const res = await this.getJson<{ items?: YtSearchItem[] }>(
      `/search?part=snippet&type=playlist&maxResults=5&q=${encodeURIComponent(query)}`,
    );
    const candidates: ScrapeCandidate[] = [];
    for (const item of res.items ?? []) {
      const pid = item.id?.playlistId;
      const snippet = item.snippet;
      if (!pid || !snippet) continue;
      const url = `https://www.youtube.com/playlist?list=${pid}`;
      candidates.push({
        fragment: this.toFragment(snippet, 'playlist', pid, url),
        source: this.id,
        sourceUrl: url,
        confidence: 0.5,
      });
    }
    return candidates;
  }

  private toFragment(
    snippet: YtSnippet,
    kind: 'playlist' | 'video',
    id: string,
    url: string,
  ): ScrapedCourseFragment {
    const poster =
      snippet.thumbnails?.['maxres']?.url ??
      snippet.thumbnails?.['high']?.url ??
      snippet.thumbnails?.['default']?.url;
    const fragment: Record<string, unknown> = {
      externalIds: [{ source: 'youtube', externalId: `youtube:${kind}:${id}`, url }],
    };
    if (snippet.title) fragment['title'] = snippet.title;
    if (snippet.description) fragment['description'] = snippet.description;
    if (snippet.channelTitle) fragment['studioName'] = snippet.channelTitle;
    if (snippet.defaultLanguage) fragment['language'] = snippet.defaultLanguage;
    if (poster) fragment['posterUrl'] = poster;
    return fragment;
  }
}
