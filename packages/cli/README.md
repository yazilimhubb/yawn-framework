# @yawn/cli

The command-line interface for Yawn framework. Scaffold projects, create components, start dev servers and build sites.

## Install

```bash
npm install -g yawn-framework
# or with npx:
npx yawn-framework init my-site
```

## Commands

### `yh init [dir]`

Scaffold a new Yawn app.

```bash
yh init my-site
cd my-site
npm install
yh dev
```

### `yh dev [dir]`

Start the development server. Looks for `src/server.ts`, `src/main.ts` (or `.js` variants) and runs it with `tsx`.

```bash
yh dev .
yh dev ./my-site
```

### `yh build [dir]`

Build the project. Runs `tsc` if `tsconfig.json` is present, otherwise compiles all `.yawn` files to static HTML in `dist/`.

```bash
yh build .
```

### `yh create component <Name> [dir]`

Scaffold a new `.yawn` component.

```bash
yh create component Hero .
# creates src/components/Hero.yawn
```

### `yh create site landing [dir]`

Scaffold a complete landing-site structure.

```bash
yh create site landing my-site
```

### `yh insert <file> <ComponentName> [key=value ...]`

Insert a component tag into an existing `.yawn` file before `</main>`.

```bash
yh insert src/page.yawn Hero title="Hello" cta="Start"
# inserts: <con:Hero title="Hello" cta="Start" />
```
