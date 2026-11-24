---
name: shared-ui-integration
description: Integrate and verify static HTML and React routes, shared public navigation or portal layouts, responsive styles, and keyboard interactions. Use before changing page wiring, shared UI, or interactive behavior.
---

# Shared UI integration

1. Trace the URL through [Express mounts and fallback](../../../app.js), [static page routes and redirects](../../../routes/index.js), and the [React page map](../../../public/main.jsx). Extend the existing route surface; preserve working links and check that API or asset requests are not served the React shell.
2. Use the [homepage](../../../public/home.html) and its [header loader](../../../public/js/header.js) for static integration. React pages use [PublicHeader](../../../public/components/Header/PublicHeader.jsx), which loads the same [HTML fragment](../../../public/components/header.html). Reuse [Footer](../../../public/components/Footer/Footer.jsx) through the [static account/footer entry](../../../public/header-account.jsx) or the React shell as appropriate. Use [AdminLayout](../../../public/admin/AdminLayout.jsx) or [VolunteerLayout](../../../public/components/Volunteer/VolunteerLayout.jsx) for portal pages.
3. Check the [shared styles guide](../../../public/css/README.md) and the target page's stylesheet order. Scope new selectors. Use links for destinations and buttons for actions; test Tab order, visible focus, labels, and skip-link targets. For dismissible controls, check Escape and focus return against the [shared menu behavior](../../../public/js/header-menu.js).
4. Scale these checks to the affected behavior; small copy-only edits need a focused readability and wrapping check rather than the full verification below. Check [Vite's two build entries and manifest](../../../vite.config.mjs), then follow [task-verification-review](../task-verification-review/SKILL.md) for the build. On phone, tablet, and desktop, verify navigation, direct URLs, reloads, and CSS/JS/image loading in development and production mode. For portal changes, include denied access and verify API permissions separately from UI state. Report modes and viewports you could not check.
