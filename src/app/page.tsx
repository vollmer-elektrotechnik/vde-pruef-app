'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../services/protocolService';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState({ open: 0, completed: 0, total: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Zuerst das Profil laden, um organization_id und user_id zu erhalten
        const profile = await protocolService.getUserProfile();
        
        if (profile && profile.organization_id) {
          // 2. Die korrekte Funktion aus deinem Service aufrufen
          const data = await protocolService.getAllProtocols(profile.organization_id, profile.id);
          
          if (data && Array.isArray(data)) {
            setStats({
              open: data.filter((p: any) => p.status !== 'completed').length,
              completed: data.filter((p: any) => p.status === 'completed').length,
              total: data.length
            });
            setRecent(data.slice(0, 5));
          }
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Dashboard wird geladen...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">Zentrale</h1>
      
      {/* Quick Stats — GEÄNDERT: grid-cols-3 erzwingt eine Zeile auf Mobilgeräten */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm">
          <p className="text-orange-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Offen</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm">
          <p className="text-green-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Erledigt</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-blue-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-blue-100">
          <p className="text-blue-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Gesamt</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letzte Aktivitäten */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800">Letzte Protokolle</h2>
            <button 
              onClick={() => router.push('/protocols')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">ALLE PROTOKOLLE →</span>
              <span className="inline sm:hidden">ALLE →</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {recent.length > 0 ? (
              recent.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => router.push(`/protocols/protocol/${p.id}`)} 
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-200"
                >
                  <span className="text-sm font-bold text-gray-700">{p.title}</span>
                  <span className={`text-[9px] px-2 py-1 rounded-lg font-black tracking-tighter ${
                    p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {p.status === 'completed' ? 'ABGESCHLOSSEN' : 'IN ARBEIT'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">Noch keine Protokolle vorhanden.</p>
            )}
          </div>
        </div>

        {/* Schnellstart Panel */}
        <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Schnellstart</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Erstellen Sie neue Prüfberichte oder verwalten Sie Ihre firmeneigenen VDE-Vorlagen.
            </p>
          </div>
          <div className="grid gap-3">
            <button 
              onClick={() => router.push('/protocols')} 
              className="bg-white text-black py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer"
            >
              NEUES PROTOKOLL
            </button>
            <button 
              onClick={() => router.push('/protocols/templates')} 
              className="bg-gray-800 text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors cursor-pointer"
            >
              VORLAGEN-EDITOR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}