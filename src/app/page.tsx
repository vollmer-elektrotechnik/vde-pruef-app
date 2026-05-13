'use client';
import { useEffect, useState } from 'react';
import { protocolService } from '../services/protocolService';
import Link from 'next/link';

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Deine Organisations-ID für die AJV Elektro GmbH
  const ORG_ID = "4bab2241-2309-435c-a003-455ad4a5b1dc";

  async function loadData() {
    setLoading(true);
    try {
      const data = await protocolService.getAllProtocols();
      setProtocols(data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Protokolle:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await protocolService.createProtocol(newTitle, ORG_ID);
      setNewTitle('');
      await loadData();
    } catch (err) {
      alert("Fehler beim Erstellen des Protokolls");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Möchtest du das Protokoll "${title}" wirklich unwiderruflich löschen?`)) return;
    try {
      // Nutzt jetzt die korrekt implementierte Funktion im Service
      await protocolService.deleteProtocol(id);
      await loadData();
    } catch (err) {
      alert("Fehler beim Löschen des Protokolls");
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 font-sans">Protokoll-Verwaltung</h1>

      {/* Formular zum Erstellen neuer Protokolle */}
      <form onSubmit={handleCreate} className="mb-10 flex gap-2">
        <input
          type="text"
          placeholder="Titel der neuen Besprechung/Prüfung..."
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

      {/* Liste der vorhandenen Protokolle */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">Vergangene Protokolle</h2>
        {loading ? (
          <p className="text-gray-500 italic">Lade Daten...</p>
        ) : protocols.length === 0 ? (
          <p className="text-gray-400 italic">Keine Protokolle vorhanden.</p>
        ) : (
          protocols.map((p) => (
            <div key={p.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center group hover:border-blue-300 transition-all">
              <div>
                <span className="font-medium text-lg text-gray-900 block">{p.title}</span>
                <span className="text-sm text-gray-500">
                  {p.date ? new Date(p.date).toLocaleDateString('de-DE') : 'Kein Datum'}
                </span>
              </div>
              <div className="flex gap-2">
                {/* Lösch-Button: Sichtbar bei Hover über der Zeile */}
                <button 
                  onClick={() => handleDelete(p.id, p.title)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Protokoll löschen"
                >
                  🗑️
                </button>
                <Link 
                  href={`/protocol/${p.id}`}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-all"
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
