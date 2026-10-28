import React, { useState } from 'react';
import { Evidence, CustodyAction, User } from '../types';
import { X, ArrowRightLeft, Shield, UserCheck } from 'lucide-react';

interface CustodyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceList: Evidence[];
  preselectedEvidence?: Evidence | null;
  currentUser: User;
  onExecuteTransfer: (data: {
    evidenceId: number;
    action: CustodyAction;
    previousCustodian: string;
    newCustodian: string;
    location: string;
    remarks: string;
  }) => void;
}

export const CustodyTransferModal: React.FC<CustodyTransferModalProps> = ({
  isOpen,
  onClose,
  evidenceList,
  preselectedEvidence,
  currentUser,
  onExecuteTransfer,
}) => {
  const [evidenceId, setEvidenceId] = useState<number>(
    preselectedEvidence?.id || evidenceList[0]?.id || 1
  );
  const [action, setAction] = useState<CustodyAction>('TRANSFERRED');
  const [previousCustodian, setPreviousCustodian] = useState(
    preselectedEvidence?.collectorName || currentUser.fullName
  );
  const [newCustodian, setNewCustodian] = useState('Dr. Sarah Chen (Forensics Director)');
  const [location, setLocation] = useState(
    preselectedEvidence?.controlledStorageIdentifier || 'Evidence Control Central Vault Bay 01'
  );
  const [remarks, setRemarks] = useState(
    'Transferred for comprehensive forensic extraction and malware reverse-engineering.'
  );

  if (!isOpen) return null;

  const currentSelectedEvidence =
    evidenceList.find((e) => e.id === Number(evidenceId)) || evidenceList[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previousCustodian.trim() || !newCustodian.trim()) return;

    onExecuteTransfer({
      evidenceId: Number(evidenceId),
      action,
      previousCustodian: previousCustodian.trim(),
      newCustodian: newCustodian.trim(),
      location: location.trim(),
      remarks: remarks.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Execute Chain-of-Custody Handover</h3>
              <p className="text-xs text-slate-500">Record legally binding evidence transfer under ISO/IEC 27037.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Evidence Artifact *
            </label>
            <select
              value={evidenceId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setEvidenceId(id);
                const ev = evidenceList.find((item) => item.id === id);
                if (ev) {
                  setPreviousCustodian(ev.collectorName || currentUser.fullName);
                  setLocation(ev.controlledStorageIdentifier);
                }
              }}
              className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {evidenceList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.evidenceNumber} - {ev.evidenceName} [{ev.evidenceType}]
                </option>
              ))}
            </select>
          </div>

          {currentSelectedEvidence && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Baseline Hash (SHA-256):</span>
                <span className="text-teal-700 font-semibold">{currentSelectedEvidence.verifiedStatus}</span>
              </div>
              <div className="font-mono text-[11px] text-slate-800 truncate bg-white p-2 rounded-lg border border-slate-200">
                {currentSelectedEvidence.originalSha256Hash}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Custody Action / Purpose *</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as CustodyAction)}
              className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="TRANSFERRED">TRANSFERRED (Internal Handoff)</option>
              <option value="LAB_ANALYSIS">LAB_ANALYSIS (Check-out for Examination)</option>
              <option value="SECURE_STORAGE_DEPOSIT">SECURE_STORAGE_DEPOSIT (Deposit into Vault)</option>
              <option value="COURT_PRODUCTION">COURT_PRODUCTION (Adduced in Trial)</option>
              <option value="RETURN_TO_OWNER">RETURN_TO_OWNER (Release post-judgment)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Releasing Custodian (From) *
              </label>
              <input
                type="text"
                required
                value={previousCustodian}
                onChange={(e) => setPreviousCustodian(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Receiving Custodian (To) *
              </label>
              <input
                type="text"
                required
                value={newCustodian}
                onChange={(e) => setNewCustodian(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              New Secure Storage Locker Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Forensic Lab Workstation Alpha / Locker B12"
              className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Transfer Remarks & Security Seals
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Condition of seals, hardware write-blocker verification, transportation notes..."
              className="w-full bg-slate-50 text-slate-800 text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Sign & Log Custody Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
