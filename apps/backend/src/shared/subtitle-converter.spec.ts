/**
 * Unit tests for convertSrtToVtt and extractCues.
 *
 * convertSrtToVtt covers:
 *   - Cue counter stripping.
 *   - Comma → dot timestamp normalisation.
 *   - Multi-cue SRT.
 *   - Windows CRLF line endings.
 *   - UTF-8 BOM stripped.
 *   - Empty string → `WEBVTT\n\n`.
 *   - Already-VTT input (starts with `WEBVTT`) → returned unchanged.
 *
 * extractCues covers:
 *   - A normal WebVTT file.
 *   - CRLF input.
 *   - A file with no trailing newline (last cue still lands).
 *   - A malformed timing line skipped rather than throwing.
 *   - Raw SRT (comma separator, cue counters) parsed without a prior convert.
 */
import { describe, expect, it } from 'vitest';

import { convertSrtToVtt, extractCues } from './subtitle-converter';

const BOM = '﻿';

describe('convertSrtToVtt', () => {
  // -------------------------------------------------------------------------
  // Already VTT — no-op
  // -------------------------------------------------------------------------
  it('returns already-VTT input unchanged', () => {
    const vtt = 'WEBVTT\n\n00:00:01.500 --> 00:00:04.000\nHello\n';
    expect(convertSrtToVtt(vtt)).toBe(vtt);
  });

  it('returns already-VTT input with BOM as-is (starts with WEBVTT after BOM strip check)', () => {
    // BOM + WEBVTT — still should detect as VTT and return unchanged.
    const vtt = `${BOM}WEBVTT\n\n00:00:01.500 --> 00:00:04.000\nHello\n`;
    // After stripping BOM the trimStart detects WEBVTT — return original.
    expect(convertSrtToVtt(vtt)).toBe(vtt);
  });

  // -------------------------------------------------------------------------
  // Empty input
  // -------------------------------------------------------------------------
  it(String.raw`empty string → WEBVTT\n\n`, () => {
    expect(convertSrtToVtt('')).toBe('WEBVTT\n\n');
  });

  // -------------------------------------------------------------------------
  // Cue counter stripping
  // -------------------------------------------------------------------------
  it('strips a numeric cue-counter line that precedes a timestamp', () => {
    const srt = '1\n00:00:01,500 --> 00:00:04,000\nHello world\n';
    const result = convertSrtToVtt(srt);
    expect(result).not.toContain('\n1\n');
    expect(result).toContain('00:00:01.500 --> 00:00:04.000');
  });

  it('does NOT strip a numeric line that does not precede a timestamp', () => {
    // A line with only "42" that is followed by text, not a timestamp.
    const srt = '42\nThis is not a timestamp\n00:00:01,500 --> 00:00:04,000\nHello\n';
    const result = convertSrtToVtt(srt);
    expect(result).toContain('42');
  });

  // -------------------------------------------------------------------------
  // Comma → dot timestamps
  // -------------------------------------------------------------------------
  it('replaces comma with dot in timestamps', () => {
    const srt = '1\n00:00:01,500 --> 00:00:04,000\nHello\n';
    const result = convertSrtToVtt(srt);
    expect(result).toContain('00:00:01.500 --> 00:00:04.000');
    expect(result).not.toContain('00:00:01,500');
  });

  // -------------------------------------------------------------------------
  // Multi-cue
  // -------------------------------------------------------------------------
  it('converts a multi-cue SRT correctly', () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:02,000',
      'First cue',
      '',
      '2',
      '00:00:03,000 --> 00:00:04,000',
      'Second cue',
      '',
    ].join('\n');

    const result = convertSrtToVtt(srt);

    expect(result.startsWith('WEBVTT\n\n')).toBe(true);
    expect(result).toContain('00:00:01.000 --> 00:00:02.000');
    expect(result).toContain('First cue');
    expect(result).toContain('00:00:03.000 --> 00:00:04.000');
    expect(result).toContain('Second cue');
    // Cue counters must be gone.
    expect(result).not.toMatch(/^\s*1\s*$/m);
    expect(result).not.toMatch(/^\s*2\s*$/m);
  });

  // -------------------------------------------------------------------------
  // CRLF line endings
  // -------------------------------------------------------------------------
  it('handles Windows CRLF line endings', () => {
    const srt = '1\r\n00:00:01,500 --> 00:00:04,000\r\nHello\r\n';
    const result = convertSrtToVtt(srt);
    expect(result.startsWith('WEBVTT\n\n')).toBe(true);
    expect(result).toContain('00:00:01.500 --> 00:00:04.000');
    expect(result).toContain('Hello');
    expect(result).not.toContain('\r');
  });

  // -------------------------------------------------------------------------
  // BOM
  // -------------------------------------------------------------------------
  it('strips BOM from non-VTT SRT input', () => {
    const srt = `${BOM}1\n00:00:01,500 --> 00:00:04,000\nHello\n`;
    const result = convertSrtToVtt(srt);
    expect(result.startsWith('WEBVTT')).toBe(true);
    // BOM (U+FEFF) must not appear in the output.
    expect(result.codePointAt(0)).not.toBe(0xfe_ff);
  });

  // -------------------------------------------------------------------------
  // HTML tags in cue text are untouched
  // -------------------------------------------------------------------------
  it('leaves <i> and <b> tags in cue text untouched', () => {
    const srt = '1\n00:00:01,000 --> 00:00:02,000\n<i>Italics</i> and <b>Bold</b>\n';
    const result = convertSrtToVtt(srt);
    expect(result).toContain('<i>Italics</i> and <b>Bold</b>');
  });
});

