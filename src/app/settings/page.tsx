'use client';
import { useState, useEffect } from 'react';
import { Shield, Bell, Database, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
// Wir nutzen den offiziellen, schlanken Browser-Client-Creator von Supabase
import { createBrowserClient } from '@supabase/ssr';

export default function SettingsPage() {
  // Initialisiert den Client direkt inline mit deinen Umgebungsvariablen
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // UI-Zustände
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Benachrichtigungs-States (werden aus Supabase befüllt)
  const [notifProtocols, setNotifProtocols] = useState(true);
  const [notifTemplates, setNotifTemplates] = useState(false);
  const [notifCategories, setNotifCategories] = useState(false);

  // 1. Einstellungen beim Laden aus Supabase abrufen
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('notify_protocols, notify_templates, notify_categories')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setNotifProtocols(data.notify_protocols);
            setNotifTemplates(data.notify_templates);
            setNotifCategories(data.notify_categories);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  // 2. Handler für die Toggles (schreibt direkt live in Supabase)
  const toggleSetting = async (
    columnName: 'notify_protocols' | 'notify_templates' | 'notify_categories',
    currentValue: boolean,
    setter: (val: boolean) => void
  ) => {
    const newValue = !currentValue;
    setSavingKey(columnName);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .update({ [columnName]: newValue })
        .eq('id', user.id);

      if (error) throw error;
      
      setter(newValue);
    } catch (error) {
      console.error(`Fehler beim Speichern von ${columnName}:`, error);
      alert('Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-black mb-6 text-gray-900 tracking-tight">Einstellungen</h1>
      
      <div className="space-y-4">
        
        {/* 1. Sicherheit */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer shadow-sm active:bg-gray-50">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="text-gray-400 p-2.5 bg-gray-50 rounded-xl shrink-0">
              <Shield size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base">Sicherheit</p>
              <p className="text-xs text-gray-500 truncate">Passwort und Zwei-Faktor-Authentifizierung</p>
            </div>
          </div>
          <div className="text-gray-400 font-bold px-2 text-lg">→</div>
        </div>

        {/* 2. Daten-Export */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer shadow-sm active:bg-gray-50">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="text-gray-400 p-2.5 bg-gray-50 rounded-xl shrink-0">
              <Database size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base">Daten-Export</p>
              <p className="text-xs text-gray-500 truncate">Schnittstellen zu Lexware & DATEV</p>
            </div>
          </div>
          <div className="text-gray-400 font-bold px-2 text-lg">→</div>
        </div>

        {/* 3. Benachrichtigungen (Akkordeon) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
          <div 
            onClick={() => setIsBellOpen(!isBellOpen)}
            className="p-5 flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer active:bg-gray-50 select-none"
          >
            <div className="flex items-center space-x-4 min-w-0">
              <div className="text-blue-600 p-2.5 bg-blue-50 rounded-xl shrink-0">
                <Bell size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base">Benachrichtigungen</p>
                <p className="text-xs text-gray-500 truncate">E-Mail-Meldungen direkt aus der Datenbank verwalten</p>
              </div>
            </div>
            <div className="text-gray-400 px-2">
              {isBellOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {/* Untermenü für die Schalter */}
          {isBellOpen && (
            <div className="bg-gray-50/70 border-t border-gray-100 p-5 space-y-4 transition-all">
              
              {loading ? (
                <div className="flex items-center justify-center py-6 text-gray-400 gap-2 text-sm font-medium">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  Lade Einstellungen aus Supabase...
                </div>
              ) : (
                <>
                  {/* Toggle 1: Abgeschlossene Protokolle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Abgeschlossene Protokolle</p>
                      <p className="text-xs text-gray-400">Info erhalten, sobald ein Prüfprotokoll final signiert wurde.</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('notify_protocols', notifProtocols, setNotifProtocols)}
                      disabled={savingKey !== null}
                      className={`w-12 h-7 shrink-0 rounded-full transition-colors relative flex items-center outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 ${
                        notifProtocols ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${
                        notifProtocols ? 'translate-x-[22px]' : 'translate-x-1'
                      } flex items-center justify-center`} >
                        {savingKey === 'notify_protocols' && <Loader2 size={10} className="animate-spin text-gray-400" />}
                      </span>
                    </button>
                  </div>

                  <hr className="border-gray-200/60" />

                  {/* Toggle 2: Neu erstellte Vorlagen */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Neu erstellte Vorlagen</p>
                      <p className="text-xs text-gray-400">Benachrichtigung, wenn eine neue VDE-Standardvorlage bereitsteht.</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('notify_templates', notifTemplates, setNotifTemplates)}
                      disabled={savingKey !== null}
                      className={`w-12 h-7 shrink-0 rounded-full transition-colors relative flex items-center outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 ${
                        notifTemplates ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${
                        notifTemplates ? 'translate-x-[22px]' : 'translate-x-1'
                      } flex items-center justify-center`} >
                        {savingKey === 'notify_templates' && <Loader2 size={10} className="animate-spin text-gray-400" />}
                      </span>
                    </button>
                  </div>

                  <hr className="border-gray-200/60" />

                  {/* Toggle 3: Neue Kategorien */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Neue Kategorien</p>
                      <p className="text-xs text-gray-400">Meldung bei Änderungen oder neuen Sektionen im Firmen-Katalog.</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('notify_categories', notifCategories, setNotifCategories)}
                      disabled={savingKey !== null}
                      className={`w-12 h-7 shrink-0 rounded-full transition-colors relative flex items-center outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 ${
                        notifCategories ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${
                        notifCategories ? 'translate-x-[22px]' : 'translate-x-1'
                      } flex items-center justify-center`} >
                        {savingKey === 'notify_categories' && <Loader2 size={10} className="animate-spin text-gray-400" />}
                      </span>
                    </button>
                  </div>
                </>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}