import React, { useState } from 'react';
import { AuditLog } from '../types';
import { ShieldAlert, Search, Terminal, Globe, Calendar, User, Shield } from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-teal-600" />
          <span>System Security Audit Logs</span>
        </h2>
        <p className="text-xs text-slate-500">
          Append-only security log auditing authentication events, access control, and hash verification operations.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by user, action, IP address, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-mono text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-5">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Account ID</th>
                <th className="py-3.5 px-4">Security Action</th>
                <th className="py-3.5 px-4">Audit Record Details</th>
                <th className="py-3.5 px-5">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => {
                const isAlert = log.action.includes('TAMPER') || log.action.includes('BREACH') || log.action.includes('MISMATCH');
                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isAlert ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">{log.username}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${
                          isAlert
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs text-slate-700 max-w-md">{log.details}</td>
                    <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap">{log.ipAddress}</td>
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
