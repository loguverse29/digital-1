import React, { useState } from 'react';
import { InvestigationCase, EvidenceType, User } from '../types';
import { X, Lock, Upload, CheckCircle2, File, Cpu } from 'lucide-react';
import { computeSha256 } from '../services/forensicsEngine';

interface NewEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: InvestigationCase[];
  currentUser: User;
  onCreateEvidence: (evidenceData: {
    caseId: number;
    evidenceName: string;
    evidenceType: EvidenceType;
    description: string;
    sourceDevice: string;
    controlledStorageIdentifier: string;
    originalFilename: string;
    fileSizeBytes: number;
    fileMimeType: string;
    sha256Hash: string;
  }) => void;
}

export const NewEvidenceModal: React.FC<NewEvidenceModalProps> = ({
  isOpen,
  onClose,
  cases,
  currentUser,
  onCreateEvidence,
}) => {
  const [caseId, setCaseId] = useState<number>(cases[0]?.id || 1);
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('DISK_IMAGE');
  const [sourceDevice, setSourceDevice] = useState('');
  const [storageIdentifier, setStorageIdentifier] = useState('SECURE-VAULT-BAY-02');
  const [description, setDescription] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [computedSha256, setComputedSha256] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!evidenceName) {
      setEvidenceName(file.name.replace(/\.[^/.]+$/, ''));
    }

    setIsComputingHash(true);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setComputedSha256(hash);
    } catch (err) {
      console.error('Failed to hash file', err);
    } finally {
      setIsComputingHash(false);
    }
  };

  const handleGenerateSampleBuffer = async () => {
    setIsComputingHash(true);
    const samplePayload = `FORENSIC_CAPTURE_DUMP_${Date.now()}_BITSTREAM_VALID_ISO27037_${Math.random()}`;
    const hash = await computeSha256(samplePayload);
    setComputedSha256(hash);
    setEvidenceName(evidenceName || 'Sample Forensic Bitstream Image');
    setSourceDevice(sourceDevice || 'Target System Primary Storage Unit');
    setIsComputingHash(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceName.trim() || !computedSha256) return;

    onCreateEvidence({
      caseId: Number(caseId),
      evidenceName: evidenceName.trim(),
      evidenceType,
      description: description.trim(),
      sourceDevice: sourceDevice.trim() || 'Laboratory Seizure Station',
      controlledStorageIdentifier: storageIdentifier,
      originalFilename: selectedFile ? selectedFile.name : `${evidenceName.toLowerCase().replace(/\s+/g, '_')}.raw`,
      fileSizeBytes: selectedFile ? selectedFile.size : 10485760,
      fileMimeType: selectedFile ? selectedFile.type : 'application/octet-stream',
      sha256Hash: computedSha256,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ingest Digital Evidence Artifact</h3>
              <p className="text-xs text-slate-500">Secure bitstream ingestion with real-time SHA-256 fingerprinting.</p>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">Associated Case Docket *</label>
            <select
              value={caseId}
              onChange={(e) => setCaseId(Number(e.target.value))}
              className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.caseName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Artifact Label / Name *</label>
              <input
                type="text"
                required
                value={evidenceName}
                onChange={(e) => setEvidenceName(e.target.value)}
                placeholder="e.g. Target Workstation NVMe Drive"
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Evidence Media Type *</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="DISK_IMAGE">Bitstream Disk Image (E01/DD)</option>
                <option value="MEMORY_DUMP">RAM / Volatile Memory Dump</option>
                <option value="NETWORK_PCAP">Network PCAP Capture</option>
                <option value="ENCRYPTED_MEDIA">Encrypted Flash / Hardware</option>
                <option value="MOBILE_EXTRACTION">Mobile Device Extraction</option>
                <option value="LOG_ARCHIVE">System Log Archive</option>
                <option value="EMAIL_MBOX">Email MBOX / PST Store</option>
                <option value="DOCUMENT">Digital Document</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Source Device / Platform</label>
              <input
                type="text"
                value={sourceDevice}
                onChange={(e) => setSourceDevice(e.target.value)}
                placeholder="e.g. Dell PowerEdge R750 Server"
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Controlled Storage Locker Identifier *
              </label>
              <input
                type="text"
                required
                value={storageIdentifier}
                onChange={(e) => setStorageIdentifier(e.target.value)}
                placeholder="e.g. SECURE-VAULT-BAY-03"
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Secure File Ingestion & Real-Time Hashing Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>Bitstream File Ingest & Cryptographic Fingerprinting</span>
              </label>

              <button
                type="button"
                onClick={handleGenerateSampleBuffer}
                className="text-[11px] text-teal-700 hover:text-teal-800 underline font-mono cursor-pointer font-semibold"
              >
                Auto-Generate Synthetic Bitstream
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white rounded-xl p-4 text-center cursor-pointer transition-all">
              <input
                type="file"
                id="evidence-file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="evidence-file-upload" className="cursor-pointer block space-y-1">
                <File className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {selectedFile ? selectedFile.name : 'Click to select or drop evidence bitstream file'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${selectedFile.type || 'raw binary'}`
                    : 'Computes cryptographic SHA-256 checksum locally via Web Crypto API'}
                </span>
              </label>
            </div>

            {/* SHA-256 Output */}
            {isComputingHash ? (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-teal-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 animate-spin text-teal-600" />
                <span>Streaming bytes and computing 256-bit cryptographic digest...</span>
              </div>
            ) : computedSha256 ? (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-teal-900 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>NIST SHA-256 DIGEST COMPUTED</span>
                  </span>
                  <span className="text-teal-700 font-mono text-[10px]">64 Hex Chars</span>
                </div>
                <div className="font-mono text-xs text-teal-950 break-all select-all font-semibold">
                  {computedSha256}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Seizure Remarks & Write-Blocker Verification
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hardware write-blocker serial number, physical seal number, ambient conditions..."
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
              disabled={!computedSha256}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all ${
                computedSha256
                  ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Record Evidence & Baseline Hash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
