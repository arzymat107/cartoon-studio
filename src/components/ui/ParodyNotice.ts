import type { Actor } from '@/engine';
import { TextLabel } from './TextLabel';

/** Always visible: makes clear this is a fan-made parody, not real footage or an official product. */
export function createParodyNotice(width: number, height: number): Actor {
  return new TextLabel({
    text: 'ANIMATED PARODY · FAN-MADE CARTOON',
    x: width / 2,
    y: height - 70,
    fontSize: 26,
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(0,0,0,0.35)',
  });
}
