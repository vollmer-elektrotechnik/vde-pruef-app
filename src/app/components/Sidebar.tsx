'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { protocolService } from '../../services/protocolService';
import { ClipboardList, Clock, Home, Settings, User, LogOut, Menu, X } from 'lucide-react';

export const Sidebar = () => {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>('Lade Firma...');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: <Home size={20} />, href: '/' },
    { name: 'Protokolle', icon: <ClipboardList size={20} />, href: '/protocols' },
    { name: 'Zeiterfassung', icon: <Clock size={20} />, href: '/time-tracking' },
    { name: 'Profil', icon: <User size={20} />, href: '/profile' },
    { name: 'Einstellungen', icon: <Settings size={20} />, href: '/settings' },
  ];

  useEffect(() => {
    const fetchOrgData = async (currentUser: any) => {
      try {
        const userProfile = await protocolService.getUserProfile();
        
        if (userProfile?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', userProfile.organization_id)
            .single();

          if (orgData && !orgError) {
            setCompanyName(orgData.name);
          } else {
            setCompanyName('Keine Firma gefunden');
          }
        } else {
          setCompanyName('Keine Organisation');
        }
      } catch (err) {
        console.error("Fehler beim Laden der Organisation:", err);
        setCompanyName('Fehler beim Laden');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (!currentUser) {
        setCompanyName('Nicht angemeldet');
      } else {
        fetchOrgData(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  const userName = user?.email ? user.email.split('@')[0] : 'Manager';
  const sidebarAvatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      {/* MOBILE KOPFZEILE (Der ungenutzte Kreis wurde entfernt) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 z-40 md:hidden shadow-md">
        <span className="text-sm font-bold tracking-wide uppercase text-blue-400 truncate max-w-[200px]">
          {companyName}
        </span>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menü öffnen"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* BACKGROUND OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR COMPONENT */}
      <aside className={`
        w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between w-full">
            <Link 
              href="/profile" 
              className="flex items-center space-x-3 overflow-hidden group/avatar cursor-pointer select-none"
            >
              {sidebarAvatarUrl ? (
                <img 
                  src={sidebarAvatarUrl} 
                  alt="Profilbild" 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 shrink-0 border border-slate-700 transition-transform group-hover/avatar:scale-105"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 shrink-0 uppercase text-xl transition-transform group-hover/avatar:scale-105">
                  {userInitial}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-sm font-bold leading-none text-white truncate group-hover/avatar:text-blue-400 transition-colors">
                  {userName}
                </h1>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight block mt-1 truncate max-w-[130px]" title={companyName}>
                  {companyName}
                </span>
              </div>
            </Link>

            <div className="flex items-center space-x-1">
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Abmelden"
              >
                <LogOut size={18} />
              </button>
              
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-slate-400 hover:text-white rounded-lg md:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            let isActive = false;
            if (item.href === '/') isActive = pathname === '/';
            else if (item.href !== '#') {
              isActive = pathname.startsWith(item.href);
              if (item.name === 'Protokolle' && (pathname.startsWith('/protocols/') || pathname.startsWith('/templates'))) {
                isActive = true;
              }
            }

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`}>
                  {item.icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Status Box */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3 text-xs">
              <div className="relative">
                <div className={`w-2 h-2 ${user ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                {user && <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>}
              </div>
              <span className="text-slate-400 font-medium">
                {user ? 'System Online' : 'Nicht angemeldet'}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              v1.0.3 • Ready for Lexware
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};