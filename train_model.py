import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# ==========================================
# 1. LOAD DATASET
# ==========================================
filename = "dataset_skripsi_lengkap.csv"
print(f"Membaca dataset dari {filename}...")
df = pd.read_csv(filename)

# ==========================================
# 2. PEMISAHAN FITUR (X) DAN LABEL (y)
# ==========================================
# Fitur yang digunakan dari sensor
X = df[['suhu', 'bpm', 'rr']]
# Target klasifikasi
y = df['label_kondisi']

# ==========================================
# 3. SPLIT DATA (TRAINING & TESTING)
# ==========================================
# 80% untuk Training, 20% untuk Testing
# stratify=y memastikan proporsi Normal, Peringatan, Bahaya seimbang di data uji
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Total Data Latih (Training): {X_train.shape[0]} baris")
print(f"Total Data Uji (Testing): {X_test.shape[0]} baris\n")

# ==========================================
# 4. TRAINING MODEL RANDOM FOREST
# ==========================================
print("Memulai proses training model Random Forest...")
# n_estimators = jumlah 'pohon' keputusan yang dibuat
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

# ==========================================
# 5. EVALUASI MODEL
# ==========================================
# Melakukan prediksi pada data uji
y_pred = rf_model.predict(X_test)

# Menghitung Akurasi
akurasi = accuracy_score(y_test, y_pred)
print("==========================================")
print(f"AKURASI MODEL: {akurasi * 100:.2f}%")
print("==========================================\n")

print("LAPORAN KLASIFIKASI:")
print(classification_report(y_test, y_pred))

print("CONFUSION MATRIX:")
cm = confusion_matrix(y_test, y_pred, labels=["Normal", "Peringatan", "Bahaya"])
print(cm)
print("(Baris = Label Asli, Kolom = Prediksi)")
print("\n==========================================")

# ==========================================
# 6. EXPORT / SIMPAN MODEL
# ==========================================
model_filename = "rf_health_model.pkl"
joblib.dump(rf_model, model_filename)
print(f"Model berhasil disimpan dengan nama: {model_filename}")
print("Model ini sudah siap di-deploy dan dihubungkan ke MQTT!")