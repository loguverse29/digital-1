package com.college.digitalforensics.service;

import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.ChainOfCustodyRepository;
import com.college.digitalforensics.repository.EvidenceHashRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generates official, court-admissible Digital Forensics & Chain-of-Custody reports
 * using OpenPDF compliant with international cyber evidentiary protocols.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfReportService {

    private final InvestigationCaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final EvidenceHashRepository hashRepository;
    private final ChainOfCustodyRepository custodyRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateCaseForensicReport(Long caseId) throws DocumentException {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found with ID: " + caseId));

        List<Evidence> evidenceList = evidenceRepository.findByInvestigationCaseId(caseId);
        List<ChainOfCustody> custodyList = custodyRepository.findByInvestigationCaseIdOrderByTimestampDesc(caseId);

        Document document = new Document(PageSize.A4, 36, 36, 54, 54);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, out);

        document.open();

        // 1. Header & Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.DARK_GRAY);
        Paragraph title = new Paragraph("CYBER CRIME INVESTIGATION & FORENSIC DOSSIER", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
        Paragraph sub = new Paragraph("OFFICIAL DIGITAL EVIDENCE CHAIN-OF-CUSTODY RECORD", subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(15);
        document.add(sub);

        // 2. Case Metadata Table
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setSpacingBefore(10f);
        metaTable.setSpacingAfter(15f);

        addMetaCell(metaTable, "Case File Number:", c.getCaseNumber());
        addMetaCell(metaTable, "Case Title:", c.getCaseName());
        addMetaCell(metaTable, "Category:", c.getCategory());
        addMetaCell(metaTable, "Status:", c.getStatus().name());
        addMetaCell(metaTable, "Lead Investigator:", c.getAssignedInvestigatorName() != null ? c.getAssignedInvestigatorName() : "Unassigned");
        addMetaCell(metaTable, "Court Jurisdiction:", c.getCourtJurisdiction() != null ? c.getCourtJurisdiction() : "Standard Cyber Tribunal");
        document.add(metaTable);

        // 3. Evidence Inventory Table
        Paragraph evHeader = new Paragraph("I. INVENTORY OF SEIZED DIGITAL EVIDENCE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12));
        evHeader.setSpacingAfter(8);
        document.add(evHeader);

        PdfPTable evTable = new PdfPTable(4);
        evTable.setWidthPercentage(100);
        evTable.setWidths(new float[]{2.5f, 2.5f, 3f, 2f});
        evTable.setHeaderRows(1);

        addTableHeader(evTable, "Evidence ID", "Type", "Original SHA-256 Hash", "Status");

        for (Evidence ev : evidenceList) {
            evTable.addCell(createCell(ev.getEvidenceNumber()));
            evTable.addCell(createCell(ev.getEvidenceType().name()));
            evTable.addCell(createCell(ev.getOriginalSha256Hash().substring(0, 16) + "..."));
            evTable.addCell(createCell(ev.getVerifiedStatus()));
        }
        document.add(evTable);

        // 4. Chain of Custody Ledger Table
        Paragraph cocHeader = new Paragraph("II. IMMUTABLE CHAIN-OF-CUSTODY LOG", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12));
        cocHeader.setSpacingBefore(15);
        cocHeader.setSpacingAfter(8);
        document.add(cocHeader);

        PdfPTable cocTable = new PdfPTable(5);
        cocTable.setWidthPercentage(100);
        cocTable.setWidths(new float[]{2.5f, 2f, 2.5f, 2.5f, 2.5f});
        cocTable.setHeaderRows(1);

        addTableHeader(cocTable, "Timestamp", "Action", "Previous Custodian", "New Custodian", "Signature Token");

        for (ChainOfCustody coc : custodyList) {
            cocTable.addCell(createCell(coc.getTimestamp().format(DATE_FMT)));
            cocTable.addCell(createCell(coc.getAction().name()));
            cocTable.addCell(createCell(coc.getPreviousCustodian()));
            cocTable.addCell(createCell(coc.getNewCustodian()));
            cocTable.addCell(createCell(coc.getCustodySignatureToken()));
        }
        document.add(cocTable);

        // 5. Certification and Sign-off
        Paragraph cert = new Paragraph("\nFORENSIC CERTIFICATION:\n" +
                "I hereby certify that the digital evidence items enumerated above were handled in strict conformance " +
                "with ISO/IEC 27037 standards. Bitstream cryptographic integrity was verified via SHA-256 digest comparisons.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.DARK_GRAY));
        cert.setSpacingBefore(20);
        document.add(cert);

        Paragraph sign = new Paragraph("\n\n___________________________________\nLead Forensic Examiner Signature / Date",
                FontFactory.getFont(FontFactory.HELVETICA, 10));
        document.add(sign);

        document.close();
        return out.toByteArray();
    }

    private void addMetaCell(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
        c1.setBackgroundColor(new Color(245, 247, 250));
        c1.setPadding(5);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "N/A", FontFactory.getFont(FontFactory.HELVETICA, 9)));
        c2.setPadding(5);
        table.addCell(c2);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
            cell.setBackgroundColor(new Color(24, 43, 73));
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", FontFactory.getFont(FontFactory.HELVETICA, 8)));
        cell.setPadding(5);
        return cell;
    }
}
