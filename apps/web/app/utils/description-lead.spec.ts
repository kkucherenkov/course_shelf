import { describe, it, expect } from 'vitest';
import { descriptionLead, descriptionBody, DESCRIPTION_LEAD_MAX_CHARS } from './description-lead';

describe('descriptionLead', () => {
  it('returns the whole string when short and single-line', () => {
    expect(descriptionLead('A short summary.')).toBe('A short summary.');
  });

  it('cuts at the first newline, leaving the bullet list for the full-text section', () => {
    const description = 'Intro paragraph.\nЧему вы научитесь\n- Bullet one\n- Bullet two';
    expect(descriptionLead(description)).toBe('Intro paragraph.');
  });

  it('caps a long single-line lead and marks the cut with an ellipsis', () => {
    const long = 'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS + 50);
    const lead = descriptionLead(long);
    expect(lead).toBe(`${'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS)}…`);
  });

  it('never cuts an emoji in half at the cap', () => {
    // The 220th grapheme is the emoji, so it is kept whole. Slicing UTF-16
    // units instead would keep only its high surrogate and render `\uFFFD`.
    const long = `${'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS - 1)}\u{1F600}tail`;
    expect(descriptionLead(long)).toBe(
      `${'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS - 1)}\u{1F600}\u2026`,
    );
  });

  it('keeps a multi-code-point grapheme whole at the cap', () => {
    // A flag is two regional indicators and a ZWJ sequence is three code
    // points plus joiners — spreading into an array splits both; grapheme
    // segmentation does not.
    const flag = `${'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS - 1)}\u{1F1F7}\u{1F1FA}tail`;
    expect(descriptionLead(flag)).toBe(
      `${'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS - 1)}\u{1F1F7}\u{1F1FA}\u2026`,
    );
  });

  it('trims surrounding whitespace before measuring', () => {
    expect(descriptionLead('  padded  \nrest')).toBe('padded');
  });

  it('returns an empty string for an empty description', () => {
    expect(descriptionLead('')).toBe('');
  });
});

describe('descriptionBody', () => {
  it('strips the lead line so it does not print twice (#184)', () => {
    const description = 'Intro paragraph.\nЧему вы научитесь\n- Bullet one\n- Bullet two';
    expect(descriptionBody(description)).toBe('Чему вы научитесь\n- Bullet one\n- Bullet two');
  });

  it('keeps the whole paragraph when the lead was truncated with an ellipsis', () => {
    const long = 'x'.repeat(DESCRIPTION_LEAD_MAX_CHARS + 50);
    expect(descriptionBody(long)).toBe(long);
  });

  it('returns the trimmed text unchanged when there is nothing after the lead', () => {
    expect(descriptionBody('  A short summary.  ')).toBe('');
  });

  it('trims surrounding whitespace before measuring', () => {
    expect(descriptionBody('  padded  \nrest')).toBe('rest');
  });

  it('returns an empty string for an empty description', () => {
    expect(descriptionBody('')).toBe('');
  });
});
