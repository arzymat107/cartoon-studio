import { blinkRandomly, melody, say, walk, wave } from '@/animations';
import { SpeechBubble, type Character } from '@/components';
import { Scene, type Timeline } from '@/engine';
import { createBob } from '../cast';
import { animateMeadow, createMeadow, GROUND_Y, type Meadow } from '../meadow';

export class MorningScene extends Scene {
  readonly title = 'Good Morning';

  private meadow!: Meadow;
  private bob!: Character;
  private hello!: SpeechBubble;

  build(): void {
    this.meadow = createMeadow(this.stage.width, this.stage.height, { sunrise: true });
    this.bob = createBob({ x: -200, y: GROUND_Y });
    this.hello = new SpeechBubble({ text: 'Good morning,\nworld!' });
    this.add(...this.meadow.layers, this.bob, this.hello);
  }

  animate(tl: Timeline): void {
    const { dawn, sun } = this.meadow;

    tl.add(melody('C5 E5 G5 E5 G5 C6:3', { bpm: 200 }), 0.4)
      .to(dawn, { opacity: 0, duration: 3.5 }, 0)
      .to(sun, { y: 230, duration: 3.5, ease: 'power1.out' }, 0)
      .add(walk(this.bob, { to: 760, duration: 3.5 }), 1)
      .addLabel('greet')
      .add(wave(this.bob), 'greet')
      .add(say(this.bob, this.hello, { voice: 'voices/bob-good-morning' }), 'greet+=0.3');

    // Background life runs for the whole scene.
    const length = tl.duration() + 0.5;
    tl.add(animateMeadow(this.meadow, length), 0)
      .add(blinkRandomly(this.bob, length), 0);
  }
}
