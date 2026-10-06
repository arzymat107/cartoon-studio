/**
 * Caricature cast for the football parody episodes.
 * Recognizable through exaggerated features (height, hair, beard) and national-team colors with
 * the shirt number – no crests, logos or sponsor marks, and voices are generic (not imitations).
 */
import { Footballer, Referee, type FootballerOptions } from '@/components';
import { GROUND_Y } from './stadium';

type CastOptions = Partial<Omit<FootballerOptions, 'kit'>>;

/** Small, calm genius: beard, number 10, sky-blue and white stripes. */
export const createMessi = (options: CastOptions = {}) =>
  new Footballer({
    name: 'Messi',
    y: GROUND_Y,
    scale: 1.45,
    headScale: 1.12,
    skin: '#f1c6a0',
    hair: '#5a3a22',
    beard: '#5a3a22',
    face: {
      width: 39, height: 48, jaw: 26, chin: 13,
      eyeColor: '#5b3a1e', browColor: '#4a2e1a', browWeight: 4.5, browTilt: -1.5,
      nose: 'straight', lips: '#b46a5c',
    },
    kit: { shirt: '#ffffff', stripes: '#75c3ea', number: 10, numberColor: '#1d3557', shorts: '#1b1b1b', socks: '#ffffff' },
    voice: { pitch: 1.05 },
    ...options,
  });

/** Tall, proud showman: styled hair, number 7, red with green. */
export const createRonaldo = (options: CastOptions = {}) =>
  new Footballer({
    name: 'Ronaldo',
    y: GROUND_Y,
    scale: 1.72,
    headScale: 1.02,
    skin: '#e0b088',
    hair: '#1e1712',
    hairStyle: 'quiff',
    face: {
      width: 40, height: 51, jaw: 30, chin: 15,
      eyeColor: '#3b2414', browColor: '#1e1712', browWeight: 5, browTilt: 2,
      nose: 'straight', lips: '#a8645a', cheekbones: true,
    },
    kit: { shirt: '#c8102e', trim: '#1e7f3a', number: 7, numberColor: '#ffd60a', shorts: '#1e7f3a', socks: '#c8102e' },
    voice: { pitch: 0.9 },
    ...options,
  });

export const createReferee = (options: CastOptions = {}) =>
  new Referee({
    name: 'Referee',
    y: GROUND_Y,
    scale: 1.55,
    headScale: 1,
    skin: '#d9a066',
    face: {
      width: 41, height: 47, jaw: 29, chin: 15,
      eyeColor: '#3b2414', browColor: '#2b1d14', browWeight: 5.5, browTilt: -0.5,
      nose: 'broad', lips: '#9c5a48', stubble: '#3b2a20',
    },
    voice: { pitch: 0.8 },
    ...options,
  });
