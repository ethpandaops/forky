/**
 * @fileoverview Ban hardcoded colors (hex, rgb, hsl) in Tailwind classes and inline styles
 *
 * This rule prevents developers from using hardcoded color values in Tailwind
 * className strings and React inline styles. All colors should come from the
 * semantic color tokens defined in src/index.css.
 *
 * Examples of incorrect code:
 *   className="bg-[#ff0000]"
 *   className="text-[rgb(255,0,0)]"
 *   className="border-[hsl(0,100%,50%)]"
 *   style={{ color: '#ff0000' }}
 *   style={{ backgroundColor: 'rgb(255,0,0)' }}
 *
 * Examples of correct code:
 *   className="bg-primary"
 *   className="text-danger"
 *   className="border-accent"
 *   style={{ color: 'var(--color-primary)' }}
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded colors in Tailwind classes',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      hardcodedHexColor:
        'Hardcoded hex color "{{value}}" detected. Use semantic color tokens from src/index.css instead (e.g., bg-primary, var(--color-primary)).',
      hardcodedRgbColor:
        'Hardcoded RGB color "{{value}}" detected. Use semantic color tokens from src/index.css instead (e.g., bg-primary, var(--color-primary)).',
      hardcodedHslColor:
        'Hardcoded HSL color "{{value}}" detected. Use semantic color tokens from src/index.css instead (e.g., bg-primary, var(--color-primary)).',
      hardcodedNamedColor:
        'Hardcoded named color "{{value}}" detected in {{property}}. Use semantic color tokens from src/index.css instead (e.g., var(--color-primary)).',
    },
    schema: [],
  },

  create(context) {
    // Patterns to detect hardcoded colors in Tailwind arbitrary values
    const hexPattern = /\[#[0-9a-fA-F]{3,8}\]/g;
    const rgbPattern = /\[rgba?\([^)]+\)\]/g;
    const hslPattern = /\[hsla?\([^)]+\)\]/g;

    // Patterns for inline style values (without Tailwind brackets)
    const hexValuePattern = /^#[0-9a-fA-F]{3,8}$/;
    const rgbValuePattern = /^rgba?\([^)]+\)$/;
    const hslValuePattern = /^hsla?\([^)]+\)$/;

    // Common named colors to ban
    const namedColors = new Set([
      'black',
      'white',
      'red',
      'green',
      'blue',
      'yellow',
      'orange',
      'purple',
      'pink',
      'gray',
      'grey',
      'brown',
      'cyan',
      'magenta',
      'lime',
      'indigo',
      'violet',
      'gold',
      'silver',
      'navy',
      'teal',
      'olive',
      'maroon',
      'aqua',
      'fuchsia',
    ]);

    // Style properties that accept color values
    const colorProperties = new Set([
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'textDecorationColor',
      'fill',
      'stroke',
      'caretColor',
      'accentColor',
    ]);

    /**
     * Check if a string value contains hardcoded color values
     * @param {import('estree').Node} node - The AST node
     * @param {string} value - The string value to check
     */
    function checkForHardcodedColors(node, value) {
      // Check for hex colors
      const hexMatches = value.match(hexPattern);
      if (hexMatches) {
        hexMatches.forEach(match => {
          context.report({
            node,
            messageId: 'hardcodedHexColor',
            data: { value: match },
          });
        });
      }

      // Check for RGB colors
      const rgbMatches = value.match(rgbPattern);
      if (rgbMatches) {
        rgbMatches.forEach(match => {
          context.report({
            node,
            messageId: 'hardcodedRgbColor',
            data: { value: match },
          });
        });
      }

      // Check for HSL colors
      const hslMatches = value.match(hslPattern);
      if (hslMatches) {
        hslMatches.forEach(match => {
          context.report({
            node,
            messageId: 'hardcodedHslColor',
            data: { value: match },
          });
        });
      }
    }

    /**
     * Check if a style object property has a hardcoded color value
     * @param {import('estree').Node} node - The property node
     * @param {string} propertyName - The property name
     * @param {*} valueNode - The value node
     */
    function checkStyleProperty(node, propertyName, valueNode) {
      if (!colorProperties.has(propertyName)) {
        return;
      }

      // Handle string literal values
      if (valueNode.type === 'Literal' && typeof valueNode.value === 'string') {
        const value = valueNode.value;

        // Check for hex colors
        if (hexValuePattern.test(value)) {
          context.report({
            node: valueNode,
            messageId: 'hardcodedHexColor',
            data: { value },
          });
          return;
        }

        // Check for RGB colors
        if (rgbValuePattern.test(value)) {
          context.report({
            node: valueNode,
            messageId: 'hardcodedRgbColor',
            data: { value },
          });
          return;
        }

        // Check for HSL colors
        if (hslValuePattern.test(value)) {
          context.report({
            node: valueNode,
            messageId: 'hardcodedHslColor',
            data: { value },
          });
          return;
        }

        // Check for named colors
        if (
          namedColors.has(value.toLowerCase()) &&
          !value.startsWith('var(') &&
          value !== 'currentColor' &&
          value !== 'transparent' &&
          value !== 'inherit'
        ) {
          context.report({
            node: valueNode,
            messageId: 'hardcodedNamedColor',
            data: { value, property: propertyName },
          });
        }
      }
    }

    return {
      // Handle JSX className attributes
      JSXAttribute(node) {
        if (
          node.name.name === 'className' &&
          node.value &&
          node.value.type === 'Literal' &&
          typeof node.value.value === 'string'
        ) {
          checkForHardcodedColors(node, node.value.value);
        }

        // Handle template literals in className
        if (
          node.name.name === 'className' &&
          node.value &&
          node.value.type === 'JSXExpressionContainer' &&
          node.value.expression.type === 'TemplateLiteral'
        ) {
          node.value.expression.quasis.forEach(quasi => {
            checkForHardcodedColors(node, quasi.value.raw);
          });
        }

        // Handle style attribute with object expression
        if (
          node.name.name === 'style' &&
          node.value &&
          node.value.type === 'JSXExpressionContainer' &&
          node.value.expression.type === 'ObjectExpression'
        ) {
          node.value.expression.properties.forEach(prop => {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              checkStyleProperty(node, prop.key.name, prop.value);
            }
          });
        }
      },

      // Handle clsx/classnames/cn function calls
      CallExpression(node) {
        const functionName = node.callee.name;
        if (['clsx', 'classnames', 'cn', 'cva'].includes(functionName)) {
          node.arguments.forEach(arg => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              checkForHardcodedColors(arg, arg.value);
            }
            if (arg.type === 'TemplateLiteral') {
              arg.quasis.forEach(quasi => {
                checkForHardcodedColors(arg, quasi.value.raw);
              });
            }
          });
        }
      },
    };
  },
};
