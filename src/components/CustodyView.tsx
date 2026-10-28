import React, { useState } from 'react';
import { ChainOfCustodyRecord, Evidence, InvestigationCase, User } from '../types';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowRightLeft,
  Shield,
  FileCheck,
  CheckCircle,
  FileSignature,
} from 'lucide-react';

interface CustodyViewProps {
  custodyRecords: ChainOfCustodyRecord[];
  evidence: Evidence[];
  cases: InvestigationCase[];
  currentUser: User;
  onOpenTransfer: () => void;
}

export const CustodyView: React.FC<CustodyViewProps> = ({
  custodyRecords,
  evidence,
  cases,
  currentUser,
  onOpenTransfer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredRecords = custodyRecords.filter((rec) => {
    const ev = evidence.find((e) => e.id === rec.evidenceId);
    const matchesSearch =
      rec.previousCustodian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.newCustodian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.custodySignatureToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev && ev.evidenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || rec.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-teal-600" />
            <span>Immutable Chain of Custody Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cryptographically signed and timestamped record of physical and electronic evidence transfers.
          </p>
        </div>

        <button
          onClick={onOpenTransfer}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Execute Custody Transfer</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by custodian name, evidence ID, or signature token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="ALL">All Actions</option>
          <option value="COLLECTED">COLLECTED</option>
          <option value="SECURE_STORAGE_DEPOSIT">SECURE_STORAGE_DEPOSIT</option>
          <option value="LAB_ANALYSIS">LAB_ANALYSIS</option>
          <option value="TRANSFERRED">TRANSFERRED</option>
          <option value="COURT_PRODUCTION">COURT_PRODUCTION</option>
          <option value="RETURN_TO_OWNER">RETURN_TO_OWNER</option>
        </select>

        <span className="text-xs font-mono text-slate-500 ml-auto hidden sm:block">
          {filteredRecords.length} Logged Entries
        </span>
      </div>

      {/* Table of Custody Logs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-mono text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-5">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Evidence Artifact</th>
                <th className="py-3.5 px-4">Action Purpose</th>
                <th className="py-3.5 px-4">Custody Transfer Flow</th>
                <th className="py-3.5 px-4">Vault Location / Remarks</th>
                <th className="py-3.5 px-5">Digital Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => {
                const ev = evidence.find((e) => e.id === rec.evidenceId);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {rec.timestamp}
                    </td>

                    <td className="py-3.5 px-4">
                      {ev ? (
                        <div>
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                            {ev.evidenceNumber}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate max-w-[170px] block mt-0.5">
                            {ev.evidenceName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Artifact #{rec.evidenceId}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px] inline-block">
                        {rec.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{rec.previousCustodian}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-bold text-slate-900">{rec.newCustodian}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-slate-800 block font-semibold">{rec.location}</span>
                      <span className="text-[11px] text-slate-500 italic block">"{rec.remarks}"</span>
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <FileSignature className="w-3 h-3 text-teal-600" />
                        {rec.custodySignatureToken}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
