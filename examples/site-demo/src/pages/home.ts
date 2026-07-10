import { defineComponent } from '../../../../packages/core/src/index.js';
import { LandingHero } from '../components/LandingHero.js';

export const HomePage = defineComponent({
  setup() {
    return {
      tag: 'section',
      children: [LandingHero.setup({})],
    };
  },
});
