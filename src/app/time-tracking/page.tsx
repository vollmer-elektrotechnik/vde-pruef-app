'use client';
import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square, Trash2, Calendar } from 'lucide-react';

interface TimeEntry {
  id: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMs: number;
}

export default function TimeTrackingPage() {
  const [description, setDescription] = useState('');
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initiales Laden aus dem LocalStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('ajv_time_entries');
    if (savedEntries) {
      try { setEntries(JSON.parse(savedEntries)); } catch (e) { console.error(e); }
    }
    
    const savedStartTime = localStorage.getItem('ajv_timer_start_ms');
    const savedDesc = localStorage.getItem('ajv_timer_desc');
    if (savedStartTime) {
      const startMs = parseInt(savedStartTime, 10);
      setStartTimeMs(startMs);
      setDescription(savedDesc || '');
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    }
  }, []);

  // Der Ticker läuft nur, wenn startTimeMs als primitive Zahl existiert
  useEffect(() => {
    if (startTimeMs !== null) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeMs) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimeMs]); // Reagiert absolut stabil, da Zahl statt Objekt

  // Timer Starten
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (startTimeMs !== null) return; // Bereits am Laufen
    
    const nowMs = Date.now();
    localStorage.setItem('ajv_timer_start_ms', nowMs.toString());
    localStorage.setItem('ajv_timer_desc', description);
    
    setElapsedSeconds(0);
    setStartTimeMs(nowMs);
  };

  // Timer Stoppen
  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startTimeMs === null) return;
    
    const nowMs = Date.now();
    const durationMs = nowMs - startTimeMs;
    
    const startDate = new Date(startTimeMs);
    const endDate = new Date(nowMs);
    
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      description: description.trim() || 'Unbenannte Tätigkeit',
      startTime: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      endTime: endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      durationMs: durationMs
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem('ajv_time_entries', JSON.stringify(updatedEntries));
    
    // Datenbereinigung
    localStorage.removeItem('ajv_timer_start_ms');
    localStorage.removeItem('ajv_timer_desc');
    
    setStartTimeMs(null);
    setElapsedSeconds(0);
    setDescription('');
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('ajv_time_entries', JSON.stringify(updatedEntries));
  };

  const handleClearAll = () => {
    if (!confirm("Möchten Sie wirklich die gesamte Liste löschen?")) return;
    setEntries([]);
    localStorage.removeItem('ajv_time_entries');
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs].map(v => v < 10 ? "0" + v : v).join(":");
  };

  const isCurrentlyRunning = startTimeMs !== null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Zeiterfassung</h1>
          <p className="text-xs text-gray-500 font-medium">Arbeitszeiten unkompliziert festhalten</p>
        </div>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
          Aktiv
        </span>
      </div>
      
      {/* Timer Karte */}
      <div className={`rounded-2xl p-5 border transition-all shadow-sm mb-6 ${
        isCurrentlyRunning ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-gray-900 border-gray-200'
      }`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${isCurrentlyRunning ? 'text-slate-400' : 'text-gray-500'}`}>
              Wofür nimmst du die Zeit?
            </label>
            <input
              type="text"
              placeholder="z.B. Zählererweiterung Müller, Anfahrt..."
              className={`w-full p-4 text-base rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border transition-all ${
                isCurrentlyRunning 
                  ? 'bg-slate-800 border-transparent text-white cursor-not-allowed' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white'
              }`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCurrentlyRunning}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {/* Display */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <div className={`p-2.5 rounded-xl ${isCurrentlyRunning ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                <Clock size={24} />
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight">
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            {/* Die 2 getrennten Buttons - Perfekt für Mobile nebeneinander angeordnet */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStart}
                disabled={isCurrentlyRunning}
                className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white px-4 py-4 sm:py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Play size={16} fill="currentColor" /> Starten
              </button>
              
              <button
                type="button"
                onClick={handleStop}
                disabled={!isCurrentlyRunning}
                className="bg-red-600 hover:bg-red-700 active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-400 disabled:scale-100 text-white px-4 py-4 sm:py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Square size={16} fill="currentColor" /> Stoppen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" /> Erfasste Zeiten
          </h2>
          {entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} /> Liste leeren
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6">
            <p className="text-gray-400 text-sm">Noch keine Einträge erfasst.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between gap-4 active:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-gray-900 block truncate text-base mb-1">
                    {entry.description}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 font-medium">
                    <span>Zeitspanne:</span>
                    <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md font-mono">
                      {entry.startTime} – {entry.endTime}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-500 block uppercase tracking-wider text-[10px] leading-none mb-1">Dauer</span>
                    <span className="font-mono font-black text-gray-900 text-lg">
                      {formatTime(Math.floor(entry.durationMs / 1000))}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}