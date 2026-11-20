# Heal One World JavaScript Style Guide

Apply these rules when adding or editing team-authored `.js`, `.jsx`, or `.mjs` files. Do not edit generated files in `dist/`, dependencies in `node_modules/`, or unrelated code just to apply this guide.

## Formatting and naming

- Use double quotes for strings and JSX attributes, and end statements with semicolons. Use template literals when interpolating values.
- Match the surrounding file’s indentation. For a new file, follow a nearby file that serves the same purpose. Do not reformat unrelated lines.
- Use `camelCase` for variables and functions, `PascalCase` for React components, and a `use` prefix for custom hooks (for example, `useLogin`). Use `UPPER_SNAKE_CASE` for module-level constants that represent fixed configuration or lookup tables.
- Prefer `const`, use `let` when reassignment is necessary, and avoid `var` in new code. Use strict equality (`===` and `!==`) unless coercion is intentional and explained.
- Prefer early returns over deep nesting. Use comments to explain why a decision was made or to document a non-obvious constraint, rather than restating the code.

## Modules and project structure

- Keep Express server files in CommonJS (`require`, `module.exports`). Use ES modules (`import`, `export`) in React/Vite code and existing `.mjs` modules. Do not convert an existing file’s module format as part of an unrelated edit.
- Keep route handlers focused on reading and validating requests, calling services, and sending responses. Put reusable business logic and database operations in `services/` and reuse existing middleware for shared request checks.
- In React, use function components and hooks. Name component files after their primary component when adding files alongside similarly named components. Call hooks at the top level, before conditional returns, and use stable data IDs as keys for lists when available.
- Prefer `async`/`await` for asynchronous work. Follow nearby code’s error-handling pattern; do not silently swallow errors. When changing a frontend data request, account for loading, success, and failure states as appropriate.

## Verification

- For behavior changes, add or update focused tests in `tests/` using `node:test` and `node:assert/strict`. Keep tests independent of the shared database and live services. Run `npm test` from the project root.
- For frontend changes, also run `npm run build` from the project root.