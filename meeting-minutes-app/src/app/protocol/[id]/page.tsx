'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { protocolService } from '../../../services/protocolService';
import { pdfService } from '../../../services/pdfService'; // PDF Service Import

// DnD Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortierbares Element (Komponente) ---
function SortableItem({ item, index, isLocked, onToggle, onBlur, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'measure': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'visual': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'function': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-xl border transition-all ${
        isDragging ? 'shadow-2xl border-blue-400 bg-blue-50 scale-[1.02] z-50' : 
        item.is_completed ? 'bg-green-50/20 border-green-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      {/* 1. Drag & Nummer */}
      <div className="md:col-span-1 flex items-center gap-2">
        {!isLocked && (
          <div {...attributes} {...listeners} className="cursor-grab p-1 text-gray-300 hover:text-gray-500">
            ⠿
          </div>
        )}
        <span className="text-[10px] font-mono font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      </div>

      {/* 2. Checkbox */}
      <div className="md:col-span-1 flex justify-center">
        <input 
          type="checkbox" 
          checked={item.is_completed} 
          onChange={() => onToggle(item.id, item.is_completed)}
          disabled={isLocked}
          className="w-5 h-5 accent-green-600 rounded cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* 3. Titel & Typ */}
      <div className="md:col-span-5">
        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border ${getTypeStyle(item.type)}`}>
          {item.type}
        </span>
        <p className={`text-sm font-bold mt-1 ${item.is_completed ? 'text-gray-500' : 'text-gray-900'}`}>
          {item.title}
        </p>
      </div>

      {/* 4. Messwert */}
      <div className="md:col-span-4">
        <input 
          type="text"
          defaultValue={item.content}
          onBlur={(e) => onBlur(item.id, e.target.value)}
          disabled={isLocked}
          placeholder="Messwert / Ergebnis..."
          className="w-full p-2 text-xs rounded border border-gray-100 bg-gray-50/50 outline-none focus:border-blue-400 focus:bg-white transition-all"
        />
      </div>

      {/* 5. Delete */}
      <div className="md:col-span-1 text-right">
        {!isLocked && (
          <button onClick={() => onDelete(item.id)} className="text-gray-200 hover:text-red-500 transition-colors">🗑️</button>
        )}
      </div>
    </div>
  );
}

// --- Hauptseite (Page) ---
export default function ProtocolDetail() {
  const params = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('measure');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function loadDetail() {
    try {
      const data = await protocolService.getProtocolDetails(params.id as string);
      if (data && data.protocol_items) {
        // Sortierung nach order_index sicherstellen
        const sorted = data.protocol_items.sort((a: any, b: any) => a.order_index - b.order_index);
        setItems(sorted);
      }
      setProtocol(data);
    } catch (err) { 
      console.error("Fehler beim Laden:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);
      setItems(newArray);
      
      const updates = newArray.map((item, idx) => ({ id: item.id, order_index: idx }));
      await protocolService.updateItemOrder(updates);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    await protocolService.addProtocolItem(params.id as string, newItemTitle, newItemType);
    setNewItemTitle('');
    loadDetail();
  }

  async function handleContentBlur(itemId: string, content: string) {
    await protocolService.updateItemContent(itemId, content);
  }

  async function toggleItem(itemId: string, currentStatus: boolean) {
    await protocolService.updateItemStatus(itemId, !currentStatus);
    loadDetail();
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Punkt löschen?")) return;
    await protocolService.deleteProtocolItem(itemId);
    loadDetail();
  }

  // Die neue Export-Funktion
  const handleExportPDF = () => {
    if (!protocol || items.length === 0) {
      alert("Keine Daten zum Exportieren vorhanden.");
      return;
    }
    pdfService.generateProtocolPDF(protocol, items);
  };

  useEffect(() => { 
    if (params.id) loadDetail(); 
  }, [params.id]);

  if (loading) return <div className="p-12 text-center font-sans text-gray-400">Prüfprotokoll wird geladen...</div>;
  
  const isLocked = protocol?.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* HEADER BEREICH */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <button onClick={() => router.push('/')} className="text-blue-600 text-sm font-bold hover:underline mb-2 block">← Zurück</button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{protocol.title}</h1>
          <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-widest">VDE Prüfprotokoll Instanz</p>
        </div>
        {!isLocked && (
          <button 
            onClick={async () => { await protocolService.importVDETemplate(protocol.id); loadDetail(); }}
            className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            VDE-VORLAGE LADEN 📑
          </button>
        )}
      </div>

      {/* CARD BEREICH */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          
          {/* Formular zum Hinzufügen (nur wenn nicht gesperrt) */}
          {!isLocked && (
            <form onSubmit={handleAddItem} className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <select 
                className="p-2 border rounded-lg bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                value={newItemType} 
                onChange={(e) => setNewItemType(e.target.value)}
              >
                <option value="measure">📏 MESSUNG</option>
                <option value="visual">👁️ SICHTPRÜFUNG</option>
                <option value="function">⚙️ FUNKTION</option>
              </select>
              <input 
                type="text" 
                className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Neuer Prüfschritt..." 
                value={newItemTitle} 
                onChange={(e) => setNewItemTitle(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
                HINZUFÜGEN
              </button>
            </form>
          )}

          {/* Drag & Drop Liste */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    isLocked={isLocked}
                    onToggle={toggleItem}
                    onBlur={handleContentBlur}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium">Keine Daten vorhanden. Bitte Vorlage laden oder Schritte hinzufügen.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* AKTIONEN BEREICH (UNTEN) */}
      <div className="mt-8 flex justify-center flex-col items-center gap-4">
        {!isLocked ? (
          <button 
            onClick={async () => { if(confirm("Prüfung abschließen? Bearbeitung wird gesperrt.")) { await protocolService.updateProtocolStatus(protocol.id, 'completed'); loadDetail(); } }}
            className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-sm hover:bg-green-700 shadow-lg transition-all active:scale-95"
          >
            PRÜFUNG FINALISIEREN & SPERREN 🔒
          </button>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={handleExportPDF}
              className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              ALS PDF EXPORTIEREN 📄
            </button>
            <button 
              onClick={async () => { if(confirm("Protokoll wieder für Bearbeitung öffnen?")) { await protocolService.updateProtocolStatus(protocol.id, 'draft'); loadDetail(); } }}
              className="bg-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-300 transition-all"
            >
              ENTSPERREN (ADMIN)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}