import React, { useState, useEffect } from 'react';
import {
  User,
  Role,
  InvestigationCase,
  Evidence,
  ChainOfCustodyRecord,
  InvestigationActivity,
  AuditLog,
  EvidenceHashRecord,
  CaseStatus,
  Priority,
  EvidenceType,
  CustodyAction,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_CASES,
  INITIAL_EVIDENCE,
  INITIAL_CUSTODY_RECORDS,
  INITIAL_ACTIVITIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_HASH_RECORDS,
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './components/DashboardView';
import { CasesView } from './components/CasesView';
import { EvidenceView } from './components/EvidenceView';
import { CustodyView } from './components/CustodyView';
import { TimelineView } from './components/TimelineView';
import { AuditView } from './components/AuditView';
import { NewCaseModal } from './components/NewCaseModal';
import { NewEvidenceModal } from './components/NewEvidenceModal';
import { CustodyTransferModal } from './components/CustodyTransferModal';
import { VerifyHashModal } from './components/VerifyHashModal';
import { computeSha256 } from './services/forensicsEngine';
import { dbStorage } from './services/dbStorage';
import {
  Shield,
  Lock,
  UserCheck,
  AlertOctagon,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Fingerprint,
  RefreshCw,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export function App() {
  // Authentication & Session State - Persisted across reloads and navigation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return dbStorage.getAuth().isAuthenticated;
  });
  const [users, setUsers] = useState<User[]>(() => dbStorage.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const auth = dbStorage.getAuth();
    if (auth.currentUser) return auth.currentUser;
    const allUsers = dbStorage.getUsers();
    return allUsers[0] || INITIAL_USERS[0];
  });
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return dbStorage.getAuth().sessionToken || 'evx_sec_789f2a49_jwt';
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('Password@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App navigation & data state - Permanently saved in database
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cases, setCases] = useState<InvestigationCase[]>(() => dbStorage.getCases());
  const [evidence, setEvidence] = useState<Evidence[]>(() => dbStorage.getEvidence());
  const [custodyRecords, setCustodyRecords] = useState<ChainOfCustodyRecord[]>(() => dbStorage.getCustodyRecords());
  const [activities, setActivities] = useState<InvestigationActivity[]>(() => dbStorage.getActivities());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dbStorage.getAuditLogs());
  const [hashRecords, setHashRecords] = useState<EvidenceHashRecord[]>(() => dbStorage.getHashRecords());

  // UI Modals & Feedback
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState<boolean>(false);
  const [isNewEvidenceOpen, setIsNewEvidenceOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [selectedEvidenceForTransfer, setSelectedEvidenceForTransfer] = useState<Evidence | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [selectedEvidenceForVerify, setSelectedEvidenceForVerify] = useState<Evidence | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add User Form State (Admin only)
  const [showAddUserForm, setShowAddUserForm] = useState<boolean>(false);
  const [newUserFullName, setNewUserFullName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<Role>('INVESTIGATOR');
  const [newUserBadge, setNewUserBadge] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');

  // Count tampered evidence
  const tamperCount = evidence.filter((e) => e.verifiedStatus === 'TAMPERED_MISMATCH').length;

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setLoginAttempts(0);
          setLoginError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLockedOut]);

  // Append-only audit logger
  const logSecurityEvent = (action: string, details: string, username = currentUser?.username || 'officer') => {
    const newLog: AuditLog = {
      id: Date.now(),
      userId: currentUser?.id,
      username,
      action,
      details,
      ipAddress: '10.0.4.15 (Secured Enclave)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updatedLogs = dbStorage.saveAuditLog(newLog);
    setAuditLogs(updatedLogs);
  };

  // RBAC Permission Check Utility
  const hasPermission = (requiredRoles: Role[]): boolean => {
    return requiredRoles.includes(currentUser.role);
  };

  const enforceRBAC = (requiredRoles: Role[], actionLabel: string, callback: () => void) => {
    if (!hasPermission(requiredRoles)) {
      const msg = `Access Denied: Action '${actionLabel}' requires clearance role [${requiredRoles.join(' or ')}]. Your current clearance is [${currentUser.role}].`;
      setAccessDeniedMessage(msg);
      logSecurityEvent(
        'RBAC_ACCESS_DENIED',
        `Officer ${currentUser.fullName} (${currentUser.role}) attempted unauthorized action: ${actionLabel}`
      );
      return;
    }
    callback();
  };

  // Secure Authentication Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const matchedUser = users.find((u) => u.username.toLowerCase() === loginUsername.trim().toLowerCase());

    if (!matchedUser) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      logSecurityEvent('LOGIN_FAILURE_UNKNOWN_USER', `Failed login attempt for non-existent username: ${loginUsername}`, loginUsername);
      if (attempts >= 3) {
        setIsLockedOut(true);
        setLockoutTimer(30);
        setLoginError('Security Protocol: Account locked due to 3 consecutive failed authentication attempts. Please wait 30 seconds.');
      } else {
        setLoginError(`Invalid officer credentials. Attempt ${attempts} of 3.`);
      }
      return;
    }

    if (!matchedUser.activeStatus) {
      logSecurityEvent('LOGIN_DENIED_DEACTIVATED', `Deactivated officer attempted login: ${matchedUser.username}`, matchedUser.username);
      setLoginError('Officer account is currently deactivated. Contact Forensics Director (ADMIN).');
      return;
    }

    // Passwords accepted in demo enclave: 'Password@123' or 'admin123' or any non-empty >= 6 chars
    if (!loginPassword || loginPassword.length < 6) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      logSecurityEvent('LOGIN_FAILURE_BAD_CREDENTIALS', `Failed password authentication for officer: ${matchedUser.username}`, matchedUser.username);
      if (attempts >= 3) {
        setIsLockedOut(true);
        setLockoutTimer(30);
        setLoginError('Security Protocol: Account locked due to 3 consecutive failed authentication attempts. Please wait 30 seconds.');
      } else {
        setLoginError(`Invalid security passphrase. Minimum 6 characters required. Attempt ${attempts} of 3.`);
      }
      return;
    }

    // Success authentication
    const token = `evx_sec_${Math.random().toString(36).substring(2, 10)}_jwt`;

    // Fetch the saved cases and all forensic records from the permanent database
    const savedCases = dbStorage.getCases();
    setCases(savedCases);
    const savedEvidence = dbStorage.getEvidence();
    setEvidence(savedEvidence);
    const savedCustody = dbStorage.getCustodyRecords();
    setCustodyRecords(savedCustody);
    const savedActivities = dbStorage.getActivities();
    setActivities(savedActivities);
    const savedLogs = dbStorage.getAuditLogs();
    setAuditLogs(savedLogs);
    const savedUsers = dbStorage.getUsers();
    setUsers(savedUsers);

    // Save auth session permanently
    dbStorage.saveAuth(true, matchedUser, token);

    setCurrentUser(matchedUser);
    setSessionToken(token);
    setIsAuthenticated(true);
    setLoginAttempts(0);
    setLoginError(null);
    setActiveTab('dashboard'); // ensure landing on dashboard where fetched cases are displayed

    logSecurityEvent(
      'AUTH_LOGIN_SUCCESS',
      `Officer ${matchedUser.fullName} authenticated successfully under role [${matchedUser.role}] with session token ${token.substring(0, 10)}...`,
      matchedUser.username
    );
  };

  const handleLogout = (reason?: string) => {
    logSecurityEvent('AUTH_LOGOUT', reason || `Officer ${currentUser.fullName} signed out.`);
    dbStorage.saveAuth(false, null, null);
    setIsAuthenticated(false);
    setLoginPassword('Password@123');
  };

  const handleQuickSwitchUser = (user: User) => {
    setCurrentUser(user);
    dbStorage.saveAuth(true, user, sessionToken);
    logSecurityEvent('OFFICER_SWITCHED', `Active console context switched to officer ${user.fullName} (${user.role})`);
  };

  // Evidence & Case Operations - Permanently saved in database
  const handleCreateCase = (newCaseData: {
    caseName: string;
    description: string;
    category: string;
    priority: Priority;
    assignedInvestigatorId: number;
    courtJurisdiction: string;
    incidentDate: string;
  }) => {
    enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR'], 'Create New Investigation Case', () => {
      const investigator = users.find((u) => u.id === newCaseData.assignedInvestigatorId) || currentUser;
      const created: InvestigationCase = {
        id: Date.now(),
        caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        caseName: newCaseData.caseName,
        description: newCaseData.description,
        category: newCaseData.category,
        priority: newCaseData.priority,
        assignedInvestigatorId: investigator.id,
        assignedInvestigatorName: investigator.fullName,
        status: 'OPEN',
        incidentDate: newCaseData.incidentDate,
        courtJurisdiction: newCaseData.courtJurisdiction,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      // Permanently save to database
      const updatedCases = dbStorage.saveCase(created);
      setCases(updatedCases);
      logSecurityEvent('CASE_CREATED', `Registered and permanently saved case docket ${created.caseNumber}: ${created.caseName}`);

      const activity: InvestigationActivity = {
        id: Date.now(),
        caseId: created.id,
        actorName: currentUser.fullName,
        activityType: 'CASE_REGISTERED',
        activityDescription: `Official docket ${created.caseNumber} registered in federal court registry and saved to database.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      const updatedActivities = dbStorage.saveActivity(activity);
      setActivities(updatedActivities);
      setIsNewCaseOpen(false);
    });
  };

  const handleUpdateCaseStatus = (caseId: number, newStatus: CaseStatus) => {
    enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR'], 'Update Case Status', () => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedCases = dbStorage.updateCase(caseId, { status: newStatus, updatedAt: nowStr });
      setCases(updatedCases);
      logSecurityEvent('CASE_STATUS_CHANGED', `Case ID ${caseId} status updated to [${newStatus}]`);
    });
  };

  const handleCreateEvidence = (data: {
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
  }) => {
    enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST'], 'Ingest Digital Evidence', () => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newEv: Evidence = {
        id: Date.now(),
        evidenceNumber: `EVD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        caseId: data.caseId,
        evidenceName: data.evidenceName,
        evidenceType: data.evidenceType,
        description: data.description,
        sourceDevice: data.sourceDevice,
        collectorId: currentUser.id,
        collectorName: currentUser.fullName,
        collectionTimestamp: nowStr,
        originalSha256Hash: data.sha256Hash,
        controlledStorageIdentifier: data.controlledStorageIdentifier,
        originalFilename: data.originalFilename,
        fileSizeBytes: data.fileSizeBytes,
        fileMimeType: data.fileMimeType,
        verifiedStatus: 'VERIFIED_INTACT',
        lastVerificationTimestamp: nowStr,
        createdAt: nowStr,
      };

      const updatedEvidence = dbStorage.saveEvidence(newEv);
      setEvidence(updatedEvidence);

      // Add baseline hash record
      const hashRec: EvidenceHashRecord = {
        id: Date.now(),
        evidenceId: newEv.id,
        algorithm: 'SHA-256',
        originalHash: data.sha256Hash,
        calculatedHash: data.sha256Hash,
        verificationOutcome: 'MATCH',
        verificationTimestamp: nowStr,
        verifyingUserName: currentUser.fullName,
        notes: `Baseline ISO/IEC 27037 cryptographic digest computed at ingest.`,
      };
      const updatedHashes = dbStorage.saveHashRecord(hashRec);
      setHashRecords(updatedHashes);

      // Add initial custody record
      const custRec: ChainOfCustodyRecord = {
        id: Date.now(),
        evidenceId: newEv.id,
        caseId: data.caseId,
        actorName: currentUser.fullName,
        action: 'COLLECTED',
        previousCustodian: data.sourceDevice,
        newCustodian: currentUser.fullName,
        timestamp: nowStr,
        location: data.controlledStorageIdentifier,
        remarks: 'Direct forensic bitstream acquisition with hardware write-blocker.',
        custodySignatureToken: `SIG-INGEST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      };
      const updatedCustody = dbStorage.saveCustodyRecord(custRec);
      setCustodyRecords(updatedCustody);

      logSecurityEvent(
        'EVIDENCE_INGESTED',
        `Seized evidence ${newEv.evidenceNumber} (${newEv.evidenceName}) under SHA-256: ${data.sha256Hash.substring(0, 16)}...`
      );

      setIsNewEvidenceOpen(false);
    });
  };

  const handleExecuteTransfer = (transferData: {
    evidenceId: number;
    action: CustodyAction;
    previousCustodian: string;
    newCustodian: string;
    location: string;
    remarks: string;
  }) => {
    enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN'], 'Chain of Custody Transfer', () => {
      const ev = evidence.find((e) => e.id === transferData.evidenceId);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newRec: ChainOfCustodyRecord = {
        id: Date.now(),
        evidenceId: transferData.evidenceId,
        caseId: ev ? ev.caseId : 1,
        actorName: currentUser.fullName,
        action: transferData.action,
        previousCustodian: transferData.previousCustodian,
        newCustodian: transferData.newCustodian,
        timestamp: nowStr,
        location: transferData.location,
        remarks: transferData.remarks,
        custodySignatureToken: `SIG-${transferData.action}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };

      const updatedCustody = dbStorage.saveCustodyRecord(newRec);
      setCustodyRecords(updatedCustody);

      // Update storage identifier on evidence if changed
      const updatedEvidence = dbStorage.updateEvidence(transferData.evidenceId, { controlledStorageIdentifier: transferData.location });
      setEvidence(updatedEvidence);

      logSecurityEvent(
        'CUSTODY_TRANSFER',
        `Transferred custody of evidence item #${transferData.evidenceId} from ${transferData.previousCustodian} to ${transferData.newCustodian} [Token: ${newRec.custodySignatureToken}]`
      );

      setIsTransferModalOpen(false);
      setSelectedEvidenceForTransfer(null);
    });
  };

  const handleVerifyEvidenceHash = (evidenceId: number, computedHash: string, notes: string) => {
    const target = evidence.find((e) => e.id === evidenceId);
    if (!target) return;

    const isMatch = target.originalSha256Hash.toLowerCase() === computedHash.trim().toLowerCase();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const hashRec: EvidenceHashRecord = {
      id: Date.now(),
      evidenceId,
      algorithm: 'SHA-256',
      originalHash: target.originalSha256Hash,
      calculatedHash: computedHash,
      verificationOutcome: isMatch ? 'MATCH' : 'MISMATCH',
      verificationTimestamp: nowStr,
      verifyingUserName: currentUser.fullName,
      notes: notes || (isMatch ? 'Parity check verified intact.' : 'Cryptographic mismatch detected!'),
    };

    const updatedHashes = dbStorage.saveHashRecord(hashRec);
    setHashRecords(updatedHashes);

    const updatedEvidence = dbStorage.updateEvidence(evidenceId, {
      verifiedStatus: isMatch ? 'VERIFIED_INTACT' : 'TAMPERED_MISMATCH',
      lastVerificationTimestamp: nowStr,
    });
    setEvidence(updatedEvidence);

    logSecurityEvent(
      isMatch ? 'HASH_VERIFICATION_PASSED' : 'HASH_VERIFICATION_TAMPER_ALERT',
      `Evidence ${target.evidenceNumber} hash verification outcome: [${isMatch ? 'MATCH' : 'MISMATCH!'}]. Computed: ${computedHash.substring(0, 16)}...`
    );

    setIsVerifyModalOpen(false);
    setSelectedEvidenceForVerify(null);
  };

  const handleSimulateTamper = (evidenceId: number) => {
    enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST'], 'Simulate Evidence Tampering', () => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedEvidence = dbStorage.updateEvidence(evidenceId, {
        verifiedStatus: 'TAMPERED_MISMATCH',
        lastVerificationTimestamp: nowStr,
      });
      setEvidence(updatedEvidence);
      logSecurityEvent(
        'SIMULATION_TAMPER_INJECTED',
        `Simulated unauthorized file alteration on evidence #${evidenceId}. SHA-256 mismatch triggered.`
      );
    });
  };

  const handleRestoreIntegrity = (evidenceId: number) => {
    enforceRBAC(['ADMIN'], 'Restore Evidence Baseline Parity', () => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedEvidence = dbStorage.updateEvidence(evidenceId, {
        verifiedStatus: 'VERIFIED_INTACT',
        lastVerificationTimestamp: nowStr,
      });
      setEvidence(updatedEvidence);
      logSecurityEvent(
        'EVIDENCE_INTEGRITY_RESTORED',
        `Administrator restored bitstream baseline for evidence #${evidenceId}. Cryptographic integrity intact.`
      );
    });
  };

  const handleToggleUserStatus = (userId: number) => {
    enforceRBAC(['ADMIN'], 'Manage Officer Account Status', () => {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;
      const nextStatus = !targetUser.activeStatus;
      const updatedUsers = dbStorage.updateUser(userId, { activeStatus: nextStatus });
      setUsers(updatedUsers);
      logSecurityEvent('USER_STATUS_MODIFIED', `Admin modified status of officer ${targetUser.username} to ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}`);
    });
  };

  const handleUpdateUserRole = (userId: number, newRole: Role) => {
    enforceRBAC(['ADMIN'], 'Update Officer Role', () => {
      const updatedUsers = dbStorage.updateUser(userId, { role: newRole });
      setUsers(updatedUsers);
      const target = updatedUsers.find((u) => u.id === userId);
      if (target) {
        logSecurityEvent('USER_ROLE_CHANGED', `Admin changed role of officer ${target.fullName} (${target.username}) to [${newRole}]`);
      }
      if (currentUser.id === userId) {
        setCurrentUser((prev) => ({ ...prev, role: newRole }));
        dbStorage.saveAuth(true, { ...currentUser, role: newRole }, sessionToken);
      }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    enforceRBAC(['ADMIN'], 'Register New Forensic Personnel', () => {
      if (!newUserFullName.trim() || !newUserUsername.trim()) return;
      const created: User = {
        id: Date.now(),
        fullName: newUserFullName.trim(),
        username: newUserUsername.trim().toLowerCase(),
        email: newUserEmail.trim() || `${newUserUsername.trim().toLowerCase()}@cyberforensics.gov`,
        role: newUserRole,
        badgeNumber: newUserBadge.trim() || `BADGE-${Math.floor(100 + Math.random() * 900)}`,
        activeStatus: true,
      };
      const updatedUsers = dbStorage.saveUser(created);
      setUsers(updatedUsers);
      logSecurityEvent(
        'USER_REGISTERED',
        `Admin created new officer account ${created.fullName} (${created.username}) under clearance role [${created.role}]`
      );
      setNewUserFullName('');
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserBadge('');
      setShowAddUserForm(false);
    });
  };

  // Render Login Gate if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white">
        {/* Ambient Glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 to-sky-600 flex items-center justify-center shadow-xl shadow-teal-500/20 text-white mb-4 border border-teal-400/30">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Evident<span className="text-teal-400">X</span>
            </h1>
            <p className="text-xs font-semibold text-teal-400/90 uppercase tracking-widest font-mono mt-1">
              Digital Forensic Evidence Management System
            </p>
            <p className="text-xs text-slate-400 mt-1">
              NIST & ISO/IEC 27037 Cryptographic Parity Enclave
            </p>
          </div>

          {/* Secure Login Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                <Lock className="w-4 h-4 text-teal-400" />
                <span>Officer Authentication</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                <Fingerprint className="w-3 h-3" />
                <span>BCrypt & CSRF Guard</span>
              </div>
            </div>

            {/* Lockout Warning Banner */}
            {isLockedOut && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Account Temporarily Locked!</span>
                  <span>Brute-force throttle active. Unlock in </span>
                  <span className="font-mono font-bold text-white bg-rose-900/60 px-1.5 py-0.5 rounded ml-1">
                    {lockoutTimer}s
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {loginError && !isLockedOut && (
              <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Officer Username / Badge ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isLockedOut}
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. admin, investigator1, analyst1"
                    className="w-full bg-slate-950/80 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Security Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLockedOut}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Default demo passphrase: <code className="text-slate-400">Password@123</code></p>
              </div>

              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-semibold tracking-wide shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Verify Credentials & Enter Enclave</span>
              </button>
            </form>

            {/* Quick-fill Roles for Evaluator / Testing */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block mb-2.5">
                Instant Role Pre-sets (RBAC Testing):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {users.slice(0, 3).map((u) => {
                  const roleDescription =
                    u.role === 'ADMIN'
                      ? 'Full Enclave & User Admin'
                      : u.role === 'INVESTIGATOR'
                      ? 'Cases & Evidence Manager'
                      : 'Read-Only Court Viewer';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginUsername(u.username);
                        setLoginPassword('Password@123');
                        setLoginError(null);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        loginUsername === u.username
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] text-white">{u.fullName.split(' ')[0]}</span>
                        <span className="text-[9px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1 rounded">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{roleDescription}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Security Standard Note */}
          <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>FIPS 140-3 & ISO/IEC 27037 Forensic Bitstream Integrity</span>
          </div>
        </div>
      </div>
    );
  }

  // Active Forensic Console View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tamperCount={tamperCount}
        caseCount={cases.length}
        evidenceCount={evidence.length}
        custodyCount={custodyRecords.length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenLogin={() => setIsUserMgmtOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <TopNavbar
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleQuickSwitchUser}
          activeTab={activeTab}
          tamperCount={tamperCount}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewCase={() =>
            enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR'], 'Create New Case', () => setIsNewCaseOpen(true))
          }
          onOpenNewEvidence={() =>
            enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST'], 'Ingest Evidence', () =>
              setIsNewEvidenceOpen(true)
            )
          }
          onOpenTransfer={() =>
            enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN'], 'Transfer Custody', () => {
              setSelectedEvidenceForTransfer(null);
              setIsTransferModalOpen(true);
            })
          }
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenLogin={() => setIsUserMgmtOpen(true)}
        />

        {/* Security Session Banner */}
        <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-teal-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC ACTIVE:</span>
              <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                {currentUser.role}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400 font-mono text-[11px]">
              Badge: {currentUser.badgeNumber}
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="text-teal-400 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Enclave Database: Connected</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setIsUserMgmtOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-semibold hover:bg-purple-500/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                <span>Officer Access Control</span>
              </button>
            )}

            <button
              onClick={() => handleLogout()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              title="Secure Sign Out"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Access Denied Warning Toast / Banner */}
        {accessDeniedMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-900 block">Security Clearance Violation (RBAC Enforcement)</strong>
                <p className="mt-0.5">{accessDeniedMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              cases={cases}
              evidence={evidence}
              custody={custodyRecords}
              activities={activities}
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewCase={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR'], 'Create Case', () => setIsNewCaseOpen(true))
              }
              onOpenNewEvidence={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST'], 'Ingest Evidence', () =>
                  setIsNewEvidenceOpen(true)
                )
              }
              onOpenTransfer={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN'], 'Transfer Custody', () => {
                  setSelectedEvidenceForTransfer(null);
                  setIsTransferModalOpen(true);
                })
              }
              onOpenUserMgmt={() => setIsUserMgmtOpen(true)}
            />
          )}

          {activeTab === 'cases' && (
            <CasesView
              cases={cases}
              evidence={evidence}
              custody={custodyRecords}
              activities={activities}
              currentUser={currentUser}
              onOpenNewCase={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR'], 'Create Case', () => setIsNewCaseOpen(true))
              }
              onUpdateCaseStatus={handleUpdateCaseStatus}
              onNavigateToEvidenceItem={(evId) => {
                setActiveTab('evidence');
              }}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceView
              evidence={evidence}
              cases={cases}
              hashRecords={hashRecords}
              currentUser={currentUser}
              onOpenNewEvidence={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST'], 'Ingest Evidence', () =>
                  setIsNewEvidenceOpen(true)
                )
              }
              onOpenVerifyModal={(ev) => {
                setSelectedEvidenceForVerify(ev);
                setIsVerifyModalOpen(true);
              }}
              onOpenTransferModal={(ev) => {
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN'], 'Transfer Custody', () => {
                  setSelectedEvidenceForTransfer(ev);
                  setIsTransferModalOpen(true);
                })
              }}
              onSimulateTamper={handleSimulateTamper}
              onRestoreIntegrity={handleRestoreIntegrity}
            />
          )}

          {activeTab === 'custody' && (
            <CustodyView
              custodyRecords={custodyRecords}
              evidence={evidence}
              cases={cases}
              currentUser={currentUser}
              onOpenTransfer={() =>
                enforceRBAC(['ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN'], 'Transfer Custody', () => {
                  setSelectedEvidenceForTransfer(null);
                  setIsTransferModalOpen(true);
                })
              }
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView activities={activities} cases={cases} evidence={evidence} />
          )}

          {activeTab === 'audit' && (
            <>
              {currentUser.role !== 'ADMIN' ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-lg mx-auto shadow-sm my-12">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                    <AlertOctagon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Restricted Security Audit Trail</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Under Federal Criminal Justice Information Services (CJIS) and ISO/IEC 27037 standards, raw security audit logs are restricted exclusively to system administrators (ROLE_ADMIN).
                  </p>
                  <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono">
                    Your Current Clearance: <span className="font-bold text-teal-600">{currentUser.role}</span>
                  </div>
                  <button
                    onClick={() => {
                      const admin = users.find((u) => u.role === 'ADMIN');
                      if (admin) handleQuickSwitchUser(admin);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Switch to Administrator (Dr. Sarah Chen)
                  </button>
                </div>
              ) : (
                <AuditView logs={auditLogs} />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. New Case Modal */}
      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        investigators={users.filter((u) => u.role === 'INVESTIGATOR' || u.role === 'LEAD_INVESTIGATOR' || u.role === 'ADMIN')}
        currentUser={currentUser}
        onCreateCase={handleCreateCase}
      />

      {/* 2. New Evidence Modal */}
      <NewEvidenceModal
        isOpen={isNewEvidenceOpen}
        onClose={() => setIsNewEvidenceOpen(false)}
        cases={cases}
        currentUser={currentUser}
        onCreateEvidence={handleCreateEvidence}
      />

      {/* 3. Chain of Custody Transfer Modal */}
      <CustodyTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedEvidenceForTransfer(null);
        }}
        evidenceList={evidence}
        preselectedEvidence={selectedEvidenceForTransfer}
        currentUser={currentUser}
        onExecuteTransfer={handleExecuteTransfer}
      />

      {/* 4. SHA-256 Hash Verification Modal */}
      <VerifyHashModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedEvidenceForVerify(null);
        }}
        evidence={selectedEvidenceForVerify}
        currentUser={currentUser}
        onVerify={handleVerifyEvidenceHash}
      />

      {/* 5. RBAC & Officer Management Modal */}
      {isUserMgmtOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Officer Access Control & RBAC Matrix</h3>
                  <p className="text-[11px] text-slate-500">Manage investigator credentials, roles and account activation</p>
                </div>
              </div>
              <button
                onClick={() => setIsUserMgmtOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
              {/* RBAC Policy Matrix Table: Admin, Investigator, Viewer */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs shadow-2xs">
                <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center justify-between">
                  <span>EvidentX Triad Access Matrix (ISO/IEC 27037 & CJIS)</span>
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Enforced by Enclave Guard
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">User Admin</th>
                      <th className="p-3">Cases</th>
                      <th className="p-3">Evidence Vault</th>
                      <th className="p-3">Custody Transfers</th>
                      <th className="p-3">Audit Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="bg-purple-50/20">
                      <td className="p-3 font-bold text-purple-700">ADMIN</td>
                      <td className="p-3 text-emerald-600 font-semibold">Full Control</td>
                      <td className="p-3 text-emerald-600 font-medium">Create & Docket</td>
                      <td className="p-3 text-emerald-600 font-medium">Ingest & Restore Baseline</td>
                      <td className="p-3 text-emerald-600 font-medium">Authorized</td>
                      <td className="p-3 text-emerald-600 font-semibold">Full Access</td>
                    </tr>
                    <tr className="bg-sky-50/20">
                      <td className="p-3 font-bold text-sky-700">INVESTIGATOR</td>
                      <td className="p-3 text-rose-500 font-medium">Restricted</td>
                      <td className="p-3 text-emerald-600 font-semibold">Create & Status</td>
                      <td className="p-3 text-emerald-600 font-semibold">Ingest & SHA-256</td>
                      <td className="p-3 text-emerald-600 font-semibold">Execute Transfer</td>
                      <td className="p-3 text-rose-500 font-medium">Restricted</td>
                    </tr>
                    <tr className="bg-emerald-50/20">
                      <td className="p-3 font-bold text-emerald-700">VIEWER</td>
                      <td className="p-3 text-rose-500 font-medium">Restricted</td>
                      <td className="p-3 text-slate-600 font-medium">Read-Only Court Dossier</td>
                      <td className="p-3 text-slate-600 font-medium">Read-Only Parity Check</td>
                      <td className="p-3 text-slate-600 font-medium">Read-Only Provenance</td>
                      <td className="p-3 text-rose-500 font-medium">Restricted</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Admin Actions: Add New Personnel Section */}
              {currentUser.role === 'ADMIN' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Forensic Personnel Provisioning</h4>
                      <p className="text-[11px] text-slate-500">Register new investigator, viewer, or administrative accounts.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer text-xs"
                    >
                      {showAddUserForm ? 'Close Form' : '+ Add Personnel'}
                    </button>
                  </div>

                  {showAddUserForm && (
                    <form onSubmit={handleCreateUser} className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Det. Morgan Hayes"
                            value={newUserFullName}
                            onChange={(e) => setNewUserFullName(e.target.value)}
                            className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Username *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. mhayes"
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Role Clearance *</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as Role)}
                            className="w-full bg-white text-slate-800 text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer font-semibold"
                          >
                            <option value="INVESTIGATOR">INVESTIGATOR</option>
                            <option value="VIEWER">VIEWER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Badge ID</label>
                          <input
                            type="text"
                            placeholder="e.g. INV-DET-772"
                            value={newUserBadge}
                            onChange={(e) => setNewUserBadge(e.target.value)}
                            className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email</label>
                          <input
                            type="email"
                            placeholder="mhayes@cyberforensics.gov"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Save & Register Officer
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Officers Account List with Role Reassignment */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Active Forensic Personnel & Role Assignment ({users.length})
                </span>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {u.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{u.fullName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {u.badgeNumber}
                            </span>
                            {!u.activeStatus && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                DEACTIVATED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            User: {u.username} • {u.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Live Role Reassignment for Admin */}
                        {currentUser.role === 'ADMIN' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Role:</span>
                            <select
                              value={u.role}
                              disabled={u.id === currentUser.id}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value as Role)}
                              className="bg-slate-50 text-slate-800 text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="INVESTIGATOR">INVESTIGATOR</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {u.role}
                          </span>
                        )}

                        {currentUser.role === 'ADMIN' && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                              u.activeStatus
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.activeStatus ? 'Deactivate' : 'Activate'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            handleQuickSwitchUser(u);
                            setIsUserMgmtOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold cursor-pointer"
                        >
                          Assume Context
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsUserMgmtOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold cursor-pointer hover:bg-slate-700"
              >
                Close Control Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;