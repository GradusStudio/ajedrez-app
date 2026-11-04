"""Recorta los candidatos de ComfyUI al golpe, normaliza y los compara con la referencia.
Uso: python recortar.py <nombre> <ms> <centroide objetivo Hz>"""
import av, glob, os, sys, numpy as np, scipy.io.wavfile as w, scipy.signal as sg
import os; ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')).replace(os.sep, '/') + '/'  # raíz del proyecto
name, ms, target = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
OUT = ROOT + "assets/fuente/sonidos/"
# Carpeta de salida de ComfyUI: variable de entorno COMFYUI_OUTPUT o ~/ComfyUI/output/audio
COMFY = os.environ.get("COMFYUI_OUTPUT", os.path.expanduser("~/ComfyUI/output/audio"))
def load(p):
    c = av.open(p); rs = av.AudioResampler(format='flt', layout='mono', rate=44100)
    return np.concatenate([g.to_ndarray().reshape(-1) for f in c.decode(audio=0) for g in rs.resample(f)])
res = []
for p in sorted(glob.glob(os.path.join(COMFY, f"{name}_*.flac"))):
    a = load(p); a = sg.sosfilt(sg.butter(2, 60, 'hp', fs=44100, output='sos'), a)
    thr = np.abs(a).max() * 0.15
    s = max(0, int(np.argmax(np.abs(a) > thr)) - 44)
    n = int(44.1 * ms); seg = a[s:s + n].copy()
    seg *= np.minimum(1, np.arange(len(seg)) / 44.0)                 # ataque 1 ms
    seg *= np.minimum(1, np.arange(len(seg))[::-1] / (0.25 * len(seg)))  # cola
    seg *= 0.45 / np.abs(seg).max()
    sp = np.abs(np.fft.rfft(seg[:int(44.1*60)] * np.hanning(int(44.1*60)))); fr = np.fft.rfftfreq(int(44.1*60), 1/44100)
    cen = (sp * fr).sum() / sp.sum()
    e = np.array([np.sqrt(np.mean(seg[j:j+220]**2)) for j in range(0, len(seg)-220, 220)])
    dur = (np.where(e > e.max()*0.1)[0].max()+1)*5
    res.append((abs(cen-target), p, cen, dur, seg))
    print(f"{p.split('/')[-1]}: centroide={cen:5.0f} Hz  dur10%={dur} ms")
res.sort(key=lambda r: r[0]); best = res[0]
w.write(OUT + f"cand-{name}.wav", 44100, (best[4]*32767).astype(np.int16))
print("mejor:", best[1].split('/')[-1])
