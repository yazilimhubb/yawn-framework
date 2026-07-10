import { startApp } from './app/index.ts';

const container = typeof document !== 'undefined' ? document.body : { innerHTML: '' };

if (typeof document !== 'undefined') {
  import('./styles/main.css');
}

startApp(container);
