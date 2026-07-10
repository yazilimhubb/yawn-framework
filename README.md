# Yawn Framework

A small TypeScript HTML-based web framework with a custom `.yawn` templating language.

Quick start:

```bash
# create a new project
node --import tsx bin/yh.js create site landing my-site
cd my-site
node --import tsx src/server.ts
```

Commands:

- `yh create site landing [dir]` - scaffold a landing site
- `yh create component <Name> [dir]` - create a `.yawn` component
- `yh insert <file> <ComponentName> [key=val ...]` - insert a component tag into a .yawn file

License: MIT
