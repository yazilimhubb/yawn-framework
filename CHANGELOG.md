# Changelog

## v0.2.2 — 2026-08-01

_Release notes coming soon._

## v0.2.1 — 2026-08-01

_Release notes coming soon._

# Changelog

## v0.2.0 — 2026-08-01

### 🚀 Breaking Changes
- All packages now ship compiled JavaScript in `dist/` — no more TypeScript source required at runtime
- `yawn-framework` exports updated: `yawn-framework/compiler`, `yawn-framework/dev-server` etc. now resolve to `dist/*.js`
- Projects using `@yawn-framework/compiler` should migrate to `yawn-framework/compiler`

### ✨ New Features

**Compiler**
- `:else` and `:else-if` directives now fully work in both SSR and client runtime
- `:bind:attr="expr"` dynamic attribute binding
- `:class="expr"` — accepts string, object `{ active: bool }`, or array
- `:style="expr"` — accepts string or object `{ color: 'red' }`
- `:model="varName"` two-way input binding shorthand (replaces `@input="x = event.target.value"`)
- `:each` now supports `$index` and `item, i in items` syntax
- `resolveComponent` option in `compileSFC` — inline component expansion at SSR time
- `<meta>` block in `.yawn` files for `title`, `description`, `og:title`, `og:image`
- Infinite loop bug in `processIfElseBlocks` fixed

**CLI (`yh`)**
- `yh create page <Name>` — scaffolds a new page with proper meta block
- `yh init` now generates `_layout.yawn` with shared nav/footer
- Layout system: `{{ slot }}` in `_layout.yawn` auto-wraps all pages
- Auto-discovery routing — add `.yawn` files to `src/pages/`, routes appear automatically
- `yh build` now compiles `.yawn` pages to static HTML files in `dist/`
- Error overlay in dev mode — render errors shown in browser
- When run from framework source, generated projects use `file:` dependency path

**Dev Server**
- Error overlay page on render failures
- Better 404 page with HMR script
- Watches project root (not just `rootDir`) for hot reload

**`create-yawn` (npx)**
- `npx create-yawn@latest my-site` interactive scaffolder
- Prompts for project name, auto-installs dependencies
- `--pm=yarn` / `--pm=pnpm` flags for package manager choice

### 🐛 Bug Fixes
- `@yawn-framework/compiler` export path was pointing to `.ts` source — now `dist/index.js`
- `core/src/app.ts` — `AppModuleContext` missing `modules` property
- `router` — relative cross-package imports replaced with package names
- `runtime` — cross-package imports fixed
- `devtools` — cross-package imports fixed
- `compileSFC` with `resolveComponent` no longer requires `as any` cast

---

## v0.1.0 — initial release
