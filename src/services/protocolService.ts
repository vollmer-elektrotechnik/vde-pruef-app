import { createClient } from '../lib/supabase/client';

const supabase = createClient();

export const protocolService = {
  
  // 1. Alle Protokolle laden: Eigene ODER öffentliche der Firma
  async getAllProtocols(organizationId: string, userId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      // Die Logik: (Gehört mir) ODER (Gehört zur Firma UND ist öffentlich)
      .or(`user_id.eq.${userId},and(organization_id.eq.${organizationId},is_public.eq.true)`)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // 2. Neues Protokoll erstellen (standardmäßig PRIVAT)
  async createProtocol(title: string, organizationId: string, userId: string) {
    const { data, error } = await supabase
      .from('protocols')
      .insert({ 
        title, 
        organization_id: organizationId, 
        user_id: userId,
        status: 'draft',
        is_public: false, // Initial für niemanden sonst sichtbar
        date: new Date().toISOString() 
      })
      .select().single();
    
    if (error) throw error;
    return data;
  },

  // 3. Sichtbarkeit umschalten (Teilen mit dem Team)
  async togglePublicStatus(protocolId: string, isPublic: boolean) {
    const { data, error } = await supabase
      .from('protocols')
      .update({ is_public: isPublic })
      .eq('id', protocolId)
      .select().single();
    
    if (error) throw error;
    return data;
  },

  // --- Ab hier folgen deine bestehenden Funktionen für die Details ---

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

  async updateItemOrder(updates: { id: string, order_index: number }[]) {
    const promises = updates.map(item => 
      supabase.from('protocol_items').update({ order_index: item.order_index }).eq('id', item.id)
    );
    await Promise.all(promises);
  },

  async importVDETemplate(protocolId: string) {
    const vdeSteps = [
      { title: 'Besichtigung: Auswahl der Betriebsmittel (Beschädigung?)', type: 'visual' },
      { title: 'Besichtigung: Brandschottungen vorhanden?', type: 'visual' },
      { title: 'Messung: Durchgängigkeit der Schutzleiter (RPE)', type: 'measure' },
      { title: 'Messung: Isolationswiderstand (RISO)', type: 'measure' },
      { title: 'Messung: Schleifenimpedanz (ZS)', type: 'measure' },
      { title: 'Messung: RCD Auslösezeit (tA)', type: 'measure' },
      { title: 'Funktion: Rechtsdrehfeld an Steckdosen', type: 'function' }
    ];

    const itemsToInsert = vdeSteps.map((step, index) => ({
      protocol_id: protocolId,
      title: step.title,
      type: step.type,
      is_completed: false,
      content: '',
      order_index: index
    }));

    const { error } = await supabase.from('protocol_items').insert(itemsToInsert);
    if (error) throw error;
  },

  async updateProtocolStatus(id: string, status: 'draft' | 'completed') {
    const { data, error } = await supabase.from('protocols').update({ status }).eq('id', id).select().single();
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
  }
};