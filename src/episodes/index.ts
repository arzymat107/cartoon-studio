import { KANE, MBAPPE, YAMAL } from '@/components';
import type { Episode } from '@/engine';
import { DICTATOR_CHAPTERS, figureShowcase, SHORTS_CHAPTERS, TROPHY_CHAPTERS } from './figure-showcase/scenes';
import { KANE_TOON_SCENES } from './kane-toon/scenes';
import { HOT_SEAT_SCENES } from './hot-seat/scenes';
import { LAUGH_SCENES } from './klopp-laughs/scenes';
import { LAST_LIGHT_SCENES } from './ronaldo-last-light/scenes';

/** Register every episode here. The key is used in the URL: ?episode=hot-seat */
export const episodes: Record<string, Episode> = {
  'hot-seat': { title: 'Carrick – The Hot Seat (Short)', width: 1080, height: 1920, scenes: HOT_SEAT_SCENES },
  'klopp-laughs': { title: "Klopp – Can't Stop Laughing (Short)", width: 1080, height: 1920, scenes: LAUGH_SCENES },
  'ronaldo-last-light': { title: 'Ronaldo – The Last Light (Short)', width: 1080, height: 1920, scenes: LAST_LIGHT_SCENES },
  'mbappe-actions': { title: 'Mbappé · Portrait – every action', width: 1080, height: 1920, scenes: figureShowcase(MBAPPE, { signature: DICTATOR_CHAPTERS }) },
  'yamal-actions': { title: 'Yamal · Portrait – every action', width: 1080, height: 1920, scenes: figureShowcase(YAMAL, { greeting: 'Hola\nculers!', signature: SHORTS_CHAPTERS }) },
  'kane-toon': { title: 'Kane · Portrait vs Toon (style check)', width: 1080, height: 1920, scenes: KANE_TOON_SCENES },
  'kane-actions': { title: 'Kane · Portrait – every action', width: 1080, height: 1920, scenes: figureShowcase(KANE, { greeting: 'Servus\nMünchen!', signature: TROPHY_CHAPTERS }) },
};

export const defaultEpisode = 'hot-seat';
