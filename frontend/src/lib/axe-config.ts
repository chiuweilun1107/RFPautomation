/**
 * Axe-core accessibility testing configuration
 * Only runs in development mode to catch accessibility issues early
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Dynamic import to avoid bundling in production
  import('@axe-core/react').then((axe) => {
    const React = require('react');
    const ReactDOM = require('react-dom');

    axe.default(React, ReactDOM, 1000, {
      rules: [
        // Enable all WCAG 2.1 AA rules
        { id: 'color-contrast', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'input-button-name', enabled: true },
        { id: 'label', enabled: true },
        { id: 'aria-required-attr', enabled: true },
        { id: 'aria-valid-attr', enabled: true },
        { id: 'aria-valid-attr-value', enabled: true },
        { id: 'aria-allowed-attr', enabled: true },
        { id: 'aria-hidden-focus', enabled: true },
        { id: 'tabindex', enabled: true },
        { id: 'duplicate-id', enabled: true },
        { id: 'duplicate-id-active', enabled: true },
        { id: 'duplicate-id-aria', enabled: true },
      ],
    });

    console.info('🔍 Axe-core accessibility testing enabled in development mode');
  }).catch((error) => {
    console.error('Failed to initialize axe-core:', error);
  });
}
