/**
 * Generates voice lines with text-to-speech. Everything runs on this computer.
 *
 *   npm run voices              generate missing lines
 *   npm run voices -- --force   regenerate all lines
 *   npm run voices -- bob       only lines of character "bob" (combine with --force)
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
 * Both engines:
 *   pitch – 1 = unchanged, < 1 deeper (and slower), > 1 higher (and faster)
 *
 * Output: src/assets/sounds/voices/<id>.wav → use as say(char, bubble, { voice: 'voices/<id>' })
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'scripts/voices.json'), 'utf8'));
const outDir = join(root, 'src/assets/sounds/voices');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
/** Kokoro model, loaded on first use. */
let kokoro = null;

mkdirSync(outDir, { recursive: true });

for (const line of config.lines) {
  if (only.length && !only.includes(line.character)) continue;
  const target = join(outDir, `${line.id}.wav`);
  if (existsSync(target) && !force) {
    console.log(`skip     ${line.id} (exists, use --force to regenerate)`);
    continue;
  }
  const character = config.characters[line.character];
  if (!character) throw new Error(`Unknown character "${line.character}" in line "${line.id}"`);

  const engine = character.engine ?? 'kokoro';
  const wav = engine === 'windows' ? await windowsSpeak(line.text, character) : await kokoroSpeak(line.text, character);
  const shifted = resample(wav.samples, character.pitch ?? 1);
  const trimmed = normalize(trimSilence(shifted, wav.sampleRate));
  writeFileSync(target, writeWav(trimmed, wav.sampleRate));
  console.log(`created  ${line.id}.wav  ${(trimmed.length / wav.sampleRate).toFixed(2)}s  [${engine} ${character.voice}]  "${line.text}"`);
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
