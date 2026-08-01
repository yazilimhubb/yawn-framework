import { compileSFC } from '../packages/compiler/dist/index.js';

// Test 1: basic :if/:else
const src1 = `<template><div><h1>{{ title }}</h1><p :if="show">YES</p><p :else>NO</p></div></template>
<script>let title="Yawn v0.2"; let show=true;</script>`;

const { html: h1 } = compileSFC(src1, 'test', { tailwind: false });
console.log('has title:', h1.includes('Yawn v0.2'));
console.log('has YES:', h1.includes('>YES<'));
console.log('has NO:', h1.includes('>NO<'));
console.log('--- snippet ---');
// Find the relevant part
const start = h1.indexOf('<h1>');
console.log(h1.slice(start, start + 200));
process.exit(0);
