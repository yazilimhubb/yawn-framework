import { compileSFC } from '../packages/compiler/dist/index.js';

const { html } = compileSFC(
  `<template><div><h1>{{ title }}</h1><p :if="show">YES</p><p :else>NO</p></div></template>
   <script>let title="Yawn v0.2"; let show=true;</script>`,
  'test', { tailwind: false }
);

const ok = html.includes('Yawn v0.2') && html.includes('YES') && !html.includes('>NO<');
console.log('compileSFC:', ok ? '✓ PASS' : '✗ FAIL');
console.log('resolveComponent in options:', 'resolveComponent' in ({} /* SFCCompileOptions */));

// Test with resolveComponent
const btnSrc = `<template><button class="btn">{{label}}</button></template><script>let label="Click";</script>`;
const { html: html2 } = compileSFC(
  `<template><div><Button label="Submit" /></div></template><script></script>`,
  'page', { tailwind: false, resolveComponent: (n) => n === 'Button' ? btnSrc : null }
);
console.log('resolveComponent:', html2.includes('Submit') ? '✓ PASS' : '✗ FAIL');
console.log('\nAll tests done.');
process.exit(0);
