import React, { useState } from 'react';
import { Evidence, User } from '../types';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Upload, File, Cpu } from 'lucide-react';
import { computeSha256 } from '../services/forensicsEngine';

interface VerifyHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence | null;
  currentUser: User;
  onVerify: (evidenceId: number, computedHash: string, notes: string) => void;
}

export const VerifyHashModal: React.FC<VerifyHashModalProps> = ({
  isOpen,
  onClose,
  evidence,
  currentUser,
  onVerify,
}) => {
  if (!isOpen || !evidence) return null;

  const [inputHash, setInputHash] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState('');
  const [notes, setNotes] = useState('Routine cryptographic audit check.');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsComputing(true);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setCalculatedHash(hash);
      setInputHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputing(false);
    }
  };

  const handleQuickParityTest = () => {
    setCalculatedHash(evidence.originalSha256Hash);
    setInputHash(evidence.originalSha256Hash);
  };

  const activeHash = inputHash.trim().toLowerCase();
  const originalHash = evidence.originalSha256Hash.toLowerCase().trim();
  const hasTested = activeHash.length > 0;
  const isMatch = hasTested && activeHash === originalHash;

  const handleConfirm = () => {
    if (!activeHash) return;
    onVerify(evidence.id, activeHash, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">SHA-256 Cryptographic Verification</h3>
              <p className="text-xs text-slate-500">Verify evidence bitstream integrity against sealed baseline hash.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Target Evidence Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {evidence.evidenceNumber}
              </span>
              <span className="text-slate-500 font-medium">Locker: {evidence.controlledStorageIdentifier}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{evidence.evidenceName}</h4>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                Original Seizure Baseline Hash (SHA-256)
              </span>
              <div className="font-mono text-xs text-slate-800 break-all select-all bg-white p-2.5 rounded-lg border border-slate-200 font-semibold">
                {evidence.originalSha256Hash}
              </div>
            </div>
          </div>

          {/* Test Input Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Verify by Uploading Evidence Copy
              </label>
              <button
                type="button"
                onClick={handleQuickParityTest}
                className="text-[11px] text-teal-700 hover:text-teal-800 underline font-mono cursor-pointer font-semibold"
              >
                Auto-fill Matching Bitstream
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/50 rounded-xl p-3.5 text-center cursor-pointer transition-all">
              <input
                type="file"
                id="verify-file-input"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="verify-file-input" className="cursor-pointer block space-y-1">
                <File className="w-5 h-5 text-slate-400 mx-auto" />
                <span className="text-xs text-slate-700 font-semibold block">
                  {selectedFile ? selectedFile.name : 'Select bitstream copy to recompute checksum'}
                </span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Or Enter Recalculated 64-Hex Digest
              </label>
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="Paste recalculated SHA-256 hash here..."
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Real-time Match / Mismatch banner */}
          {isComputing ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-teal-700 flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin text-teal-600" />
              <span>Streaming bytes and computing SHA-256...</span>
            </div>
          ) : hasTested ? (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                isMatch
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isMatch ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>CRYPTOGRAPHIC PARITY CONFIRMED (100% MATCH)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>HASH MISMATCH DETECTED! EVIDENCE INTEGRITY BREACH!</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed font-sans">
                {isMatch
                  ? 'The calculated SHA-256 digest is byte-for-byte identical to the original baseline. Zero tampering or bit rot detected.'
                  : 'Calculated hash diverges from the sealed baseline. An emergency chain-of-custody breach alert will be registered in the audit log.'}
              </p>
            </div>
          ) : null}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Verification Audit Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
            ></textarea>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!hasTested}
              onClick={handleConfirm}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isMatch
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Record Verification in Audit Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
