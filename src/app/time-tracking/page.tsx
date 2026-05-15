'use client';
import { Clock, Play } from 'lucide-react';

export default function TimeTrackingPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">Zeiterfassung</h1>
        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">In Entwicklung</span>
      </div>
      
      <div className="bg-slate-900 rounded-3xl p-12 text-center text-white border border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Bald verfügbar</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
          Hier können Sie bald Arbeitszeiten direkt mit Ihren Prüfprotokollen verknüpfen.
        </p>
        <button disabled className="bg-slate-800 text-slate-500 px-8 py-3 rounded-xl font-bold text-sm cursor-not-allowed">
          Timer starten
        </button>
      </div>
    </div>
  );
}