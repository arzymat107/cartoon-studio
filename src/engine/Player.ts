import { audio } from '@/audio';
import type { Movie } from './Movie';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
};

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Playback controls: play/pause, restart, scrubber, mute, speed and chapter buttons. */
export class Player {
  private readonly movie: Movie;
  private readonly playButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly scrubber: HTMLInputElement;
  private readonly timeLabel: HTMLElement;
  private readonly chapterButtons: HTMLButtonElement[];
  private scrubbing = false;

  constructor(container: HTMLElement, movie: Movie) {
    this.movie = movie;
    container.classList.add('player');
    container.innerHTML = `
      <div class="player-bar">
        <button type="button" data-action="restart" title="Restart (Home)">&#x23EE;</button>
        <button type="button" data-action="toggle" class="primary" title="Play / Pause (Space)">&#x25B6;</button>
        <input type="range" min="0" max="1" step="0.0001" value="0" aria-label="Timeline" />
        <span class="time"></span>
        <button type="button" data-action="mute" title="Mute (M)"></button>
        <select aria-label="Playback speed">
          ${SPEEDS.map((s) => `<option value="${s}"${s === 1 ? ' selected' : ''}>${s}&times;</option>`).join('')}
        </select>
      </div>
      <nav class="chapters">
        ${movie.chapters
          .map((c, i) => `<button type="button" data-chapter="${i}">${i + 1}. ${escapeHtml(c.title)}</button>`)
          .join('')}
      </nav>`;

    this.playButton = container.querySelector('[data-action="toggle"]')!;
    this.muteButton = container.querySelector('[data-action="mute"]')!;
    this.scrubber = container.querySelector('input[type="range"]')!;
    this.timeLabel = container.querySelector('.time')!;
    this.chapterButtons = [...container.querySelectorAll<HTMLButtonElement>('[data-chapter]')];
    const speedSelect = container.querySelector('select')!;

    this.playButton.addEventListener('click', () => movie.toggle());
    this.muteButton.addEventListener('click', () => this.toggleMute());
    container.querySelector('[data-action="restart"]')!.addEventListener('click', () => movie.restart());

    this.scrubber.addEventListener('input', () => {
      this.scrubbing = true;
      if (movie.playing) movie.pause();
      movie.seek(Number(this.scrubber.value) * movie.duration);
    });
    this.scrubber.addEventListener('change', () => (this.scrubbing = false));

    speedSelect.addEventListener('change', () => movie.setSpeed(Number(speedSelect.value)));

    this.chapterButtons.forEach((button, i) =>
      button.addEventListener('click', () => movie.seek(movie.chapters[i].time)),
    );

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea, button')) return;
      if (e.code === 'Space') { e.preventDefault(); movie.toggle(); }
      if (e.code === 'Home') movie.restart();
      if (e.code === 'KeyM') this.toggleMute();
      if (e.code === 'ArrowRight') movie.seek(movie.time + 1);
      if (e.code === 'ArrowLeft') movie.seek(movie.time - 1);
    });

    movie.onChange(() => this.sync());
    this.sync();
  }

  private toggleMute(): void {
    audio.muted = !audio.muted;
    this.sync();
  }

  private sync(): void {
    const { movie } = this;
    this.playButton.innerHTML = movie.playing ? '&#x23F8;' : '&#x25B6;';
    this.muteButton.innerHTML = audio.muted ? '&#x1F507;' : '&#x1F50A;';
    if (!this.scrubbing) this.scrubber.value = String(movie.timeline.progress());
    this.timeLabel.textContent = `${formatTime(movie.time)} / ${formatTime(movie.duration)}`;

    let current = 0;
    movie.chapters.forEach((c, i) => { if (c.time <= movie.time) current = i; });
    this.chapterButtons.forEach((b, i) => b.classList.toggle('active', i === current));
  }
}
