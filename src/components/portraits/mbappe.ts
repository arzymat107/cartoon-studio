import markup from '@/assets/portraits/mbappe-m1.svg?raw';
import { uid } from '@/engine';
import { SvgArt, type SvgArtOptions } from '../SvgArt';

/**
 * Kylian Mbappé, portrait "M1" (head and shoulders), traced from a reference photo with his
 * natural asymmetry kept. Pivot: bottom of the chin. The artwork is ~680 px wide, so use `scale`
 * to size it (e.g. 0.3 for a head on a full-body character).
 */
export function createMbappePortrait(options: Omit<SvgArtOptions, 'markup'> = {}): SvgArt {
  // Fresh ids per copy, so two portraits on one stage don't share clip paths.
  const ids = markup.replaceAll('mbappe-m1-', `${uid('mbappe-m1')}-`);
  return new SvgArt({ name: 'MbappePortrait', markup: ids, originX: 352, originY: 842, ...options });
}
