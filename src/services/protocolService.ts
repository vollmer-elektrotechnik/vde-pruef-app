import { createClient } from '../lib/supabase/client';
import { AJV_DEFAULT_TEMPLATES } from '../constants/defaultTemplates';

const supabase = createClient();

export const protocolService = {
  
  // --- 1. PROFIL & AVATAR LOGIK ---

  /**
   * Lädt die Profildaten eines Benutzers (z.B. Avatar-URL).
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: Kein Eintrag vorhanden
    return data;
  },

  /**
   * Lädt ein Bild in den Storage hoch und aktualisiert die avatar_url im Profil.
   */
	async updateAvatar(userId: string, file: File) {
	  const fileExt = file.name.split('.').pop();
	  const cleanFileName = `${Date.now()}.${fileExt}`;
	  const filePath = `${userId}/${cleanFileName}`;

	  // --- HIER DAS LOGGING EINFÜGEN ---
	  console.log("DEBUG: Starte Upload-Prozess");
	  console.log("DEBUG: User-ID:", userId);
	  console.log("DEBUG: Generierter Pfad:", filePath);
	  console.log("DEBUG: Datei-Typ:", file.type);
	  // ---------------------------------

	  const { error: uploadError } = await supabase.storage
		.from('avatars')
		.upload(filePath, file, { 
		  upsert: true,
		  contentType: file.type 
		});

	  if (uploadError) {
		console.error("Storage Error Details:", uploadError);
		throw uploadError;
	  }

	  // ... restlicher Code (Public URL und Profil-Update)
	},

  // --- 2. PROTOKOLL LOGIK (PROJEKTE) ---

  async getAllProtocols(organizationId: string, userId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .or(`user_id.eq.${userId},and(organization_id.eq.${organizationId},is_public.eq.true)`)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createProtocol(title: string, organizationId: string, userId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .insert({ 
        title, 
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

  // --- 3. VORLAGEN VERWALTUNG (TEMPLATES) ---

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

    const newTemplate = await this.createEmptyTemplate(newName, orgId);

    if (oldTemplate.template_items && oldTemplate.template_items.length > 0) {
      const newItems = oldTemplate.template_items.map((item: any) => ({
        template_id: newTemplate.id,
        title: item.title,
        type: item.type,
        order_index: item.order_index
      }));
      
      const { error: itemError } = await supabase
        .from('template_items')
        .insert(newItems);
      
      if (itemError) throw itemError;
    }
    return newTemplate;
  },

  async createFromTemplate(title: string, orgId: string, userId: string, templateId: string) {
    const newProtocol = await this.createProtocol(title, orgId, userId);
    
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

  // --- 4. ITEM LOGIK (AKTIVE PRÜFPUNKTE) ---

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

  async deleteProtocolItem(itemId: string) {
    const { error } = await supabase.from('protocol_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // --- 5. INITIALISIERUNG (SEED) ---

  async seedDefaultTemplates(orgId: string) {
    for (const t of AJV_DEFAULT_TEMPLATES) {
      const { data: temp, error: tErr } = await supabase
        .from('protocol_templates')
        .insert({ name: t.name, organization_id: orgId })
        .select().single();
      
      if (!tErr && temp) {
        const items = t.items.map((it, idx) => ({ ...it, template_id: temp.id, order_index: idx }));
        await supabase.from('template_items').insert(items);
      }
    }
  }
};