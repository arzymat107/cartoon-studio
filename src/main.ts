import './style.css';
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

const stage = new Stage(document.querySelector('#stage')!, { width: 1920, height: 1080, background: '#111' });
const movie = new Movie(stage, episode);
const player = new Player(document.querySelector('#player')!, movie);

// ?t=4.5 opens paused on that moment, ?paused opens paused at the start.
if (params.has('t')) {
  movie.timeline.seek(Number(params.get('t')));
  player.sync();
} else if (!params.has('paused')) {
  player.play();
}

// Handy for experimenting in the browser console: movie.timeline.seek(3)
Object.assign(window, { movie, stage });
