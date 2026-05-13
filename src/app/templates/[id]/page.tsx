'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { protocolService } from '../../../services/protocolService';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';

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

// --- Sortierbare Komponente für Vorlagen-Items ---
function SortableTemplateItem({ item, onBlur, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white border rounded-xl mb-2 transition-all ${
        isDragging ? 'shadow-lg border-blue-400 z-50 scale-[1.01]' : 'border-gray-200'
      }`}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600 px-2 text-xl">
        ⠿
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-3 items-center">
        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">
          {item.type}
        </span>
        <input
          type="text"
          defaultValue={item.title}
          onBlur={(e) => onBlur(item.id, e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-gray-700 outline-none"
        />
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-500 transition-colors p-2"
      >
        🗑️
      </button>
    </div>
  );
}

// --- Hauptseite ---
export default function TemplateEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null); // Dynamisch
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const initEditor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const profile = await protocolService.getUserProfile();
      if (profile?.organization_id) {
        setOrgId(profile.organization_id);
        if (id) await loadTemplate(profile.organization_id);
      } else {
        router.push('/templates');
      }
    };
    
    initEditor();
  }, [id, router]);

  async function loadTemplate(currentOrgId: string) {
    setLoading(true);
    try {
      // Wir holen alle Templates dieser Org und suchen das passende
      const allTemplates = await protocolService.getTemplates(currentOrgId);
      const current = allTemplates.find((t: any) => t.id === id);
      
      if (!current) {
        // Falls das Template nicht existiert oder zu einer anderen Org gehört
        router.push('/templates');
        return;
      }
      
      setTemplate(current);
      const sortedItems = (current.template_items || []).sort((a: any, b: any) => a.order_index - b.order_index);
      setItems(sortedItems);
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
      await protocolService.updateTemplateItemOrder(updates);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim() || isProcessing || !orgId) return;
    setIsProcessing(true);
    try {
      await protocolService.addTemplateItem(id as string, newItemTitle, 'check');
      setNewItemTitle('');
      await loadTemplate(orgId);
    } catch (err) {
      alert("Fehler beim Hinzufügen");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateTitle(itemId: string, newTitle: string) {
    console.log("Titel Update:", itemId, newTitle);
    // Hier könnte später protocolService.updateTemplateItemTitle aufgerufen werden
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Schritt aus Vorlage entfernen?")) return;
    setIsProcessing(true);
    try {
      await protocolService.deleteTemplateItem(itemId);
      if (orgId) await loadTemplate(orgId);
    } catch (err) {
      alert("Fehler beim Löschen");
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Editor lädt...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans">
      <div className="mb-8">
        <Link href="/templates" className="text-blue-600 hover:underline text-sm font-bold">
          ← Zurück zu den Vorlagen
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-4 tracking-tight">
          Vorlage: <span className="text-blue-600">{template?.name}</span>
        </h1>
        <p className="text-gray-500 text-sm">Definiere die Standard-Schritte für diesen Protokoll-Typ.</p>
      </div>

      {/* Neuer Schritt */}
      <form onSubmit={handleAddItem} className="bg-white border-2 border-blue-50 p-4 rounded-2xl shadow-sm mb-10 flex gap-2">
        <input
          type="text"
          className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
          placeholder="z.B. Erdungswiderstand prüfen"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim() || isProcessing || !orgId}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isProcessing ? '...' : 'Hinzufügen'}
        </button>
      </form>

      {/* Liste */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="min-h-[100px]">
            {items.map((item) => (
              <SortableTemplateItem
                key={item.id}
                item={item}
                onBlur={handleUpdateTitle}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Noch keine Schritte definiert.</p>
        </div>
      )}
    </div>
  );
}