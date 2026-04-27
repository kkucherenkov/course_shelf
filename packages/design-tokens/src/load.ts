import { readFileSync } from 'node:fs';
import path from 'node:path';

import type {
  ColorFile,
  MotionFile,
  OpacityFile,
  RadiusFile,
  ShadowFile,
  SpacingFile,
  TokenBundle,
  TypographyFile,
} from './types.ts';

interface DocsTokensFile {
  color: ColorFile['color'];
  space: SpacingFile['space'];
  radius: RadiusFile['radius'];
  shadow: ShadowFile['shadow'];
  motion: MotionFile['motion'];
  zIndex: MotionFile['zIndex'];
  opacity: OpacityFile['opacity'];
  typography: TypographyFile['typography'];
}

export function loadTokens(repoRoot: string): TokenBundle {
  // The single source of truth is the design handout. The `_palette` section
  // (raw colour primitives) is intentionally ignored — codegen consumes only
  // the semantic `color.*` group.
  const file = path.join(repoRoot, 'docs/design/shared/tokens.json');
  const raw = JSON.parse(readFileSync(file, 'utf8')) as DocsTokensFile;

  return {
    color: { color: raw.color },
    typography: { typography: raw.typography },
    spacing: { space: raw.space },
    radius: { radius: raw.radius },
    shadow: { shadow: raw.shadow },
    motion: { motion: raw.motion, zIndex: raw.zIndex },
    opacity: { opacity: raw.opacity },
  };
}
