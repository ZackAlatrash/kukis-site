"""Speaks one line with Kokoro, an Apache-2.0 neural TTS that runs locally.

    .venv-tts/bin/python scripts/say-kokoro.py <voice> <speed> <out.wav> <text>

macOS `say` was the first attempt and sounds unmistakably synthetic. Kokoro is
free, permissively licensed (so it is safe on a paid listing), needs no account
or API key, and runs offline — nothing about the product leaves this machine.
"""
import sys
import soundfile as sf
from kokoro_onnx import Kokoro

voice, speed, out, text = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
kokoro = Kokoro(".venv-tts/kokoro.onnx", ".venv-tts/voices.bin")
samples, rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
sf.write(out, samples, rate)
