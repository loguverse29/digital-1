import React, { useState, useEffect } from 'react';
import { InvestigationCase, User, Priority } from '../types';
import { X, Edit3, Save } from 'lucide-react';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: InvestigationCase | null;
  investigators: User[];
  onSaveCase: (updatedData: {
    id: number;
    caseName: string;
    description: string;
    category: string;
    priority: Priority;
    assignedInvestigatorId: number;
    courtJurisdiction: string;
  }) => void;
}

export const EditCaseModal: React.FC<EditCaseModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  investigators,
  onSaveCase,
}) => {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [assignedInvestigatorId, setAssignedInvestigatorId] = useState<number>(1);
  const [courtJurisdiction, setCourtJurisdiction] = useState('');

  useEffect(() => {
    if (caseItem) {
      setCaseName(caseItem.caseName);
      setDescription(caseItem.description);
      setCategory(caseItem.category);
      setPriority(caseItem.priority);
      setAssignedInvestigatorId(caseItem.assignedInvestigatorId);
      setCourtJurisdiction(caseItem.courtJurisdiction || '');
    }
  }, [caseItem]);

  if (!isOpen || !caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    onSaveCase({
      id: caseItem.id,
      caseName: caseName.trim(),
      description: description.trim(),
      category,
      priority,
      assignedInvestigatorId: Number(assignedInvestigatorId),
      courtJurisdiction: courtJurisdiction.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5EBF3] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-5 border-b border-[#E5EBF3] flex items-center justify-between bg-[#F7F9FC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E8F8F7] flex items-center justify-center text-[#32B8B0]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#253247]">Edit Case Docket</h3>
              <p className="text-xs text-[#758195] font-mono">{caseItem.caseNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#758195] hover:text-[#253247] hover:bg-[#E5EBF3] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#253247] block mb-1">
              Case Title *
            </label>
            <input
              type="text"
              required
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="w-full bg-[#F7F9FC] text-[#253247] text-xs px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#253247] block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F7F9FC] text-[#253247] text-xs px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
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
              <label className="text-xs font-semibold text-[#253247] block mb-1">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#F7F9FC] text-[#253247] text-xs px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
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
              <label className="text-xs font-semibold text-[#253247] block mb-1">
                Assigned Investigator
              </label>
              <select
                value={assignedInvestigatorId}
                onChange={(e) => setAssignedInvestigatorId(Number(e.target.value))}
                className="w-full bg-[#F7F9FC] text-[#253247] text-xs px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
              >
                {investigators.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.fullName} ({inv.badgeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#253247] block mb-1">
                Jurisdiction
              </label>
              <input
                type="text"
                value={courtJurisdiction}
                onChange={(e) => setCourtJurisdiction(e.target.value)}
                className="w-full bg-[#F7F9FC] text-[#253247] text-xs px-3 py-2.5 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#253247] block mb-1">
              Description & Evidence Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F7F9FC] text-[#253247] text-xs p-3 rounded-lg border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0]"
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5EBF3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#F7F9FC] hover:bg-[#E5EBF3] text-[#758195] hover:text-[#253247] text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#32B8B0] hover:bg-[#299F98] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
