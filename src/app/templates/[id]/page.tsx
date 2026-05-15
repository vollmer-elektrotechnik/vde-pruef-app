'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { protocolService } from '../../../services/protocolService';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';
import { 
  GripVertical, 
  Trash2, 
  Eye, 
  Zap, 
  Ruler, 
  ArrowLeft, 
  Plus 
} from 'lucide-react';

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

// --- Hilfsfunktion für dynamische Kategorie-Details ---
const getCategoryDetails = (type: string, customCategories: any[]) => {
  const custom = customCategories.find(c => c.value === type);
  const baseType = custom ? custom.base_type : type;

  switch (baseType) {
    case 'visual':
      return { icon: <Eye size={14} className="text-blue-500" />, label: custom?.name || 'Besichtigen', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    case 'measure':
      return { icon: <Ruler size={14} className="text-green-500" />, label: custom?.name || 'Messen', color: 'bg-green-50 text-green-600 border-green-100' };
    case 'check':
    default:
      return { icon: <Zap size={14} className="text-orange-500" />, label: custom?.name || 'Erproben', color: 'bg-orange-50 text-orange-600 border-orange-100' };
  }
};

// --- Sortierbare Komponente für Vorlagen-Items ---
// Hier wurden die Props für das Deployment typisiert
function SortableTemplateItem({ item, onBlur, onDelete, onTypeChange, customCategories }: any) {
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

  const details = getCategoryDetails(item.type, customCategories);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white border rounded-xl mb-2 transition-all ${
        isDragging ? 'shadow-lg border-blue-400 z-50 scale-[1.01]' : 'border-gray-200'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600 px-1">
        <GripVertical size={20} />
      </div>

      <div className="flex-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select
          value={item.type}
          onChange={(e) => onTypeChange(item.id, e.target.value)}
          className={`text-[10px] font-bold px-2 py-1 rounded uppercase border outline-none cursor-pointer ${details.color}`}
        >
          <optgroup label="Standard">
            <option value="visual">Besichtigen</option>
            <option value="measure">Messen</option>
            <option value="check">Erproben</option>
          </optgroup>
          {customCategories.length > 0 && (
            <optgroup label="Eigene Kategorien">
              {/* FIX: Expliziter Typ für 'cat' hinzugefügt */}
              {customCategories.map((cat: any) => (
                <option key={cat.id} value={cat.value}>{cat.name}</option>
              ))}
            </optgroup>
          )}
        </select>

        <input
          type="text"
          defaultValue={item.title}
          onBlur={(e) => onBlur(item.id, e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-gray-700 outline-none w-full"
        />
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-500 transition-colors p-2"
      >
        <Trash2 size={18} />
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
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('visual');
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
        const cats = await protocolService.getCustomCategories(profile.organization_id);
        setCustomCategories(cats);
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
      const allTemplates = await protocolService.getTemplates(currentOrgId);
      const current = allTemplates.find((t: any) => t.id === id);
      
      if (!current) {
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
    if (active && over && active.id !== over.id) {
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
      await protocolService.addTemplateItem(id as string, newItemTitle, newItemType);
      setNewItemTitle('');
      await loadTemplate(orgId);
    } catch (err) {
      alert("Fehler beim Hinzufügen");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateTitle(itemId: string, newTitle: string) {
    if (!newTitle.trim()) return;
    try {
      await protocolService.updateTemplateItem(itemId, { title: newTitle });
    } catch (err) {
      console.error("Fehler beim Updaten des Titels");
    }
  }

  async function handleTypeChange(itemId: string, newType: string) {
    try {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, type: newType } : item));
      await protocolService.updateTemplateItem(itemId, { type: newType });
    } catch (err) {
      alert("Fehler beim Ändern des Typs");
    }
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
        <Link href="/templates" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold transition-colors">
          <ArrowLeft size={16} /> Zurück zu den Vorlagen
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-4 tracking-tight">
          Vorlage: <span className="text-blue-600">{template?.name}</span>
        </h1>
        <p className="text-gray-500 text-sm">Definiere die Standard-Schritte und deren Typ für diesen Protokoll-Typ.</p>
      </div>

      <form onSubmit={handleAddItem} className="bg-white border-2 border-blue-50 p-4 rounded-2xl shadow-sm mb-10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
            placeholder="z.B. Isolationswiderstand messen"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
          />
          <select 
            value={newItemType}
            onChange={(e) => setNewItemType(e.target.value)}
            className="p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-blue-500 text-sm font-medium"
          >
            <optgroup label="Standard">
              <option value="visual">Besichtigen</option>
              <option value="measure">Messen</option>
              <option value="check">Erproben</option>
            </optgroup>
            {customCategories.length > 0 && (
              <optgroup label="Eigene Kategorien">
                {/* FIX: Expliziter Typ für 'cat' hinzugefügt */}
                {customCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.value}>{cat.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="submit"
            disabled={!newItemTitle.trim() || isProcessing || !orgId}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {isProcessing ? '...' : 'Hinzufügen'}
          </button>
        </div>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            {items.map((item) => (
              <SortableTemplateItem
                key={item.id}
                item={item}
                customCategories={customCategories}
                onBlur={handleUpdateTitle}
                onDelete={handleDeleteItem}
                onTypeChange={handleTypeChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Noch keine Schritte definiert. Nutze das Formular oben.</p>
        </div>
      )}
    </div>
  );
}