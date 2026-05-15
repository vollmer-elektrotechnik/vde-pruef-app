'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { protocolService } from '../../services/protocolService';
import { User, Mail, Building2, Camera, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [organizationName, setOrganizationName] = useState<string>(''); // Initial leer
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);

        // 1. Profil laden
        const userProfile = await protocolService.getUserProfile();
        if (userProfile) {
          setProfile(userProfile);

          // 2. Organisation laden (basierend auf der ID aus deinem Screenshot)
          // Wir nutzen hier direkt die organization_id vom Profil
          if (userProfile.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', userProfile.organization_id)
              .single();
            
            if (orgData && !orgError) {
              setOrganizationName(orgData.name);
            } else {
              // Falls kein Name gefunden wurde, Fallback auf den Anzeigenamen in der UI
              setOrganizationName('Keine Organisation gefunden');
            }
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden des Profils:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [supabase, router]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setStatusMessage(null);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (authUpdateError) throw authUpdateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setStatusMessage({ type: 'success', text: 'Profilbild erfolgreich aktualisiert!' });
      router.refresh();
    } catch (error: any) {
      console.error('Upload-Fehler:', error);
      setStatusMessage({ type: 'error', text: error.message || 'Fehler beim Upload.' });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm('Möchtest du dein Profilbild wirklich löschen?')) return;
    try {
      setUploading(true);
      setStatusMessage(null);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (updateError) throw updateError;
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });
      if (authUpdateError) throw authUpdateError;
      setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      setStatusMessage({ type: 'success', text: 'Profilbild erfolgreich gelöscht.' });
      router.refresh();
    } catch (error: any) {
      console.error('Lösch-Fehler:', error);
      setStatusMessage({ type: 'error', text: error.message || 'Fehler beim Löschen.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Lade Profil...</p>
      </div>
    );
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  const userName = user?.email ? user.email.split('@')[0].toUpperCase() : 'BENUTZER';
  const currentAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">Mein Profil</h1>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
        
        {statusMessage && (
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold border ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6">
          <div className="relative group shrink-0 select-none">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
              disabled={uploading} 
            />
            
            <div className="group relative w-24 h-24 rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-blue-50 text-blue-600 flex items-center justify-center transition-all duration-300">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black uppercase">{userInitial}</span>
              )}

              {!uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 z-10 transition-all duration-300 opacity-30 group-hover:opacity-100 group-hover:bg-black/60">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95" 
                    title="Bild ändern"
                  >
                    <Camera size={20} />
                  </button>
                  {currentAvatarUrl && (
                    <button 
                      type="button" 
                      onClick={handleAvatarDelete} 
                      className="p-2 bg-red-500/60 hover:bg-red-500 text-white rounded-lg transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95" 
                      title="Bild löschen"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1 py-2">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{userName}</h2>
            <p className="text-gray-500 text-sm font-medium">
              {user?.email === 'julianvollmer@live.de' ? 'Administrator' : 'Mitarbeiter'} • {organizationName || 'Lade Firma...'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-center space-x-3 text-gray-700 font-medium">
            <Mail size={18} className="text-gray-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700 font-medium">
            <Building2 size={18} className="text-gray-400" />
            <span>Organisation ID: <code className="bg-gray-100 px-2 py-0.5 rounded-md font-mono text-xs font-bold text-gray-600">{profile?.organization_id || '[Keine ID]'}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}