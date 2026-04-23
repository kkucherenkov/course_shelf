import { BANNER, type TokenBundle } from './types.ts';

function kebab(name: string): string {
  return name
    .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
    .replaceAll(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

type ThemeName = 'light' | 'dark' | 'sepia' | 'forest';

function themedBlock(themeName: ThemeName, tokens: TokenBundle): string {
  // Light doubles as the default — emit it under `:root` as well so semantic
  // tokens (--text-fg, --surface-surface, --brand-accent-*, …) resolve even
  // when no `data-theme` attribute is set on <html>. Other themes override via
  // their own selectors only.
  // dark theme responds to both our data-theme attr and Nuxt UI's class strategy.
  const selector =
    themeName === 'light'
      ? `:root, [data-theme='light']`
      : themeName === 'dark'
        ? `[data-theme='dark'], .dark`
        : `[data-theme='${themeName}']`;
  const lines: string[] = [`${selector} {`];

  const { color, shadow } = tokens;
  const groups = ['brand', 'surface', 'border', 'text', 'status'] as const;
  for (const group of groups) {
    const entries = color.color[group];
    for (const [key, leaf] of Object.entries(entries)) {
      // Fall back to light values when a theme-specific key is absent.
      const value = (leaf[themeName] ?? leaf.light).$value.toString();
      lines.push(`  --${kebab(group)}-${kebab(key)}: ${value};`);
    }
  }

  for (const [key, leaf] of Object.entries(shadow.shadow)) {
    const value = (leaf[themeName] ?? leaf.light).$value.toString();
    lines.push(`  --shadow-${kebab(key)}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function emitScss(tokens: TokenBundle): string {
  const sections: string[] = [BANNER, '', ':root {'];


  const { typography, spacing, radius, motion, color } = tokens;

  for (const [key, leaf] of Object.entries(typography.typography.font.family)) {
    sections.push(`  --font-${kebab(key)}: ${leaf.$value.toString()};`);
  }
  for (const [key, leaf] of Object.entries(typography.typography.font.weight)) {
    sections.push(`  --fw-${kebab(key)}: ${leaf.$value.toString()};`);
  }
  for (const [key, leaf] of Object.entries(typography.typography.font.size)) {
    sections.push(`  --text-${kebab(key)}: ${leaf.$value.toString()};`);
  }
  for (const [key, leaf] of Object.entries(typography.typography.font.tracking)) {
    sections.push(`  --tracking-${kebab(key)}: ${leaf.$value.toString()};`);
  }
  for (const [key, leaf] of Object.entries(typography.typography.font.leading)) {
    sections.push(`  --leading-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [key, leaf] of Object.entries(spacing.space)) {
    sections.push(`  --space-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [key, leaf] of Object.entries(radius.radius)) {
    sections.push(`  --radius-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [key, leaf] of Object.entries(motion.motion.duration)) {
    sections.push(`  --dur-${kebab(key)}: ${leaf.$value.toString()};`);
  }
  const easingLines = Object.entries(motion.motion.easing).map(
    ([key, leaf]) => `  --ease-${kebab(key)}: ${leaf.$value.toString()};`,
  );
  // Bare alias: source-bundle and components use `--ease` as shorthand for the default easing.
  easingLines.push('  --ease: var(--ease-default);');
  sections.push(...easingLines);
  for (const [key, leaf] of Object.entries(motion.motion.lift)) {
    if (key.startsWith('$')) continue;
    sections.push(`  --lift-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [key, leaf] of Object.entries(tokens.opacity.opacity)) {
    if (key.startsWith('$')) continue;
    sections.push(`  --opacity-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [roleKey, role] of Object.entries(tokens.typography.typography.role)) {
    if (roleKey.startsWith('$')) continue;
    const size = tokens.typography.typography.font.size[role.size]?.$value ?? '';
    const weight = tokens.typography.typography.font.weight[role.weight]?.$value ?? '';
    const tracking = tokens.typography.typography.font.tracking[role.tracking]?.$value ?? '';
    const leading = tokens.typography.typography.font.leading[role.leading]?.$value ?? '';
    const prefix = `--role-${kebab(roleKey)}`;
    const roleLines = [
      `  ${prefix}-font-size: ${size.toString()};`,
      `  ${prefix}-font-weight: ${weight.toString()};`,
      `  ${prefix}-letter-spacing: ${tracking.toString()};`,
      `  ${prefix}-line-height: ${leading.toString()};`,
    ];
    if (role.mono === true) {
      roleLines.push(`  ${prefix}-font-family: var(--font-mono);`);
    }
    sections.push(...roleLines);
  }

  for (const [key, leaf] of Object.entries(motion.zIndex)) {
    if (key.startsWith('$')) continue;
    sections.push(`  --z-${kebab(key)}: ${leaf.$value.toString()};`);
  }

  for (const [key, leaf] of Object.entries(color.color.vertical)) {
    if (leaf.$value !== undefined) {
      sections.push(`  --vertical-${kebab(key)}: ${leaf.$value};`);
    }
    if (leaf.bgTint !== undefined) {
      sections.push(`  --vertical-${kebab(key)}-tint: ${leaf.bgTint};`);
    }
  }

  sections.push(
    '}',
    '',
    themedBlock('light', tokens),
    '',
    themedBlock('dark', tokens),
    '',
    themedBlock('sepia', tokens),
    '',
    themedBlock('forest', tokens),
    '',
  );

  return sections.join('\n');
}
