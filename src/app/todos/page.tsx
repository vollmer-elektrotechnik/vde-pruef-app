'use client';
import { useState, useEffect } from 'react';
import { Trash2, CheckCircle, Circle, Loader2, Link as LinkIcon, CornerDownRight, ChevronDown, ChevronRight, X, Edit2, Lock, Users } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function TodosPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [todos, setTodos] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [subTaskInput, setSubTaskInput] = useState<Record<string, string>>({});
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedMain, setExpandedMain] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { 
    fetchData(); 
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) throw new Error("Profil nicht gefunden");
      setUserOrgId(profile.organization_id);

      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*, protocols!left(id, title), profiles!left(full_name)')
        .eq('organization_id', profile.organization_id)
        .or(`is_private.eq.false,owner_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
        
      if (todosError) throw todosError;
      setTodos(todosData || []);

      const { data: protoData } = await supabase
        .from('protocols')
        .select('id, title')
        .or(`is_public.eq.true,user_id.eq.${user.id}`);
      setProtocols(protoData || []);

    } catch (err) {
      console.error("Detaillierter Fehler:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }

  const addTodo = async (parentId: string | null = null, parentIsPrivate: boolean = false) => {
    const taskValue = parentId ? subTaskInput[parentId] : newTask;
    if (!taskValue?.trim() || !userOrgId) return;
    const { data, error } = await supabase.from('todos').insert([{ 
        task: taskValue, owner_id: currentUserId, organization_id: userOrgId, parent_id: parentId, 
        protocol_id: parentId ? null : (selectedProtocol || null), is_private: parentId ? parentIsPrivate : isPrivate 
    }]).select('*, profiles!owner_id(full_name)').single();
    if (!error && data) {
      setTodos([...todos, data]);
      parentId ? setSubTaskInput({...subTaskInput, [parentId]: ''}) : (setNewTask(''), setIsPrivate(false));
    }
  };

  const togglePrivacy = async (todo: any) => {
    if (todo.owner_id !== currentUserId) return;
    const newStatus = !todo.is_private;
    await supabase.from('todos').update({ is_private: newStatus }).eq('id', todo.id);
    await supabase.from('todos').update({ is_private: newStatus }).eq('parent_id', todo.id);
    setTodos(todos.map(t => (t.id === todo.id || t.parent_id === todo.id) ? { ...t, is_private: newStatus } : t));
  };

  const toggleTodo = async (todo: any) => {
    const { error } = await supabase.from('todos').update({ is_completed: !todo.is_completed }).eq('id', todo.id);
    if (!error) setTodos(todos.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
  };

  const deleteTodo = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTodos(todos.filter(t => t.id !== id && t.parent_id !== id));
  };

  const updateTodo = async (id: string, text: string) => {
    const { error } = await supabase.from('todos').update({ task: text }).eq('id', id);
    if (!error) { setTodos(todos.map(t => t.id === id ? { ...t, task: text } : t)); setEditingId(null); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-black mb-8 text-gray-900">Aufgaben & Aufträge</h1>
      <div className="bg-white p-5 rounded-2xl border shadow-sm mb-8 space-y-4">
        <input className="w-full bg-transparent outline-none text-lg font-medium" placeholder="Was muss erledigt werden?" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
        <div className="flex flex-wrap items-center gap-4">
          <select className="w-full sm:w-auto sm:flex-1 bg-gray-50 text-sm p-2 rounded-xl border border-gray-100 truncate" onChange={(e) => setSelectedProtocol(e.target.value)}>
            <option value="">Kein Protokoll verknüpft</option>
            {protocols.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 cursor-pointer hover:text-blue-600">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            <Lock size={14}/> {isPrivate ? 'Privat' : 'Öffentlich'}
          </label>
          <button onClick={() => addTodo()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Hinzufügen</button>
        </div>
      </div>
      <div className="space-y-4">
        {loading ? <div className="text-center py-10"><Loader2 className="animate-spin inline text-blue-600" /></div> : (
          todos.filter(t => !t.parent_id).map(main => (
            <div key={main.id} className="bg-white border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedMain({...expandedMain, [main.id]: !expandedMain[main.id]})}>
                    {expandedMain[main.id] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  </button>
                  <div onClick={() => toggleTodo(main)} className="cursor-pointer">
                    {main.is_completed ? <CheckCircle className="text-green-500" /> : <Circle className="text-gray-300" />}
                  </div>
                  <div className="flex flex-col">
                    {editingId === main.id ? <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => updateTodo(main.id, editValue)} className="border-b outline-none font-bold" /> : <span className="font-bold">{main.task}</span>}
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{main.profiles?.full_name}</span>
                  </div>
                  {main.owner_id === currentUserId && (
                    <button onClick={() => togglePrivacy(main)} className={`p-1 rounded-full transition-colors ${main.is_private ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                      {main.is_private ? <Lock size={16} /> : <Users size={16} />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {setEditingId(main.id); setEditValue(main.task)}}><Edit2 size={16} className="text-gray-400 hover:text-blue-500"/></button>
                  <button onClick={() => deleteTodo(main.id)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                  {main.protocol_id && <a href={`/protocols/protocol/${main.protocol_id}`}><LinkIcon size={16} className="text-blue-500 ml-2" /></a>}
                </div>
              </div>
              {expandedMain[main.id] && (
                <div className="ml-10 mt-4 space-y-2 border-l-2 pl-4">
                  {todos.filter(s => s.parent_id === main.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div onClick={() => toggleTodo(sub)} className="cursor-pointer">{sub.is_completed ? <CheckCircle size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-300" />}</div>
                        <span className="text-sm">{sub.task}</span>
                      </div>
                      <button onClick={() => deleteTodo(sub.id)}><X size={14} className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2">
                    <CornerDownRight size={16} className="text-gray-300" />
                    <input placeholder="Unteraufgabe..." className="flex-1 text-sm bg-transparent outline-none" value={subTaskInput[main.id] || ''} onChange={(e) => setSubTaskInput({...subTaskInput, [main.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addTodo(main.id, main.is_private)} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}