import React from 'react';
import { InvestigationCase, Evidence, ChainOfCustodyRecord, InvestigationActivity, User } from '../types';
import {
  Shield,
  FileText,
  Lock,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cpu,
  Radio,
  FileCheck,
  ChevronRight,
  FileDown,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { generateForensicPdfDossier } from '../services/forensicsEngine';

interface DashboardViewProps {
  cases: InvestigationCase[];
  evidence: Evidence[];
  custody: ChainOfCustodyRecord[];
  activities: InvestigationActivity[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onOpenNewCase?: () => void;
  onOpenNewEvidence?: () => void;
  onOpenTransfer: () => void;
  onOpenUserMgmt?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  evidence,
  custody,
  activities,
  currentUser,
  onNavigate,
  onOpenNewCase,
  onOpenNewEvidence,
  onOpenTransfer,
  onOpenUserMgmt,
}) => {
  const openCases = cases.filter((c) => c.status === 'OPEN').length;
  const inProgressCases = cases.filter((c) => c.status === 'IN_PROGRESS').length;
  const closedCases = cases.filter((c) => c.status === 'CLOSED').length;

  const verifiedEvidence = evidence.filter((e) => e.verifiedStatus === 'VERIFIED_INTACT').length;
  const tamperedEvidence = evidence.filter((e) => e.verifiedStatus === 'TAMPERED_MISMATCH').length;
  const integrityRate = evidence.length > 0 ? Math.round((verifiedEvidence / evidence.length) * 100) : 100;

  // Breakdown by type
  const typeCounts: Record<string, number> = {};
  evidence.forEach((ev) => {
    typeCounts[ev.evidenceType] = (typeCounts[ev.evidenceType] || 0) + 1;
  });

  const isAdmin = currentUser.role === 'ADMIN';
  const isInvestigator = currentUser.role === 'INVESTIGATOR' || currentUser.role === 'LEAD_INVESTIGATOR';
  const isViewer = currentUser.role === 'VIEWER';

  return (
    <div className="space-y-6">
      {/* Role-Specific Hero Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all ${
          isAdmin
            ? 'bg-gradient-to-r from-purple-50/40 via-white to-teal-50/30 border-purple-200/70'
            : isViewer
            ? 'bg-gradient-to-r from-emerald-50/40 via-white to-sky-50/30 border-emerald-200/70'
            : 'bg-gradient-to-r from-white via-teal-50/30 to-sky-50/40 border-slate-200/80'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isAdmin
                  ? 'bg-purple-100/70 text-purple-800 border-purple-200'
                  : isViewer
                  ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                  : 'bg-teal-100/70 text-teal-800 border-teal-200'
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {isAdmin && 'ADMIN DASHBOARD • System Authority'}
              {isInvestigator && 'INVESTIGATOR DASHBOARD • Case & Vault Operations'}
              {isViewer && 'VIEWER PORTAL • Judicial & Legal Review (Read-Only)'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Officer: <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.badgeNumber})
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
            <span>Evident<span className="text-teal-600">X</span></span>
            <span className="text-slate-300 font-normal hidden sm:inline">•</span>
            <span className="text-xl sm:text-2xl font-semibold text-slate-800">
              {isAdmin && 'Enclave Administration & Security Deck'}
              {isInvestigator && 'Cyber Crime Investigation Workstation'}
              {isViewer && 'Authorized Case & Forensic Dossier Review'}
            </span>
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isAdmin &&
              'Full administrative authority active: You can manage registered forensic personnel, toggle RBAC privileges, inspect all investigation records, verify and restore bitstream integrity baselines, and review immutable audit trails.'}
            {isInvestigator &&
              'Investigator authority active: You can register incident dockets, ingest seized digital evidence artifacts, calculate SHA-256 parity hashes, execute chain-of-custody handovers, and generate court-admissible dossiers.'}
            {isViewer &&
              'Read-only legal clearance active: You can review authorized case files, inspect chain-of-custody provenance tokens, examine cryptographic hash verification reports, and download certified PDF dossiers for judicial presentation. Modifying records is restricted.'}
          </p>

          {/* Quick Role Actions Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isAdmin && (
              <>
                {onOpenUserMgmt && (
                  <button
                    onClick={onOpenUserMgmt}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Manage Officers (RBAC)</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('audit')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Audit Trail</span>
                </button>
                {onOpenNewCase && (
                  <button
                    onClick={onOpenNewCase}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    + New Case
                  </button>
                )}
              </>
            )}

            {isInvestigator && (
              <>
                {onOpenNewCase && (
                  <button
                    onClick={onOpenNewCase}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ New Case Docket</span>
                  </button>
                )}
                {onOpenNewEvidence && (
                  <button
                    onClick={onOpenNewEvidence}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Ingest Evidence</span>
                  </button>
                )}
                <button
                  onClick={onOpenTransfer}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Transfer Custody
                </button>
              </>
            )}

            {isViewer && (
              <>
                <button
                  onClick={() => onNavigate('cases')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Browse Authorized Cases</span>
                </button>
                <button
                  onClick={() => onNavigate('custody')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
                  <span>View Custody Chain</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 self-start md:self-center">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-teal-100 text-teal-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cryptographic Vault Online</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Clearance: <strong className="text-slate-700">{currentUser.role}</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards in Crisp White with Soft Pastel Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cases */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Investigation Cases
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{cases.length}</span>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              {inProgressCases} Active
            </span>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 font-mono">
            <span>Open: {openCases}</span>
            <span>Closed: {closedCases}</span>
          </div>
        </div>

        {/* Evidence Vault */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Seized Artifacts
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{evidence.length}</span>
            <span className="text-xs text-slate-500">items locked</span>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2.5 font-mono">
            <span className="text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-600" /> {verifiedEvidence} Intact
            </span>
            {tamperedEvidence > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" /> {tamperedEvidence} Alert!
              </span>
            ) : (
              <span className="text-slate-400">0 Breaches</span>
            )}
          </div>
        </div>

        {/* SHA-256 Parity Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SHA-256 Integrity
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                integrityRate === 100 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {integrityRate}%
            </span>
            <span className="text-xs text-slate-500">hash parity</span>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 font-mono">
            <span>Digest: 256-bit</span>
            <span className="text-emerald-700 font-semibold">Zero Collision</span>
          </div>
        </div>

        {/* Custody Handshakes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Custody Handshakes
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{custody.length}</span>
            <span className="text-xs text-slate-500">signed entries</span>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 font-mono">
            <span>Immutable Ledger</span>
            <span className="text-indigo-600 font-semibold">100% Signed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Cases & Media Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Cases (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Priority Cyber Crime Cases</span>
              </h3>
              <p className="text-xs text-slate-500">Active law enforcement investigation dockets.</p>
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cases.slice(0, 3).map((caseItem) => {
              const caseEvidence = evidence.filter((e) => e.caseId === caseItem.id);
              return (
                <div
                  key={caseItem.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-lg">
                        {caseItem.caseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                          caseItem.priority === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : caseItem.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {caseItem.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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

                      <button
                        onClick={() =>
                          generateForensicPdfDossier(
                            caseItem,
                            caseEvidence,
                            custody.filter((c) => c.caseId === caseItem.id),
                            activities.filter((a) => a.caseId === caseItem.id),
                            currentUser.fullName
                          )
                        }
                        title="Download Court PDF Dossier"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-teal-600" />
                        <span>PDF Report</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{caseItem.caseName}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {caseItem.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400">Lead Investigator: </span>
                      <span className="text-slate-700 font-semibold">{caseItem.assignedInvestigatorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Evidence Count: </span>
                      <span className="text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {caseEvidence.length} items
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Media Distribution & Recent Custody */}
        <div className="space-y-6">
          {/* Media Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-600" />
                <span>Seized Media Classification</span>
              </h3>
              <p className="text-xs text-slate-500">Distribution by forensic bitstream category.</p>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { type: 'MEMORY_DUMP', label: 'Volatile RAM Dumps', icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-500' },
                { type: 'DISK_IMAGE', label: 'E01 / Bitstream Images', icon: HardDrive, color: 'text-teal-600', bg: 'bg-teal-500' },
                { type: 'NETWORK_PCAP', label: 'Network Packet Traces', icon: Radio, color: 'text-sky-600', bg: 'bg-sky-500' },
                { type: 'ENCRYPTED_MEDIA', label: 'Encrypted Hardware', icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500' },
              ].map((m) => {
                const count = typeCounts[m.type] || 0;
                const pct = evidence.length > 0 ? Math.round((count / evidence.length) * 100) : 0;
                const Icon = m.icon;
                return (
                  <div key={m.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                        <span className="text-slate-700 font-medium">{m.label}</span>
                      </div>
                      <span className="font-mono text-slate-500 font-bold">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.bg} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Handshakes */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  <span>Recent Custody Transfers</span>
                </h3>
                <p className="text-xs text-slate-500">Immutable possession handovers.</p>
              </div>
              <button
                onClick={() => onNavigate('custody')}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
              >
                Ledger
              </button>
            </div>

            <div className="space-y-2.5">
              {custody.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{c.action}</span>
                    <span className="font-mono text-[10px] text-slate-400">{c.timestamp.substring(11, 19)}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] flex items-center gap-1.5 truncate">
                    <span className="text-slate-500">{c.previousCustodian}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-teal-700 font-semibold">{c.newCustodian}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 pt-0.5">{c.custodySignatureToken}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
