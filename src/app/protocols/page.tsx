'use client';

import { useEffect, useState } from 'react';
import { protocolService } from '../../services/protocolService'; 
import { createClient } from '../../lib/supabase/client';        
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// HIER ERGÄNZT: ExternalLink Icon für den mobilen Button
import { Settings, Download, Trash2, ExternalLink } from 'lucide-react';

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const ADMIN_EMAIL = "julianvollmer@live.de";

  useEffect(() => {
    const initSession = async () => {
      try {
        const profile = await protocolService.getUserProfile();
        
        if (profile) {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
          setOrgId(profile.organization_id);
          
          await loadInitialData(profile.organization_id, profile.id);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error("Auth Init Fehler:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  async function loadInitialData(organizationId: string, userId: string) {
    setLoading(true);
    try {
      const [protoData, tempData] = await Promise.all([
        protocolService.getAllProtocols(organizationId, userId), 
        protocolService.getTemplates(organizationId)
      ]);
      setProtocols(protoData || []);
      setTemplates(tempData || []);
    } catch (err: any) {
      console.error("Fehler beim Laden der Listen:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedTemplates() {
    if (user?.email !== ADMIN_EMAIL || !orgId) return;
    if (!confirm("Standard-Vorlagen jetzt laden?")) return;
    
    try {
      await protocolService.seedDefaultTemplates(orgId);
      const tempData = await protocolService.getTemplates(orgId);
      setTemplates(tempData || []);
      alert("Vorlagen geladen!");
    } catch (err) {
      alert("Fehler beim Laden");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !user || !orgId) return;
    setIsCreating(true);
    try {
      let newProtocol: any;
      
      if (selectedTemplate) {
        newProtocol = await protocolService.createFromTemplate(newTitle, orgId, user.id, selectedTemplate);
      } else {
        newProtocol = await protocolService.createProtocol(newTitle, orgId, user.id);
      }
      
      setNewTitle('');
      setSelectedTemplate('');
      
      if (newProtocol?.id) {
        router.push(`/protocols/protocol/${newProtocol.id}`);
      } else {
        await loadInitialData(orgId, user.id);
      }
    } catch (err: any) {
      alert(err.message || "Fehler beim Erstellen");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleTogglePublic(id: string, currentStatus: boolean) {
    if (!orgId || !user) return;
    try {
      await protocolService.togglePublicStatus(id, !currentStatus);
      await loadInitialData(orgId, user.id);
    } catch (err) {
      alert("Fehler beim Ändern");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Protokoll "${title}" löschen?`) || !orgId || !user) return;
    try {
      await protocolService.deleteProtocol(id);
      await loadInitialData(orgId, user.id);
    } catch (err) {
      alert("Fehler beim Löschen");
    }
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-screen font-sans">Prüfe Anmeldung...</div>;

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/protocols/templates" 
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold flex items-center gap-1 transition-colors"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Vorlagen verwalten</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              /* HIER GEÄNDERT: Text angepasst & 'cursor-pointer' hinzugefügt */
              <button 
                onClick={handleSeedTemplates}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-100 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Vorlagen laden</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 tracking-tight">Protokolle</h1>

        <section className="mb-8 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Projekt / Kunde</label>
            <input
              type="text"
              placeholder="z.B. Müller - PV Anlage"
              className="w-full p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vorlage auswählen</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-base text-gray-700 appearance-none cursor-pointer outline-none transition-all"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">-- Leeres Protokoll --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 active:scale-[0.98] transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            disabled={isCreating || !newTitle.trim()}
          >
            {isCreating ? 'Wird erstellt...' : 'Protokoll erstellen'}
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-end pb-2 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Letzte Protokolle</h2>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              {protocols.length} Gesamt
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Lade Daten...</p>
            </div>
          ) : protocols.length === 0 ? (
            <div className="text-center py-16 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Noch keine Protokolle vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {protocols.map((p) => (
                <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between gap-3 active:bg-gray-50 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900 truncate text-base">{p.title}</span>
                      
                      {/* GEÄNDERT: hidden sm:inline-block sorgt dafür, dass Team/Privat mobil ausgeblendet wird */}
                      <span className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${p.is_public ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_public ? 'Team' : 'Privat'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {p.date ? new Date(p.date).toLocaleDateString('de-DE') : 'Kein Datum'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {p.user_id === user?.id && (
                      <button 
                        onClick={() => handleTogglePublic(p.id, p.is_public)} 
                        className="p-2 sm:p-3 text-lg hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title={p.is_public ? 'Öffentlich' : 'Privat'}
                      >
                        {p.is_public ? '👥' : '🔒'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDelete(p.id, p.title)} 
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    {/* GEÄNDERT: Button passt sich jetzt an (Icon mobil, Text ab sm-Breakpoint) */}
                    <Link 
                      href={`/protocols/protocol/${p.id}`} 
                      className="ml-1 bg-gray-900 text-white p-3 sm:px-5 sm:py-3 rounded-xl text-sm font-bold shadow-sm active:bg-black transition-all flex items-center justify-center"
                      title="Protokoll öffnen"
                    >
                      <span className="hidden sm:inline">Öffnen</span>
                      <span className="sm:hidden flex items-center justify-center">
                        <ExternalLink size={16} />
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}