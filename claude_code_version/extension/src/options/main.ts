import Options from './Options.svelte';
import { mount } from 'svelte';
import '../popup/app.css';

const app = mount(Options, {
  target: document.getElementById('app')!,
});

export default app;
