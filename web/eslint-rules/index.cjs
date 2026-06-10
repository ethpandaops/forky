/**
 * @fileoverview Custom ESLint rules for the forky frontend
 *
 * These rules enforce the two-tier color architecture: all colors should be
 * defined in src/index.css as primitive scales + semantic tokens, and
 * application code should only reference the semantic tokens.
 */

module.exports = {
  rules: {
    'no-hardcoded-colors': require('./no-hardcoded-colors.cjs'),
    'no-primitive-color-scales': require('./no-primitive-color-scales.cjs'),
  },
};
