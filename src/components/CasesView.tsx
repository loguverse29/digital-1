import React, { useState } from 'react';
import { InvestigationCase, Evidence, ChainOfCustodyRecord, InvestigationActivity, User, CaseStatus } from '../types';
import {
  FileText,
  Search,
  Filter,
  FileDown,
  Calendar,
  Lock,
  ChevronRight,
  User as UserIcon,
  X,
  History,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { generateForensicPdfDossier } from '../services/forensicsEngine';

interface CasesViewProps {
  cases: InvestigationCase[];
  evidence: Evidence[];
  custody: ChainOfCustodyRecord[];
  activities: InvestigationActivity[];
  currentUser: User;
  onOpenNewCase?: () => void;
  onUpdateCaseStatus: (caseId: number, newStatus: CaseStatus) => void;
  onNavigateToEvidenceItem: (evidenceId: number) => void;
}

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  evidence,
  custody,
  activities,
  currentUser,
  onOpenNewCase,
  onUpdateCaseStatus,
  onNavigateToEvidenceItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(cases.map((c) => c.category)));

  // Selected case details
  const activeCase = selectedCase ? cases.find((c) => c.id === selectedCase.id) || selectedCase : null;
  const caseEvidence = activeCase ? evidence.filter((e) => e.caseId === activeCase.id) : [];
  const caseCustody = activeCase ? custody.filter((c) => c.caseId === activeCase.id) : [];
  const caseActivities = activeCase ? activities.filter((a) => a.caseId === activeCase.id) : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>Cyber Crime Investigation Cases</span>
          </h2>
          <p className="text-xs text-slate-500">
            Case files, evidence linkage, and court-admissible forensic dossiers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Case ID, name, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400 ml-auto hidden sm:block">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      </div>

      {/* Cases Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCases.map((caseItem) => {
          const count = evidence.filter((e) => e.caseId === caseItem.id).length;
          return (
            <div
              key={caseItem.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-lg">
                    {caseItem.caseNumber}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      caseItem.status === 'OPEN'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : caseItem.status === 'IN_PROGRESS'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {caseItem.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {caseItem.caseName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {caseItem.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                        caseItem.priority === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : caseItem.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {caseItem.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {caseItem.description}
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.assignedInvestigatorName}</span>
                  </span>
                  <span className="flex items-center gap-1 text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{count} Evidences</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCase(caseItem)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      generateForensicPdfDossier(
                        caseItem,
                        evidence.filter((e) => e.caseId === caseItem.id),
                        custody.filter((c) => c.caseId === caseItem.id),
                        activities.filter((a) => a.caseId === caseItem.id),
                        currentUser.fullName
                      )
                    }
                    title="Export Official PDF Dossier"
                    className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Details Drawer / Modal */}
      {activeCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                      {activeCase.caseNumber}
                    </span>
                    <span className="text-xs text-slate-500">• {activeCase.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeCase.caseName}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    generateForensicPdfDossier(
                      activeCase,
                      caseEvidence,
                      caseCustody,
                      caseActivities,
                      currentUser.fullName
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Court PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Status and Metadata Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Investigation Status</span>
                  <div className="mt-1">
                    {currentUser.role === 'VIEWER' ? (
                      <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                        {activeCase.status} <span className="text-[10px] text-slate-400 font-normal">(Read-Only)</span>
                      </span>
                    ) : (
                      <select
                        value={activeCase.status}
                        onChange={(e) => onUpdateCaseStatus(activeCase.id, e.target.value as CaseStatus)}
                        className="bg-white text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs cursor-pointer"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Lead Investigator</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {activeCase.assignedInvestigatorName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Court Jurisdiction</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {activeCase.courtJurisdiction}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Incident Timestamp</span>
                  <span className="font-mono text-slate-700 mt-1 block">
                    {activeCase.incidentDate}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                  Incident Narrative & Forensics Scope
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  {activeCase.description}
                </p>
              </div>

              {/* Linked Evidence Locker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-teal-700 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Seized Evidence Locker ({caseEvidence.length})</span>
                  </h4>
                </div>

                {caseEvidence.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No evidence items associated with this case yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {ev.evidenceNumber}
                            </span>
                            <span className="font-semibold text-slate-900">{ev.evidenceName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">[{ev.evidenceType}]</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                            <span>SHA-256: {ev.originalSha256Hash.substring(0, 24)}...</span>
                            <span>• Locker: {ev.controlledStorageIdentifier}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                              ev.verifiedStatus === 'VERIFIED_INTACT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ev.verifiedStatus === 'TAMPERED_MISMATCH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {ev.verifiedStatus}
                          </span>

                          <button
                            onClick={() => {
                              setSelectedCase(null);
                              onNavigateToEvidenceItem(ev.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chain of Custody Records for this Case */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  <span>Chain-of-Custody Handovers ({caseCustody.length})</span>
                </h4>

                {caseCustody.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No custody transfers recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseCustody.map((coc) => (
                      <div
                        key={coc.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{coc.action}</span>
                            <span className="text-slate-500 text-[11px]">
                              {coc.previousCustodian} → <strong className="text-teal-700">{coc.newCustodian}</strong>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 italic">"{coc.remarks}"</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-teal-700 font-semibold block">{coc.custodySignatureToken}</span>
                          <span className="text-[10px] text-slate-400">{coc.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
