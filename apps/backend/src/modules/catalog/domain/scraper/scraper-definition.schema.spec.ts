// scraper-definition.schema.spec.ts
import { describe, expect, it } from 'vitest';

import { ScraperDefinitionInvalidError } from './scraper-definition.errors';
import { parseScraperDefinition } from './scraper-definition.schema';

const NO_RESERVED = new Set<string>();

function json(obj: unknown): string {
  return JSON.stringify(obj);
}

const valid = {
  id: 'my-site',
  kinds: ['url'],
  match: { urlPattern: String.raw`^https://my\.site/course/` },
  rules: {
    title: { selector: 'h1.course-title', from: 'text' },
    description: { selector: 'meta[name=description]', from: 'attr:content' },
    tags: { selector: '.tag', from: 'text', many: true },
    releaseDate: { json: 'props.pageProps.course.publishedAt', jsonFrom: 'script#__NEXT_DATA__' },
  },
};

describe('parseScraperDefinition', () => {
  it('parses a valid definition', () => {
    const def = parseScraperDefinition(json(valid), 'my-site.json', NO_RESERVED);
    expect(def.id).toBe('my-site');
    expect(def.kinds).toEqual(['url']);
    expect(def.urlPattern?.test('https://my.site/course/x')).toBe(true);
    expect(def.urlPattern?.test('https://other.site/course/x')).toBe(false);
    expect(def.rules.title).toEqual({ selector: 'h1.course-title', from: 'text' });
    expect(def.rules.tags).toEqual({ selector: '.tag', from: 'text', many: true });
    expect(def.rules.releaseDate).toEqual({
      json: 'props.pageProps.course.publishedAt',
      jsonFrom: 'script#__NEXT_DATA__',
    });
  });

  it('throws on unparseable JSON', () => {
    expect(() => parseScraperDefinition('{not json', 'bad.json', NO_RESERVED)).toThrow(
      ScraperDefinitionInvalidError,
    );
  });

  it('throws on an unknown rule target field', () => {
    const def = { ...valid, rules: { nope: { selector: 'h1', from: 'text' } } };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /is not a supported field/,
    );
  });

  it('throws on a bad regex in match.urlPattern', () => {
    const def = { ...valid, match: { urlPattern: '(unterminated' } };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /not a valid regular expression/,
    );
  });

  it('throws when the id collides with a reserved (built-in) id', () => {
    const reserved = new Set(['udemy']);
    const def = { ...valid, id: 'udemy' };
    expect(() => parseScraperDefinition(json(def), 'udemy2.json', reserved)).toThrow(/collides/);
  });

  it('requires match.urlPattern when kinds includes "url"', () => {
    const def = { ...valid, match: undefined };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /match.urlPattern is required/,
    );
  });

  it('rejects a rule that is neither CSS nor JSON shaped', () => {
    const def = { ...valid, rules: { title: { foo: 'bar' } } };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /rules.title.selector must be a non-empty string/,
    );
  });

  it('rejects a rule mixing CSS and JSON shapes', () => {
    const def = { ...valid, rules: { title: { selector: 'h1', from: 'text', json: 'a.b' } } };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /must be either a CSS rule/,
    );
  });

  it('rejects an invalid "from" value', () => {
    const def = { ...valid, rules: { title: { selector: 'h1', from: 'html' } } };
    expect(() => parseScraperDefinition(json(def), 'bad.json', NO_RESERVED)).toThrow(
      /from must be "text" or "attr:<name>"/,
    );
  });
});
