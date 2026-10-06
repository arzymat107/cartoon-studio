import type { Episode } from '@/engine';
import { FriendScene } from './demo/scenes/FriendScene';
import { MorningScene } from './demo/scenes/MorningScene';

/** Register every episode here. The key is used in the URL: ?episode=demo */
export const episodes: Record<string, Episode> = {
  demo: { title: 'Demo – A Sunny Day', scenes: [MorningScene, FriendScene] },
};

export const defaultEpisode = 'demo';
