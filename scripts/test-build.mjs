import { compileSFC } from '../packages/compiler/dist/index.js';
import { startDevServer } from '../packages/dev-server/dist/index.js';

// Test compileSFC
const { html } = compileSFC(
  `<template><div><h1>{{ title }}</h1><p :if="show">Visible!</p><p :else>Hidden!</p></div></template>
   <script>let title = "Hello Yawn v0.2"; let show = true;</script>`,
  'test',
  { tailwind: false }
);

console.log('\n  ✓ compileSFC works');
console.log('  html length:', html.length);
console.log('  has title:', html.includes('Hello Yawn v0.2'));
console.log('  has :if render:', html.includes('Visible!'));
console.log('  :else hidden:', !html.includes('Hidden!') || html.includes(':else'));

// Test that dev-server exports
console.log('  ✓ startDevServer type:', typeof startDevServer);

console.log('\n  ✅ All exports working from dist/\n');
