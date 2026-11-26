# Shared UI and accessibility

- Reuse the public header and footer and the existing admin and volunteer layouts. Instructors use the volunteer portal with backend permissions appropriate to the operation, not a separate portal or a client-only access check.
- Reuse the shared [theme](../public/css/theme.css), [layout](../public/css/layout.css), and [component](../public/css/components.css) styles. Scope page CSS to its page or component.
- Preserve keyboard navigation, visible focus, accessible labels, skip links, and Escape/focus-return behavior for dismissible UI.
- Scale verification to the change. For layout, navigation, or interactive changes, check affected pages on phone, tablet, and desktop, including relevant routes, refreshes, and assets in development and production mode. Small copy-only edits need a focused check for readability and wrapping, not full browser verification.

Activate [shared-ui-integration](../.cline/skills/shared-ui-integration/SKILL.md) for page routes, shared layouts, responsive CSS, or interactive UI changes.
