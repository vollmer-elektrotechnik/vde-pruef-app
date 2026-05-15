'use client';
import { Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black mb-8 text-gray-900">Einstellungen</h1>
      
      <div className="space-y-4">
        {[
          { icon: <Shield />, title: 'Sicherheit', desc: 'Passwort und Zwei-Faktor-Authentifizierung' },
          { icon: <Database />, title: 'Daten-Export', desc: 'Schnittstellen zu Lexware & DATEV' },
          { icon: <Bell />, title: 'Benachrichtigungen', desc: 'E-Mail Berichte nach Prüfungsabschluss' }
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="text-gray-400">{item.icon}</div>
              <div>
                <p className="font-bold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <div className="text-gray-300">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}