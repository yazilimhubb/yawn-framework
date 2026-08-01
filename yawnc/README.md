# yawnc — Yawn Framework C++ Native Runtime

Single-binary C++ implementation of the Yawn `.yawn` template engine.  
No Node.js, no npm. Just compile and run.

## Features

- `.yawn` SFC parser — `<template>`, `<script>`, `<style>`, `<meta>` blocks
- All directives: `{{ expr }}`, `:if`, `:else`, `:each`, `:model`, `:class`, `:style`, `:bind:attr`
- File-based routing — `src/pages/*.yawn` → URL routes (automatic)
- Layout system — `_layout.yawn` with `{{ slot }}` injection
- Built-in HTTP dev server with SSE-based hot reload (HMR)
- Static HTML build output (`dist/`)
- Component resolution — `<MyComp prop="val" />`
- Rainbow-colored CLI output

## Build

**Requirements:** C++20 compiler (GCC 12+, Clang 14+, MSVC 2022), CMake 3.18+

```bash
# Debug
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build

# Release (optimized, stripped)
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Binary: `build/yawnc` (or `build/yawnc.exe` on Windows)

## Usage

```bash
yawnc init my-site          # Scaffold new project
yawnc dev my-site           # Dev server  →  http://localhost:3000
yawnc build my-site         # Build to dist/
yawnc create page Contact   # New page
yawnc create component Card # New component
yawnc help
```

## Dev server options

```bash
yawnc dev . --port 8080
```

## Project structure

```
my-site/
  src/
    _layout.yawn      # Shared layout ({{ slot }})
    pages/
      index.yawn      # Route: /
      about.yawn      # Route: /about
    components/
      Card.yawn
  public/             # Static assets
```

## Performance

| Operation          | Node.js (yh) | C++ (yawnc) |
|--------------------|:------------:|:-----------:|
| Cold start         | ~300ms       | ~5ms        |
| Single page render | ~15ms        | ~0.3ms      |
| 100 page build     | ~2s          | ~30ms       |

## Differences from Node.js version

- No npm, no dependencies — single binary
- Expression evaluator is simpler (basic comparisons, no full JS)
- Reactive client runtime is identical (same JS generated)
- Dev server is single-threaded (fine for development)
