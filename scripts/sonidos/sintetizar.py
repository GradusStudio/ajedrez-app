"""Sintetiza toc (movida) y chak (captura) como golpes de madera de varios modos que se apagan en milisegundos.
Las frecuencias y los tiempos de apagado salen de medir.py sobre la referencia; la señal es propia (modos + ruido).
Uso: python sintetizar.py  -> assets/sounds/move.wav, capture.wav"""
import numpy as np, scipy.io.wavfile as w, scipy.signal as sg
import os; ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')).replace(os.sep, '/') + '/'  # raíz del proyecto
R = 44100
rng = np.random.default_rng(7)

def hit(modes, ms, noise_ms=1.5, noise_gain=0.35, noise_band=(900, 3500), hits=((0, 1.0),)):
    n = int(R * ms / 1000); t = np.arange(n) / R; y = np.zeros(n)
    for t0, g in hits:
        i0 = int(R * t0 / 1000); tt = t[: n - i0]
        for f, a, tau in modes:
            y[i0:] += g * a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 0.4)) * np.exp(-tt / (tau / 1000))
        nb = int(R * noise_ms / 1000)
        x = rng.standard_normal(nb) * np.exp(-np.arange(nb) / (nb / 3))
        x = sg.sosfilt(sg.butter(2, noise_band, 'bp', fs=R, output='sos'), x)
        y[i0:i0 + nb] += g * noise_gain * x[: n - i0][:nb]
    y *= np.minimum(1, np.arange(n) / (R * 0.0004))
    y = sg.sosfilt(sg.butter(2, 120, 'hp', fs=R, output='sos'), y)
    return y

def save(name, y, peak=0.5):
    y = y / np.abs(y).max() * peak
    w.write(f"{ROOT}assets/sounds/{name}.wav", R, (y * 32767).astype(np.int16))

TOC = [(193, .8, 5), (462, 1.0, 3.5), (624, .25, 3), (925, .57, 2.5), (1087, .25, 2.5), (1313, .3, 2)]
CHAK = [(150, 1.0, 7), (322, .65, 6), (613, .4, 5), (807, .35, 4), (1001, .38, 4), (1238, .5, 4), (1453, .7, 5), (1884, .22, 3)]

if __name__ == "__main__":
    save("move", hit(TOC, 70, hits=((0, 1.0), (5, 0.4))))
    # Mate: redoble de golpes secos y un golpe grave al final (medido en el sonido de fin de partida de la referencia).
    roll = [(f * 1.4, a, t) for f, a, t in TOC]
    low = [(360, 1.0, 14), (720, .45, 9), (1080, .25, 6)]
    y = hit(roll, 300, hits=((0, .7), (30, .9), (45, .8), (75, .8), (90, 1.0), (105, .9)))
    y += np.pad(hit(low, 90, noise_gain=.25), (int(R * .21), 0))[:len(y)]
    save("mate", y)
    save("capture", hit(CHAK, 110, noise_gain=0.5, hits=((0, 0.9), (6, 1.0))))
