/** Screen-space elements shared by every football scene: scoreboard and parody notice. */
import { Scoreboard, TextLabel } from '@/components';
import type { Actor } from '@/engine';

export function createScoreboard(width: number): Scoreboard {
  return new Scoreboard({
    x: width / 2,
    y: 60,
    home: { name: 'Messi', color: '#75c3ea', accent: '#ffffff' },
    away: { name: 'Ronaldo', color: '#c8102e', accent: '#1e7f3a' },
  });
}

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
