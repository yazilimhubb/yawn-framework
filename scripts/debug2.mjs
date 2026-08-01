import { compileSFC } from '../packages/compiler/dist/index.js';

// Test :if true → show if block, hide else
const t1 = compileSFC(
  `<template><div><p :if="show">YES</p><p :else>NO</p></div></template><script>let show=true;</script>`,
  'x', { tailwind: false, fullPage: false }
);
const body1 = t1.html.slice(0, t1.html.indexOf('<script'));
console.log('show=true  → has YES:', body1.includes('>YES<'), '| has NO:', body1.includes('>NO<'));

// Test :if false → hide if block, show else  
const t2 = compileSFC(
  `<template><div><p :if="show">YES</p><p :else>NO</p></div></template><script>let show=false;</script>`,
  'x', { tailwind: false, fullPage: false }
);
const body2 = t2.html.slice(0, t2.html.indexOf('<script'));
console.log('show=false → has YES:', body2.includes('>YES<'), '| has NO:', body2.includes('>NO<'));

// Test :each
const t3 = compileSFC(
  `<template><ul><li :each="item in items">{{ item }}</li></ul></template><script>let items=["a","b","c"];</script>`,
  'y', { tailwind: false, fullPage: false }
);
const body3 = t3.html.slice(0, t3.html.indexOf('<script'));
console.log(':each      → has a:', body3.includes('>a<'), '| has b:', body3.includes('>b<'), '| has c:', body3.includes('>c<'));

// Test :model
const t4 = compileSFC(
  `<template><input :model="name" /><p>{{ name }}</p></template><script>let name="World";</script>`,
  'z', { tailwind: false, fullPage: false }
);
const body4 = t4.html.slice(0, t4.html.indexOf('<script'));
console.log(':model     → has World:', body4.includes('World'));

// Test resolveComponent
const btnSrc = `<template><button>{{ label }}</button></template><script>let label="Go";</script>`;
const t5 = compileSFC(
  `<template><div><Btn label="Click me" /></div></template><script></script>`,
  'page', { tailwind: false, fullPage: false, resolveComponent: n => n === 'Btn' ? btnSrc : null }
);
const body5 = t5.html.slice(0, t5.html.indexOf('<script'));
console.log('component  → has Click me:', body5.includes('Click me'));

console.log('\nDone.');
process.exit(0);
