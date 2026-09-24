#!/usr/bin/env python3
"""
Sintetizzatore procedurale per effetti sonori cartoon / foley vintage.
TUTTI I SUONI SONO SINTETIZZATI MATEMATICAMENTE DA ZERO: NON SONO REGISTRAZIONI REALI.
Nessuna dipendenza esterna: solo libreria standard Python (wave, math, random, struct, os, sys).
"""

import math
import os
import random
import struct
import sys
import wave

SAMPLE_RATE = 44100


# ==============================================================================
# STRUMENTI DI FILTRAGGIO, MODULAZIONE ED ELABORAZIONE SEGNALE
# ==============================================================================

def lowpass_filter(samples, cutoff_hz):
    """Filtro IIR passa-basso a singolo polo."""
    dt = 1.0 / SAMPLE_RATE
    rc = 1.0 / (2.0 * math.pi * max(cutoff_hz, 1.0))
    alpha = dt / (rc + dt)
    out = [0.0] * len(samples)
    acc = 0.0
    for i, s in enumerate(samples):
        acc += alpha * (s - acc)
        out[i] = acc
    return out


def highpass_filter(samples, cutoff_hz):
    """Filtro IIR passa-alto a singolo polo."""
    dt = 1.0 / SAMPLE_RATE
    rc = 1.0 / (2.0 * math.pi * max(cutoff_hz, 1.0))
    alpha = rc / (rc + dt)
    out = [0.0] * len(samples)
    prev_in = samples[0] if samples else 0.0
    prev_out = 0.0
    for i, s in enumerate(samples):
        curr_out = alpha * (prev_out + s - prev_in)
        out[i] = curr_out
        prev_in = s
        prev_out = curr_out
    return out


def bandpass_filter(samples, low_hz, high_hz):
    """Filtro passa-banda a due stadi in cascata."""
    return lowpass_filter(highpass_filter(samples, low_hz), high_hz)


def apply_envelope(samples, attack_s=0.005, release_s=0.015):
    """Applica rampe di attacco e rilascio morbide anti-click (curva sin²)."""
    n = len(samples)
    atk_n = max(1, int(attack_s * SAMPLE_RATE))
    rel_n = max(1, int(release_s * SAMPLE_RATE))
    out = list(samples)

    for i in range(min(atk_n, n)):
        gain = math.sin((i / atk_n) * (math.pi / 2.0)) ** 2
        out[i] *= gain

    for i in range(min(rel_n, n)):
        idx = n - 1 - i
        gain = math.sin((i / rel_n) * (math.pi / 2.0)) ** 2
        out[idx] *= gain

    return out


