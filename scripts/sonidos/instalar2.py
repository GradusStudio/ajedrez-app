"""Pasa una vista previa mp3 (Freesound, CC0) a wav mono 44,1 kHz en assets/sounds, sin recortar el golpe.
Uso: python instalar2.py <archivo.mp3> <nombre destino> <ms máximos>"""
import av, sys, numpy as np, scipy.io.wavfile as w
src, name, ms = sys.argv[1], sys.argv[2], int(sys.argv[3])
c = av.open(src); rs = av.AudioResampler(format='flt', layout='mono', rate=44100)
a = np.concatenate([g.to_ndarray().reshape(-1) for f in c.decode(audio=0) for g in rs.resample(f)])
on = max(0, int(np.argmax(np.abs(a) > np.abs(a).max() * 0.1)) - 88)
seg = a[on:on + int(44.1 * ms)].copy()
seg *= np.minimum(1, np.arange(len(seg))[::-1] / (0.15 * len(seg)))
seg *= 0.7 / np.abs(seg).max()
w.write(f"C:/dev/ajedrez-app/assets/sounds/{name}.wav", 44100, (seg * 32767).astype(np.int16))
print(name, round(len(seg) / 44.1), "ms, total original", round(len(a) / 44.1), "ms")
