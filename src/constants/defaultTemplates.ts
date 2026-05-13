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
    name: 'Übergabe - SL',
    items: [
      { title: 'Medis für Otto herrichten', type: 'visual' },
      { title: 'Hygiene-Artikel für Olga', type: 'visual' },
      { title: 'Schichtplan Sommerpause anpassen', type: 'measure' },
      { title: 'Weihnachtsfeier vorbereiten', type: 'measure' },
      { title: 'Medikamente Till', type: 'function' },
	  { title: 'Peter um 20:00 Uhr aus Einzelbetreuung rauslassen', type: 'visual' },
      { title: 'Neuzugang Steve - gefährlich', type: 'visual' },
      { title: 'Neuzugang Julian - noch gefährlicher', type: 'measure' },
      { title: 'Katze bringt unglück', type: 'measure' },
      { title: 'Patrick hat Geburtstag - "LinkzuPaypal"', type: 'function' }
    ]
  }
];