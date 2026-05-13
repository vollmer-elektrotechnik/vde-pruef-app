'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../../services/protocolService';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const supabase = createClient();
  const router = useRouter();
  const ORG_ID = "4bab2241-2309-435c-a003-455ad4a5b1dc";

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        loadTemplates();
      }
    };
    checkUser();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await protocolService.getTemplates(ORG_ID);
      setTemplates(data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Vorlagen");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEmpty(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    try {
      await protocolService.createEmptyTemplate(newTemplateName, ORG_ID);
      setNewTemplateName('');
      loadTemplates();
    } catch (err) {
      alert("Fehler beim Erstellen");
    }
  }

  async function handleClone(id: string, name: string) {
    const newName = prompt("Name für die neue Kopie:", `${name} (Kopie)`);
    if (!newName) return;
    try {
      await protocolService.cloneTemplate(id, newName, ORG_ID);
      loadTemplates();
    } catch (err) {
      alert("Fehler beim Kopieren");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Vorlage "${name}" wirklich löschen? Alle verknüpften Prüfschritte gehen verloren.`)) return;
    try {
      await protocolService.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      alert("Fehler beim Löschen");
    }
  }

  if (loading) return <div className="p-8 text-center">Lade Vorlagen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Zurück zur Übersicht</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Vorlagen-Verwaltung</h1>
        </div>
      </div>

      {/* Neue Vorlage anlegen */}
      <form onSubmit={handleCreateEmpty} className="mb-10 flex gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <input
          type="text"
          placeholder="Name für neue Vorlage (z.B. PV-Anlagen Check)"
          className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
          disabled={!newTemplateName.trim()}
        >
          Neu anlegen
        </button>
      </form>

      {/* Liste der Vorlagen */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-gray-500 italic">Keine Vorlagen gefunden. Nutze den Seed-Button auf der Hauptseite oder erstelle eine neue.</p>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex justify-between items-center group hover:border-blue-300 transition-all">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <p className="text-sm text-gray-500">
                  {t.template_items?.length || 0} definierte Prüfschritte
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleClone(t.id, t.name)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Kopieren
                </button>
                <button 
                  onClick={() => handleDelete(t.id, t.name)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Löschen
                </button>
                {/* Platzhalter für zukünftiges Editieren der Items */}
                <button 
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => alert("Funktion zum Bearbeiten der einzelnen Schritte folgt!")}
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}