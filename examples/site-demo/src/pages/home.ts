import { defineComponent } from '../../../../packages/core/src/index.js';
import { LandingHero } from '../components/LandingHero.ts';

export const HomePage = defineComponent({
  setup() {
    return () => ({
      tag: 'section',
      children: [
        LandingHero.setup(),
      ],
    });
  },
});