def save_pcm16_wav(filename, samples, peak_db=-3.0):
    """Normalizza a peak_db (default -3 dB headroom) e scrive il file WAV mono PCM16."""
    max_amp = max(abs(s) for s in samples) if samples else 0.0
    target_amp = 10.0 ** (peak_db / 20.0)

    if max_amp > 1e-7:
        scale = target_amp / max_amp
    else:
        scale = 1.0

    raw_bytes = bytearray()
    for s in samples:
        val = s * scale
        clamped = max(-1.0, min(1.0, val))
        val_int = int(clamped * 32767.0)
        raw_bytes.extend(struct.pack("<h", val_int))

    with wave.open(filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(raw_bytes)


# ==============================================================================
# GENERATORI DI SINTESI DEI SUONI (PROCEDURALI / CARTOON MORBIDO)
# ==============================================================================

def synthesize_step(seed, tone_pitch, grit_weight, crunch_freq):
    """
    Sintetizza il passo di uno stivale pesante su mattoni cotti antichi (0.18s).
    Combina:
      - Tonfo sordo iniziale del tacco (risonanza bassa smorzata).
      - Frizione / friabilità granulare della sabbia/laterizio (rumore denso).
    """
    rng = random.Random(seed)
    duration = 0.18
    num_samples = int(duration * SAMPLE_RATE)
    raw = [0.0] * num_samples

    phase_heel = 0.0
    heel_decay = 38.0

    for i in range(num_samples):
        t = i / SAMPLE_RATE

        # Risonanza tacco
        f_heel = tone_pitch * math.exp(-t * 22.0)
        phase_heel += 2.0 * math.pi * f_heel * (1.0 / SAMPLE_RATE)
        heel = math.sin(phase_heel) * math.exp(-t * heel_decay)

        # Micro-scivolamento sabbioso
        grain_decay = math.exp(-t * 28.0)
        noise = (rng.random() * 2.0 - 1.0) * grain_decay

        raw[i] = heel * (1.0 - grit_weight) + noise * grit_weight

    # Filtro passa-banda: corpo caldo e scricchiolio sabbioso
    filtered = bandpass_filter(raw, 70.0, crunch_freq)
    return apply_envelope(filtered, attack_s=0.002, release_s=0.02)


def synthesize_book_open():
    """
    Apertura di un vecchio tomo in pelle (0.9s).
    Sintetizza la tensione della costola in cuoio e il fruscio delicato dei fogli.
    """
    rng = random.Random(101)
    duration = 0.9
    num_samples = int(duration * SAMPLE_RATE)
    spine = [0.0] * num_samples
    pages = [0.0] * num_samples

    # Sfregamento del cuoio della rilegatura (0.05s -> 0.45s)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        if 0.03 <= t <= 0.45:
            rel = (t - 0.03) / 0.42
            env = max(0.0, math.sin(rel * math.pi)) ** 1.5
            n = (rng.random() * 2.0 - 1.0)
            flutter = math.sin(2.0 * math.pi * 35.0 * t) * 0.5 + 0.5
            creak = math.sin(2.0 * math.pi * (160.0 + 40.0 * rel) * t) * 0.3
            spine[i] = (n * 0.7 + creak) * env * flutter

    # Fruscio morbido di pagine che si aprono (0.25s -> 0.85s)
    page_events = [0.28, 0.34, 0.42, 0.50, 0.58, 0.67, 0.74]
    for pe in page_events:
        for i in range(int(pe * SAMPLE_RATE), min(num_samples, int((pe + 0.12) * SAMPLE_RATE))):
            t_loc = (i / SAMPLE_RATE) - pe
            env = math.sin((t_loc / 0.12) * math.pi) ** 2
            pages[i] += (rng.random() * 2.0 - 1.0) * env * 0.35

    spine_filt = bandpass_filter(spine, 110.0, 850.0)
    pages_filt = bandpass_filter(pages, 400.0, 3200.0)

    out = [s + p for s, p in zip(spine_filt, pages_filt)]
    return apply_envelope(out, attack_s=0.015, release_s=0.04)


def synthesize_book_close():
    """
    Chiusura di un vecchio tomo (0.7s).
    Breve fruscio di chiusura pagine seguito dall'impatto sordo della copertina.
    """
    rng = random.Random(102)
    duration = 0.7
    num_samples = int(duration * SAMPLE_RATE)
    pages = [0.0] * num_samples
    impact = [0.0] * num_samples

    # Rientro dei fogli (0.1s -> 0.48s)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        if 0.08 <= t <= 0.48:
            rel = (t - 0.08) / 0.40
            env = math.sin(rel * math.pi) ** 2
            pages[i] = (rng.random() * 2.0 - 1.0) * env * 0.3

    pages_filt = bandpass_filter(pages, 450.0, 2600.0)

    # Impatto sordo e compatto della copertina imbottita (a 0.48s)
    hit_start = int(0.48 * SAMPLE_RATE)
    phase = 0.0
    for i in range(hit_start, num_samples):
        t_loc = (i - hit_start) / SAMPLE_RATE
        f = 95.0 * math.exp(-t_loc * 26.0)
        phase += 2.0 * math.pi * f * (1.0 / SAMPLE_RATE)
        hit_env = math.exp(-t_loc * 24.0)
        noise_puff = (rng.random() * 2.0 - 1.0) * math.exp(-t_loc * 40.0) * 0.4
        impact[i] = (math.sin(phase) + noise_puff) * hit_env

    impact_filt = lowpass_filter(impact, 450.0)

    out = [p + imp * 1.3 for p, imp in zip(pages_filt, impact_filt)]
    return apply_envelope(out, attack_s=0.01, release_s=0.02)


def synthesize_creak(rng, duration, start_t, end_t, base_f, mod_f, jitter=0.08):
    """Sintetizza una frizione/cigolio non acuto per cardini e ante in legno."""
    samples = [0.0] * int(duration * SAMPLE_RATE)
    phase = 0.0
    start_idx = int(start_t * SAMPLE_RATE)
    end_idx = int(end_t * SAMPLE_RATE)
    length = max(1, end_idx - start_idx)

    for i in range(start_idx, min(len(samples), end_idx)):
        rel = (i - start_idx) / length
        t = i / SAMPLE_RATE

        # Inviluppo morbido campaniforme
        env = max(0.0, math.sin(rel * math.pi)) ** 1.8

        # Oscillazione della frequenza del cardine (non acuto)
        pitch = base_f * (1.0 + 0.22 * math.sin(2.0 * math.pi * mod_f * t))
        pitch += (rng.random() * 2.0 - 1.0) * jitter * base_f

        phase += 2.0 * math.pi * pitch * (1.0 / SAMPLE_RATE)

        # Frizione complessa e asimmetrica (vibrazione metallica/legno)
        creak_wave = math.sin(phase) + 0.35 * math.sin(2.0 * phase) + 0.15 * math.sin(3.0 * phase)
        friction_burst = (rng.random() * 2.0 - 1.0) * 0.25

        samples[i] = (creak_wave + friction_burst) * env

    return samples


def synthesize_impact(rng, duration, hit_time, freq, decay, wood_body=True):
    """Sintetizza un colpo di battuta con corpo risonante in legno."""
    samples = [0.0] * int(duration * SAMPLE_RATE)
    start_idx = int(hit_time * SAMPLE_RATE)
    phase = 0.0

    for i in range(start_idx, len(samples)):
        t_loc = (i - start_idx) / SAMPLE_RATE
        f = freq * math.exp(-t_loc * 20.0)
        phase += 2.0 * math.pi * f * (1.0 / SAMPLE_RATE)

        # Risonanza fondamentale + transiente d'attacco sordo
        env = math.exp(-t_loc * decay)
        thud = math.sin(phase)
        if wood_body:
            thud += 0.4 * math.sin(phase * 1.55) * math.exp(-t_loc * (decay * 1.3))

        clack = (rng.random() * 2.0 - 1.0) * math.exp(-t_loc * (decay * 2.5)) * 0.4
        samples[i] = (thud + clack) * env

    return samples


def synthesize_cabinet_open():
    """Apertura di una piccola anta in legno (0.9s): scatto e cigolio delicato."""
    rng = random.Random(201)
    duration = 0.9
    # Scatto morbido iniziale del fermaglio
    click = synthesize_impact(rng, duration, 0.04, 340.0, 48.0, wood_body=False)
    click_filt = bandpass_filter(click, 180.0, 1600.0)

    # Cigolio piccolo e scorrevole (380-450 Hz)
    creak = synthesize_creak(rng, duration, 0.08, 0.78, base_f=420.0, mod_f=4.5)
    creak_filt = bandpass_filter(creak, 200.0, 1400.0)

    out = [c * 0.6 + cr * 0.8 for c, cr in zip(click_filt, creak_filt)]
    return apply_envelope(out, attack_s=0.01, release_s=0.03)


def synthesize_cabinet_close():
    """Chiusura di una piccola anta (0.8s): movimento leggero e battuta finale."""
    rng = random.Random(202)
    duration = 0.8
    # Fruscio d'aria / frizione mentre si accosta
    swing = synthesize_creak(rng, duration, 0.08, 0.58, base_f=310.0, mod_f=3.0)
    swing_filt = bandpass_filter(swing, 180.0, 1100.0)

    # Battuta finale chiara ma raccolta dell'anta
    hit = synthesize_impact(rng, duration, 0.60, 260.0, 36.0, wood_body=True)
    hit_filt = lowpass_filter(hit, 1200.0)

    out = [s * 0.4 + h * 1.1 for s, h in zip(swing_filt, hit_filt)]
    return apply_envelope(out, attack_s=0.01, release_s=0.02)


def synthesize_chest_open():
    """Apertura di un pesante forziere (1.2s): cerniere tozze e legno cavernoso."""
    rng = random.Random(301)
    duration = 1.2

    # Scricchiolio lungo, pesante e intermittente (220 Hz)
    creak1 = synthesize_creak(rng, duration, 0.08, 0.65, base_f=220.0, mod_f=3.2, jitter=0.15)
    creak2 = synthesize_creak(rng, duration, 0.58, 1.08, base_f=190.0, mod_f=2.8, jitter=0.18)

    # Cassa risonante profonda
    num_samples = int(duration * SAMPLE_RATE)
    sub = [0.0] * num_samples
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        if 0.1 <= t <= 1.05:
            sub[i] = (rng.random() * 2.0 - 1.0) * math.sin(((t - 0.1) / 0.95) * math.pi)

    sub_filt = lowpass_filter(sub, 160.0)
    creak_all = [c1 + c2 for c1, c2 in zip(creak1, creak2)]
    creak_filt = bandpass_filter(creak_all, 110.0, 950.0)

    out = [c * 0.9 + s * 0.6 for c, s in zip(creak_filt, sub_filt)]
    return apply_envelope(out, attack_s=0.02, release_s=0.04)


def synthesize_chest_close():
    """Chiusura di un pesante forziere (1.0s): discesa lenta e pesante tonfo finale."""
    rng = random.Random(302)
    duration = 1.0

    # Movimento di chiusura cerniera tozza
    creak = synthesize_creak(rng, duration, 0.08, 0.72, base_f=210.0, mod_f=3.5)
    creak_filt = bandpass_filter(creak, 100.0, 850.0)

    # Tonfo sordo e potente del coperchio massiccio a 0.74s
    slam = synthesize_impact(rng, duration, 0.74, 90.0, 16.0, wood_body=True)
    slam_filt = lowpass_filter(slam, 650.0)

    out = [c * 0.45 + s * 1.35 for c, s in zip(creak_filt, slam_filt)]
    return apply_envelope(out, attack_s=0.015, release_s=0.02)


def synthesize_door_open():
    """Apertura di una grande porta antica (1.5s): cigolio prolungato da castello cartoon."""
    rng = random.Random(401)
    duration = 1.5

    # Lamento continuo del cardine arrugginito (frequenza media ~280-340 Hz)
    creak1 = synthesize_creak(rng, duration, 0.10, 0.95, base_f=290.0, mod_f=2.2, jitter=0.12)
    creak2 = synthesize_creak(rng, duration, 0.85, 1.42, base_f=330.0, mod_f=2.6, jitter=0.14)

    # Frizione sul pavimento di pietra
    num_samples = int(duration * SAMPLE_RATE)
    scrape = [0.0] * num_samples
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        if 0.12 <= t <= 1.38:
            rel = (t - 0.12) / 1.26
            env = max(0.0, math.sin(rel * math.pi)) ** 1.5
            scrape[i] = (rng.random() * 2.0 - 1.0) * env * 0.25

    scrape_filt = bandpass_filter(scrape, 80.0, 480.0)
    creak_all = [c1 + c2 for c1, c2 in zip(creak1, creak2)]
    creak_filt = bandpass_filter(creak_all, 140.0, 1200.0)

    out = [c * 0.85 + s * 0.5 for c, s in zip(creak_filt, scrape_filt)]
    return apply_envelope(out, attack_s=0.02, release_s=0.05)


def synthesize_door_close():
    """Chiusura di una grande porta antica (1.3s): corsa lenta e colpo tombale alla fine."""
    rng = random.Random(402)
    duration = 1.3

    # Movimento cardine in avvicinamento
    creak = synthesize_creak(rng, duration, 0.10, 0.98, base_f=270.0, mod_f=2.4)
    creak_filt = bandpass_filter(creak, 120.0, 1000.0)

    # Colpo netto e imponente nel telaio a 1.02s
    hit = synthesize_impact(rng, duration, 1.02, 115.0, 17.0, wood_body=True)
    hit_filt = lowpass_filter(hit, 750.0)

    out = [c * 0.4 + h * 1.3 for c, h in zip(creak_filt, hit_filt)]
    return apply_envelope(out, attack_s=0.015, release_s=0.02)


# ==============================================================================
# PUNTO DI INGRESSO PRINCIPALE
# ==============================================================================

def main():
    if len(sys.argv) < 2:
        out_dir = "."
    else:
        out_dir = sys.argv[1]

    os.makedirs(out_dir, exist_ok=True)

    catalog = [
        # Passi su mattoni antichi (0.18 s ciascuno, timbri e altezze distinte)
        ("step-0.wav", synthesize_step(seed=11, tone_pitch=95.0, grit_weight=0.38, crunch_freq=1800.0)),
        ("step-1.wav", synthesize_step(seed=12, tone_pitch=115.0, grit_weight=0.45, crunch_freq=2100.0)),
        ("step-2.wav", synthesize_step(seed=13, tone_pitch=88.0, grit_weight=0.32, crunch_freq=1650.0)),
        ("step-3.wav", synthesize_step(seed=14, tone_pitch=105.0, grit_weight=0.42, crunch_freq=1950.0)),

        # Libro antico (carta e dorso in pelle)
        ("book-open.wav", synthesize_book_open()),
        ("book-close.wav", synthesize_book_close()),

        # Mobiletto ad ante piccole
        ("cabinet-open.wav", synthesize_cabinet_open()),
        ("cabinet-close.wav", synthesize_cabinet_close()),

        # Forziere pesante in legno
        ("chest-open.wav", synthesize_chest_open()),
        ("chest-close.wav", synthesize_chest_close()),

        # Porta antica
        ("door-open.wav", synthesize_door_open()),
        ("door-close.wav", synthesize_door_close()),
    ]

    for name, samples in catalog:
        path = os.path.join(out_dir, name)
        save_pcm16_wav(path, samples, peak_db=-3.0)
        print(f"Creato: {path} ({len(samples)} campioni, {len(samples)/SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()