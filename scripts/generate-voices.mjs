/**
 * Generates voice lines with text-to-speech. Everything runs on this computer.
 *
 *   npm run voices              generate missing lines
 *   npm run voices -- --force   regenerate all lines
 *   npm run voices -- bob       only lines of character "bob" (combine with --force)
 *   npm run voices -- --force kane-not-again   just that line
 *
 * Edit scripts/voices.json to add lines or change a character's voice.
 *
 * engine "kokoro" (default) – natural AI voices, any OS. The model (~90 MB) is downloaded
 *   once from Hugging Face, then works offline.
 *   voice – e.g. am_puck, am_michael, am_fenrir, bm_george (male), af_heart, af_bella, bf_emma (female).
 *           a = American, b = British. Full list: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
 *   speed – 1 = normal, 1.2 = faster, 0.85 = slower
 *
 * engine "windows" – Windows built-in voices (Settings → Time & language → Speech to add more).
 *   voice – installed voice name, e.g. "Microsoft Zira Desktop"
 *   rate  – speaking speed, -10 … 10 (0 = normal)
 *
 * engine "chatterbox" – expressive acting (Resemble AI's Chatterbox, ~2 GB model, best on an NVIDIA
 *   graphics card). It speaks with the character's Kokoro voice (a sample is made once), so set
 *   "voice" and "speed" as for Kokoro, plus:
 *   exaggeration – 0.25 flat … 0.5 normal … 1+ over the top
 *   cfg          – pacing: lower = slower, more deliberate (pair low cfg with high exaggeration)
 *   temperature, seed – variation; change the seed to get a different take
 *   Setup, once (Python environment outside the project; uv: https://docs.astral.sh/uv/):
 *     uv venv --python 3.11 ~/.local/share/cartoon-studio/tts-venv
 *     uv pip install --python ~/.local/share/cartoon-studio/tts-venv chatterbox-tts "setuptools<81"
 *   (setuptools: Chatterbox's audio watermarker fails to load without it.)
 *   (or point TTS_PYTHON at another Python with chatterbox-tts installed)
 *
 * All engines:
 *   pitch – 1 = unchanged, < 1 deeper (and slower), > 1 higher (and faster)
 *
 * Acting: a line can override its character's delivery (speed, rate, pitch, exaggeration, cfg, …), and
 * instead of "text" it can be built from "parts", each with its own delivery and a "pause" (seconds)
 * after it – an excited burst, a beat of silence, a tired mumble:
 *   { "id": "kane-finally", "character": "kane", "parts": [
 *     { "text": "And finally...", "speed": 0.8, "pause": 0.6 },
 *     { "text": "this beautiful trophy!", "speed": 1.1, "pitch": 1.05 } ] }
 *
 * Output: src/assets/sounds/voices/<id>.wav → use as say(char, bubble, { voice: 'voices/<id>' })
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'scripts/voices.json'), 'utf8'));
const outDir = join(root, 'src/assets/sounds/voices');
/** Voice samples and Chatterbox takes – generated files that don't belong in the project. */
const cacheDir = join(homedir(), '.cache/cartoon-studio/voices');
const ttsPython = process.env.TTS_PYTHON ?? join(homedir(), '.local/share/cartoon-studio/tts-venv/bin/python');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
/** Kokoro model, loaded on first use. */
let kokoro = null;

mkdirSync(outDir, { recursive: true });

const pending = config.lines.filter((line) => {
  if (only.length && !only.includes(line.character) && !only.includes(line.id)) return false;
  if (!config.characters[line.character]) throw new Error(`Unknown character "${line.character}" in line "${line.id}"`);
  if (existsSync(join(outDir, `${line.id}.wav`)) && !force) {
    console.log(`skip     ${line.id} (exists, use --force to regenerate)`);
    return false;
  }
  return true;
});

