import csv
import random
import numpy as np

random.seed(42)
np.random.seed(42)

filename = "dataset_skripsi_lengkap.csv"
dataset = []

def clip(v, lo, hi):
    return max(lo, min(hi, v))

# ==========================================================
# 1. NORMAL (300 baris) - kondisi duduk santai/rileks
#    Distribusi gaussian supaya ada overlap alami di batas kelas
# ==========================================================
for _ in range(300):
    suhu = clip(np.random.normal(34.3, 0.7), 32.0, 37.0)
    bpm  = clip(np.random.normal(78, 10), 50, 118)
    rr   = clip(np.random.normal(17, 3.2), 8, 30)
    dataset.append([round(suhu,2), int(round(bpm)), int(round(rr)), "Normal"])

# ==========================================================
# 2. PERINGATAN (300 baris) - sehabis aktivitas ringan/stres/demam awal
#    Sengaja tumpang tindih dgn ekor Normal & ekor Bahaya
# ==========================================================
for _ in range(300):
    suhu = clip(np.random.normal(36.3, 0.7), 34.0, 38.0)
    bpm  = clip(np.random.normal(103, 10), 80, 130)
    rr   = clip(np.random.normal(25, 3.5), 16, 34)
    dataset.append([round(suhu,2), int(round(bpm)), int(round(rr)), "Peringatan"])

# ==========================================================
# 3. BAHAYA (300 baris) - takipnea, bradipnea/apnea, takikardia kritis
#    Tetap dibuat 3 sub-tipe, tapi dgn sebaran gaussian (bukan uniform rentang tetap)
# ==========================================================
for _ in range(300):
    tipe = random.choice(["napas_cepat", "napas_lambat", "jantung_kritis"])
    if tipe == "napas_cepat":
        suhu = clip(np.random.normal(37.4, 0.7), 35.5, 39.0)
        bpm  = clip(np.random.normal(122, 10), 100, 145)
        rr   = clip(np.random.normal(35, 4.5), 26, 46)
    elif tipe == "napas_lambat":
        suhu = clip(np.random.normal(32.3, 0.8), 30.5, 34.5)
        bpm  = clip(np.random.normal(48, 7), 32, 65)
        rr   = clip(np.random.normal(5, 3.0), 0, 12)
    else:
        suhu = clip(np.random.normal(35.5, 0.9), 33.5, 37.5)
        bpm  = clip(np.random.normal(158, 12), 132, 185)
        rr   = clip(np.random.normal(28, 5.0), 18, 40)
    dataset.append([round(suhu,2), int(round(bpm)), int(round(rr)), "Bahaya"])

# ==========================================================
# 4. LABEL NOISE - simulasi ketidaksempurnaan sensor / variasi individu
#    3% data diacak labelnya supaya tidak terjadi separasi sempurna
# ==========================================================
n_noise = int(0.03 * len(dataset))
noise_idx = random.sample(range(len(dataset)), n_noise)
labels = ["Normal", "Peringatan", "Bahaya"]
for i in noise_idx:
    current = dataset[i][3]
    choices = [l for l in labels if l != current]
    dataset[i][3] = random.choice(choices)

random.shuffle(dataset)

with open(filename, mode='w', newline='') as f:
    w = csv.writer(f)
    w.writerow(["suhu", "bpm", "rr", "label_kondisi"])
    w.writerows(dataset)

print(f"Berhasil membuat {len(dataset)} baris data (dengan noise: {n_noise} baris)")
