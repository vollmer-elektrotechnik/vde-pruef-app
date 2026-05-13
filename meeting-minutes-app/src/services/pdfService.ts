import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const pdfService = {
  generateProtocolPDF(protocol: any, items: any[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Blau
    doc.text('Prüfprotokoll nach VDE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Elektrische Anlagen und Betriebsmittel', 14, 28);

    // Meta-Daten Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 35, pageWidth - 28, 30, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Projekt:', 20, 43);
    doc.text('Datum:', 20, 50);
    doc.text('Status:', 20, 57);

    doc.setFont('helvetica', 'normal');
    doc.text(protocol.title, 50, 43);
    doc.text(new Date(protocol.date).toLocaleDateString('de-DE'), 50, 50);
    doc.text(protocol.status === 'completed' ? 'ABGESCHLOSSEN' : 'ENTWURF', 50, 57);

    // Tabelle der Prüfschritte
    const tableRows = items.map((item, index) => [
      (index + 1).toString().padStart(2, '0'),
      item.type.toUpperCase(),
      item.title,
      item.content || '---'
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Nr.', 'Art', 'Prüfschritt / Bezeichnung', 'Messwert / Ergebnis']],
      body: tableRows,
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 30, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 40, fontStyle: 'bold' }
      },
      margin: { top: 75 }
    });

    // Unterschriften-Felder
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.line(14, finalY, 80, finalY);
    doc.text('Ort, Datum', 14, finalY + 5);

    doc.line(110, finalY, pageWidth - 14, finalY);
    doc.text('Unterschrift Prüfer', 110, finalY + 5);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Erstellt am ${new Date().toLocaleString('de-DE')} | Seite 1`, pageWidth / 2, 285, { align: 'center' });

    // Download
    doc.save(`VDE_Protokoll_${protocol.title.replace(/\s+/g, '_')}.pdf`);
  }
};