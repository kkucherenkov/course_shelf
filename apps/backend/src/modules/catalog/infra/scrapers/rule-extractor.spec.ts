// rule-extractor.spec.ts
import { describe, expect, it } from 'vitest';

import { RuleExtractor } from './rule-extractor';

import type { ScraperDefinitionRules } from '../../domain/scraper/scraper-definition.schema';

const extractor = new RuleExtractor();

describe('RuleExtractor', () => {
  it('extracts text via a CSS rule', () => {
    const html = '<h1 class="title">Docker Mastery</h1>';
    const rules: ScraperDefinitionRules = { title: { selector: '.title', from: 'text' } };
    expect(extractor.extract(html, rules, 'my-site').title).toBe('Docker Mastery');
  });

  it('extracts an attribute via "attr:<name>"', () => {
    const html = '<meta name="description" content="Learn Docker">';
    const rules: ScraperDefinitionRules = {
      description: { selector: 'meta[name=description]', from: 'attr:content' },
    };
    expect(extractor.extract(html, rules, 'my-site').description).toBe('Learn Docker');
  });

  it('collects every match with many: true', () => {
    const html = '<span class="tag">docker</span><span class="tag">devops</span>';
    const rules: ScraperDefinitionRules = { tags: { selector: '.tag', from: 'text', many: true } };
    expect(extractor.extract(html, rules, 'my-site').tags).toEqual(['docker', 'devops']);
  });

  it('walks a dotted JSON path, default jsonFrom (any ld+json script)', () => {
    const html = `<script type="application/ld+json">
      {"props":{"pageProps":{"course":{"publishedAt":"2024-01-01"}}}}
    </script>`;
    const rules: ScraperDefinitionRules = {
      releaseDate: { json: 'props.pageProps.course.publishedAt' },
    };
    expect(extractor.extract(html, rules, 'my-site').releaseDate).toBe('2024-01-01');
  });

  it('walks a dotted JSON path with a numeric index, custom jsonFrom', () => {
    const html = `<script id="__NEXT_DATA__">
      {"props":{"pageProps":{"instructors":[{"name":"Jane"}]}}}
    </script>`;
    const rules: ScraperDefinitionRules = {
      title: { json: 'props.pageProps.instructors.0.name', jsonFrom: 'script#__NEXT_DATA__' },
    };
    expect(extractor.extract(html, rules, 'my-site').title).toBe('Jane');
  });

  it('yields an absent field when the selector matches nothing', () => {
    const html = '<div></div>';
    const rules: ScraperDefinitionRules = { title: { selector: '.missing', from: 'text' } };
    expect(extractor.extract(html, rules, 'my-site').title).toBeUndefined();
  });

  it('drops a value that will not coerce (non-numeric ratingAverage)', () => {
    const html = '<span class="rating">not-a-number</span>';
    const rules: ScraperDefinitionRules = {
      ratingAverage: { selector: '.rating', from: 'text' },
    };
    expect(extractor.extract(html, rules, 'my-site').ratingAverage).toBeUndefined();
  });

  it('coerces ratingAverage to a number', () => {
    const html = '<span class="rating">4.6</span>';
    const rules: ScraperDefinitionRules = { ratingAverage: { selector: '.rating', from: 'text' } };
    expect(extractor.extract(html, rules, 'my-site').ratingAverage).toBe(4.6);
  });

  it('shapes externalIds as objects sourced from the definition id', () => {
    const html = '<span class="ext">abc123</span>';
    const rules: ScraperDefinitionRules = { externalIds: { selector: '.ext', from: 'text' } };
    expect(extractor.extract(html, rules, 'my-site').externalIds).toEqual([
      { source: 'my-site', externalId: 'abc123' },
    ]);
  });

  it('drops an invalid level rather than setting a wrong value', () => {
    const html = '<span class="level">expert-ish</span>';
    const rules: ScraperDefinitionRules = { level: { selector: '.level', from: 'text' } };
    expect(extractor.extract(html, rules, 'my-site').level).toBeUndefined();
  });
});
