import React, { useState } from 'react';
import { User, Priority } from '../types';
import { X, Plus, FileText } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigators: User[];
  currentUser: User;
  onCreateCase: (caseData: {
    caseName: string;
    description: string;
    category: string;
    priority: Priority;
    assignedInvestigatorId: number;
    courtJurisdiction: string;
    incidentDate: string;
  }) => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  investigators,
  currentUser,
  onCreateCase,
}) => {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ransomware');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [assignedInvestigatorId, setAssignedInvestigatorId] = useState<number>(
    investigators[0]?.id || currentUser.id
  );
  const [courtJurisdiction, setCourtJurisdiction] = useState('Federal Cyber Crime District Court');
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().substring(0, 16).replace('T', ' ') + ':00'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    onCreateCase({
      caseName: caseName.trim(),
      description: description.trim(),
      category,
      priority,
      assignedInvestigatorId: Number(assignedInvestigatorId),
      courtJurisdiction,
      incidentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Cyber Crime Case</h3>
              <p className="text-xs text-slate-500">Instantiate case docket with ISO/IEC 27037 chain-of-custody tracking.</p>
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
              Case Title / Incident Codename *
            </label>
            <input
              type="text"
              required
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="e.g. Operation Sentinel: Cloud Database Ransom Incident"
              className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="Ransomware">Ransomware</option>
                <option value="Insider Threat">Insider Threat</option>
                <option value="Financial Fraud">Financial Fraud</option>
                <option value="Network Intrusion">Network Intrusion</option>
                <option value="Identity Theft">Identity Theft</option>
                <option value="Intellectual Property Exfiltration">Intellectual Property Exfiltration</option>
                <option value="Cryptojacking">Cryptojacking</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Priority Classification *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Investigator</label>
              <select
                value={assignedInvestigatorId}
                onChange={(e) => setAssignedInvestigatorId(Number(e.target.value))}
                className="w-full bg-slate-50 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {investigators.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.fullName} ({inv.badgeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Court Jurisdiction</label>
              <input
                type="text"
                value={courtJurisdiction}
                onChange={(e) => setCourtJurisdiction(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Case Narrative & Incident Summary
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe attack vectors, compromised hosts, seized network traces, and evidentiary scope..."
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
              <Plus className="w-4 h-4" />
              <span>Create Case Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
