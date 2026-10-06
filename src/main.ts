import './style.css';
import { audio, encodeWav, loadSounds } from '@/audio';
import { Movie, Player, Stage } from '@/engine';
import { defaultEpisode, episodes } from '@/episodes';

const params = new URLSearchParams(location.search);
const key = params.get('episode') ?? defaultEpisode;
const episode = episodes[key] ?? episodes[defaultEpisode];
document.title = `${episode.title} · Cartoon Studio`;

const picker = document.querySelector<HTMLSelectElement>('#episode-select')!;
for (const [id, ep] of Object.entries(episodes)) picker.add(new Option(ep.title, id, false, ep === episode));
picker.addEventListener('change', () => {
  params.set('episode', picker.value);
  location.search = params.toString();
});

// Sound file lengths must be known before scenes put them on the timeline.
await loadSounds();

const stageFrame = document.querySelector<HTMLElement>('#stage')!;
const width = episode.width ?? 1920;
const height = episode.height ?? 1080;
stageFrame.style.aspectRatio = `${width} / ${height}`;
stageFrame.classList.toggle('portrait', height > width);
const stage = new Stage(stageFrame, { width, height, background: '#111' });
const movie = new Movie(stage, episode);
audio.attach(movie);
new Player(document.querySelector('#player')!, movie);

// Browsers only allow sound after the user interacts with the page.
for (const type of ['pointerdown', 'keydown'] as const) {
  window.addEventListener(type, () => audio.unlock(), { once: true, capture: true });
}

if (params.has('export')) {
  // Driven by scripts/export-video.mjs: UI hidden, stage fills the viewport.
  document.body.classList.add('export-mode');
  // ?export&t=12 shows a clean full-size frame – handy for YouTube thumbnails.
  movie.seek(Number(params.get('t') ?? 0));
  Object.assign(window, {
    exporter: {
      width,
      height,
      duration: movie.duration,
      seek: (time: number) => movie.seek(time),
      /** Whole soundtrack as a base64 WAV. */
      renderAudio: async () => {
        const bytes = encodeWav(await audio.renderOffline());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(binary);
      },
    },
  });
} else if (params.has('t')) {
  // ?t=4.5 opens paused on that moment.
  movie.seek(Number(params.get('t')));
} else {
  // A big play button, so the first click also turns the sound on.
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'start-overlay';
  start.innerHTML = '<span>&#x25B6;</span>Play with sound';
  start.addEventListener('click', () => movie.play());
  stageFrame.appendChild(start);
  const unsubscribe = movie.onChange(() => {
    if (movie.playing) {
      start.remove();
      unsubscribe();
    }
  });
  movie.seek(0.6); // show the first scene behind the button
}

// Handy for experimenting in the browser console: movie.seek(3), audio.muted = true
Object.assign(window, { movie, stage, audio });
