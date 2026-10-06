import type { Movie } from './Movie';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
};

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Playback controls: play/pause, restart, scrubber, speed and chapter buttons. */
export class Player {
  private readonly movie: Movie;
  private readonly playButton: HTMLButtonElement;
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
    this.scrubber = container.querySelector('input[type="range"]')!;
    this.timeLabel = container.querySelector('.time')!;
    this.chapterButtons = [...container.querySelectorAll<HTMLButtonElement>('[data-chapter]')];
    const speedSelect = container.querySelector('select')!;
    const tl = movie.timeline;

    this.playButton.addEventListener('click', () => this.toggle());
    container.querySelector('[data-action="restart"]')!.addEventListener('click', () => this.restart());

    this.scrubber.addEventListener('input', () => {
      this.scrubbing = true;
      tl.pause();
      tl.progress(Number(this.scrubber.value));
      this.sync();
    });
    this.scrubber.addEventListener('change', () => (this.scrubbing = false));

    speedSelect.addEventListener('change', () => tl.timeScale(Number(speedSelect.value)));

    this.chapterButtons.forEach((button, i) =>
      button.addEventListener('click', () => {
        tl.seek(movie.chapters[i].time);
        this.sync();
      }),
    );

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea, button')) return;
      if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
      if (e.code === 'Home') this.restart();
      if (e.code === 'ArrowRight') { tl.seek(Math.min(tl.time() + 1, tl.duration())); this.sync(); }
      if (e.code === 'ArrowLeft') { tl.seek(Math.max(tl.time() - 1, 0)); this.sync(); }
    });

    tl.eventCallback('onUpdate', () => this.sync());
    tl.eventCallback('onComplete', () => this.sync());
    this.sync();
  }

  play(): void {
    const tl = this.movie.timeline;
    if (tl.progress() >= 1) tl.restart();
    else tl.play();
    this.sync();
  }

  toggle(): void {
    if (this.isPlaying()) {
      this.movie.timeline.pause();
      this.sync();
    } else {
      this.play();
    }
  }

  restart(): void {
    this.movie.timeline.restart();
    this.sync();
  }

  private isPlaying(): boolean {
    const tl = this.movie.timeline;
    return !tl.paused() && tl.progress() < 1;
  }

  /** Refresh the controls (call after seeking the timeline from outside). */
  sync(): void {
    const tl = this.movie.timeline;
    this.playButton.innerHTML = this.isPlaying() ? '&#x23F8;' : '&#x25B6;';
    if (!this.scrubbing) this.scrubber.value = String(tl.progress());
    this.timeLabel.textContent = `${formatTime(tl.time())} / ${formatTime(tl.duration())}`;

    const time = tl.time();
    let current = 0;
    this.movie.chapters.forEach((c, i) => { if (c.time <= time) current = i; });
    this.chapterButtons.forEach((b, i) => b.classList.toggle('active', i === current));
  }
}
