import type { Episode } from '@/engine';
import { FriendScene } from './demo/scenes/FriendScene';
import { FarewellScene } from './farewell/scenes/FarewellScene';
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
};

export const defaultEpisode = 'demo';
