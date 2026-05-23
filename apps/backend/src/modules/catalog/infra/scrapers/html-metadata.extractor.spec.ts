// html-metadata.extractor.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';

const extractor = new HtmlMetadataExtractor();

const jsonLdHtml = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Advanced TS",
 "description":"Deep dive","provider":{"@type":"Organization","name":"Acme Edu"},
 "instructor":[{"@type":"Person","name":"Jane Doe"}],
 "image":"https://cdn.test/poster.jpg","inLanguage":"en",
 "aggregateRating":{"@type":"AggregateRating","ratingValue":4.7,"ratingCount":1234}}
</script></head><body></body></html>`;

const ogOnlyHtml = `<!doctype html><html><head>
<meta property="og:title" content="OG Course"/>
<meta property="og:description" content="From OG"/>
<meta property="og:image" content="https://cdn.test/og.png"/>
</head><body></body></html>`;

describe('HtmlMetadataExtractor', () => {
  it('extracts a fragment from schema.org Course JSON-LD', () => {
    const f = extractor.extract(jsonLdHtml);
    expect(f.title).toBe('Advanced TS');
    expect(f.description).toBe('Deep dive');
    expect(f.studioName).toBe('Acme Edu');
    expect(f.instructorNames).toEqual(['Jane Doe']);
    expect(f.posterUrl).toBe('https://cdn.test/poster.jpg');
    expect(f.language).toBe('en');
    expect(f.ratingAverage).toBe(4.7);
    expect(f.ratingCount).toBe(1234);
  });

  it('falls back to OpenGraph when no JSON-LD is present', () => {
    const f = extractor.extract(ogOnlyHtml);
    expect(f.title).toBe('OG Course');
    expect(f.description).toBe('From OG');
    expect(f.posterUrl).toBe('https://cdn.test/og.png');
  });

  it('returns an empty fragment when nothing is extractable', () => {
    expect(extractor.extract('<html><body>nothing</body></html>')).toEqual({});
  });

  it('does not leak non-Course JSON-LD node names as course titles', () => {
    const html = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","name":"Home"}
</script></head><body></body></html>`;
    const f = extractor.extract(html);
    expect(f.title).toBeUndefined();
    expect(f).toEqual({});
  });
});
