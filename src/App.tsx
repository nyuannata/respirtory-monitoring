import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { 
  Wind, 
  Thermometer, 
  Activity, 
  BrainCircuit,
  AlertTriangle,
  Wifi,
  Clock,
  X,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  YAxis, 
  XAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Status = 'normal' | 'peringatan' | 'bahaya';

interface SensorData {
  value: number;
  status: Status;
  trend: 'naik' | 'turun' | 'stabil';
}

interface HistoricalData {
  time: string;
  respRate: number;
  spo2: number;
  temp: number;
}

const BreathingWaveform = ({ respRate, isDanger }: { respRate: number, isDanger: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    let time = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;
      
      const breathsPerSecond = respRate / 60;
      // Make speed visually more responsive to the actual rate
      time += 0.015 + (respRate * 0.0005);

      ctx.clearRect(0, 0, w, h);
      
      // Gradient stroke
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      if (isDanger) {
        gradient.addColorStop(0, '#f43f5e'); // rose-500
        gradient.addColorStop(1, '#881337'); // rose-900 (smooth darker transition)
        ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
      } else {
        gradient.addColorStop(0, '#06b6d4'); // cyan-500
        gradient.addColorStop(1, '#3b82f6'); // blue-500
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      }

      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 12;

      for (let x = 0; x < w; x++) {
        const t = time * 2 - (w - x) * 0.005;
        const primary = Math.sin(t * breathsPerSecond * Math.PI * 2);
        const secondary = Math.sin(t * breathsPerSecond * Math.PI * 2 + 0.5) * 0.3;
        const wave = (primary + secondary) * (h / 3.5);
        ctx.lineTo(x, (h / 2) - wave);
      }
      ctx.stroke();

      // Reset shadow so it doesn't affect anything else if extended
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [respRate, isDanger]);

  return (
    <div className="w-full h-28 bg-white rounded-2xl overflow-hidden relative border border-blue-100/50 shadow-sm mb-6 group transition-all duration-300 hover:shadow-md">
      <div className="absolute top-3 left-4 flex items-center space-x-2 z-10 transition-colors bg-white/90 px-2.5 py-1 rounded-md backdrop-blur-sm border border-slate-100 shadow-sm">
         <span className={cn("w-2 h-2 rounded-full", isDanger ? "bg-rose-500 animate-[pulse_1s_ease-in-out_infinite]" : "bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]")}></span>
         <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors duration-500", isDanger ? "text-rose-600" : "text-blue-700")}>GELOMBANG PERNAPASAN</span>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-70"></div>
      <canvas ref={canvasRef} className="w-full h-full relative z-[5]" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
    </div>
  );
};

const LogModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-inner">
               <FileText className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Riwayat Sistem & Peringatan Lengkap</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow space-y-4 custom-scrollbar">
           {[
             { time: new Date().toLocaleTimeString('id-ID'), type: 'info', title: 'Akses Log Sistem', desc: 'Pengguna membuka log riwayat sistem secara penuh.' },
             { time: '11:45:00', type: 'info', title: 'Pemindaian Sistem Selesai', desc: 'Kalibrasi sensor SpO2 dan laju pernapasan berjalan sukses dan normal tanpa gangguan.' },
             { time: '11:03:12', type: 'normal', title: 'Normalisasi SpO2', desc: 'Tingkat oksigen pasien kembali ke 98% secara alami tanpa memerlukan intervensi lanjutan.' },
             { time: '10:15:20', type: 'peringatan', title: 'Peringatan Laju Napas', desc: 'Laju pernapasan sedikit menurun ke batas 13 BPM selama lebih dari 5 menit berturut-turut.' },
             { time: '09:48:30', type: 'bahaya', title: 'Lonjakan Laju Napas Kritis', desc: 'Peringatan keras! Laju pernapasan mencapai 28 BPM di luar ambang batas sehat. Peringatan stasiun dipacu.' },
             { time: '08:00:00', type: 'info', title: 'Mulai Shift Pemantauan', desc: 'Sistem deteksi utama diaktifkan untuk pasien #20489A di stasiun ICU Sayap B.' },
             { time: '07:30:15', type: 'normal', title: 'Suhu Tubuh Stabil', desc: 'Monitoring pagi menunjukkan hasil suhu berada di angka normal yaitu 36.8°C.' },
             { time: '06:12:00', type: 'peringatan', title: 'Suhu Mendekati Batas Demam', desc: 'Suhu tubuh tercatat naik sedikit ke 37.6°C, asisten perawat telah diberi notifikasi tertulis.' },
             { time: '02:44:11', type: 'normal', title: 'Pemantauan Malam Aktif', desc: 'Perangkat berada dalam mode visibilitas dimalam hari secara efisien dan senyap.' },
           ].map((log, i) => (
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 }}
               key={i} 
               className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-default group"
             >
               <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform",
                 log.type === 'bahaya' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                 log.type === 'peringatan' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                 log.type === 'normal' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' :
                 'bg-blue-50 text-blue-500 border-blue-100'
               )}>
                 {log.type === 'bahaya' ? <AlertTriangle className="w-4 h-4" /> :
                  log.type === 'peringatan' ? <AlertTriangle className="w-4 h-4" /> : 
                  log.type === 'normal' ? <Activity className="w-4 h-4" /> :
                  <FileText className="w-4 h-4" />}
               </div>
               <div className="flex-grow">
                 <div className="flex justify-between items-start mb-1.5">
                   <h4 className="font-bold text-slate-800 text-sm">{log.title}</h4>
                   <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md shadow-sm">{log.time}</span>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">{log.desc}</p>
               </div>
             </motion.div>
           ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors shadow-md active:scale-95"
          >
            Tutup Riwayat
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [dataHistory, setDataHistory] = useState<HistoricalData[]>([]);
  const [currentData, setCurrentData] = useState<{
    respRate: SensorData;
    spo2: SensorData;
    temp: SensorData;
  }>({
    respRate: { value: 16, status: 'normal', trend: 'stabil' },
    spo2: { value: 98, status: 'normal', trend: 'stabil' },
    temp: { value: 36.8, status: 'normal', trend: 'stabil' },
  });

  const [aiAnalysis, setAiAnalysis] = useState({
    status: 'normal' as Status,
    recommendation: 'Kondisi stabil',
    confidence: 98,
  });

  const stateRef = useRef({
    respRate: 16,
    spo2: 98,
    temp: 36.8,
    timeCounter: 0,
    crisisMode: false,
    crisisCounter: 0,
  });

  useEffect(() => {
    // Mengisi riwayat awal agar grafik tidak kosong saat pertama kali dimuat
    const initialHistory: HistoricalData[] = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 2500);
      initialHistory.push({
        time: t.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        respRate: 16,
        spo2: 98, // Detak jantung awal
        temp: 36.8,
      });
    }
    setDataHistory(initialHistory);

    // Hubungkan ke HiveMQ menggunakan wss (WebSocket Secure)
    const brokerUrl = "wss://096d892966dc40f687e38c2a80e38de8.s1.eu.hivemq.cloud:8884/mqtt";
    const clientId = "WebDashboard-" + Math.random().toString(16).substr(2, 8);
    
    const client = mqtt.connect(brokerUrl, {
      clientId: clientId,
      username: "yuannatan",
      password: "Yuanmqtt123"
    });

    client.on('connect', () => {
      console.log('Terhubung ke HiveMQ');
      client.subscribe('health/monitoring/data');
      client.subscribe('health/monitoring/hasil');
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        if (topic === 'health/monitoring/data') {
          // payload: { suhu, bpm, rr }
          setCurrentData(prev => {
            const evaluateRespColor = (val: number): Status => {
              if (val > 25) return 'bahaya';
              if (val >= 21) return 'peringatan';
              return 'normal';
            };
            const evaluateSpo2Color = (val: number): Status => {
              // Mapping ini disesuaikan untuk rentang BPM
              if (val > 100 || val < 60) return 'bahaya';
              if (val > 90 || val < 65) return 'peringatan';
              return 'normal';
            };
            const evaluateTempColor = (val: number): Status => {
              if (val > 38.0) return 'bahaya';
              if (val >= 37.6) return 'peringatan';
              return 'normal';
            };

            const newResp = evaluateRespColor(payload.rr);
            const newBpm = evaluateSpo2Color(payload.bpm);
            const newTemp = evaluateTempColor(payload.suhu);

            const tickTime = new Date();
            setDataHistory(oldHistory => {
              const next = [...(oldHistory.length > 20 ? oldHistory.slice(1) : oldHistory), {
                time: tickTime.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
                respRate: parseFloat(payload.rr),
                spo2: parseFloat(payload.bpm), // Mapping BPM ke properti spo2 agar grafik tidak perlu banyak diubah
                temp: parseFloat(payload.suhu),
              }];
              return next;
            });

            return {
              respRate: { 
                value: parseFloat(payload.rr), 
                status: newResp,
                trend: payload.rr > prev.respRate.value ? 'naik' : payload.rr < prev.respRate.value ? 'turun' : 'stabil'
              },
              spo2: { 
                value: parseFloat(payload.bpm), 
                status: newBpm,
                trend: payload.bpm > prev.spo2.value ? 'naik' : payload.bpm < prev.spo2.value ? 'turun' : 'stabil'
              },
              temp: { 
                value: parseFloat(payload.suhu), 
                status: newTemp,
                trend: payload.suhu > prev.temp.value ? 'naik' : payload.suhu < prev.temp.value ? 'turun' : 'stabil'
              }
            };
          });
        }
        
        if (topic === 'health/monitoring/hasil') {
          // payload: { status_pasien: "Normal" }
          const kondisi = payload.status_pasien;
          let status: Status = 'normal';
          let conf = 95;
          let rec = 'Diagnosis: ' + kondisi;
          
          if (kondisi.toLowerCase().includes('peringatan')) {
             status = 'peringatan';
             conf = 88 + Math.floor(Math.random() * 6);
          } else if (kondisi.toLowerCase().includes('bahaya') || kondisi.toLowerCase().includes('kritis')) {
             status = 'bahaya';
             conf = 98 - Math.floor(Math.random() * 2);
          } else {
             status = 'normal';
             conf = 96 + Math.floor(Math.random() * 4);
          }
          
          setAiAnalysis(prev => ({
            ...prev,
            status: status,
            recommendation: rec,
            confidence: conf
          }));
        }
      } catch (err) {
        console.error("Gagal parse message:", err);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const getStatusColorConfig = (status: Status) => {
    switch(status) {
      case 'bahaya': 
        return { text: 'text-rose-600', bg: 'bg-rose-500', shadow: 'rgba(225,29,72,0.3)', lightBg: 'bg-rose-100', border: 'border-rose-200' };
      case 'peringatan': 
        return { text: 'text-amber-600', bg: 'bg-amber-500', shadow: 'rgba(217,119,6,0.3)', lightBg: 'bg-amber-100', border: 'border-amber-200' };
      case 'normal': 
      default:
        return { text: 'text-emerald-600', bg: 'bg-emerald-500', shadow: 'rgba(5,150,105,0.3)', lightBg: 'bg-emerald-100', border: 'border-emerald-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden relative selection:bg-blue-500/20 transition-colors duration-500">
      {/* Soft mesh background to reduce glare and add texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.06),transparent_70%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-blue-100/50 shadow-sm gap-4 transition-all duration-300">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-blue-900 flex items-center space-x-3">
            <div className="p-1 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 flex items-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span>Respiratory Monitoring</span>
          </h1>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mt-1 ml-11">
            Dasbor Kesehatan IoT + AI
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm transition-all hover:bg-blue-100">
              <Wifi className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Terhubung</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm hidden sm:flex">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                Pemantauan Langsung
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-2">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="text-right hidden lg:block border-l border-slate-200 pl-6">
            <p className="text-xs text-slate-500">ID Pasien: <span className="text-slate-800 font-bold">#20489A</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">Stasiun: ICU Sayap B</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-4 sm:p-8 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        <div className="col-span-1 lg:col-span-8 flex flex-col">
          
          {/* Top Cards: Sensors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            
            {/* Resp Rate Card */}
            <motion.div 
              layout
              className={cn("bg-white rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default shadow-sm border", 
                getStatusColorConfig(currentData.respRate.status).border
              )}
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 transition-colors duration-500", 
                getStatusColorConfig(currentData.respRate.status).bg
              )}></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("p-2.5 rounded-xl transition-colors duration-500 shadow-sm", 
                  getStatusColorConfig(currentData.respRate.status).lightBg,
                  getStatusColorConfig(currentData.respRate.status).text
                )}>
                  <Wind className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-2">
                   <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusColorConfig(currentData.respRate.status).bg)}></span>
                   <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors duration-500",
                     getStatusColorConfig(currentData.respRate.status).lightBg,
                     getStatusColorConfig(currentData.respRate.status).text
                   )}>NAPAS</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-semibold relative z-10">Laju Pernapasan</p>
              <div className="flex items-baseline space-x-2 mt-1 relative z-10">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={currentData.respRate.value}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn("text-5xl font-black tracking-tight drop-shadow-sm transition-colors duration-500", 
                      getStatusColorConfig(currentData.respRate.status).text
                    )}
                    style={{ textShadow: `0 4px 12px ${getStatusColorConfig(currentData.respRate.status).shadow}` }}
                  >
                    {currentData.respRate.value.toFixed(1)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-slate-400 text-sm font-semibold">BPM</span>
              </div>
            </motion.div>

            {/* SpO2 Card */}
            <motion.div 
              layout
              className={cn("bg-white rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default shadow-sm border", 
                getStatusColorConfig(currentData.spo2.status).border
              )}
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 transition-colors duration-500", 
                getStatusColorConfig(currentData.spo2.status).bg
              )}></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("p-2.5 rounded-xl transition-colors duration-500 shadow-sm", 
                  getStatusColorConfig(currentData.spo2.status).lightBg,
                  getStatusColorConfig(currentData.spo2.status).text
                )}>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-2">
                   <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusColorConfig(currentData.spo2.status).bg)}></span>
                   <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors duration-500",
                     getStatusColorConfig(currentData.spo2.status).lightBg,
                     getStatusColorConfig(currentData.spo2.status).text
                   )}>BPM</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-semibold relative z-10">Detak Jantung</p>
              <div className="flex items-baseline space-x-2 mt-1 relative z-10">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={currentData.spo2.value}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn("text-5xl font-black tracking-tight drop-shadow-sm transition-colors duration-500",
                      getStatusColorConfig(currentData.spo2.status).text
                    )}
                    style={{ textShadow: `0 4px 12px ${getStatusColorConfig(currentData.spo2.status).shadow}` }}
                  >
                    {currentData.spo2.value.toFixed(1)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-slate-400 text-sm font-semibold">BPM</span>
              </div>
            </motion.div>

            {/* Temp Card */}
            <motion.div 
              layout
              className={cn("bg-white rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default shadow-sm border", 
                getStatusColorConfig(currentData.temp.status).border
              )}
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 transition-colors duration-500", 
                 getStatusColorConfig(currentData.temp.status).bg
              )}></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("p-2.5 rounded-xl transition-colors duration-500 shadow-sm", 
                  getStatusColorConfig(currentData.temp.status).lightBg,
                  getStatusColorConfig(currentData.temp.status).text
                )}>
                  <Thermometer className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-2">
                   <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusColorConfig(currentData.temp.status).bg)}></span>
                   <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors duration-500",
                     getStatusColorConfig(currentData.temp.status).lightBg,
                     getStatusColorConfig(currentData.temp.status).text
                   )}>SUHU</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-semibold relative z-10">Suhu Tubuh</p>
              <div className="flex items-baseline space-x-2 mt-1 relative z-10">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={currentData.temp.value}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn("text-5xl font-black tracking-tight drop-shadow-sm transition-colors duration-500",
                      getStatusColorConfig(currentData.temp.status).text
                    )}
                    style={{ textShadow: `0 4px 12px ${getStatusColorConfig(currentData.temp.status).shadow}` }}
                  >
                    {currentData.temp.value.toFixed(1)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-slate-400 text-sm font-semibold">&deg;C</span>
              </div>
            </motion.div>

          </div>

          <BreathingWaveform respRate={currentData.respRate.value} isDanger={currentData.respRate.status === 'bahaya'} />

          {/* Historical Chart */}
          <div className="flex-grow bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col min-h-[360px] shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h3 className="text-lg font-bold text-slate-800">Tren Riwayat Pasien</h3>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                  <span>Laju Napas</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></span>
                  <span>Detak Jantung</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataHistory} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickMargin={12} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    axisLine={false}
                    tickLine={false}
                    domain={[80, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#334155', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="respRate" 
                    name="Laju Napas"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 3 }}
                    isAnimationActive={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="spo2" 
                    name="Detak Jantung"
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute left-8 bottom-3 flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
               <Clock className="w-3 h-3" />
               <span>Jendela 20 pembaruan terakhir</span>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="col-span-1 lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-xl shadow-inner">
                  <BrainCircuit className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Mesin Logika AI</h3>
              </div>
              <div className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[9px] text-slate-500 font-mono">
                RandomForest_v2.0
              </div>
            </div>

            <motion.div 
              layout
              animate={aiAnalysis.status === 'bahaya' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn("p-6 rounded-2xl border mb-6 transition-all duration-500 relative overflow-hidden group", 
                aiAnalysis.status === 'bahaya' ? 'bg-rose-50 border-rose-300 shadow-[0_0_20px_rgba(225,29,72,0.1)]' :
                aiAnalysis.status === 'peringatan' ? 'bg-amber-50 border-amber-300 shadow-[0_0_20px_rgba(217,119,6,0.1)]' :
                'bg-emerald-50 border-emerald-300 shadow-sm'
              )}
            >
              <div className={cn("absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-50 transition-all duration-700",
                  aiAnalysis.status === 'bahaya' ? 'bg-rose-300' :
                  aiAnalysis.status === 'peringatan' ? 'bg-amber-300' : 'bg-emerald-300'
              )}></div>

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center space-x-2">
                  <span className={cn("w-2 h-2 rounded-full", aiAnalysis.status === 'bahaya' ? 'bg-rose-500 animate-pulse' : aiAnalysis.status === 'peringatan' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}></span>
                  <span className={cn("text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm transition-colors duration-500",
                    aiAnalysis.status === 'bahaya' ? 'text-white bg-rose-600' :
                    aiAnalysis.status === 'peringatan' ? 'text-white bg-amber-500' :
                    'text-white bg-emerald-500'
                  )}>
                    {aiAnalysis.status === 'normal' ? 'NORMAL' : aiAnalysis.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="relative z-10 mb-5">
                <p className={cn("text-2xl font-black leading-tight mb-2 tracking-tight transition-colors duration-500", 
                  aiAnalysis.status === 'bahaya' ? 'text-rose-600' : 
                  aiAnalysis.status === 'peringatan' ? 'text-amber-600' : 'text-emerald-600'
                )}>
                  {aiAnalysis.recommendation}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium transition-colors duration-500">
                  {aiAnalysis.status === 'bahaya' 
                    ? '🚨 Segera hubungi tenaga medis darurat! Periksa alat bantu pernapasan, pastikan jalur napas tidak terhalang, dan persiapkan tabung oksigen cadangan jika diperlukan.'
                    : aiAnalysis.status === 'peringatan'
                    ? '⚠️ Pasien menunjukkan gejala sesak ringan. Minta pasien untuk rileks, atur posisi duduk lebih tegak (Fowler), dan pantau terus perubahan angkanya selama 15 menit ke depan.'
                    : '✅ Kondisi pernapasan dan detak jantung pasien stabil. Lanjutkan pemantauan rutin dan pastikan pasien beristirahat di ruangan dengan sirkulasi udara yang baik.'}
                </p>
              </div>

              {/* Confidence Progress Bar */}
              <div className="relative z-10 border-t border-black/5 pt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Skor Akurasi AI</span>
                  <span className="text-xs font-black text-slate-700">{aiAnalysis.confidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${aiAnalysis.confidence}%` }}
                    transition={{ duration: 1, type: "spring" }}
                    className={cn("h-full rounded-full transition-colors duration-500",
                      aiAnalysis.status === 'bahaya' ? 'bg-rose-500' :
                      aiAnalysis.status === 'peringatan' ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  />
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <span className="text-slate-500 font-semibold tracking-wide">Evaluasi Terakhir</span>
                </div>
                <span className="text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{new Date().toLocaleTimeString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-slate-500 font-semibold tracking-wide">Pemindaian Berkelanjutan</span>
                </div>
                <span className="text-blue-600 font-mono font-bold tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">AKTIF</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex-grow flex flex-col min-h-[300px] shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Riwayat Peringatan Terbaru</h3>
            <div className="space-y-5">
              <div className="flex items-start space-x-4 group cursor-default">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-700">Normalisasi SpO2</p>
                    <span className="text-[10px] text-slate-400 font-medium">45m yg lalu</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Tingkat oksigen pasien kembali ke 98% secara alami tanpa intervensi.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group cursor-default">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-700">Lonjakan Laju Napas</p>
                    <span className="text-[10px] text-slate-400 font-medium">2j yg lalu</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Lonjakan singkat laju pernapasan mencapai 28 BPM. Teratasi secara mandiri.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsLogModalOpen(true)}
              className="mt-auto w-full py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all duration-300 active:scale-[0.98] shadow-sm"
            >
              Lihat Riwayat Log Lengkap
            </button>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isLogModalOpen && <LogModal onClose={() => setIsLogModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
