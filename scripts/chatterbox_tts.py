"""
Expressive text-to-speech with Chatterbox (Resemble AI), called by generate-voices.mjs for characters
with "engine": "chatterbox". Runs locally, on the graphics card when there is one.

Reads a JSON list of jobs on stdin and writes one WAV per job:
  [{ "text": "...", "reference": "ref.wav", "out": "out.wav",
     "exaggeration": 0.5, "cfg": 0.5, "temperature": 0.8, "seed": 1 }]
  reference    – a short clip of the voice to speak with (the character's Kokoro voice)
  exaggeration – 0.25 flat … 0.5 normal … 1+ over the top
  cfg          – pacing: lower = slower, more deliberate (pair low cfg with high exaggeration)

Setup (once): see the header of scripts/generate-voices.mjs.
"""
import json
import sys

import torch
import torchaudio
from chatterbox.tts import ChatterboxTTS


def main() -> None:
    jobs = json.load(sys.stdin)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f'loading  Chatterbox on {device}…', file=sys.stderr, flush=True)
    model = ChatterboxTTS.from_pretrained(device=device)
    for job in jobs:
        torch.manual_seed(job.get('seed', 1))
        wav = model.generate(
            job['text'],
            audio_prompt_path=job['reference'],
            exaggeration=job.get('exaggeration', 0.5),
            cfg_weight=job.get('cfg', 0.5),
            temperature=job.get('temperature', 0.8),
        )
        torchaudio.save(job['out'], wav, model.sr, encoding='PCM_S', bits_per_sample=16)
        print(f'spoken   "{job["text"]}"', file=sys.stderr, flush=True)


if __name__ == '__main__':
    main()
