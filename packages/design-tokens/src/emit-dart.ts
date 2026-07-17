import {
  colorToDart,
  parseCubicBezier,
  parseMs,
  shadowListToDart,
  stripPxForDart,
} from './parse.ts';
import { DART_BANNER, type ThemedLeaf, type TokenBundle, type VerticalLeaf } from './types.ts';

function camel(name: string): string {
  // Keep numeric-leading keys (like "2xs") legible: prefix with 's' for sizes, 'v' for verticals.
  return name.replaceAll(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase());
}

function dartDouble(value: number | string): string {
  const s = typeof value === 'number' ? value.toString() : value.trim();
  if (s === '0' || s === '0.0') return '0.0';
  if (s.includes('.')) return s;
  return `${s}.0`;
}

function stripEmForDart(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '0') return '0.0';
  if (trimmed.endsWith('em')) {
    return dartDouble(trimmed.slice(0, -2));
  }
  return dartDouble(trimmed);
}

// Dart reserved words that can never be used as identifiers. We don't need the full
// Dart keyword list here — only words that our token keys could realistically hit.
const DART_RESERVED: ReadonlySet<string> = new Set([
  'default',
  'class',
  'void',
  'return',
  'null',
  'true',
  'false',
  'new',
  'this',
  'super',
  'const',
  'final',
  'var',
  'if',
  'else',
  'for',
  'while',
  'switch',
  'case',
  'break',
  'continue',
  'try',
  'catch',
  'in',
  'is',
  'as',
  'with',
  'extends',
  'implements',
  'enum',
]);

function safeKey(prefix: string, raw: string): string {
  const key = camel(raw);
  // Dart identifiers can't start with a digit.
  if (/^[0-9]/.test(key)) return `${prefix}${key}`;
  if (DART_RESERVED.has(key)) return `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return key;
}

function colorsClass(
  name: string,
  theme: 'light' | 'dark',
  entries: (readonly [string, Record<string, ThemedLeaf>])[],
): string {
  const lines: string[] = [`abstract final class ${name} {`];
  for (const [group, tokens] of entries) {
    for (const [key, leaf] of Object.entries(tokens)) {
      const fieldName = camel(`${group}${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      lines.push(
        `  static const Color ${fieldName} = ${colorToDart(leaf[theme].$value.toString())};`,
      );
    }
  }
  lines.push('}');
  return lines.join('\n');
}

