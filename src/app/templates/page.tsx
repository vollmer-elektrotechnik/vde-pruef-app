'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../../services/protocolService';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Copy, Edit3, ArrowLeft, Plus, Settings2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  template_items?: any[];
}

interface CustomCategory {
  id: string;
  name: string;
  value: string;
  base_type: 'visual' | 'measure' | 'check';
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // States für neue Kategorie
  const [newCatName, setNewCatName] = useState('');
  const [newCatBaseType, setNewCatBaseType] = useState<'visual' | 'measure' | 'check'>('measure');
  
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
        const profile = await protocolService.getUserProfile();
        
        if (profile?.organization_id) {
          setOrgId(profile.organization_id);
          await Promise.all([
            loadTemplates(profile.organization_id),
            loadCategories(profile.organization_id)
          ]);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error("Fehler beim Initialisieren:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [router]);

  async function loadTemplates(currentOrgId: string) {
    const data = await protocolService.getTemplates(currentOrgId);
    setTemplates(data || []);
  }

  async function loadCategories(currentOrgId: string) {
    const cats = await protocolService.getCustomCategories(currentOrgId);
    setCustomCategories(cats || []);
  }

  // --- Vorlagen Aktionen ---
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
    if (!confirm(`Vorlage "${name}" wirklich löschen?`)) return;
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

  // --- Kategorie Aktionen ---
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim() || !orgId || isProcessing) return;
    setIsProcessing(true);
    try {
      await protocolService.addCustomCategory(orgId, newCatName, newCatBaseType);
      setNewCatName('');
      await loadCategories(orgId);
    } catch (err) {
      alert("Fehler beim Erstellen der Kategorie");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Kategorie löschen? Bestehende Vorlagen-Items mit diesem Typ bleiben erhalten, aber der Typ ist nicht mehr neu wählbar.")) return;
    try {
      await protocolService.deleteCustomCategory(id);
      if (orgId) await loadCategories(orgId);
    } catch (err) {
      alert("Fehler beim Löschen der Kategorie");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Zurück zur Übersicht
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">Vorlagen & Konfiguration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Linke Spalte: Vorlagen-Verwaltung */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-600" /> Neue Vorlage
            </h2>
            <form onSubmit={handleCreateEmpty} className="flex gap-2">
              <input
                type="text"
                placeholder="z.B. PV-Check"
                className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-all text-sm"
                disabled={!newTemplateName.trim() || isProcessing}
              >
                {isProcessing ? '...' : 'Anlegen'}
              </button>
            </form>
          </section>

          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.template_items?.length || 0} Schritte</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleClone(t.id, t.name)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Copy size={18} /></button>
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={18} /></button>
                  <Link href={`/templates/${t.id}`} className="ml-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all">Bearbeiten</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rechte Spalte: Kategorien / Typen */}
        <div className="space-y-6">
          <section className="bg-gray-900 text-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
              <Settings2 size={18} /> Eigene Kategorien
            </h2>
            
            <form onSubmit={handleAddCategory} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Name (z.B. R-ISO)"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl outline-none focus:border-blue-500 text-sm"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <select 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none"
                value={newCatBaseType}
                onChange={(e) => setNewCatBaseType(e.target.value as any)}
              >
                <option value="measure">Basis: Messen (Zahl)</option>
                <option value="visual">Basis: Besichtigen (Text)</option>
                <option value="check">Basis: Erproben (Text)</option>
              </select>
              <button 
                type="submit"
                disabled={!newCatName.trim() || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Hinzufügen
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Deine Kategorien</p>
              {customCategories.length === 0 && <p className="text-gray-600 text-xs italic">Keine eigenen Typen.</p>}
              {customCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{cat.base_type}</p>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-600 hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}