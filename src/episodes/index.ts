import type { Episode } from '@/engine';
import { BODY_POSE_24_SCENES, BODY_POSE_SCENES } from './body/poses';
import { HOODIE_SCENES } from './body/puppet';
import { BODY_CLEAN_SCENES, BODY_FULL_SCENES, BODY_SCENES } from './body/scenes';
import { KANE_SCENES } from './kane/scenes';
import { HOT_SEAT_SCENES } from './hot-seat/scenes';
import { LAUGH_SCENES } from './klopp-laughs/scenes';
import { LAST_LIGHT_SCENES } from './ronaldo-last-light/scenes';

/** Register every episode here. The key is used in the URL: ?episode=hot-seat */
export const episodes: Record<string, Episode> = {
  'hot-seat': { title: 'Carrick – The Hot Seat (Short)', width: 1080, height: 1920, scenes: HOT_SEAT_SCENES },
  'klopp-laughs': { title: "Klopp – Can't Stop Laughing (Short)", width: 1080, height: 1920, scenes: LAUGH_SCENES },
  'ronaldo-last-light': { title: 'Ronaldo – The Last Light (Short)', width: 1080, height: 1920, scenes: LAST_LIGHT_SCENES },
  kane: { title: 'Kane · flat cartoon (check)', width: 1080, height: 1920, scenes: KANE_SCENES },
  body: { title: 'Cut-out body · normal (check)', width: 1080, height: 1920, scenes: BODY_SCENES },
  'body-clean': { title: 'Cut-out body · cleaned-up frames (check)', width: 1080, height: 1920, scenes: BODY_CLEAN_SCENES },
  'body-full': { title: 'Cut-out body · complete parts (check)', width: 1080, height: 1920, scenes: BODY_FULL_SCENES },
  hoodie: { title: 'Hoodie puppet · walk and clap', width: 1080, height: 1920, scenes: HOODIE_SCENES },
  'body-poses': { title: 'Cut-out body · 12 walk poses', width: 1600, height: 2240, transition: 0, scenes: BODY_POSE_SCENES },
  'body-poses-24': { title: 'Cut-out body · 24 walk poses', width: 1600, height: 2240, transition: 0, scenes: BODY_POSE_24_SCENES },
};

export const defaultEpisode = 'hot-seat';
