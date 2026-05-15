import { createClient } from '../lib/supabase/client';
import { AJV_DEFAULT_TEMPLATES } from '../constants/defaultTemplates';

const supabase = createClient();

export const protocolService = {
  
  // --- 1. PROFIL & AUTH LOGIK ---

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; 
    return data;
  },

  async getUserProfile() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      // Korrektur: select('*') statt eingeschränkter Spaltenwahl, 
      // damit avatar_url und andere Felder für die UI verfügbar sind.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error("Profil konnte nicht geladen werden:", error.message);
        }
        return null;
      }
      return data;
    } catch (err) {
      console.error("Unerwarteter Fehler in getUserProfile:", err);
      return null;
    }
  },

  async updateAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl; 
  },

  // --- 2. DYNAMISCHE KATEGORIEN (CUSTOM CATEGORIES) ---

  async getCustomCategories(orgId: string) {
    const { data, error } = await supabase
      .from('protocol_categories')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async addCustomCategory(orgId: string, name: string, baseType: 'visual' | 'measure' | 'check') {
    const value = name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { data, error } = await supabase
      .from('protocol_categories')
      .insert([{ organization_id: orgId, name, value, base_type: baseType }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCustomCategory(id: string) {
    const { error } = await supabase
      .from('protocol_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- 3. PROTOKOLL LOGIK ---

  async getAllProtocols(organizationId: string, userId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createProtocol(title: string, organizationId: string, userId: string) {
    const { data: existing } = await supabase
      .from('protocols')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('title', title.trim())
      .maybeSingle();

    if (existing) {
      throw new Error(`Ein Protokoll mit dem Namen "${title}" existiert bereits.`);
    }

    const { data, error } = await supabase
      .from('protocols')
      .insert({ 
        title: title.trim(), 
        organization_id: organizationId, 
        user_id: userId,
        status: 'draft',
        is_public: false, 
        date: new Date().toISOString() 
      })
      .select().single();
    
    if (error) throw error;
    return data;
  },

  async getProtocolDetails(protocolId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .select(`*, protocol_items (*)`)
      .eq('id', protocolId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProtocolStatus(protocolId: string, status: 'draft' | 'completed') {
    const { data, error } = await supabase
      .from('protocols')
      .update({ status: status })
      .eq('id', protocolId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProtocol(protocolId: string) {
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', protocolId);
    if (error) throw error;
  },

  async togglePublicStatus(protocolId: string, isPublic: boolean) {
    const { data, error } = await supabase
      .from('protocols')
      .update({ is_public: isPublic })
      .eq('id', protocolId)
      .select().single();
    if (error) throw error;
    return data;
  },

  // --- 4. VORLAGEN VERWALTUNG (TEMPLATES) ---

  async getTemplates(orgId: string) {
    const { data, error } = await supabase
      .from('protocol_templates')
      .select('*, template_items(*)')
      .eq('organization_id', orgId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createEmptyTemplate(name: string, orgId: string) {
    const { data, error } = await supabase
      .from('protocol_templates')
      .insert({ name, organization_id: orgId })
      .select().single();
    if (error) throw error;
    return data;
  },

  async deleteTemplate(templateId: string) {
    const { error } = await supabase
      .from('protocol_templates')
      .delete()
      .eq('id', templateId);
    if (error) throw error;
  },

  async cloneTemplate(templateId: string, newName: string, orgId: string) {
    const { data: oldTemplate, error: loadError } = await supabase
      .from('protocol_templates')
      .select('*, template_items(*)')
      .eq('id', templateId)
      .single();

    if (loadError || !oldTemplate) throw new Error("Vorlage nicht gefunden");

    const newTemplate = await protocolService.createEmptyTemplate(newName, orgId);

    if (oldTemplate.template_items && oldTemplate.template_items.length > 0) {
      const newItems = oldTemplate.template_items.map((item: any) => ({
        template_id: newTemplate.id,
        title: item.title,
        type: item.type,
        order_index: item.order_index
      }));
      const { error: itemError } = await supabase.from('template_items').insert(newItems);
      if (itemError) throw itemError;
    }
    return newTemplate;
  },

  async createFromTemplate(title: string, orgId: string, userId: string, templateId: string) {
    const newProtocol = await protocolService.createProtocol(title, orgId, userId);
    
    const { data: templateItems, error } = await supabase
      .from('template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index');

    if (error) throw error;

    if (templateItems && templateItems.length > 0) {
      const itemsToInsert = templateItems.map(item => ({
        protocol_id: newProtocol.id,
        title: item.title,
        type: item.type,
        is_completed: false,
        content: '',
        order_index: item.order_index
      }));
      await supabase.from('protocol_items').insert(itemsToInsert);
    }
    return newProtocol;
  },

  async importVDETemplate(protocolId: string) {
    const vdeTemplate = AJV_DEFAULT_TEMPLATES.find(t => t.name.includes('VDE'));
    if (!vdeTemplate) throw new Error("VDE-Standardvorlage nicht gefunden.");

    const itemsToInsert = vdeTemplate.items.map((item, idx) => ({
      protocol_id: protocolId,
      title: item.title,
      type: item.type,
      is_completed: false,
      content: '',
      order_index: idx
    }));

    const { error } = await supabase.from('protocol_items').insert(itemsToInsert);
    if (error) throw error;
    return { success: true };
  },

  // --- 5. TEMPLATE ITEM LOGIK (EDITOR) ---

  async addTemplateItem(templateId: string, title: string, type: string = 'visual') {
    const { data: items } = await supabase
      .from('template_items')
      .select('order_index')
      .eq('template_id', templateId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextIndex = items && items.length > 0 ? (items[0].order_index + 1) : 0;

    const { data, error } = await supabase
      .from('template_items')
      .insert({ template_id: templateId, title, type, order_index: nextIndex })
      .select().single();
      
    if (error) throw error;
    return data;
  },

  async updateTemplateItem(itemId: string, updates: { title?: string, type?: string }) {
    const { error } = await supabase
      .from('template_items')
      .update(updates)
      .eq('id', itemId);
    if (error) throw error;
  },

  async deleteTemplateItem(itemId: string) {
    const { error } = await supabase.from('template_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  async updateTemplateItemOrder(updates: { id: string, order_index: number }[]) {
    const promises = updates.map(u => 
      supabase.from('template_items').update({ order_index: u.order_index }).eq('id', u.id)
    );
    const results = await Promise.all(promises);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;
  },

  // --- 6. AKTIVE PROTOKOLL-ITEM LOGIK ---

  async addProtocolItem(protocolId: string, title: string, type: string = 'info', content: string = '') {
    const { data: items } = await supabase
      .from('protocol_items')
      .select('order_index')
      .eq('protocol_id', protocolId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextIndex = items && items.length > 0 ? (items[0].order_index + 1) : 0;

    const { data, error } = await supabase
      .from('protocol_items')
      .insert({
        protocol_id: protocolId,
        title,
        type,
        is_completed: false,
        content,
        order_index: nextIndex
      })
      .select();
    if (error) throw error;
    return data;
  },

  async updateItemStatus(itemId: string, isCompleted: boolean) {
    const { error } = await supabase.from('protocol_items').update({ is_completed: isCompleted }).eq('id', itemId);
    if (error) throw error;
  },

  async updateItemContent(itemId: string, content: string) {
    const { error } = await supabase.from('protocol_items').update({ content }).eq('id', itemId);
    if (error) throw error;
  },

  async updateItemOrder(updates: { id: string, order_index: number }[]) {
    const promises = updates.map(update => 
      supabase.from('protocol_items').update({ order_index: update.order_index }).eq('id', update.id)
    );
    const results = await Promise.all(promises);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;
  },

  async deleteProtocolItem(itemId: string) {
    const { error } = await supabase.from('protocol_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // --- 7. INITIALISIERUNG (SEED) ---

  async seedDefaultTemplates(orgId: string) {
    for (const t of AJV_DEFAULT_TEMPLATES) {
      const { data: temp, error: tErr } = await supabase
        .from('protocol_templates')
        .insert({ name: t.name, organization_id: orgId })
        .select().single();
      
      if (!tErr && temp) {
        const items = t.items.map((it, idx) => ({ 
            template_id: temp.id, 
            title: it.title,
            type: it.type,
            order_index: idx 
        }));
        await supabase.from('template_items').insert(items);
      }
    }
  }
};