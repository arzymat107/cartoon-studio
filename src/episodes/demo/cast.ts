/** Recurring characters: define a look and voice once, reuse them in every scene and episode. */
import { Character, type CharacterOptions } from '@/components';

export const createBob = (options: CharacterOptions = {}) =>
  new Character({
    shirt: '#3a86ff', hair: '#4a2c1a', scale: 1.3,
    voice: { pitch: 0.8, wave: 'triangle' },
    ...options,
  });

export const createAlice = (options: CharacterOptions = {}) =>
  new Character({
    shirt: '#ff5d8f', pants: '#5a4fcf', hair: '#e09f3e', hairStyle: 'long', scale: 1.3,
    voice: { pitch: 1.5, wave: 'sine' },
    ...options,
  });
