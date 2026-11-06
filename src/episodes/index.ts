import type { Episode } from '@/engine';
import { HOT_SEAT_SCENES } from './hot-seat/scenes';
import { LAUGH_SCENES } from './klopp-laughs/scenes';
import { LAST_LIGHT_SCENES } from './ronaldo-last-light/scenes';

/** Register every episode here. The key is used in the URL: ?episode=hot-seat */
export const episodes: Record<string, Episode> = {
  'hot-seat': { title: 'Carrick – The Hot Seat (Short)', width: 1080, height: 1920, scenes: HOT_SEAT_SCENES },
  'klopp-laughs': { title: "Klopp – Can't Stop Laughing (Short)", width: 1080, height: 1920, scenes: LAUGH_SCENES },
  'ronaldo-last-light': { title: 'Ronaldo – The Last Light (Short)', width: 1080, height: 1920, scenes: LAST_LIGHT_SCENES },
};

export const defaultEpisode = 'hot-seat';
