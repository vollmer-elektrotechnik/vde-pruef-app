'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../../services/protocolService';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Interface für bessere Typisierung
interface Template {
  id: string;
  name: string;
  template_items?: any[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null); // Jetzt dynamisch
  const [isProcessing, setIsProcessing] = useState(false); 
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Holen der organization_id aus dem Profil des Nutzers
        const profile = await protocolService.getUserProfile();
        
        if (profile?.organization_id) {
          setOrgId(profile.organization_id);
          // Templates direkt mit der gefundenen ID laden
          await loadTemplates(profile.organization_id);
        } else {
          console.error("Keine Organisation für diesen Nutzer gefunden.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Fehler beim Initialisieren der Sitzung:", err);
        setLoading(false);
      }
    };

    initSession();
  }, [router]);

  async function loadTemplates(currentOrgId: string) {
    setLoading(true);
    try {
      const data = await protocolService.getTemplates(currentOrgId);
      setTemplates(data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Vorlagen");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEmpty(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateName.trim() || !orgId || isProcessing) return;

    setIsProcessing(true);
    try {
      await protocolService.createEmptyTemplate(newTemplateName, orgId);
      setNewTemplateName('');
      await loadTemplates(orgId);
    } catch (err) {
      alert("Fehler beim Erstellen");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleClone(id: string, name: string) {
    const newName = prompt("Name für die neue Kopie:", `${name} (Kopie)`);
    if (!newName || !orgId || isProcessing) return;

    setIsProcessing(true);
    try {
      await protocolService.cloneTemplate(id, newName, orgId);
      await loadTemplates(orgId);
    } catch (err) {
      alert("Fehler beim Kopieren");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Vorlage "${name}" wirklich löschen? Alle verknüpften Prüfschritte gehen verloren.`)) return;
    
    setIsProcessing(true);
    try {
      await protocolService.deleteTemplate(id);
      if (orgId) await loadTemplates(orgId);
    } catch (err) {
      alert("Fehler beim Löschen");
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600 font-medium">Lade Vorlagen...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium transition-colors">
            <span>←</span> Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Vorlagen-Verwaltung</h1>
        </div>
      </div>

      {/* Neue Vorlage anlegen */}
      <form onSubmit={handleCreateEmpty} className="mb-10 flex gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
        <input
          type="text"
          placeholder="Name für neue Vorlage (z.B. PV-Anlagen Check)"
          className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
            !newTemplateName.trim() || isProcessing || !orgId
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
          disabled={!newTemplateName.trim() || isProcessing || !orgId}
        >
          {isProcessing ? 'Wird erstellt...' : 'Neu anlegen'}
        </button>
      </form>

      {/* Liste der Vorlagen */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 italic">Keine Vorlagen gefunden. Erstelle deine erste Vorlage oben.</p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-blue-300 transition-all gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{t.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
                  {t.template_items?.length || 0} definierte Prüfschritte
                </p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleClone(t.id, t.name)}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isProcessing}
                >
                  Kopieren
                </button>
                <button 
                  onClick={() => handleDelete(t.id, t.name)}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Löschen
                </button>
                
                <Link 
                  href={`/templates/${t.id}`}
                  className={`flex-1 md:flex-none px-4 py-2 text-center text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition-all ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Bearbeiten
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}