import React, { useState } from 'react';
import { Evidence, EvidenceHashRecord, InvestigationCase, User } from '../types';
import {
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  Copy,
  Check,
  ShieldAlert,
  HardDrive,
  FileCode,
  FileWarning,
} from 'lucide-react';

interface EvidenceViewProps {
  evidence: Evidence[];
  cases: InvestigationCase[];
  hashRecords: EvidenceHashRecord[];
  currentUser: User;
  onOpenNewEvidence?: () => void;
  onOpenVerifyModal: (evidence: Evidence) => void;
  onOpenTransferModal: (evidence: Evidence) => void;
  onSimulateTamper: (evidenceId: number) => void;
  onRestoreIntegrity: (evidenceId: number) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  evidence,
  cases,
  hashRecords,
  currentUser,
  onOpenNewEvidence,
  onOpenVerifyModal,
  onOpenTransferModal,
  onSimulateTamper,
  onRestoreIntegrity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredEvidence = evidence.filter((ev) => {
    const matchesSearch =
      ev.evidenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.evidenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.controlledStorageIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.originalSha256Hash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || ev.evidenceType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || ev.verifiedStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <span>Digital Evidence Locker & Vault</span>
          </h2>
          <p className="text-xs text-slate-500">
            Hardware-isolated bitstream vault with ISO/IEC 27037 SHA-256 cryptographic parity validation.
          </p>
        </div>
      </div>

      {/* College Project Viva Demonstration Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/70 via-sky-50/70 to-white border border-teal-200/80 shadow-2xs flex items-start gap-3">
        <FileCode className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-teal-900">
            College Final Year & Viva Demonstration: Cryptographic Tamper Simulator
          </span>
          <p className="text-slate-600 leading-relaxed">
            In digital forensics, any 1-bit alteration in an evidence file triggers the <strong>avalanche effect</strong> in SHA-256, rendering the computed digest completely different and invalidating court admissibility.
            Click <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">"Simulate 1-Byte Tamper"</span> on any item below to witness instant cryptographic failure detection and chain-of-custody alert logging!
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Evidence ID, filename, SHA-256 hash, or locker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        {/* Media Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="ALL">All Media Types</option>
          <option value="MEMORY_DUMP">Memory Dump</option>
          <option value="DISK_IMAGE">Bitstream Disk Image</option>
          <option value="NETWORK_PCAP">Network PCAP</option>
          <option value="ENCRYPTED_MEDIA">Encrypted Media</option>
          <option value="LOG_ARCHIVE">Log Archive</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="ALL">All Integrity Statuses</option>
          <option value="VERIFIED_INTACT">VERIFIED_INTACT</option>
          <option value="TAMPERED_MISMATCH">TAMPERED_MISMATCH</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      {/* Evidence Cards Grid */}
      <div className="space-y-4">
        {filteredEvidence.map((ev) => {
          const associatedCase = cases.find((c) => c.id === ev.caseId);
          const evHashHistory = hashRecords.filter((h) => h.evidenceId === ev.id);
          const isTampered = ev.verifiedStatus === 'TAMPERED_MISMATCH';

          return (
            <div
              key={ev.id}
              className={`p-6 rounded-2xl border transition-all ${
                isTampered
                  ? 'bg-rose-50/40 border-rose-200 shadow-md shadow-rose-100/50'
                  : 'bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                {/* Evidence Info */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
                      {ev.evidenceNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {ev.evidenceType}
                    </span>
                    {associatedCase && (
                      <span className="text-xs text-slate-500">
                        Case: <strong className="text-slate-800">{associatedCase.caseNumber}</strong> ({associatedCase.caseName})
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{ev.evidenceName}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{ev.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-500 pt-1">
                    <div>
                      <span className="text-slate-400">Source Hardware: </span>
                      <span className="text-slate-700 font-semibold">{ev.sourceDevice}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Seized By: </span>
                      <span className="text-slate-700 font-semibold">{ev.collectorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Controlled Locker: </span>
                      <span className="text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {ev.controlledStorageIdentifier}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 Cryptographic Hash Box */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-mono font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-teal-600" />
                        <span>BASELINE SHA-256 CHECKSUM (ISO/IEC 27037)</span>
                      </span>
                      <button
                        onClick={() => handleCopy(ev.originalSha256Hash)}
                        className="text-teal-700 hover:text-teal-800 flex items-center gap-1 text-[11px] font-mono font-semibold cursor-pointer"
                      >
                        {copiedHash === ev.originalSha256Hash ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Digest</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="font-mono text-xs text-slate-800 break-all select-all tracking-wider bg-white p-2.5 rounded-lg border border-slate-200">
                      {ev.originalSha256Hash}
                    </div>

                    {isTampered && (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-pulse">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <strong className="text-rose-900">CRYPTOGRAPHIC INTEGRITY VIOLATION DETECTED!</strong>
                          <span className="block text-[11px] text-rose-700 mt-0.5">
                            Current file bitstream does not match baseline SHA-256 hash. Evidence chain compromised.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Status & Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-end sm:items-center lg:items-end justify-between gap-3 min-w-[210px]">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                        isTampered
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : ev.verifiedStatus === 'VERIFIED_INTACT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isTampered ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>TAMPERED MISMATCH</span>
                        </>
                      ) : ev.verifiedStatus === 'VERIFIED_INTACT' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>VERIFIED INTACT</span>
                        </>
                      ) : (
                        <span>PENDING VERIFICATION</span>
                      )}
                    </span>

                    {ev.lastVerificationTimestamp && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                        Verified: {ev.lastVerificationTimestamp}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap lg:flex-col gap-2 w-full sm:w-auto">
                    {/* Live Verify Button: Available to all for verification */}
                    <button
                      onClick={() => onOpenVerifyModal(ev)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{currentUser.role === 'VIEWER' ? 'Inspect Parity' : 'Re-Verify SHA-256'}</span>
                    </button>

                    {/* Transfer Custody Button: Only Investigator and Admin */}
                    {currentUser.role !== 'VIEWER' ? (
                      <button
                        onClick={() => onOpenTransferModal(ev)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
                        <span>Transfer Custody</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-mono italic text-center py-1">
                        Transfers: Investigator Only
                      </div>
                    )}

                    {/* Tamper / Baseline Controls: Restricted from Viewer */}
                    {currentUser.role !== 'VIEWER' && (
                      <>
                        {!isTampered ? (
                          <button
                            onClick={() => onSimulateTamper(ev.id)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                            title="Simulate 1-byte alteration in file to demonstrate hash mismatch in viva presentation"
                          >
                            <FileWarning className="w-3.5 h-3.5 text-rose-600" />
                            <span>Simulate 1-Byte Tamper</span>
                          </button>
                        ) : (
                          <>
                            {currentUser.role === 'ADMIN' ? (
                              <button
                                onClick={() => onRestoreIntegrity(ev.id)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Restore Baseline (Admin)</span>
                              </button>
                            ) : (
                              <div className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-200 text-center">
                                Baseline restore requires Admin
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
