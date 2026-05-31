'use client';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Play, 
  Loader2,
  Edit3 
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
  status?: string;
}

export default function WikiPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [artikelList, setArtikelList] = useState<WikiArtikel[]>([]);
  const [selectedArtikel, setSelectedArtikel] = useState<WikiArtikel | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoAccepted, setVideoAccepted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadWikiArticles() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('wiki_articles')
          .select('*')
          // FILTER: Nur fertiggestellte Anleitungen laden
          .eq('status', 'fertiggestellt') 
          .order('title', { ascending: true });

        if (error) throw error;

        if (data) {
          setArtikelList(data);
          if (data.length > 0) {
            setSelectedArtikel(data[0]);
          } else {
            setSelectedArtikel(null);
          }
        }
      } catch (err: any) {
        console.error('Supabase Fehler:', err.message || err);
      } finally {
        setLoading(false);
      }
    }

    loadWikiArticles();
  }, [supabase]);

  if (loading && artikelList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 gap-2 font-medium">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        Lade Wissensdatenbank...
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-600" size={28} />
            Wissensdatenbank & Wiki
          </h1>
          <p className="text-sm text-gray-500 mt-1">Interne Anleitungen, Normen-Updates und Video-Tutorials.</p>
        </div>
        
        {/* BUTTON ZUM EDITOR */}
        <Link 
          href="/wiki/editor"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-center cursor-pointer"
        >
          <Edit3 size={16} />
          Editor öffnen
        </Link>
      </div>

      {/* RECHTLICHER HINWEIS */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 mb-6 shadow-sm">
        <div className="text-red-600 bg-red-100 p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          <strong>Haftungsausschluss:</strong> Sämtliche Inhalte dienen der Dokumentation. Arbeiten an elektrischen Anlagen dürfen nur von qualifizierten Elektrofachkräften unter Beachtung von § 13 NAV durchgeführt werden.
        </p>
      </div>

      {/* RASTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* LINKS: Artikelliste */}
        <div className="space-y-2 md:col-span-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Anleitungen</p>
          
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {artikelList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-2">Keine fertiggestellten Anleitungen vorhanden.</p>
            ) : (
              artikelList.map((artikel) => {
                const isSelected = selectedArtikel?.id === artikel.id;
                return (
                  <button
                    key={artikel.id}
                    type="button"
                    onClick={() => {
                      setSelectedArtikel(artikel);
                      // Setzt die Video-Akzeptanz für alle Artikel beim Wechseln zurück
                      setVideoAccepted({});
                    }}
                    className={`w-full p-4 rounded-xl border text-left shadow-sm transition-all block outline-none cursor-pointer ${
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
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RECHTS: Inhaltsbereich */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6">
          {selectedArtikel ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    {selectedArtikel.category}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-2">{selectedArtikel.title}</h2>
                </div>
                
                <div className="text-right bg-gray-50 border border-gray-200 p-2 rounded-xl text-[11px]">
                  <p className="text-gray-500 flex items-center gap-1 justify-end">
                    <Calendar size={12} /> Geprüft
                  </p>
                  <p className="font-bold text-gray-700 mt-0.5">
                    {new Date(selectedArtikel.last_checked).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              {selectedArtikel.vde_norm && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-1 bg-blue-50/50 w-fit px-2.5 py-1 rounded-md">
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
                          <h4 className="text-white font-bold text-sm">Video aktivieren?</h4>
                          <p className="text-[11px] text-gray-300">
                            Beim Abspielen werden Cookies und Daten an YouTube übertragen.
                          </p>
                          <button
                            type="button"
                            onClick={() => setVideoAccepted(prev => ({ ...prev, [selectedArtikel.id]: true }))}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Video laden
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
              Wähle links eine Anleitung aus.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}