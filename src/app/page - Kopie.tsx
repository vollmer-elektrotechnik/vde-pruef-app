'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../services/protocolService';
import { createClient } from './../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const ORG_ID = "4bab2241-2309-435c-a003-455ad4a5b1dc";
  const ADMIN_EMAIL = "julianvollmer@live.de";

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
        loadInitialData(session.user.id);
      }
    };
    checkUser();
  }, [supabase, router]);

  async function loadInitialData(userId: string) {
    setLoading(true);
    try {
      const [protoData, tempData, profileData] = await Promise.all([
        protocolService.getAllProtocols(ORG_ID, userId),
        protocolService.getTemplates(ORG_ID),
        protocolService.getProfile(userId)
      ]);
      setProtocols(protoData || []);
      setTemplates(tempData || []);
      if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);
    } catch (err: any) {
      console.error("Fehler beim Laden:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    try {
      const newUrl = await protocolService.updateAvatar(user.id, file);
      setAvatarUrl(newUrl);
    } catch (err) {
      alert("Upload fehlgeschlagen");
    }
  }

  async function handleSeedTemplates() {
    if (user?.email !== ADMIN_EMAIL) return;
    if (!confirm("Standard-Vorlagen jetzt laden?")) return;
    
    try {
      await protocolService.seedDefaultTemplates(ORG_ID);
      const tempData = await protocolService.getTemplates(ORG_ID);
      setTemplates(tempData || []);
      alert("Vorlagen geladen!");
    } catch (err) {
      alert("Fehler beim Laden");
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
      if (selectedTemplate) {
        await protocolService.createFromTemplate(newTitle, ORG_ID, user.id, selectedTemplate);
      } else {
        await protocolService.createProtocol(newTitle, ORG_ID, user.id);
      }
      setNewTitle('');
      setSelectedTemplate('');
      await loadInitialData(user.id);
    } catch (err) {
      alert("Fehler beim Erstellen");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleTogglePublic(id: string, currentStatus: boolean) {
    try {
      await protocolService.togglePublicStatus(id, !currentStatus);
      await loadInitialData(user.id);
    } catch (err) {
      alert("Fehler beim Ändern");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Protokoll "${title}" löschen?`)) return;
    try {
      await protocolService.deleteProtocol(id);
      await loadInitialData(user.id);
    } catch (err) {
      alert("Fehler beim Löschen");
    }
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Prüfe Anmeldung...</div>;

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <label className="cursor-pointer">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" alt="Avatar" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition-opacity">
                Edit
              </div>
            </label>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold leading-none">Angemeldet als</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/templates" 
            className="text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            ⚙️ Vorlagen verwalten
          </Link>
          <div className="flex flex-col items-end">
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
              Abmelden
            </button>
            <button 
              onClick={handleSeedTemplates} 
              disabled={!isAdmin}
              className={`text-[10px] px-2 underline transition-colors ${
                isAdmin ? 'text-gray-400 hover:text-gray-600' : 'text-gray-200 cursor-not-allowed'
              }`}
            >
              Vorlagen laden
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-900">Protokoll-Manager</h1>

      {/* Formular */}
      <form onSubmit={handleCreate} className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Projekt- / Kundenname</label>
          <input
            type="text"
            placeholder="z.B. Müller - Wallbox"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={isCreating}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Vorlage auswählen (optional)</label>
          <select 
            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 cursor-pointer"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">-- Leeres Protokoll --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-400"
          disabled={isCreating || !newTitle.trim()}
        >
          {isCreating ? 'Wird erstellt...' : 'Protokoll erstellen'}
        </button>
      </form>

      {/* Liste */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">Vergangene Protokolle</h2>
        {loading ? (
          <p className="text-gray-500 italic">Lade Daten...</p>
        ) : protocols.length === 0 ? (
          <p className="text-gray-400 italic text-center py-10">Noch keine Protokolle vorhanden.</p>
        ) : (
          protocols.map((p) => (
            <div key={p.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center group hover:border-blue-300 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg text-gray-900">{p.title}</span>
                  {p.is_public ? (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Team</span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Privat</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {p.date ? new Date(p.date).toLocaleDateString('de-DE') : 'Kein Datum'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {p.user_id === user.id && (
                  <button onClick={() => handleTogglePublic(p.id, p.is_public)} className="px-3 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    {p.is_public ? '👥' : '🔒'}
                  </button>
                )}
                <button onClick={() => handleDelete(p.id, p.title)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  🗑️
                </button>
                <Link href={`/protocol/${p.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">
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