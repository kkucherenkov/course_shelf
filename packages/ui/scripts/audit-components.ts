import { readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const COMPONENTS_DIR = path.join(import.meta.dirname, '../src/components');

// Compound-child / compound-pair components whose stories or spec live in
// their paired component's folder. They throw when used outside their
// parent, so a standalone Storybook example is not meaningful, and their
// behaviour is exercised through the paired spec (e.g. AppRadioGroup is
// integration-tested inside AppRadio.spec.ts).
//
//   key   = folder name
//   value = { stories?: 'paired-with-X', spec?: 'paired-with-X' }
const COMPOUND_EXEMPTIONS: Record<string, { stories?: string; spec?: string }> = {
  AppRadio: { stories: 'AppRadioGroup' },
  AppRadioGroup: { spec: 'AppRadio' },
  AppTab: { stories: 'AppTabs', spec: 'AppTabs' },
  AppSegmentedItem: { stories: 'AppSegmented', spec: 'AppSegmented' },
};

interface Violation {
  component: string;
  missing: string[];
}

function hasAnyStoriesFile(dir: string): boolean {
  return readdirSync(dir).some((f) => f.endsWith('.stories.ts'));
}

function auditComponents(): void {
  const entries = readdirSync(COMPONENTS_DIR);
  const dirs = entries.filter((e) => statSync(path.join(COMPONENTS_DIR, e)).isDirectory());
  const violations: Violation[] = [];

  for (const name of dirs) {
    const dir = path.join(COMPONENTS_DIR, name);
    const exempt = COMPOUND_EXEMPTIONS[name];
    const missing: string[] = [];

    const hasPrimaryVue = existsSync(path.join(dir, `${name}.vue`));
    const hasIndex = existsSync(path.join(dir, 'index.ts'));

    if (!hasIndex) missing.push('index.ts');

    // Stories: any *.stories.ts file in the folder counts (multi-vue
    // families like CourseCard use `<Family>.stories.ts`; folders whose
    // component name doesn't match the folder name like ScanProgress/
    // AppScanProgress.stories.ts would also be accepted).
    if (!exempt?.stories && !hasAnyStoriesFile(dir)) {
      missing.push(`${name}.stories.ts`);
    }

    // Spec: when a canonical <Name>.vue exists, require <Name>.spec.ts.
    // Otherwise (multi-vue family), require a sibling spec for every .vue.
    if (hasPrimaryVue) {
      if (!exempt?.spec && !existsSync(path.join(dir, `${name}.spec.ts`))) {
        missing.push(`${name}.spec.ts`);
      }
    } else {
      const vueFiles = readdirSync(dir).filter((f) => f.endsWith('.vue'));
      for (const vue of vueFiles) {
        const spec = vue.replace(/\.vue$/, '.spec.ts');
        if (!existsSync(path.join(dir, spec))) {
          missing.push(spec);
        }
      }
    }

    if (missing.length > 0) {
      violations.push({ component: name, missing });
    }
  }

  if (violations.length === 0) {
    process.stderr.write(`✓ All ${String(dirs.length)} components passed the audit.\n`);
    // eslint-disable-next-line unicorn/no-process-exit -- CLI script; exit 0 = success
    process.exit(0);
  }

  process.stderr.write(
    `\n✗ Component audit failed — ${String(violations.length)} component(s) missing required files:\n\n`,
  );
  for (const { component, missing } of violations) {
    process.stderr.write(`  ${component}:\n`);
    for (const file of missing) {
      process.stderr.write(`    missing: ${file}\n`);
    }
  }
  process.stderr.write(
    '\nEach single-component folder needs: <Name>.vue, <Name>.stories.ts, <Name>.spec.ts, index.ts\n' +
      'Compound children paired with another component (e.g. AppRadio inside AppRadioGroup)\n' +
      'can be exempted via COMPOUND_EXEMPTIONS in this script.\n',
  );
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script; exit 1 = audit failure
  process.exit(1);
}

auditComponents();
