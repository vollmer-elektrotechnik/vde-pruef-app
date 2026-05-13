'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../services/protocolService';
import { createClient } from './../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Deine Organisations-ID für die AJV Elektro GmbH
  const ORG_ID = "4bab2241-2309-435c-a003-455ad4a5b1dc";

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
        // Lädt Daten basierend auf Organisation UND User-ID
        loadData(ORG_ID, session.user.id);
      }
    };
    checkUser();
  }, [supabase, router]);

  async function loadData(orgId: string, userId: string) {
    setLoading(true);
    try {
      const data = await protocolService.getAllProtocols(orgId, userId);
      setProtocols(data || []);
    } catch (err: any) {
      console.error("Fehler beim Laden:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setIsCreating(true);
    try {
      // Erstellt ein Protokoll, das initial dir gehört und privat ist
      await protocolService.createProtocol(newTitle, ORG_ID, user.id);
      setNewTitle('');
      await loadData(ORG_ID, user.id);
    } catch (err) {
      alert("Fehler beim Erstellen des Protokolls");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleTogglePublic(id: string, currentStatus: boolean) {
    try {
      await protocolService.togglePublicStatus(id, !currentStatus);
      await loadData(ORG_ID, user.id);
    } catch (err) {
      alert("Fehler beim Ändern der Sichtbarkeit");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Möchtest du das Protokoll "${title}" wirklich unwiderruflich löschen?`)) return;
    try {
      await protocolService.deleteProtocol(id);
      await loadData(ORG_ID, user.id);
    } catch (err) {
      alert("Fehler beim Löschen des Protokolls");
      console.error(err);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 font-sans">Prüfe Anmeldung...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* User Header */}
      <div className="flex justify-between items-center mb-10 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold leading-none">Angemeldet als</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          Abmelden
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-900 font-sans">AJV Protokoll-Manager</h1>

      {/* Eingabeformular */}
      <form onSubmit={handleCreate} className="mb-10 flex gap-2">
        <input
          type="text"
          placeholder="Neues Protokoll (privat)..."
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isCreating}
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-400"
          disabled={isCreating || !newTitle.trim()}
        >
          {isCreating ? '...' : 'Erstellen'}
        </button>
      </form>

      {/* Protokollliste */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">Deine & geteilte Protokolle</h2>
        {loading ? (
          <p className="text-gray-500 italic">Lade Daten...</p>
        ) : protocols.length === 0 ? (
          <p className="text-gray-400 italic">Keine Protokolle vorhanden.</p>
        ) : (
          protocols.map((p) => (
            <div key={p.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center group hover:border-blue-300 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg text-gray-900">{p.title}</span>
                  {p.is_public ? (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Team</span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">Privat</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {p.date ? new Date(p.date).toLocaleDateString('de-DE') : 'Kein Datum'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {/* Sichtbarkeit umschalten: Nur der Besitzer (user_id) darf das */}
                {p.user_id === user.id && (
                  <button 
                    onClick={() => handleTogglePublic(p.id, p.is_public)}
                    className="px-3 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={p.is_public ? "Privat machen" : "Für Team freigeben"}
                  >
                    {p.is_public ? '👥' : '🔒'}
                  </button>
                )}
                
                <button 
                  onClick={() => handleDelete(p.id, p.title)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Löschen"
                >
                  🗑️
                </button>
                <Link 
                  href={`/protocol/${p.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
                >
                  Öffnen
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}