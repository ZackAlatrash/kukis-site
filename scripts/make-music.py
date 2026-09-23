"""Generates the screencast's music bed.

    .venv-tts/bin/python scripts/make-music.py <seconds> <out.wav>

Written rather than downloaded: a store listing is public, commercial use, and
an original piece is the only bed whose licence is not in question.

It is a slow four-chord loop — Am, F, C, G — under a sparse bell figure. Warm,
unhurried, and deliberately uneventful: it plays under a voice for two minutes,
so anything with a hook would start competing with the narration by the third
repeat. Mixed quiet here, and ducked further under speech by the build.
"""

import sys
import numpy as np
import soundfile as sf

RATE = 44100
BPM = 68
BEAT = 60.0 / BPM
BAR = BEAT * 4

# A, C, E, F, G — everything below is drawn from these.
def note(semitones_from_a3: int) -> float:
    return 220.0 * (2 ** (semitones_from_a3 / 12))


# Am, F, C, G as (root, third, fifth) in semitones from A3.
PROGRESSION = [
    (0, 3, 7),      # Am
    (-4, 0, 3),     # F
    (3, 7, 10),     # C
    (-2, 2, 5),     # G
]

# The bell figure, as (bar offset in beats, semitone, gain).
FIGURE = [
    (0.0, 12, 0.55), (1.5, 19, 0.42), (2.5, 16, 0.38), (3.5, 12, 0.30),
]


def adsr(length: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    """A plain envelope. Without one, every note starts with an audible click."""
    a, d, r = int(attack * RATE), int(decay * RATE), int(release * RATE)
    s = max(0, length - a - d - r)
    return np.concatenate([
        np.linspace(0, 1, a, endpoint=False),
        np.linspace(1, sustain, d, endpoint=False),
        np.full(s, sustain),
        np.linspace(sustain, 0, r),
    ])[:length]


def voice(freq: float, length: int, detune: float = 0.004) -> np.ndarray:
    """Two slightly detuned sines plus a quiet octave: warmer than one tone."""
    t = np.arange(length) / RATE
    return (
        np.sin(2 * np.pi * freq * t)
        + 0.85 * np.sin(2 * np.pi * freq * (1 + detune) * t)
        + 0.30 * np.sin(2 * np.pi * freq * 2 * t)
    ) / 2.15


def pad(chord, seconds: float) -> np.ndarray:
    length = int(seconds * RATE)
    out = np.zeros(length)
    env = adsr(length, attack=1.1, decay=0.8, sustain=0.72, release=1.4)
    for i, semi in enumerate(chord):
        # Upper voices a touch quieter, so the root stays the root.
        out += voice(note(semi), length) * (0.9 - 0.16 * i)
    return out * env * 0.30


def bell(semi: float, seconds: float = 2.2) -> np.ndarray:
    length = int(seconds * RATE)
    t = np.arange(length) / RATE
    freq = note(semi)
    body = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.01 * t)
    return body * np.exp(-t * 2.6) * 0.5


def reverb(signal: np.ndarray) -> np.ndarray:
    """A few taps. Not a real room, but enough to stop it sounding bone dry."""
    out = signal.copy()
    for delay_ms, gain in ((67, 0.28), (113, 0.20), (191, 0.13), (307, 0.08)):
        d = int(RATE * delay_ms / 1000)
        out[d:] += signal[:-d] * gain
    return out


def lowpass(signal: np.ndarray, cutoff: float = 2600.0) -> np.ndarray:
    """One-pole, to take the glassy edge off the sines."""
    alpha = 1.0 / (1.0 + RATE / (2 * np.pi * cutoff))
    out = np.empty_like(signal)
    acc = 0.0
    for i, sample in enumerate(signal):
        acc += alpha * (sample - acc)
        out[i] = acc
    return out


def build(seconds: float) -> np.ndarray:
    total = int(seconds * RATE) + RATE * 3
    left = np.zeros(total)
    right = np.zeros(total)

    bar_index = 0
    position = 0.0
    while position < seconds + 1.0:
        chord = PROGRESSION[bar_index % len(PROGRESSION)]
        start = int(position * RATE)

        block = pad(chord, BAR * 2.05)
        end = min(total, start + len(block))
        # A little stereo spread, alternating each bar, so it breathes.
        spread = 0.06 if bar_index % 2 == 0 else -0.06
        left[start:end] += block[: end - start] * (1 - spread)
        right[start:end] += block[: end - start] * (1 + spread)

        # The bell figure sits out every third bar, to leave some air.
        if bar_index % 3 != 2:
            for beat_offset, semi, gain in FIGURE:
                at = start + int(beat_offset * BEAT * RATE)
                tone = bell(chord[0] + semi) * gain
                stop = min(total, at + len(tone))
                if at < total:
                    left[at:stop] += tone[: stop - at] * 0.9
                    right[at:stop] += tone[: stop - at] * 1.1

        position += BAR
        bar_index += 1

    left, right = lowpass(reverb(left)), lowpass(reverb(right))
    stereo = np.stack([left, right], axis=1)

    keep = int(seconds * RATE)
    stereo = stereo[:keep]

    # Fades, then normalise to a level that will sit under a voice.
    fade_in, fade_out = int(2.5 * RATE), int(4.0 * RATE)
    stereo[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    stereo[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    peak = np.max(np.abs(stereo))
    return stereo / peak * 0.5 if peak else stereo


if __name__ == "__main__":
    seconds, out = float(sys.argv[1]), sys.argv[2]
    sf.write(out, build(seconds), RATE)
