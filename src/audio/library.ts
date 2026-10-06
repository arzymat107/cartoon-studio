/**
 * Every audio file under src/assets/sounds/ is available by name – its path without the extension:
 *   src/assets/sounds/voices/bob-hello.mp3  →  'voices/bob-hello'
 */
const ROOT = '/src/assets/sounds/';

const files = import.meta.glob<string>('/src/assets/sounds/**/*.{mp3,ogg,wav,m4a,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urls = new Map<string, string>(
  Object.entries(files).map(([path, url]) => [path.slice(ROOT.length).replace(/\.[^.]+$/, ''), url]),
);

const durations = new Map<string, number>();

/** Read the length of every sound file. Must finish before the movie is built. */
export async function loadSounds(): Promise<void> {
  await Promise.all(
    [...urls].map(
      ([name, url]) =>
        new Promise<void>((resolve) => {
          const element = new Audio();
          element.preload = 'metadata';
          element.onloadedmetadata = () => {
            durations.set(name, element.duration);
            resolve();
          };
          element.onerror = () => {
            console.warn(`Could not load sound "${name}" (${url})`);
            resolve();
          };
          element.src = url;
        }),
    ),
  );
}

export function soundInfo(name: string): { url: string; duration: number } | undefined {
  const url = urls.get(name);
  const duration = durations.get(name);
  return url !== undefined && duration !== undefined ? { url, duration } : undefined;
}

export const soundNames = (): string[] => [...urls.keys()];
