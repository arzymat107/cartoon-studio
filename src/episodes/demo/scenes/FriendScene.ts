import { synth } from '@/audio';
import { blinkRandomly, cheer, jump, melody, say, sfx, walk } from '@/animations';
import { SpeechBubble, type Character } from '@/components';
import { Scene, type Timeline } from '@/engine';
import { createAlice, createBob } from '../cast';
import { animateMeadow, createMeadow, GROUND_Y, type Meadow } from '../meadow';

export class FriendScene extends Scene {
  readonly title = 'A Friend Arrives';

  private meadow!: Meadow;
  private bob!: Character;
  private alice!: Character;
  private aliceHi!: SpeechBubble;
  private bobReply!: SpeechBubble;
  private aliceYay!: SpeechBubble;

  build(): void {
    this.meadow = createMeadow(this.stage.width, this.stage.height);
    this.bob = createBob({ x: 760, y: GROUND_Y });
    this.alice = createAlice({ x: 2150, y: GROUND_Y });
    this.aliceHi = new SpeechBubble({ text: 'Hi Bob!\nWhat a lovely day!' });
    this.bobReply = new SpeechBubble({ text: "Let's celebrate!" });
    this.aliceYay = new SpeechBubble({ text: 'Yaaay!' });
    this.add(...this.meadow.layers, this.bob, this.alice, this.aliceHi, this.bobReply, this.aliceYay);
  }

  animate(tl: Timeline): void {
    const { bob, alice, camera } = this;

    tl.add(walk(alice, { to: 1180, duration: 3.2 }), 0.3)
      .addLabel('chat')
      .to(camera, { ...camera.focus(970, 640, 1.5), duration: 1.5, ease: 'power2.inOut' }, 'chat')
      .add(sfx(synth.whoosh), 'chat')
      .add(say(alice, this.aliceHi, { voice: 'voices/alice-hi-bob' }), 'chat+=0.4')
      .add(say(bob, this.bobReply, { voice: 'voices/bob-lets-celebrate' }), '>-0.2')
      .addLabel('party')
      .to(camera, { ...camera.reset(), duration: 1.2, ease: 'power2.inOut' }, 'party')
      .add(sfx(synth.whoosh), 'party')
      .add(melody('G5 C6 E6 G6 - E6 G6:3', { bpm: 260 }), 'party+=0.3')
      .add(cheer(bob, { duration: 1.4 }), 'party+=0.3')
      .add(cheer(alice, { duration: 1.4 }), 'party+=0.4')
      .add(jump(bob, { times: 2 }), 'party+=0.3')
      .add(jump(alice, { times: 2 }), 'party+=0.45')
      .add(say(alice, this.aliceYay, { voice: 'voices/alice-yay', hold: 1 }), 'party+=0.5');

    const length = tl.duration() + 0.8;
    tl.add(animateMeadow(this.meadow, length), 0)
      .add(blinkRandomly(bob, length), 0)
      .add(blinkRandomly(alice, length), 0);
  }
}
