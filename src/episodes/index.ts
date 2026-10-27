import { KANE, MBAPPE, YAMAL } from '@/components';
import type { Episode } from '@/engine';
import { BenchedScene } from './benched/scenes/BenchedScene';
import { FriendScene } from './demo/scenes/FriendScene';
import { FinedScene } from './fined/scenes/FinedScene';
import { DICTATOR_CHAPTERS, figureShowcase, SHORTS_CHAPTERS } from './figure-showcase/scenes';
import { FarewellScene } from './farewell/scenes/FarewellScene';
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
  'mbappe-actions': {
    title: 'Mbappé – All Actions (reference)',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(MBAPPE, { signature: DICTATOR_CHAPTERS }),
  },
  'yamal-actions': {
    title: 'Yamal – All Actions (reference)',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(YAMAL, { greeting: 'Hola\nculers!', signature: SHORTS_CHAPTERS }),
  },
  'kane-actions': {
    title: 'Kane – All Actions (reference)',
    width: 1080,
    height: 1920,
    scenes: figureShowcase(KANE, { greeting: 'Servus\nMünchen!' }),
  },
};

export const defaultEpisode = 'demo';
