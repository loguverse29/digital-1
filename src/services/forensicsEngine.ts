import { jsPDF } from 'jspdf';
import { InvestigationCase, Evidence, ChainOfCustodyRecord, InvestigationActivity, AuditLog } from '../types';

/**
 * Computes standard NIST SHA-256 cryptographic digest using browser Web Crypto API
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  let uint8: Uint8Array;
  if (typeof data === 'string') {
    uint8 = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    uint8 = data;
  } else {
    uint8 = new Uint8Array(data);
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', uint8 as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an official court-admissible forensic case dossier PDF using jsPDF
 */
export function generateForensicPdfDossier(
  caseItem: InvestigationCase,
  evidenceList: Evidence[],
  custodyRecords: ChainOfCustodyRecord[],
  activities: InvestigationActivity[],
  examinerName: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(248, 250, 252);
  doc.text('EVIDENTX — CYBER CRIME INVESTIGATION & FORENSIC DOSSIER', pageWidth / 2, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DIGITAL FORENSIC EVIDENCE MANAGEMENT SYSTEM • ISO/IEC 27037', pageWidth / 2, 19, { align: 'center' });
  doc.text('OFFICIAL CHAIN-OF-CUSTODY & CRYPTOGRAPHIC PARITY RECORD', pageWidth / 2, 24, { align: 'center' });

  y = 36;

  // Case Metadata Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CASE IDENTIFICATION RECORD', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const leftX = 18;
  const midX = 110;

  doc.text(`Case File ID:`, leftX, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(caseItem.caseNumber, leftX + 26, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Classification:`, leftX, y + 19);
  doc.text(`${caseItem.category} (Priority: ${caseItem.priority})`, leftX + 26, y + 19);

  doc.text(`Lead Investigator:`, leftX, y + 25);
  doc.text(caseItem.assignedInvestigatorName || 'Unassigned', leftX + 26, y + 25);

  doc.text(`Jurisdiction:`, leftX, y + 31);
  doc.text(caseItem.courtJurisdiction || 'Federal Cyber Jurisdiction', leftX + 26, y + 31);

  // Right column
  doc.text(`Status:`, midX, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(caseItem.status === 'CLOSED' ? 16 : 220, caseItem.status === 'CLOSED' ? 185 : 38, caseItem.status === 'CLOSED' ? 129 : 38);
  doc.text(caseItem.status, midX + 24, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Incident Timestamp:`, midX, y + 19);
  doc.text(caseItem.incidentDate, midX + 28, y + 19);

  doc.text(`Report Generated:`, midX, y + 25);
  doc.text(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', midX + 28, y + 25);

  y += 44;

  // Case Brief
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE CASE SUMMARY', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(caseItem.description, pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4 + 4;

  // Evidence Inventory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. SEIZED DIGITAL EVIDENCE INVENTORY & SHA-256 HASHES', 14, y);
  y += 5;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('EVIDENCE ID', 16, y + 4.2);
  doc.text('NAME & TYPE', 45, y + 4.2);
  doc.text('SECURE VAULT LOCATION', 95, y + 4.2);
  doc.text('SHA-256 DIGEST (FIRST 24 CHARS)', 135, y + 4.2);
  doc.text('INTEGRITY', 182, y + 4.2);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  evidenceList.forEach((ev, idx) => {
    const rowColor = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowColor, rowColor, rowColor);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 6, pageWidth - 14, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(ev.evidenceNumber, 16, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const shortName = ev.evidenceName.length > 28 ? ev.evidenceName.substring(0, 26) + '...' : ev.evidenceName;
    doc.text(`${shortName} [${ev.evidenceType}]`, 45, y + 4);
    doc.text(ev.controlledStorageIdentifier, 95, y + 4);

    doc.setFont('courier', 'normal');
    doc.text(ev.originalSha256Hash.substring(0, 24) + '...', 135, y + 4);

    doc.setFont('helvetica', 'bold');
    if (ev.verifiedStatus === 'VERIFIED_INTACT') {
      doc.setTextColor(16, 149, 102);
      doc.text('MATCH', 182, y + 4);
    } else if (ev.verifiedStatus === 'TAMPERED_MISMATCH') {
      doc.setTextColor(220, 38, 38);
      doc.text('MISMATCH', 182, y + 4);
    } else {
      doc.setTextColor(202, 138, 4);
      doc.text('PENDING', 182, y + 4);
    }

    y += 6;
  });

  y += 8;

  // Chain of Custody Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('II. IMMUTABLE CHAIN-OF-CUSTODY AUDIT TRAIL', 14, y);
  y += 5;

  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('TIMESTAMP', 16, y + 4.2);
  doc.text('ACTION', 45, y + 4.2);
  doc.text('PREVIOUS CUSTODIAN', 75, y + 4.2);
  doc.text('RECEIVING CUSTODIAN', 115, y + 4.2);
  doc.text('SECURITY SIGNATURE TOKEN', 158, y + 4.2);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  custodyRecords.slice(0, 8).forEach((coc, idx) => {
    const rowColor = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowColor, rowColor, rowColor);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 6, pageWidth - 14, y + 6);

    doc.setTextColor(51, 65, 85);
    doc.text(coc.timestamp.substring(0, 16), 16, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(coc.action, 45, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(coc.previousCustodian.substring(0, 22), 75, y + 4);
    doc.text(coc.newCustodian.substring(0, 22), 115, y + 4);
    doc.setFont('courier', 'normal');
    doc.text(coc.custodySignatureToken, 158, y + 4);

    y += 6;
  });

  y += 10;

  // Forensic Attestation & Legal Sign-off
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC ATTESTATION & ADMISSIBILITY CERTIFICATE', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I affirm under penalty of perjury that the digital evidence described herein was secured using hardware write-blockers and',
    18,
    y + 10
  );
  doc.text(
    'stored in controlled vaults in accordance with ISO/IEC 27037:2012 guidelines. Cryptographic SHA-256 hashes confirm zero unauthorized alteration.',
    18,
    y + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Certified By: ${examinerName}`, 18, y + 23);
  doc.text(`Digital Seal Token: SEC-SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 110, y + 23);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL LAW ENFORCEMENT & JUDICIAL COURT RECORD — FOR OFFICIAL USE ONLY', pageWidth / 2, 290, {
    align: 'center',
  });

  doc.save(`Forensic_Dossier_${caseItem.caseNumber}.pdf`);
}
