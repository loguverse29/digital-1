import React from 'react';
import { User } from '../types';
import {
  Menu,
  Plus,
  Lock,
  ArrowRightLeft,
  ShieldAlert,
  Search,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';

interface TopNavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  activeTab: string;
  tamperCount: number;
  onOpenMobileMenu: () => void;
  onOpenNewCase: () => void;
  onOpenNewEvidence: () => void;
  onOpenTransfer: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenLogin?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  activeTab,
  tamperCount,
  onOpenMobileMenu,
  onOpenNewCase,
  onOpenNewEvidence,
  onOpenTransfer,
  searchQuery,
  setSearchQuery,
  onOpenLogin,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Forensics Overview & Metrics';
      case 'cases':
        return 'Investigation Case Dockets';
      case 'evidence':
        return 'Secure Digital Evidence Vault';
      case 'custody':
        return 'Chain of Custody Ledger';
      case 'timeline':
        return 'Investigation Milestone Stream';
      case 'audit':
        return 'System Security Audit Trail';
      default:
        return 'EvidentX Forensics Console';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & breadcrumb title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
              <span className="font-semibold text-slate-600">EvidentX</span>
              <span>/</span>
              <span className="text-teal-600 font-semibold capitalize">{activeTab}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              {getTabTitle()}
            </h2>
          </div>
        </div>

        {/* Right: Actions, Tamper Banner, Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Tamper Warning Badge */}
          {tamperCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>{tamperCount} Breach{tamperCount > 1 ? 'es' : ''}!</span>
            </div>
          )}

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-100/90 hover:bg-slate-100 p-1 pl-2.5 rounded-xl border border-slate-200/70 transition-all">
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline mr-1.5">
              Role:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find((u) => u.id === Number(e.target.value));
                if (selected) onSwitchUser(selected);
              }}
              className="bg-white text-slate-800 text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>

            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                title="EvidentX Officer Login"
                className="ml-1 px-2 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:bg-white rounded-lg transition-colors cursor-pointer hidden md:inline"
              >
                Login
              </button>
            )}
          </div>

          {/* Quick Action Buttons / Clearance Indicator */}
          <div className="flex items-center space-x-2">
            {currentUser.role === 'VIEWER' ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Viewer (Read-Only Mode)</span>
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenNewCase}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Case</span>
                </button>

                <button
                  onClick={onOpenNewEvidence}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Ingest Digital Evidence Artifact"
                >
                  <Lock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="hidden sm:inline">Ingest Evidence</span>
                  <span className="sm:hidden">Ingest</span>
                </button>

                <button
                  onClick={onOpenTransfer}
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xl:inline">Transfer Custody</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
