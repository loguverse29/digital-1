import React, { useState } from 'react';
import { InvestigationCase, Evidence, ChainOfCustodyRecord, InvestigationActivity, User } from '../types';
import { FileText, FileDown, CheckCircle2, ShieldCheck, Printer, Clock, Lock } from 'lucide-react';
import { generateForensicPdfDossier } from '../services/forensicsEngine';

interface ReportsViewProps {
  cases: InvestigationCase[];
  evidence: Evidence[];
  custody: ChainOfCustodyRecord[];
  activities: InvestigationActivity[];
  currentUser: User;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  cases,
  evidence,
  custody,
  activities,
  currentUser,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<number>(cases[0]?.id || 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const selectedCase = cases.find((c) => c.id === Number(selectedCaseId)) || cases[0];
  const caseEvidence = selectedCase ? evidence.filter((e) => e.caseId === selectedCase.id) : [];
  const caseCustody = selectedCase ? custody.filter((c) => c.caseId === selectedCase.id) : [];
  const caseActivities = selectedCase ? activities.filter((a) => a.caseId === selectedCase.id) : [];

  const handleGeneratePdf = () => {
    if (!selectedCase) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateForensicPdfDossier(
          selectedCase,
          caseEvidence,
          caseCustody,
          caseActivities,
          currentUser.fullName
        );
        setLastGeneratedAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('PDF generation failed', err);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253247] tracking-tight">
            Forensic Reports & Judicial Dossiers
          </h1>
          <p className="text-xs sm:text-sm text-[#758195] mt-0.5">
            Compile and export court-admissible forensic case files adhering to ISO/IEC 27037 standards.
          </p>
        </div>

        <button
          onClick={handleGeneratePdf}
          disabled={isGenerating || !selectedCase}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#32B8B0] hover:bg-[#299F98] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Generating Document...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Generate PDF Report</span>
            </>
          )}
        </button>
      </div>

      {/* Case Selector Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E5EBF3] shadow-xs space-y-3">
        <label className="text-xs font-bold text-[#253247] uppercase font-mono tracking-wider block">
          Select Investigation Docket
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              className="w-full bg-[#F7F9FC] text-[#253247] text-xs font-medium px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0] cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.caseName} [{c.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-[#F7F9FC] rounded-lg border border-[#E5EBF3] text-xs">
            <span className="text-[#758195]">Seized Evidence:</span>
            <span className="font-mono font-bold text-[#172B46]">{caseEvidence.length} items</span>
          </div>
        </div>

        {lastGeneratedAt && (
          <div className="flex items-center space-x-2 text-xs text-[#177346] pt-1">
            <CheckCircle2 className="w-4 h-4 text-[#177346]" />
            <span>PDF dossier generated successfully at {lastGeneratedAt}. File downloaded to local system.</span>
          </div>
        )}
      </div>

      {/* Report Preview Document */}
      {selectedCase && (
        <div className="bg-white rounded-xl border border-[#E5EBF3] p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
          {/* Document Header */}
          <div className="border-b-2 border-[#172B46] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#758195] block font-bold">
                FORENSIC EVIDENCE & INVESTIGATION DOSSIER
              </span>
              <h2 className="text-lg font-bold text-[#172B46] mt-0.5">
                Official Evidentiary Custody Report
              </h2>
              <span className="text-xs text-[#758195]">
                Jurisdiction: {selectedCase.courtJurisdiction}
              </span>
            </div>

            <div className="sm:text-right font-mono text-xs text-[#758195]">
              <div>DOCKET: <strong className="text-[#172B46]">{selectedCase.caseNumber}</strong></div>
              <div>DATE: {selectedCase.incidentDate.substring(0, 10)}</div>
              <div>STATUS: <span className="font-bold text-[#32B8B0]">{selectedCase.status}</span></div>
            </div>
          </div>

          {/* Section 1: Executive Case Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B46]">
              I. Incident Classification & Scope
            </h3>
            <div className="bg-[#F7F9FC] p-4 rounded-lg border border-[#E5EBF3] text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[#758195]">Incident Title: </span>
                  <strong className="text-[#253247]">{selectedCase.caseName}</strong>
                </div>
                <div>
                  <span className="text-[#758195]">Lead Investigator: </span>
                  <strong className="text-[#253247]">{selectedCase.assignedInvestigatorName}</strong>
                </div>
              </div>
              <p className="text-[#758195] leading-relaxed pt-1">
                {selectedCase.description}
              </p>
            </div>
          </div>

          {/* Section 2: Seized Evidence Inventory */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B46]">
              II. Seized Digital Evidence Inventory ({caseEvidence.length} Artifacts)
            </h3>
            <div className="border border-[#E5EBF3] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#758195] font-mono uppercase text-[10px] border-b border-[#E5EBF3]">
                  <tr>
                    <th className="py-2.5 px-3">Evidence ID</th>
                    <th className="py-2.5 px-3">Name & Media Type</th>
                    <th className="py-2.5 px-3">Controlled Storage</th>
                    <th className="py-2.5 px-3">Original SHA-256 Digest</th>
                    <th className="py-2.5 px-3 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EBF3]">
                  {caseEvidence.map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-2 px-3 font-mono font-semibold text-[#172B46]">{ev.evidenceNumber}</td>
                      <td className="py-2 px-3 text-[#253247] font-medium">{ev.evidenceName} [{ev.evidenceType}]</td>
                      <td className="py-2 px-3 font-mono text-[#758195]">{ev.controlledStorageIdentifier}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#253247]">{ev.originalSha256Hash.substring(0, 20)}...</td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5E8] text-[#177346]">
                          {ev.verifiedStatus === 'VERIFIED_INTACT' ? 'MATCH' : ev.verifiedStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Chain of Custody Ledger */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B46]">
              III. Sequential Chain-of-Custody Log
            </h3>
            <div className="border border-[#E5EBF3] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#758195] font-mono uppercase text-[10px] border-b border-[#E5EBF3]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Releasing → Receiving Custodian</th>
                    <th className="py-2.5 px-3 text-right">Signature Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EBF3]">
                  {caseCustody.map((coc) => (
                    <tr key={coc.id}>
                      <td className="py-2 px-3 font-mono text-[#758195]">{coc.timestamp}</td>
                      <td className="py-2 px-3 font-semibold text-[#253247]">{coc.action}</td>
                      <td className="py-2 px-3 text-[#253247]">{coc.previousCustodian} → <strong>{coc.newCustodian}</strong></td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[#177346] text-right font-bold">{coc.custodySignatureToken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attestation & Signature Footer */}
          <div className="pt-4 border-t border-[#E5EBF3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#758195]">
            <div>
              <p className="font-semibold text-[#253247]">Certification Statement:</p>
              <p className="text-[11px] leading-relaxed max-w-md mt-0.5">
                I hereby certify under penalty of perjury that the digital evidence items enumerated herein were acquired using hardware write-blockers and secured under ISO/IEC 27037:2012 protocols.
              </p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-[#E5EBF3] sm:pl-6 pt-3 sm:pt-0">
              <div className="w-48 border-b border-[#253247] mb-1"></div>
              <span className="font-semibold text-[#253247] block">{currentUser.fullName}</span>
              <span className="text-[11px] font-mono">{currentUser.role.replace('_', ' ')} · {currentUser.badgeNumber}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
