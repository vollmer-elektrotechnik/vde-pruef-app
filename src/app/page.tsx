'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../services/protocolService';
import { useRouter } from 'next/navigation';
import { Settings, X } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ open: 0, completed: 0, total: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showConfig, setShowConfig] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    protocols: true, // Stats & Liste
    expert: true    // Experten-Bereich
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('dashboard_settings');
    if (savedConfig) setVisibleWidgets(JSON.parse(savedConfig));

    async function loadDashboardData() {
      try {
        const profile = await protocolService.getUserProfile();
        if (profile?.organization_id) {
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

  const toggleWidget = (widget: keyof typeof visibleWidgets) => {
    const newConfig = { ...visibleWidgets, [widget]: !visibleWidgets[widget] };
    setVisibleWidgets(newConfig);
    localStorage.setItem('dashboard_settings', JSON.stringify(newConfig));
  };

  if (loading) return <div className="p-8 text-gray-400">Dashboard wird geladen...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Zentrale</h1>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
          <Settings size={24} />
        </button>
      </div>

      {showConfig && (
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Dashboard anpassen</h3>
            <button onClick={() => setShowConfig(false)}><X size={18} /></button>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={visibleWidgets.protocols} onChange={() => toggleWidget('protocols')} className="accent-blue-600" />
              <span className="text-sm font-medium text-gray-600">Protokolle</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={visibleWidgets.expert} onChange={() => toggleWidget('expert')} className="accent-blue-600" />
              <span className="text-sm font-medium text-gray-600">Experte</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Das Grid-System erzwingt 2 Spalten auf Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {visibleWidgets.protocols && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <p className="text-orange-600 text-[9px] font-bold uppercase">Offen</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.open}</p>
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <p className="text-green-600 text-[9px] font-bold uppercase">Erledigt</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.completed}</p>
              </div>
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100">
                <p className="text-blue-100 text-[9px] font-bold uppercase">Gesamt</p>
                <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800">Letzte Protokolle</h2>
                <button onClick={() => router.push('/protocols')} className="text-xs font-bold text-blue-600">ALLE →</button>
              </div>
              <div className="space-y-3">
                {recent.map(p => (
                  <div key={p.id} onClick={() => router.push(`/protocols/protocol/${p.id}`)} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100">
                    <span className="text-sm font-bold text-gray-700 truncate mr-2">{p.title}</span>
                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.status === 'completed' ? 'ABGESCHLOSSEN' : 'IN ARBEIT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {visibleWidgets.expert && (
          <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xl font-bold mb-2">Experten-Bereich</h2>
              <p className="text-gray-400 text-sm mb-8">Erstellen Sie neue Prüfberichte oder verwalten Sie Ihre VDE-Vorlagen.</p>
            </div>
            <div className="grid gap-3">
              <button onClick={() => router.push('/protocols')} className="bg-white text-black py-4 rounded-2xl font-black text-sm">NEUES PROTOKOLL</button>
              <button onClick={() => router.push('/protocols/templates')} className="bg-gray-800 text-white py-4 rounded-2xl font-bold text-sm">VORLAGEN-EDITOR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}