function verticalClass(entries: Record<string, VerticalLeaf>): string {
  const lines: string[] = ['abstract final class AppVerticalColors {'];
  for (const [key, leaf] of Object.entries(entries)) {
    if (leaf.$value !== undefined) {
      lines.push(`  static const Color ${camel(key)} = ${colorToDart(leaf.$value)};`);
    }
    if (leaf.bgTint !== undefined) {
      lines.push(`  static const Color ${camel(key)}Tint = ${colorToDart(leaf.bgTint)};`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}

function shadowsClass(
  name: string,
  theme: 'light' | 'dark',
  entries: Record<string, ThemedLeaf>,
): string {
  const lines: string[] = [`abstract final class ${name} {`];
  for (const [key, leaf] of Object.entries(entries)) {
    const list = shadowListToDart(leaf[theme].$value.toString());
    lines.push(`  static const List<BoxShadow> ${camel(key)} = ${list};`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function emitDart(tokens: TokenBundle): string {
  const parts: string[] = [DART_BANNER, '', "import 'package:flutter/widgets.dart';", ''];

  const colorEntries: (readonly [string, Record<string, ThemedLeaf>])[] = [
    ['brand', tokens.color.color.brand],
    ['surface', tokens.color.color.surface],
    ['border', tokens.color.color.border],
    ['text', tokens.color.color.text],
    ['status', tokens.color.color.status],
  ];
  parts.push(
    colorsClass('AppColorsLight', 'light', colorEntries),
    '',
    colorsClass('AppColorsDark', 'dark', colorEntries),
    '',
    verticalClass(tokens.color.color.vertical),
    '',
    'abstract final class AppSpacing {',
  );
  for (const [key, leaf] of Object.entries(tokens.spacing.space)) {
    const field = safeKey('s', key);
    parts.push(`  static const double ${field} = ${stripPxForDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppRadius {');
  for (const [key, leaf] of Object.entries(tokens.radius.radius)) {
    const field = safeKey('r', key);
    parts.push(`  static const double ${field} = ${stripPxForDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppFontSize {');
  for (const [key, leaf] of Object.entries(tokens.typography.typography.font.size)) {
    const field = safeKey('s', key);
    parts.push(`  static const double ${field} = ${stripPxForDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppFontWeight {');
  for (const [key, leaf] of Object.entries(tokens.typography.typography.font.weight)) {
    const field = camel(key);
    parts.push(`  static const FontWeight ${field} = FontWeight.w${leaf.$value.toString()};`);
  }
  parts.push('}', '', 'abstract final class AppFontFamily {');
  for (const [key, leaf] of Object.entries(tokens.typography.typography.font.family)) {
    const primary =
      leaf.$value
        .toString()
        .split(',')[0]
        ?.trim()
        .replaceAll(/^['"]|['"]$/g, '') ?? '';
    parts.push(`  static const String ${camel(key)} = ${JSON.stringify(primary)};`);
  }
  parts.push('}', '', 'abstract final class AppLeading {');
  for (const [key, leaf] of Object.entries(tokens.typography.typography.font.leading)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const double ${camel(key)} = ${dartDouble(leaf.$value)};`);
  }
  parts.push('}', '', 'abstract final class AppTracking {');
  for (const [key, leaf] of Object.entries(tokens.typography.typography.font.tracking)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const double ${camel(key)} = ${stripEmForDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppTextStyles {');
  for (const [roleKey, role] of Object.entries(tokens.typography.typography.role)) {
    if (roleKey.startsWith('$')) continue;
    const sizeField = safeKey('s', role.size);
    const weightField = camel(role.weight);
    const trackingField = camel(role.tracking);
    const leadingField = camel(role.leading);
    const fieldName = camel(roleKey);
    const lines: string[] = [`  static const TextStyle ${fieldName} = TextStyle(`];
    if (role.mono === true) {
      lines.push(`    fontFamily: AppFontFamily.mono,`);
    }
    lines.push(
      `    fontSize: AppFontSize.${sizeField},`,
      `    fontWeight: AppFontWeight.${weightField},`,
      `    letterSpacing: AppTracking.${trackingField} * AppFontSize.${sizeField},`,
      `    height: AppLeading.${leadingField},`,
      `  );`,
    );
    parts.push(lines.join('\n'));
  }
  parts.push('}', '', 'abstract final class AppDuration {');
  for (const [key, leaf] of Object.entries(tokens.motion.motion.duration)) {
    const ms = parseMs(leaf.$value.toString());
    parts.push(`  static const Duration ${camel(key)} = Duration(milliseconds: ${ms.toString()});`);
  }
  parts.push('}', '', 'abstract final class AppEasing {');
  for (const [key, leaf] of Object.entries(tokens.motion.motion.easing)) {
    const value = leaf.$value.toString();
    if (value.startsWith('cubic-bezier')) {
      const [a, b, c, d] = parseCubicBezier(value);
      // safeKey protects against Dart reserved words (e.g. key "default" → "easeDefault").
      parts.push(
        `  static const Cubic ${safeKey('ease', key)} = Cubic(${a.toString()}, ${b.toString()}, ${c.toString()}, ${d.toString()});`,
      );
    }
  }
  parts.push('}', '', 'abstract final class AppLift {');
  for (const [key, leaf] of Object.entries(tokens.motion.motion.lift)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const double ${camel(key)} = ${stripPxForDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppOpacity {');
  for (const [key, leaf] of Object.entries(tokens.opacity.opacity)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const double ${camel(key)} = ${dartDouble(leaf.$value)};`);
  }
  // Media-surface colours are theme-INDEPENDENT — emitted once, like space/opacity,
  // never per theme (mirrors emit-scss, which keeps `--media-*` under `:root` only).
  // Video is dark under every theme, so on-media white must stay white in light mode
  // too; a themed variant would make controls vanish into the footage.
  parts.push('}', '', 'abstract final class AppMedia {');
  for (const [key, leaf] of Object.entries(tokens.media.media)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const Color ${camel(key)} = ${colorToDart(leaf.$value.toString())};`);
  }
  parts.push('}', '', 'abstract final class AppZIndex {');
  for (const [key, leaf] of Object.entries(tokens.motion.zIndex)) {
    if (key.startsWith('$')) continue;
    parts.push(`  static const int ${camel(key)} = ${leaf.$value.toString()};`);
  }
  parts.push(
    '}',
    '',
    // Shadows
    shadowsClass('AppShadowsLight', 'light', tokens.shadow.shadow),
    '',
    shadowsClass('AppShadowsDark', 'dark', tokens.shadow.shadow),
    '',
  );

  return parts.join('\n');
}
