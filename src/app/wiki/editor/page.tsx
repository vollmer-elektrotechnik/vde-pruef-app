'use client';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface WikiArtikel {
  id: string;
  title: string;
  category: string;
  description: string;
  vde_norm: string;
  video_id: string;
  content: string;
  last_checked: string;
  status: string; // Hier hinzugefügt
}

export default function WikiEditorPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [artikelList, setArtikelList] = useState<WikiArtikel[]>([]);
  const [selectedArtikel, setSelectedArtikel] = useState<WikiArtikel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Form States
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('VDE Vorschriften');
  const [formDescription, setFormDescription] = useState('');
  const [formVdeNorm, setFormVdeNorm] = useState('');
  const [formVideoId, setFormVideoId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState('entwurf');

  const loadWikiArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_articles')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      if (data) {
        setArtikelList(data);
        if (data.length > 0) {
          setSelectedArtikel(prev => data.find(a => a.id === prev?.id) || data[0]);
        } else {
          setSelectedArtikel(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWikiArticles();
  }, [supabase]);

  const startEdit = (artikel: WikiArtikel) => {
    setIsCreatingNew(false);
    setFormId(artikel.id);
    setFormTitle(artikel.title);
    setFormCategory(artikel.category);
    setFormDescription(artikel.description);
    setFormVdeNorm(artikel.vde_norm || '');
    setFormVideoId(artikel.video_id || '');
    setFormContent(artikel.content);
    setFormStatus(artikel.status || 'entwurf');
    setIsEditing(true);
  };

  const startCreate = () => {
    setIsEditing(false);
    setFormId('');
    setFormTitle('');
    setFormCategory('VDE Vorschriften');
    setFormDescription('');
    setFormVdeNorm('');
    setFormVideoId('');
    setFormContent('');
    setFormStatus('entwurf'); // Standardmäßig Entwurf
    setIsCreatingNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalId = formId.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const heute = new Date().toISOString().split('T')[0];

    const artikelDaten = {
      id: finalId,
      title: formTitle,
      category: formCategory,
      description: formDescription,
      vde_norm: formVdeNorm,
      video_id: formVideoId,
      content: formContent,
      last_checked: heute,
      status: formStatus
    };

    try {
      let error;
      if (isCreatingNew) {
        const { error: insError } = await supabase.from('wiki_articles').insert([artikelDaten]);
        error = insError;
      } else {
        const { error: updError } = await supabase.from('wiki_articles').update(artikelDaten).eq('id', finalId);
        error = updError;
      }

      if (error) throw error;

      setIsEditing(false);
      setIsCreatingNew(false);
      await loadWikiArticles();
    } catch (err) {
      console.error(err);
      alert('Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  // Status-Umschalter per Schnellklick außerhalb des Formulars
  const toggleStatus = async (artikel: WikiArtikel, zielStatus: 'entwurf' | 'fertiggestellt') => {
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('wiki_articles')
        .update({ status: zielStatus })
        .eq('id', artikel.id);

      if (error) throw error;
      await loadWikiArticles();
    } catch (err) {
      console.error(err);
      alert('Statusänderung fehlgeschlagen.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading && artikelList.length === 0) {
    return <div className="p-8 text-center text-gray-400 font-medium">Lade Wiki-Verwaltung...</div>;
  }

  return (
    <div className="w-full font-sans">
      {/* ZURÜCK BUTTON & HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/wiki"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors shadow-sm cursor-pointer"
            title="Zurück zum Wiki"
          >
            <ArrowLeft size={20} />
          </Link>
          
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="text-amber-500" size={24} />
              Wiki-Verwaltung & Editor
            </h1>
            <p className="text-xs text-gray-500">Inhalte erstellen, aktualisieren oder korrigieren.</p>
          </div>
        </div>
        
        <button
          onClick={startCreate}
          className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl transition-colors shadow-sm self-start sm:self-center cursor-pointer"
        >
          <Plus size={14} /> Neue Anleitung
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* LINKS */}
        <div className="space-y-2 md:col-span-1">
          {artikelList.map((artikel) => {
            const isSelected = selectedArtikel?.id === artikel.id && !isCreatingNew;
            return (
              <button
                key={artikel.id}
                type="button"
                onClick={() => {
                  setSelectedArtikel(artikel);
                  setIsEditing(false);
                  setIsCreatingNew(false);
                }}
                className={`w-full p-3.5 rounded-xl border transition-all text-left block cursor-pointer ${
                  isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[9px] font-bold uppercase ${isSelected ? 'text-amber-100' : 'text-amber-600'}`}>{artikel.category}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    artikel.status === 'fertiggestellt' 
                      ? (isSelected ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700')
                      : (isSelected ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600')
                  }`}>
                    {artikel.status === 'fertiggestellt' ? 'Live' : 'Entwurf'}
                  </span>
                </div>
                <h3 className="font-bold text-xs mt-0.5">{artikel.title}</h3>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 text-[10px] opacity-80">
                  <span>Stand: {new Date(artikel.last_checked).toLocaleDateString('de-DE')}</span>
                  <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>

        {/* RECHTS */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          {isEditing || isCreatingNew ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold text-gray-900">{isCreatingNew ? 'Neue Anleitung' : 'Anleitung bearbeiten'}</h2>
                <button type="button" onClick={() => { setIsEditing(false); setIsCreatingNew(false); }} className="text-gray-400 cursor-pointer"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Titel</label>
                  <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Kategorie</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all cursor-pointer">
                    <option value="VDE Vorschriften">VDE Vorschriften</option>
                    <option value="Prüfungen">Prüfungen & Messung</option>
                    <option value="Gerätekunde">Gerätekunde / Werkzeug</option>
                    <option value="Sicherheit">Arbeitssicherheit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Kurzbeschreibung</label>
                  <input type="text" required value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Standard-Status beim Speichern</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all cursor-pointer">
                    <option value="entwurf">Als Entwurf belassen</option>
                    <option value="fertiggestellt">Direkt veröffentlichen (Live)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">VDE-Norm (Optional)</label>
                  <input type="text" value={formVdeNorm} onChange={e => setFormVdeNorm(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">YouTube-ID (Optional)</label>
                  <input type="text" value={formVideoId} onChange={e => setFormVideoId(e.target.value)} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Inhalt</label>
                <textarea required rows={8} value={formContent} onChange={e => setFormContent(e.target.value)} className="w-full text-xs p-2 border rounded-xl bg-gray-50 font-mono whitespace-pre-wrap outline-none" />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsEditing(false); setIsCreatingNew(false); }} className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-xl cursor-pointer">Abbrechen</button>
                <button type="submit" disabled={saving} className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Speichern
                </button>
              </div>
            </form>
          ) : selectedArtikel ? (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-start border-b pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{selectedArtikel.category}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedArtikel.status === 'fertiggestellt' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      Status: {selectedArtikel.status === 'fertiggestellt' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-1">{selectedArtikel.title}</h2>
                </div>
                
                {/* STATUS-TOGGLE BUTTONS */}
                <div className="flex items-center gap-2">
                  {selectedArtikel.status === 'fertiggestellt' ? (
                    <button 
                      disabled={statusUpdating}
                      onClick={() => toggleStatus(selectedArtikel, 'entwurf')}
                      className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                    >
                      {statusUpdating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} 
                      In Entwurf umwandeln
                    </button>
                  ) : (
                    <button 
                      disabled={statusUpdating}
                      onClick={() => toggleStatus(selectedArtikel, 'fertiggestellt')}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {statusUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} 
                      Jetzt Veröffentlichen
                    </button>
                  )}

                  <button onClick={() => startEdit(selectedArtikel)} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl cursor-pointer"><Edit2 size={12} /> Bearbeiten</button>
                </div>
              </div>
              {selectedArtikel.vde_norm && <div className="text-xs text-blue-600 bg-blue-50/50 px-2 py-1 rounded w-fit font-medium">Ref: {selectedArtikel.vde_norm}</div>}
              <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedArtikel.content}</div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-400">Wähle links einen Eintrag zum Bearbeiten oder erstelle einen neuen.</div>
          )}
        </div>
      </div>
    </div>
  );
}