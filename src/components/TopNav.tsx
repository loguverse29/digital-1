import React from 'react';
import { User, Role } from '../types';
import { Menu, ShieldAlert, UserCheck, Shield, ChevronDown } from 'lucide-react';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  tamperCount: number;
  activeTab: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  currentUser,
  users,
  onSwitchUser,
  tamperCount,
  activeTab,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Investigation Overview';
      case 'cases':
        return 'Cases & Dossiers';
      case 'evidence':
        return 'Evidence Vault';
      case 'custody':
        return 'Chain of Custody';
      case 'timeline':
        return 'Investigation Activities';
      case 'audit':
        return 'System Audit Trail';
      case 'reports':
        return 'Forensic Reports & Dossiers';
      case 'users':
        return 'User Management';
      case 'settings':
        return 'System Settings & Compliance';
      case 'architecture':
        return 'Spring Boot 3 & MySQL Architecture';
      default:
        return 'Investigation Console';
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[#F2E8FA] text-[#692994] border-[#DEC5F3]';
      case 'LEAD_INVESTIGATOR':
        return 'bg-[#E5F5FA] text-[#166E87] border-[#C2E7F2]';
      case 'FORENSIC_ANALYST':
        return 'bg-[#DDF5E8] text-[#177346] border-[#B9E9CD]';
      case 'EVIDENCE_CUSTODIAN':
        return 'bg-[#FFF0D0] text-[#8C5A08] border-[#FFE2A4]';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5EBF3] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-[#758195] hover:text-[#253247] hover:bg-[#F7F9FC] focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#758195] hidden sm:inline">Portal /</span>
          <h2 className="text-sm sm:text-base font-bold text-[#253247] tracking-tight">
            {getTabTitle(activeTab)}
          </h2>
        </div>
      </div>

      {/* Right: Tamper alert & user profile / role switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {tamperCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FCE4E4] text-[#B82E2E] border border-[#F8BDBD] text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-[#B82E2E]" />
            <span className="hidden sm:inline">{tamperCount} Tamper Alert{tamperCount > 1 ? 's' : ''}!</span>
            <span className="sm:hidden">{tamperCount}</span>
          </div>
        )}

        {/* Role Switcher for easy academic evaluation */}
        <div className="flex items-center space-x-2 bg-[#F7F9FC] border border-[#E5EBF3] rounded-lg p-1.5">
          <span className="text-[11px] font-medium text-[#758195] pl-1.5 hidden md:inline">
            Role:
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = users.find((u) => u.id === Number(e.target.value));
              if (selected) onSwitchUser(selected);
            }}
            className="bg-white text-xs font-semibold text-[#253247] py-1 px-2.5 rounded-md border border-[#E5EBF3] focus:outline-none focus:ring-1 focus:ring-[#32B8B0] cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.role.replace('_', ' ')})
              </option>
            ))}
          </select>

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase hidden sm:inline ${getRoleBadge(
              currentUser.role
            )}`}
          >
            {currentUser.badgeNumber}
          </span>
        </div>
      </div>
    </header>
  );
};
