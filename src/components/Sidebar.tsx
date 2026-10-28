import React from 'react';
import { User, Role } from '../types';
import {
  Shield,
  FileText,
  Lock,
  ArrowRightLeft,
  Terminal,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tamperCount: number;
  caseCount: number;
  evidenceCount: number;
  custodyCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenLogin?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | number | null;
  alert?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  tamperCount,
  caseCount,
  evidenceCount,
  custodyCount,
  isOpenMobile,
  onCloseMobile,
  onOpenLogin,
}) => {
  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'INVESTIGATOR':
      case 'LEAD_INVESTIGATOR':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'VIEWER':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'FORENSIC_ANALYST':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'EVIDENCE_CUSTODIAN':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const navGroups: NavGroup[] = [
    {
      group: 'INVESTIGATION',
      items: [
        { id: 'dashboard', label: 'Overview', icon: Shield, badge: null },
        { id: 'cases', label: 'Cases & Dossiers', icon: FileText, badge: caseCount },
        { id: 'evidence', label: 'Evidence Vault', icon: Lock, badge: evidenceCount, alert: tamperCount > 0 },
        { id: 'custody', label: 'Chain of Custody', icon: ArrowRightLeft, badge: custodyCount },
      ],
    },
    {
      group: 'SECURITY & LOGS',
      items: [
        { id: 'timeline', label: 'Forensic Activities', icon: Terminal, badge: null },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: ShieldAlert,
          badge: currentUser.role === 'ADMIN' ? 'Admin' : 'Locked',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Muted Navy Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 flex items-center justify-center shadow-md shadow-teal-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">
                  Evident<span className="text-teal-400">X</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-tight">
                Digital Forensic Evidence Management System
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase px-3">
                {group.group}
              </span>

              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 font-semibold shadow-xs border border-teal-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-teal-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {item.alert && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        )}
                        {item.badge !== null && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium ${
                              isActive
                                ? 'bg-teal-500/30 text-teal-200'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Security Standard Card */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-teal-400 font-mono text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400" /> ISO/IEC 27037
            </span>
            <span className="text-slate-400">SHA-256</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            NIST-approved bitstream validation with cryptographic parity enforcement.
          </p>
        </div>

        {/* Active User Card at Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-300">
              {currentUser.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                title="Switch Officer / Login"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