const partsOf = (line) => line.parts ?? [{ text: line.text }];
/** Delivery: the character's, overridden by the line's, overridden by the part's. */
const settingsOf = (line, part) => ({ ...config.characters[line.character], ...delivery(line), ...delivery(part) });
const takeFile = (line, i) => join(cacheDir, 'takes', `${line.id}-${i}.wav`);

// Chatterbox loads a big model, so all its lines are spoken in one go, before the rest.
await chatterboxSpeakAll(pending.filter((line) => (config.characters[line.character].engine ?? 'kokoro') === 'chatterbox'));

for (const line of pending) {
  const character = config.characters[line.character];
  const engine = character.engine ?? 'kokoro';
  const parts = partsOf(line);
  const pieces = [];
  let sampleRate = 24000;
  for (const [i, part] of parts.entries()) {
    const settings = settingsOf(line, part);
    const wav = engine === 'windows' ? await windowsSpeak(part.text, settings)
      : engine === 'chatterbox' ? readWav(readFileSync(takeFile(line, i)))
      : await kokoroSpeak(part.text, settings);
    sampleRate = wav.sampleRate;
    pieces.push(trimSilence(resample(wav.samples, settings.pitch ?? 1), sampleRate));
    if (part.pause) pieces.push(new Int16Array(Math.round(part.pause * sampleRate)));
  }
  const joined = normalize(concat(pieces));
  writeFileSync(join(outDir, `${line.id}.wav`), writeWav(joined, sampleRate));
  const text = parts.map((p) => p.text).join(' ');
  console.log(`created  ${line.id}.wav  ${(joined.length / sampleRate).toFixed(2)}s  [${engine} ${character.voice}]  "${text}"`);
}

/** The delivery settings set on a line or part. */
function delivery({ speed, rate, pitch, exaggeration, cfg, temperature, seed }) {
  return Object.fromEntries(
    Object.entries({ speed, rate, pitch, exaggeration, cfg, temperature, seed }).filter(([, v]) => v !== undefined),
  );
}

/** Speak every part of these lines with Chatterbox, into the takes folder. */
async function chatterboxSpeakAll(lines) {
  if (!lines.length) return;
  if (!existsSync(ttsPython)) throw new Error(`Chatterbox needs its Python environment (${ttsPython}) – see the setup at the top of this script`);
  mkdirSync(join(cacheDir, 'takes'), { recursive: true });
  const jobs = [];
  for (const line of lines) {
    for (const [i, part] of partsOf(line).entries()) {
      const s = settingsOf(line, part);
      jobs.push({
        text: part.text, reference: await voiceSample(s), out: takeFile(line, i),
        exaggeration: s.exaggeration, cfg: s.cfg, temperature: s.temperature, seed: s.seed,
      });
    }
  }
  execFileSync(ttsPython, [join(root, 'scripts/chatterbox_tts.py')], { input: JSON.stringify(jobs), stdio: ['pipe', 'inherit', 'inherit'] });
}

/** A ~10 s sample of a Kokoro voice for Chatterbox to speak with (made once, then cached). */
async function voiceSample({ voice = 'af_heart', speed = 1 }) {
  const file = join(cacheDir, `sample-${voice}-${speed}.wav`);
  if (!existsSync(file)) {
    const text = "I've been playing football since I was a little kid, and honestly, every single match still feels special to me. "
      + 'The noise, the lights, the fans singing – there is nothing else like it in the world.';
    const wav = await kokoroSpeak(text, { voice, speed });
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, writeWav(normalize(trimSilence(wav.samples, wav.sampleRate)), wav.sampleRate));
  }
  return file;
}

function concat(pieces) {
  const out = new Int16Array(pieces.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const piece of pieces) {
    out.set(piece, offset);
    offset += piece.length;
  }
  return out;
}

