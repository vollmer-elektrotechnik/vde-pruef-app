import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const pdfService = {
  /**
   * Generiert ein VDE-Prüfprotokoll als PDF.
   * @param protocol Das Protokoll-Objekt (Metadaten)
   * @param items Die Liste der Prüfschritte
   * @param customCategories Die Liste der benutzerdefinierten Kategorien (optional)
   */
  generateProtocolPDF(protocol: any, items: any[], customCategories: any[] = []) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Blau (Tailwind blue-700)
    doc.text('Prüfprotokoll nach VDE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Elektrische Anlagen und Betriebsmittel', 14, 28);

    // --- Meta-Daten Box ---
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 35, pageWidth - 28, 30, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Projekt:', 20, 43);
    doc.text('Datum:', 20, 50);
    doc.text('Status:', 20, 57);

    doc.setFont('helvetica', 'normal');
    doc.text(protocol.title || 'Ohne Titel', 50, 43);
    doc.text(new Date(protocol.created_at || protocol.date).toLocaleDateString('de-DE'), 50, 50);
    doc.text(protocol.status === 'completed' ? 'ABGESCHLOSSEN' : 'ENTWURF', 50, 57);

    // --- Tabellen-Logik ---
    const tableRows = items.map((item, index) => {
      // Suche den Anzeigenamen der Kategorie
      const custom = customCategories.find(c => c.value === item.type);
      
      // Fallback-Logik für das Label
      let typeLabel = item.type; // Default (z.B. visual, measure)
      if (custom) {
        typeLabel = custom.name;
      } else {
        // Schöner machen, falls Standard-Typen
        if (item.type === 'visual') typeLabel = 'Besichtigen';
        if (item.type === 'measure') typeLabel = 'Messen';
        if (item.type === 'check' || item.type === 'function') typeLabel = 'Erproben';
      }

      return [
        (index + 1).toString().padStart(2, '0'),
        typeLabel.toUpperCase(),
        item.title,
        item.content || '---'
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Nr.', 'Art', 'Prüfschritt / Bezeichnung', 'Messwert / Ergebnis']],
      body: tableRows,
      headStyles: { 
        fillColor: [30, 64, 175], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 45, fontStyle: 'bold', halign: 'right' }
      },
      margin: { top: 75 }
    });

    // --- Unterschriften-Felder ---
    // Wir prüfen, ob auf der aktuellen Seite noch genug Platz ist
    const finalY = (doc as any).lastAutoTable.finalY + 35;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Falls finalY zu nah am unteren Rand ist, neue Seite anlegen
    const signY = finalY > pageHeight - 40 ? 40 : finalY;
    if (finalY > pageHeight - 40) doc.addPage();

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Linie links (Ort/Datum)
    doc.line(14, signY, 80, signY);
    doc.text('Ort, Datum', 14, signY + 5);

    // Linie rechts (Unterschrift)
    doc.line(110, signY, pageWidth - 14, signY);
    doc.text('Unterschrift Prüfer', 110, signY + 5);

    // --- Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Erstellt am ${new Date().toLocaleString('de-DE')} | Seite ${i} von ${totalPages}`, 
        pageWidth / 2, 
        285, 
        { align: 'center' }
      );
    }

    // --- Download ---
    const fileName = `VDE_Protokoll_${(protocol.title || 'Export').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }
};