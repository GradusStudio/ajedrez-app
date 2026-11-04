"""Recorta un wav de ElevenLabs (inicio del golpe - 5 ms), lo normaliza y lo deja en assets/sounds.
Uso: python instalar.py <archivo.wav> <nombre destino> <ms de duración>"""
import sys, numpy as np, scipy.io.wavfile as w
import os; ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')).replace(os.sep, '/') + '/'  # raíz del proyecto
src, name, ms = sys.argv[1], sys.argv[2], int(sys.argv[3])
r, a = w.read(src); a = a.astype(float) / 32768
if a.ndim > 1: a = a.mean(1)
on = max(0, int(np.argmax(np.abs(a) > np.abs(a).max() * 0.15)) - int(r * .005))
seg = a[on:on + int(r * ms / 1000)].copy()
seg *= np.minimum(1, np.arange(len(seg)) / (r * .0005))
seg *= np.minimum(1, np.arange(len(seg))[::-1] / (0.2 * len(seg)))
seg *= 0.6 / np.abs(seg).max()
w.write(f"{ROOT}assets/sounds/{name}.wav", r, (seg * 32767).astype(np.int16))
print(name, len(seg) / r * 1000, "ms")
