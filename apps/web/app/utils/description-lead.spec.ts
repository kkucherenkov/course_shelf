import { describe, it, expect } from 'vitest';
import { descriptionLead, DESCRIPTION_LEAD_MAX_CHARS } from './description-lead';

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

  it('trims surrounding whitespace before measuring', () => {
    expect(descriptionLead('  padded  \nrest')).toBe('padded');
  });

  it('returns an empty string for an empty description', () => {
    expect(descriptionLead('')).toBe('');
  });
});