/** Kokoro-82M neural TTS (24 kHz). Loaded once; the model is cached after the first download. */
async function kokoroSpeak(text, { voice = 'af_heart', speed = 1 }) {
  if (!kokoro) {
    console.log('loading  Kokoro model (first run downloads ~90 MB)…');
    const { KokoroTTS } = await import('kokoro-js');
    kokoro = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
  }
  const audio = await kokoro.generate(text, { voice, speed });
  const samples = Int16Array.from(audio.audio, (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767));
  return { sampleRate: audio.sampling_rate, samples };
}

async function windowsSpeak(text, character) {
  if (process.platform !== 'win32') throw new Error('engine "windows" only works on Windows – use "kokoro"');
  const raw = join(tmpdir(), `voice-${process.pid}-${Date.now()}.wav`);
  synthesizeWindows(text, character, raw);
  const wav = readWav(readFileSync(raw));
  rmSync(raw);
  return wav;
}

/** Speak `text` into a 22 kHz 16-bit mono WAV file using System.Speech. */
function synthesizeWindows(text, { voice, rate = 0 }, file) {
  const script = `
    Add-Type -AssemblyName System.Speech
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $names = $s.GetInstalledVoices() | Where-Object Enabled | ForEach-Object { $_.VoiceInfo.Name }
    if ($names -contains $env:TTS_VOICE) { $s.SelectVoice($env:TTS_VOICE) }
    else {
      $fallback = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1
      if (-not $fallback) { throw 'No English text-to-speech voice installed' }
      [Console]::Error.WriteLine("Voice '$($env:TTS_VOICE)' not installed, using $($fallback.VoiceInfo.Name)")
      $s.SelectVoice($fallback.VoiceInfo.Name)
    }
    $s.Rate = [int]$env:TTS_RATE
    $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $s.SetOutputToWaveFile($env:TTS_FILE, $format)
    $s.Speak($env:TTS_TEXT)
    $s.Dispose()`;
  // Values go through environment variables so quotes in the text can't break the script.
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    env: { ...process.env, TTS_TEXT: text, TTS_VOICE: voice ?? '', TTS_RATE: String(rate), TTS_FILE: file },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

function readWav(buffer) {
  let offset = 12;
  let sampleRate = 22050;
  let samples = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      if (buffer.readUInt16LE(body) !== 1 || buffer.readUInt16LE(body + 2) !== 1 || buffer.readUInt16LE(body + 14) !== 16) {
        throw new Error('Expected 16-bit mono PCM');
      }
      sampleRate = buffer.readUInt32LE(body + 4);
    } else if (id === 'data') {
      samples = new Int16Array(size / 2);
      for (let i = 0; i < samples.length; i++) samples[i] = buffer.readInt16LE(body + i * 2);
    }
    offset = body + size + (size % 2);
  }
  if (!samples) throw new Error('WAV has no data chunk');
  return { sampleRate, samples };
}

function writeWav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buffer.writeInt16LE(s, 44 + i * 2));
  return buffer;
}

/** Change pitch like a tape speed change (pitch 0.8 = lower and 25% longer). */
function resample(samples, pitch) {
  if (pitch === 1) return samples;
  const out = new Int16Array(Math.floor(samples.length / pitch));
  for (let i = 0; i < out.length; i++) {
    const pos = i * pitch;
    const j = Math.floor(pos);
    const a = samples[j] ?? 0;
    const b = samples[j + 1] ?? a;
    out[i] = Math.round(a + (b - a) * (pos - j));
  }
  return out;
}

/** Scale so the loudest sample hits `peak`, so every line plays at the same level. */
function normalize(samples, peak = 0.89) {
  const max = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
  if (max === 0) return samples;
  const gain = (peak * 32767) / max;
  return samples.map((s) => Math.round(s * gain));
}

/** Cut silence at the start and end (keeping a little padding) so mouths move with the words. */
function trimSilence(samples, sampleRate, threshold = 600, padSeconds = 0.04) {
  let start = samples.findIndex((s) => Math.abs(s) > threshold);
  if (start === -1) return samples;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) <= threshold) end--;
  const pad = Math.round(padSeconds * sampleRate);
  return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad));
}
