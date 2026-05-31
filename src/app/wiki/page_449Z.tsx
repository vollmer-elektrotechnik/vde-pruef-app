'use client';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Play, 
  ExternalLink,
  Loader2,
  Plus,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface WikiArtikel {
  id: string;
  title: string;
  category: string;
  description: string;
  vde_norm: string;
  video_id: string;
  content: string;
  last_checked: string;
}

export default function WikiPageWithEditor() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Daten-States
  const [artikelList, setArtikelList] = useState<WikiArtikel[]>([]);
  const [selectedArtikel, setSelectedArtikel] = useState<WikiArtikel | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoAccepted, setVideoAccepted] = useState<Record<string, boolean>>({});

  // Admin / Editor States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formular-States für Erstellen/Editieren
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVdeNorm, setFormVdeNorm] = useState('');
  const [formVideoId, setFormVideoId] = useState('');
  const [formContent, setFormContent] = useState('');

  // Artikel aus Supabase laden
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
      console.error('Fehler beim Laden des Wikis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWikiArticles();
  }, [supabase]);

  // Funktion zum Akzeptieren der Video-Cookies (DSGVO)
  const handleAcceptVideo = (id: string) => {
    setVideoAccepted(prev => ({ ...prev, [id]: true }));
  };

  // Funktion: Bearbeitungsmodus starten
  const startEdit = (artikel: WikiArtikel) => {
    setIsCreatingNew(false);
    setFormId(artikel.id);
    setFormTitle(artikel.title);
    setFormCategory(artikel.category);
    setFormDescription(artikel.description);
    setFormVdeNorm(artikel.vde_norm || '');
    setFormVideoId(artikel.video_id || '');
    setFormContent(artikel.content);
    setIsEditing(true);
  };

  // Funktion: Erstellmodus starten
  const startCreate = () => {
    setIsEditing(false);
    setFormId('');
    setFormTitle('');
    setFormCategory('VDE Vorschriften');
    setFormDescription('');
    setFormVdeNorm('');
    setFormVideoId('');
    setFormContent('');
    setIsCreatingNew(true);
  };

  // Funktion: Speichern in Supabase
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
      last_checked: heute
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
      console.error('Fehler beim Speichern:', err);
      alert('Speichern fehlgeschlagen. Bitte überprüfe die Datenbank-Rechte.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && artikelList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 gap-2 font-medium">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        Lade Wissensdatenbank...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* HEADER SEKTION MIT ADMIN-TOGGLE */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-600" size={28} />
            Wissensdatenbank & Wiki
          </h1>
          <p className="text-sm text-gray-500 mt-1">Interne Anleitungen, Normen-Updates und Video-Tutorials.</p>
        </div>
        
        <button 
          onClick={() => { setIsAdmin(!isAdmin); setIsEditing(false); setIsCreatingNew(false); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
            isAdmin ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-200 text-gray-400'
          }`}
        >
          {isAdmin ? '🔒 Admin-Modus Aktiv' : '🔓 Admin-Modus simulieren'}
        </button>
      </div>

      {/* RECHTLICHER HINWEIS */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 mb-6 shadow-sm">
        <div className="text-red-600 bg-red-100 p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          <strong>Haftungsausschluss:</strong> Sämtliche Inhalte dienen ausschließlich der innerbetrieblichen Information. Arbeiten an elektrischen Anlagen dürfen nur von qualifizierten Elektrofachkräften unter Beachtung von § 13 NAV durchgeführt werden.
        </p>
      </div>

      {/* ARBEITSBEREICH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* LINKS: Artikelliste & "Neu"-Button */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Anleitungen</p>
            {isAdmin && (
              <button
                onClick={startCreate}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus size={14} /> Neu
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {artikelList.map((artikel) => {
              const isSelected = selectedArtikel?.id === artikel.id && !isCreatingNew;
              return (
                <div
                  key={artikel.id}
                  onClick={() => {
                    setSelectedArtikel(artikel);
                    setIsEditing(false);
                    setIsCreatingNew(false);
                    if (window.innerWidth < 768) {
                      document.getElementById('wiki-main-view')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none text-left shadow-sm ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900 hover:border-blue-300'
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-200' : 'text-blue-600'}`}>
                    {artikel.category}
                  </p>
                  <h3 className="font-bold text-sm mt-1 leading-tight">{artikel.title}</h3>
                  <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                    {artikel.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-[11px]">
                    <span className="opacity-80">
                      Stand: {new Date(artikel.last_checked).toLocaleDateString('de-DE')}
                    </span>
                    <ArrowRight size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECHTS: Hauptfenster (Editor ODER Ansicht) */}
        <div id="wiki-main-view" className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6">
          
          {isEditing || isCreatingNew ? (
            /* FORMULAR MODUS */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  {isCreatingNew ? 'Neuen Wiki-Eintrag anlegen' : 'Eintrag bearbeiten'}
                </h2>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setIsCreatingNew(false); }}
                  className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titel der Anleitung</label>
                  <input
                    type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    placeholder="z.B. 5 Sicherheitsregeln"
                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategorie</label>
                  <select
                    value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="VDE Vorschriften">VDE Vorschriften</option>
                    <option value="Prüfungen">Prüfungen & Messung</option>
                    <option value="Gerätekunde">Gerätekunde / Werkzeug</option>
                    <option value="Sicherheit">Arbeitssicherheit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kurzbeschreibung</label>
                <input
                  type="text" required value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  placeholder="Kurzer Teaser-Text für die Übersicht..."
                  className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">VDE-Norm Referenz (Optional)</label>
                  <input
                    type="text" value={formVdeNorm} onChange={e => setFormVdeNorm(e.target.value)}
                    placeholder="z.B. DIN VDE 0105-100"
                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">YouTube Video-ID (Optional)</label>
                  <input
                    type="text" value={formVideoId} onChange={e => setFormVideoId(e.target.value)}
                    placeholder="z.B. dQw4w9WgXcQ"
                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inhalt / Anleitung</label>
                <textarea
                  required rows={8} value={formContent} onChange={e => setFormContent(e.target.value)}
                  placeholder="Schreibe hier die ausführliche Anleitung..."
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => { setIsEditing(false); setIsCreatingNew(false); }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Änderungen speichern
                </button>
              </div>
            </form>
          ) : selectedArtikel ? (
            /* ANSICHTS MODUS */
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {selectedArtikel.category}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => startEdit(selectedArtikel)}
                        className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold px-2"
                      >
                        <Edit2 size={12} /> Bearbeiten
                      </button>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-2">{selectedArtikel.title}</h2>
                </div>
                
                <div className="text-right bg-gray-50 border border-gray-200 p-2 rounded-xl text-[11px] shrink-0">
                  <p className="text-gray-500 flex items-center gap-1 justify-end">
                    <Calendar size={12} /> Letzte Prüfung
                  </p>
                  <p className="font-bold text-gray-700 mt-0.5">
                    {new Date(selectedArtikel.last_checked).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              {selectedArtikel.vde_norm && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50/50 w-fit px-2.5 py-1 rounded-md">
                  <CheckCircle2 size={14} /> Ref: {selectedArtikel.vde_norm}
                </div>
              )}

              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-white">
                {selectedArtikel.content}
              </div>

              {selectedArtikel.video_id && (
                <>
                  <hr className="border-gray-200" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Video size={18} className="text-red-600" />
                      <h3 className="text-sm font-bold text-gray-900">Zugehöriges Praxis-Video</h3>
                    </div>

                    {!videoAccepted[selectedArtikel.id] ? (
                      <div className="w-full aspect-video rounded-xl border border-gray-200 bg-gray-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                        <div className="z-10 max-w-sm space-y-3">
                          <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                            <Play size={22} className="ml-0.5" />
                          </div>
                          <h4 className="text-white font-bold text-sm">Video laden?</h4>
                          <p className="text-[11px] text-gray-300">
                            Beim Abspielen werden Cookies und Daten an YouTube übertragen.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAcceptVideo(selectedArtikel.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                          >
                            Video aktivieren
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube-nocookie.com/embed/${selectedArtikel.video_id}?autoplay=1`}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Keine Anleitungen vorhanden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}