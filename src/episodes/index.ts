import { KANE, KANE_CARICATURE, MBAPPE, MBAPPE_CARICATURE, YAMAL, YAMAL_CARICATURE } from '@/components';
import type { Episode } from '@/engine';
import { BenchedScene } from './benched/scenes/BenchedScene';
import { FriendScene } from './demo/scenes/FriendScene';
import { FinedScene } from './fined/scenes/FinedScene';
import { DICTATOR_CHAPTERS, figureShowcase, SHORTS_CHAPTERS, TROPHY_CHAPTERS } from './figure-showcase/scenes';
import { FarewellScene } from './farewell/scenes/FarewellScene';
import { SPEECH_SCENES } from './kane-speech/scenes';
import { WHO_IS_BEST_SCENES } from './who-is-best/scenes';
import { DressingRoomScene } from './madrid-laughs/scenes/DressingRoomScene';
import { FullTimeScene } from './madrid-laughs/scenes/FullTimeScene';
import { TableScene as MadridTableScene } from './madrid-laughs/scenes/TableScene';
import { VideoCallScene } from './madrid-laughs/scenes/VideoCallScene';
import { RuizGoalScene } from './psg-barca/scenes/RuizGoalScene';
import { TableScene } from './psg-barca/scenes/TableScene';
import { VitinhaGoalScene } from './psg-barca/scenes/VitinhaGoalScene';
import { YamalGoalScene } from './psg-barca/scenes/YamalGoalScene';
import { MorningScene } from './demo/scenes/MorningScene';
import { ChallengeScene } from './football/scenes/ChallengeScene';
import { MagicChipScene } from './football/scenes/MagicChipScene';
import { PowerShotScene } from './football/scenes/PowerShotScene';

/** Register every episode here. The key is used in the URL: ?episode=demo */
export const episodes: Record<string, Episode> = {
  demo: { title: 'Demo – A Sunny Day', scenes: [MorningScene, FriendScene] },
  football: {
    title: 'Football Parody – Free Kick Battle (Short)',
    width: 1080,
    height: 1920,
    scenes: [ChallengeScene, PowerShotScene, MagicChipScene],
  },
  farewell: {
    title: 'Messi – The Last Dance (Short)',
    width: 1080,
    height: 1920,
    scenes: [FarewellScene],
  },
  benched: {
    title: 'Ronaldo – Benched?! (Short)',
    width: 1080,
    height: 1920,
    scenes: [BenchedScene],
  },
  fined: {
    title: 'Ronaldo – Paid in 39 Seconds (Short)',
    width: 1080,
    height: 1920,
    scenes: [FinedScene],
  },
  'psg-barca': {
    title: 'PSG 4–2 Barça (Short)',
    width: 1080,
    height: 1920,
    scenes: [YamalGoalScene, VitinhaGoalScene, RuizGoalScene, TableScene],
  },
  'madrid-laughs': {
    title: 'Real Madrid – Same Night, Different Vibes (Short)',
    width: 1080,
    height: 1920,
    scenes: [FullTimeScene, DressingRoomScene, VideoCallScene, MadridTableScene],
  },
  'kane-speech': {
    title: 'Kane – The Longest Speech (Short)',
    width: 1080,
    height: 1920,
    scenes: SPEECH_SCENES,
  },
  'who-is-best': {
    title: 'Who Is The Best? – Kane, Yamal, Mbappé (Short)',
    width: 1080,
    height: 1920,
    transition: 0,
    scenes: WHO_IS_BEST_SCENES,
  },
  'mbappe-actions': {
    title: 'Mbappé · Portrait – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(MBAPPE, { signature: DICTATOR_CHAPTERS }),
  },
  'mbappe-caricature': {
    title: 'Mbappé · Caricature – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(MBAPPE_CARICATURE, { signature: DICTATOR_CHAPTERS }),
  },
  'yamal-actions': {
    title: 'Yamal · Portrait – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(YAMAL, { greeting: 'Hola\nculers!', signature: SHORTS_CHAPTERS }),
  },
  'yamal-caricature': {
    title: 'Yamal · Caricature – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(YAMAL_CARICATURE, { greeting: 'Hola\nculers!', signature: SHORTS_CHAPTERS }),
  },
  'kane-actions': {
    title: 'Kane · Portrait – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(KANE, { greeting: 'Servus\nMünchen!', signature: TROPHY_CHAPTERS }),
  },
  'kane-caricature': {
    title: 'Kane · Caricature – every action',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(KANE_CARICATURE, { greeting: 'Servus\nMünchen!', signature: TROPHY_CHAPTERS }),
  },
};

export const defaultEpisode = 'demo';
