import numpy as np, scipy.io.wavfile as w, scipy.signal as sg, glob
import os; ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')).replace(os.sep, '/') + '/'  # raíz del proyecto
for p in sorted(glob.glob(ROOT + "assets/fuente/sonidos/elevenlabs/*.wav")):
    r,a=w.read(p); a=a.astype(float)/32768
    if a.ndim>1: a=a.mean(1)
    pk=np.abs(a).max(); on=np.argmax(np.abs(a)>pk*0.15)
    e=np.array([np.sqrt(np.mean(a[j:j+int(r*0.005)]**2)) for j in range(on,len(a)-int(r*.005),int(r*.005))])
    dur=(np.where(e>e.max()*0.1)[0].max()+1)*5
    seg=a[on:on+int(r*0.06)]; sp=np.abs(np.fft.rfft(seg*np.hanning(len(seg)))); fr=np.fft.rfftfreq(len(seg),1/r)
    # golpes: picos de envolvente a 2ms
    env=np.abs(sg.hilbert(a)); env=np.convolve(env,np.ones(int(r*.002))/int(r*.002),'same')
    hits,_=sg.find_peaks(env,height=pk*0.25,distance=int(r*.012))
    print(p.split('/')[-1][:24], f"peak={pk:.2f} inicio={on/r*1000:.0f}ms dur10%={dur}ms cen={(sp*fr).sum()/sp.sum():.0f}Hz golpes={len(hits)}", [int(h/r*1000) for h in hits][:10])
