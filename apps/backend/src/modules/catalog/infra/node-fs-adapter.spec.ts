/**
 * Unit tests for NodeFsAdapter.walk() against a real temp directory tree —
 * the ignore-list behaviour (#506) is exactly the opendir/recursion wiring
 * this class owns, so a fake filesystem would test nothing.
 */
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { NodeFsAdapter } from './node-fs-adapter';

describe('NodeFsAdapter.walk', () => {
  let root: string;
  const adapter = new NodeFsAdapter();

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'node-fs-adapter-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function collectPaths(): Promise<string[]> {
    const paths: string[] = [];
    for await (const entry of adapter.walk(root)) {
      paths.push(path.relative(root, entry.path));
    }
    return paths.toSorted();
  }

  it('does not descend into node_modules — no entry from inside it is yielded', async () => {
    const courseDir = path.join(root, 'Backend Node.js-разработчик');
    const nodeModulesDir = path.join(courseDir, 'node_modules', 'some-pkg');
    await mkdir(nodeModulesDir, { recursive: true });
    await writeFile(path.join(nodeModulesDir, 'index.js'), '');
    await writeFile(path.join(nodeModulesDir, 'package.json'), '{}');
    await writeFile(path.join(courseDir, 'lesson-1.mp4'), '');

    const paths = await collectPaths();

    expect(paths).toEqual(
      [
        'Backend Node.js-разработчик',
        path.join('Backend Node.js-разработчик', 'lesson-1.mp4'),
      ].toSorted(),
    );
    expect(paths.some((p) => p.includes('node_modules'))).toBe(false);
  });

  it.each(['__pycache__', 'vendor', 'bower_components'])(
    'does not descend into %s',
    async (dirName) => {
      const junkDir = path.join(root, 'Course', dirName);
      await mkdir(junkDir, { recursive: true });
      await writeFile(path.join(junkDir, 'junk.bin'), '');
      await writeFile(path.join(root, 'Course', 'lesson-1.mp4'), '');

      const paths = await collectPaths();

      expect(paths.some((p) => p.includes(dirName))).toBe(false);
      expect(paths).toContain(path.join('Course', 'lesson-1.mp4'));
    },
  );

  it('still descends into an ordinary course/section directory', async () => {
    const sectionDir = path.join(root, 'Course', '01 - Section');
    await mkdir(sectionDir, { recursive: true });
    await writeFile(path.join(sectionDir, 'lesson-1.mp4'), '');

    const paths = await collectPaths();

    expect(paths).toContain(path.join('Course', '01 - Section', 'lesson-1.mp4'));
  });
});
