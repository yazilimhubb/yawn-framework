import { startApp } from './app/index.ts';
import './styles/main.css';

const container = typeof document !== 'undefined' ? document.body : { innerHTML: '' };
startApp(container);
