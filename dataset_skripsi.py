import csv
import random

# Nama file output
filename = "dataset_skripsi_lengkap.csv"

# Fungsi pembantu untuk RR MPU6050 (selalu kelipatan 4 karena WIN_SEC 15 detik)
def generate_rr(min_val, max_val):
    # Mencari kelipatan 4 terdekat dalam rentang
    pilihan_rr = [i for i in range(min_val, max_val + 1) if i % 4 == 0]
    return random.choice(pilihan_rr)

# Menyiapkan list untuk menampung data
dataset = []

# ========================================================
# 1. GENERATE DATA NORMAL (300 Baris)
# ========================================================
# Kondisi: Duduk santai, rileks
for _ in range(300):
    suhu = round(random.uniform(33.0, 35.5), 2)  # Suhu kulit normal
    bpm = random.randint(60, 95)                 # Detak jantung rileks
    rr = generate_rr(12, 20)                     # 12, 16, atau 20 BrPM
    dataset.append([suhu, bpm, rr, "Normal"])

# ========================================================
# 2. GENERATE DATA PERINGATAN / WARNING (300 Baris)
# ========================================================
# Kondisi: Sehabis aktivitas fisik, stres ringan, atau demam awal
for _ in range(300):
    # Suhu sedikit naik atau detak jantung cepat atau napas agak cepat
    suhu = round(random.uniform(35.6, 37.0), 2)
    bpm = random.randint(96, 115) 
    rr = generate_rr(24, 28)                     # 24 atau 28 BrPM
    dataset.append([suhu, bpm, rr, "Peringatan"])

# ========================================================
# 3. GENERATE DATA BAHAYA / DANGER (300 Baris)
# ========================================================
# Kondisi: Takipnea (napas sangat cepat), Bradipnea (sangat lambat/apnea), atau Takikardia
for _ in range(300):
    tipe_bahaya = random.choice(["napas_cepat", "napas_lambat", "jantung_kritis"])
    
    if tipe_bahaya == "napas_cepat":
        suhu = round(random.uniform(36.5, 38.5), 2)
        bpm = random.randint(110, 140)
        rr = generate_rr(32, 44)                 # Napas terengah-engah (>30)
    elif tipe_bahaya == "napas_lambat":
        suhu = round(random.uniform(31.0, 32.9), 2) # Hipotermia/suhu drop
        bpm = random.randint(40, 55)             # Jantung melambat
        rr = generate_rr(0, 8)                   # 0, 4, atau 8 BrPM
    else: # jantung_kritis
        suhu = round(random.uniform(34.0, 36.0), 2)
        bpm = random.randint(141, 180)           # Jantung sangat cepat
        rr = generate_rr(24, 36)
        
    dataset.append([suhu, bpm, rr, "Bahaya"])

# ========================================================
# ACAK URUTAN DATA (SHUFFLE) AGAR MODEL MACHINE LEARNING BAGUS
# ========================================================
random.shuffle(dataset)

# Menulis ke file CSV
with open(filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    # Tulis Header
    writer.writerow(["suhu", "bpm", "rr", "label_kondisi"])
    # Tulis Data
    writer.writerows(dataset)

print(f"✅ Berhasil membuat {len(dataset)} baris data sintetis!")
print(f"Data disimpan dalam file: {filename}")