describe('extractCues', () => {
  it('parses a normal WebVTT file', () => {
    const vtt =
      'WEBVTT\n\n' +
      '00:00:01.500 --> 00:00:04.000\nHello there\n\n' +
      '00:01:02.250 --> 00:01:05.000\nSecond cue\nover two lines\n';

    expect(extractCues(vtt)).toEqual([
      { startMs: 1500, endMs: 4000, text: 'Hello there' },
      { startMs: 62_250, endMs: 65_000, text: 'Second cue\nover two lines' },
    ]);
  });

  it('reads hours', () => {
    const vtt = 'WEBVTT\n\n01:02:03.004 --> 01:02:04.005\nLate\n';
    expect(extractCues(vtt)).toEqual([{ startMs: 3_723_004, endMs: 3_724_005, text: 'Late' }]);
  });

  it('handles CRLF input', () => {
    const vtt = 'WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nHello\r\n';
    expect(extractCues(vtt)).toEqual([{ startMs: 1000, endMs: 2000, text: 'Hello' }]);
  });

  it('keeps the last cue when the file has no trailing newline', () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nNo newline at EOF';
    expect(extractCues(vtt)).toEqual([{ startMs: 1000, endMs: 2000, text: 'No newline at EOF' }]);
  });

  it('skips a malformed timing line rather than throwing', () => {
    const vtt =
      'WEBVTT\n\n' +
      '00:00:01.000 --> 00:00:02.000\nGood\n\n' +
      '00:00:0X.000 --> broken\nOrphaned text\n\n' +
      '00:00:03.000 --> 00:00:04.000\nAlso good\n';

    expect(extractCues(vtt)).toEqual([
      { startMs: 1000, endMs: 2000, text: 'Good' },
      { startMs: 3000, endMs: 4000, text: 'Also good' },
    ]);
  });

  it('ignores WebVTT cue settings trailing the timings', () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000 align:start position:0%\nPositioned\n';
    expect(extractCues(vtt)).toEqual([{ startMs: 1000, endMs: 2000, text: 'Positioned' }]);
  });

  it('parses raw SRT, cue counters and commas included', () => {
    const srt =
      '1\n00:00:01,500 --> 00:00:04,000\nHello\n\n2\n00:00:05,000 --> 00:00:06,000\nBye\n';
    expect(extractCues(srt)).toEqual([
      { startMs: 1500, endMs: 4000, text: 'Hello' },
      { startMs: 5000, endMs: 6000, text: 'Bye' },
    ]);
  });

  it('returns no cues for an empty document', () => {
    expect(extractCues('WEBVTT\n\n')).toEqual([]);
    expect(extractCues('')).toEqual([]);
  });
});
