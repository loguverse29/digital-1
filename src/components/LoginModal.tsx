import React, { useState } from 'react';
import { User } from '../types';
import { X, Shield, Lock, KeyRound, CheckCircle2, UserCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onLoginSuccess,
}) => {
  const [selectedUsername, setSelectedUsername] = useState(currentUser.username);
  const [password, setPassword] = useState('Password@123');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find((u) => u.username === selectedUsername);
    if (targetUser) {
      setIsSuccess(true);
      setTimeout(() => {
        onLoginSuccess(targetUser);
        setIsSuccess(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 to-sky-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white mb-3">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Evident<span className="text-teal-600">X</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mt-0.5">
            Digital Forensic Evidence Management System
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Officer Authentication & Access Enclave
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {isSuccess && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Officer credentials verified. Authenticating into EvidentX...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Officer Account
            </label>
            <select
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.fullName} ({u.role.replace('_', ' ')}) • {u.badgeNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Security Clearance Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-[11px] text-teal-600 font-medium">ISO/IEC 27037 Compliant</span>
            <span className="text-[11px] font-mono text-slate-400">SHA-256 Validated</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Authenticate into EvidentX Enclave</span>
          </button>

          {/* Demonstration Accounts Guide */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1 font-mono">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Available Roles in EvidentX:
            </span>
            <div className="flex justify-between text-slate-500">
              <span>Dr. Sarah Chen</span>
              <span className="text-purple-600 font-semibold">ADMIN</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Insp. Rajesh Kumar</span>
              <span className="text-sky-600 font-semibold">LEAD_INVESTIGATOR</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Elena Vance</span>
              <span className="text-teal-600 font-semibold">FORENSIC_ANALYST</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Marcus Thorne</span>
              <span className="text-amber-600 font-semibold">EVIDENCE_CUSTODIAN</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
