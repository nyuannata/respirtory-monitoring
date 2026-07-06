import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

df = pd.read_csv("dataset_skripsi_lengkap.csv")
X = df[['suhu', 'bpm', 'rr']]
y = df['label_kondisi']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Data latih: {X_train.shape[0]}, Data uji: {X_test.shape[0]}")

rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
akurasi = accuracy_score(y_test, y_pred)
print(f"AKURASI MODEL: {akurasi*100:.2f}%")
print(classification_report(y_test, y_pred, digits=4))
cm = confusion_matrix(y_test, y_pred, labels=["Normal","Peringatan","Bahaya"])
print("Confusion Matrix (baris=asli, kolom=prediksi):")
print(cm)

joblib.dump(rf_model, "rf_health_model.pkl")
