import numpy as np, scipy.io.wavfile as w, scipy.signal as sg
import os; ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')).replace(os.sep, '/') + '/'  # raíz del proyecto
r,a=w.read(ROOT + "assets/fuente/sonidos/referencia-chesscom.wav"); a=a.astype(float)/32768
groups={'toc':[5.87,9.83,14.26,17.66,27.96,44.29,53.92,60.47,67.63,116.23,127.39],
        'chak':[20.74,24.42,29.47,31.15,38.07,39.27,57.40,80.79],
        'contra':[8.11,12.24,15.85,19.35,22.69],
        'jaque?':[34.50,73.38,88.57,94.93,131.04,141.37]}
for g,ts in groups.items():
    print("==",g)
    specs=[];envs=[]
    for t in ts:
        s=int((t-0.004)*r); seg=a[s:s+int(0.12*r)]
        k=np.argmax(np.abs(seg)>np.abs(seg).max()*0.2); seg=seg[max(0,k-20):][:int(0.08*r)]
        seg=seg/np.abs(seg).max()
        sp=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),4096)); specs.append(sp)
        envs.append([np.sqrt(np.mean(seg[j:j+44]**2)) for j in range(0,len(seg)-44,44)])
    fr=np.fft.rfftfreq(4096,1/r); sp=np.mean(specs,0); sp/=sp.max()
    pk,_=sg.find_peaks(sp,height=0.15,distance=15)
    print("picos Hz:",[(int(fr[i]),round(sp[i],2)) for i in pk][:10])
    e=np.mean(envs,0); print("env por ms:",[round(x,2) for x in e[:40]])
