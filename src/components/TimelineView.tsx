import React, { useState } from 'react';
import { InvestigationActivity, InvestigationCase, Evidence } from '../types';
import { Terminal, Calendar, Search, Filter, Shield, Activity, User } from 'lucide-react';

interface TimelineViewProps {
  activities: InvestigationActivity[];
  cases: InvestigationCase[];
  evidence: Evidence[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ activities, cases, evidence }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState('ALL');

  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.activityDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.activityType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCase = caseFilter === 'ALL' || act.caseId === Number(caseFilter);

    return matchesSearch && matchesCase;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-teal-600" />
          <span>Investigation Activity Stream & Milestones</span>
        </h2>
        <p className="text-xs text-slate-500">
          Chronological journal of field seizures, lab inspections, and investigative milestones.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activities by description, officer, or event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={caseFilter}
          onChange={(e) => setCaseFilter(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="ALL">All Cases</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.caseNumber} - {c.caseName.substring(0, 24)}...
            </option>
          ))}
        </select>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-teal-200/60 ml-4 pl-6 space-y-5">
        {filtered.map((act) => {
          const associatedCase = cases.find((c) => c.id === act.caseId);
          const associatedEvidence = evidence.find((e) => e.id === act.evidenceId);

          return (
            <div key={act.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white shadow-xs group-hover:scale-125 transition-all"></div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                      {act.activityType}
                    </span>
                    {associatedCase && (
                      <span className="text-xs text-slate-500">
                        {associatedCase.caseNumber}
                      </span>
                    )}
                    {associatedEvidence && (
                      <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {associatedEvidence.evidenceNumber}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">{act.timestamp}</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans">{act.activityDescription}</p>

                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Officer / Analyst: <strong className="text-slate-700">{act.actorName}</strong></span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
