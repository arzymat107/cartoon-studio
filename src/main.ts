import './style.css';
import { audio, loadSounds } from '@/audio';
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
const stage = new Stage(stageFrame, { width: 1920, height: 1080, background: '#111' });
const movie = new Movie(stage, episode);
audio.attach(movie);
new Player(document.querySelector('#player')!, movie);

// Browsers only allow sound after the user interacts with the page.
for (const type of ['pointerdown', 'keydown'] as const) {
  window.addEventListener(type, () => audio.unlock(), { once: true, capture: true });
}

if (params.has('t')) {
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
