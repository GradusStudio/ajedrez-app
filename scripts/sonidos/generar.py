"""Genera candidatos de sonido con ComfyUI (Stable Audio Open).
Uso: python generar.py <nombre> "<prompt>" <semillas separadas por coma> [segundos]
Guarda en ComfyUI/output/audio/<nombre>_<semilla>_*.flac. ComfyUI tiene que estar abierto en el puerto 8188."""
import json, sys, time, urllib.request

name, prompt, seeds = sys.argv[1], sys.argv[2], [int(s) for s in sys.argv[3].split(",")]
secs = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
NEG = "music, melody, speech, voice, noise, hiss, reverb, echo, long, drone"

def wf(seed):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "stable-audio-open-1.0.safetensors"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "t5_base.safetensors", "type": "stable_audio"}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningStableAudio", "inputs": {"positive": ["3", 0], "negative": ["4", 0], "seconds_start": 0.0, "seconds_total": secs}},
        "6": {"class_type": "EmptyLatentAudio", "inputs": {"seconds": secs, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["5", 0], "negative": ["5", 1], "latent_image": ["6", 0],
              "seed": seed, "steps": 60, "cfg": 6.0, "sampler_name": "dpmpp_3m_sde", "scheduler": "exponential", "denoise": 1.0}},
        "8": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["7", 0], "vae": ["1", 2]}},
        "9": {"class_type": "SaveAudio", "inputs": {"audio": ["8", 0], "filename_prefix": f"audio/{name}_{seed}"}},
    }

ids = []
for s in seeds:
    req = urllib.request.Request("http://127.0.0.1:8188/prompt", json.dumps({"prompt": wf(s)}).encode(), {"Content-Type": "application/json"})
    ids.append(json.load(urllib.request.urlopen(req))["prompt_id"])
for i in ids:
    while True:
        h = json.load(urllib.request.urlopen(f"http://127.0.0.1:8188/history/{i}"))
        if i in h:
            st = h[i]["status"]
            print(i[:8], st["status_str"], "" if st["status_str"] == "success" else st["messages"][-1])
            break
        time.sleep(1)
