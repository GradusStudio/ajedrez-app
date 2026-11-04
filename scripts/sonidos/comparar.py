import numpy as np, scipy.io.wavfile as w, scipy.signal as sg, sys
def med(seg, r):
    k=np.argmax(np.abs(seg)>np.abs(seg).max()*0.2); seg=seg[max(0,k-20):][:int(0.08*r)]; seg=seg/np.abs(seg).max()
    sp=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),4096)); fr=np.fft.rfftfreq(4096,1/r); sp/=sp.max()
    pk,_=sg.find_peaks(sp,height=0.2,distance=15)
    e=[np.sqrt(np.mean(seg[j:j+44]**2)) for j in range(0,len(seg)-44,44)]
    return [int(fr[i]) for i in pk][:7], [round(x,2) for x in e[:25]], (sp*fr).sum()/sp.sum()
for n in sys.argv[1:]:
    r,a=w.read(f"C:/dev/ajedrez-app/assets/sounds/{n}.wav"); p,e,c=med(np.pad(a.astype(float)/32768,(200,0)),r)
    print(n,"picos",p,"centroide",int(c)); print("  env",e)
