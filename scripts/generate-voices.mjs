/**
 * Generates voice lines with Windows text-to-speech (offline, no external service).
 *
 *   npm run voices              generate missing lines
 *   npm run voices -- --force   regenerate all lines
 *
 * Edit scripts/voices.json to add lines or change a character's voice:
 *   voice  – installed voice name (Settings → Time & language → Speech to add more)
 *   rate   – speaking speed, -10 … 10 (0 = normal)
 *   pitch  – 1 = unchanged, < 1 deeper (and slower), > 1 higher (and faster)
 *            Tip: combine a low pitch with a higher rate to keep normal speed.
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
const force = process.argv.includes('--force');

if (process.platform !== 'win32') {
  console.error('This script uses Windows text-to-speech. On other systems, record the lines and save them to', outDir);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const line of config.lines) {
  const target = join(outDir, `${line.id}.wav`);
  if (existsSync(target) && !force) {
    console.log(`skip     ${line.id} (exists, use --force to regenerate)`);
    continue;
  }
  const character = config.characters[line.character];
  if (!character) throw new Error(`Unknown character "${line.character}" in line "${line.id}"`);

  const raw = join(tmpdir(), `voice-${line.id}-${process.pid}.wav`);
  synthesize(line.text, character, raw);
  const wav = readWav(readFileSync(raw));
  rmSync(raw);

  const shifted = resample(wav.samples, character.pitch ?? 1);
  const trimmed = trimSilence(shifted, wav.sampleRate);
  writeFileSync(target, writeWav(trimmed, wav.sampleRate));
  console.log(`created  ${line.id}.wav  ${(trimmed.length / wav.sampleRate).toFixed(2)}s  "${line.text}"`);
}

/** Speak `text` into a 22 kHz 16-bit mono WAV file using System.Speech. */
function synthesize(text, { voice, rate = 0 }, file) {
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

/** Cut silence at the start and end (keeping a little padding) so mouths move with the words. */
function trimSilence(samples, sampleRate, threshold = 600, padSeconds = 0.04) {
  let start = samples.findIndex((s) => Math.abs(s) > threshold);
  if (start === -1) return samples;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) <= threshold) end--;
  const pad = Math.round(padSeconds * sampleRate);
  return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad));
}
