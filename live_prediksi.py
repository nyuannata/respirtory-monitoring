import paho.mqtt.client as mqtt
import json
import joblib
import warnings
import ssl

warnings.filterwarnings("ignore")

# 1. LOAD MODEL ML
rf_model = joblib.load("rf_health_model.pkl")
print("✅ Model Machine Learning Aktif!")

# 2. KONFIGURASI HIVEMQ
BROKER = "096d892966dc40f687e38c2a80e38de8.s1.eu.hivemq.cloud"
PORT = 8883
USERNAME = "yuannatan"
PASSWORD = "Yuanmqtt123"

# Topik untuk Menerima Data Mentah & Mengirim Hasil
TOPIC_TERIMA = "health/monitoring/data"
TOPIC_KIRIM = "health/monitoring/hasil"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Python Terhubung ke HiveMQ!")
        client.subscribe(TOPIC_TERIMA)
    else:
        print("❌ Gagal terhubung.")

def on_message(client, userdata, msg):
    try:
        # Terima data mentah dari ESP32
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)
        
        suhu, bpm, rr = data.get("suhu", 0), data.get("bpm", 0), data.get("rr", 0)
        
        # Prediksi menggunakan Random Forest (.pkl)
        hasil_prediksi = rf_model.predict([[suhu, bpm, rr]])[0]
        
        # Cetak di terminal Python
        print(f"Data: Suhu={suhu}, BPM={bpm}, RR={rr} | Status: {hasil_prediksi}")
        
        # KIRIM HASIL PREDIKSI KE WEBSITE VIA MQTT
        paket_hasil = json.dumps({"status_pasien": hasil_prediksi})
        client.publish(TOPIC_KIRIM, paket_hasil)

    except Exception as e:
        print(f"❌ Error saat memproses data: {e}")

client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS)

client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()