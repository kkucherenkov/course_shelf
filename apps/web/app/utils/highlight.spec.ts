import { describe, it, expect } from 'vitest';
import { highlight } from './highlight';

describe('highlight', () => {
  it('returns a single non-matching segment when q is empty', () => {
    expect(highlight('Hello world', '')).toEqual([{ text: 'Hello world', match: false }]);
  });

  it('returns a single non-matching segment when there is no match', () => {
    expect(highlight('Hello world', 'xyz')).toEqual([{ text: 'Hello world', match: false }]);
  });

  it('handles a single match in the middle', () => {
    expect(highlight('Hello world', 'world')).toEqual([
      { text: 'Hello ', match: false },
      { text: 'world', match: true },
    ]);
  });

  it('handles multiple matches', () => {
    expect(highlight('foo bar foo', 'foo')).toEqual([
      { text: 'foo', match: true },
      { text: ' bar ', match: false },
      { text: 'foo', match: true },
    ]);
  });

  it('handles a leading match', () => {
    expect(highlight('PostgreSQL deep dive', 'Post')).toEqual([
      { text: 'Post', match: true },
      { text: 'greSQL deep dive', match: false },
    ]);
  });

  it('handles a trailing match', () => {
    expect(highlight('Intro to SQL', 'SQL')).toEqual([
      { text: 'Intro to ', match: false },
      { text: 'SQL', match: true },
    ]);
  });

  it('is case-insensitive and preserves original casing in match segment', () => {
    expect(highlight('PostgreSQL', 'postgresql')).toEqual([{ text: 'PostgreSQL', match: true }]);
  });

  it('exact match with different case', () => {
    const result = highlight('Distributed Systems', 'distributed systems');
    expect(result).toEqual([{ text: 'Distributed Systems', match: true }]);
  });

  it('does not treat regex special characters as regex (q = "a.b" should not match "axb")', () => {
    expect(highlight('axb', 'a.b')).toEqual([{ text: 'axb', match: false }]);
  });

  it('matches literal dot in query', () => {
    expect(highlight('a.b is here', 'a.b')).toEqual([
      { text: 'a.b', match: true },
      { text: ' is here', match: false },
    ]);
  });

  it('handles query with parentheses (regex special chars)', () => {
    expect(highlight('Node.js (LTS)', '(LTS)')).toEqual([
      { text: 'Node.js ', match: false },
      { text: '(LTS)', match: true },
    ]);
  });

  it('returns single non-matching segment for empty text', () => {
    expect(highlight('', 'foo')).toEqual([{ text: '', match: false }]);
  });
});
