// src/constants/defaultTemplates.ts

export interface DefaultTemplateItem {
  title: string;
  type: 'visual' | 'measure' | 'function' | 'info';
}

export interface DefaultTemplate {
  name: string;
  items: DefaultTemplateItem[];
}

export const AJV_DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Steckdose installieren',
    items: [
      { title: 'Sichtprüfung: Gehäuse & Kontakte', type: 'visual' },
      { title: 'Anschluss: L, N, PE fest?', type: 'visual' },
      { title: 'Messung: Spannung & Drehfeld', type: 'measure' },
      { title: 'Messung: Schleifenimpedanz (Zs)', type: 'measure' }
    ]
  },
  {
    name: 'Herd anschließen',
    items: [
      { title: 'Anschlussdose: Zustand prüfen', type: 'visual' },
      { title: 'Zugentlastung montiert?', type: 'visual' },
      { title: 'Messung: Spannung L1-L2-L3 (400V)', type: 'measure' },
      { title: 'Messung: Durchgängigkeit Schutzleiter', type: 'measure' },
      { title: 'Funktionstest: Alle Platten/Ofen', type: 'function' }
    ]
  },
  {
    name: 'Wallbox anschließen',
    items: [
      { title: 'Sichtprüfung: Montage & Zuleitung', type: 'visual' },
      { title: 'RCD Typ B vorhanden?', type: 'visual' },
      { title: 'Messung: Isolationswiderstand', type: 'measure' },
      { title: 'Messung: Erdungswiderstand', type: 'measure' },
      { title: 'Simulation: CP/PP Signal', type: 'function' },
      { title: 'Messung: Auslösezeit RCD (tA)', type: 'measure' }
    ]
  }
];