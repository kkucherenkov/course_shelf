/**
 * Custom Stylelint rule: `course-shelf/font-size-token-only`.
 *
 * `declaration-property-value-disallowed-list` (stylelint.config.mjs, the
 * #668/#675 gate) only sees a literal written directly on the `font-size`
 * property — `font-size: 11px`. It is blind to the same literal one level of
 * indirection away: a SCSS `$variable` declared as a bare px value and then
 * referenced from `font-size`. Four such variables shipped below the type
 * scale and were invisible to every pass that grepped for `font-size:\s*\d`
 * (#700) — this rule closes that gap structurally rather than by another
 * one-off cleanup.
 *
 * The type scale (`--text-xs` … `--text-7xl`) has no "bespoke ramp" escape
 * hatch the way spacing/dimensions do (see AppAvatar.vue's own comment on
 * off-step diameters) — every `font-size` must resolve to a `var(--text-*)`
 * token, so a `$var` holding a raw px number is always the defect, not just
 * the below-scale ones.
 */

import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'course-shelf/font-size-token-only';

const messages = ruleMessages(ruleName, {
  rejected: (varName, value) =>
    `font-size: ${varName} resolves to a raw "${value}" — declare ${varName} as var(--text-*) ` +
    `(or reference the token directly) instead of a hand-picked px value (#700).`,
});

const meta = {
  url: 'https://github.com/kkucherenkov/course_shelf/issues/700',
};

const BARE_VAR = /^(\$[a-zA-Z_-][\w-]*)$/;
const RAW_PX = /^-?[\d.]+px$/;

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual: primary });
    if (!validOptions) return;

    // One SCSS `<style>` block per invocation (postcss-html splits Vue SFCs
    // that way) — a single flat map of the block's own `$var` declarations
    // is enough; these components don't share variables across blocks.
    const declaredValues = new Map();

    root.walkDecls((decl) => {
      if (decl.prop.startsWith('$')) {
        declaredValues.set(decl.prop, decl.value.trim());
      }
    });

    root.walkDecls('font-size', (decl) => {
      const match = BARE_VAR.exec(decl.value.trim());
      if (!match) return;

      const varName = match[1];
      const varValue = declaredValues.get(varName);
      if (varValue === undefined || !RAW_PX.test(varValue)) return;

      report({
        message: messages.rejected(varName, varValue),
        messageArgs: [varName, varValue],
        node: decl,
        result,
        ruleName,
      });
    });
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default createPlugin(ruleName, rule);
