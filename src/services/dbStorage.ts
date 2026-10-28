import {
  InvestigationCase,
  Evidence,
  ChainOfCustodyRecord,
  InvestigationActivity,
  AuditLog,
  EvidenceHashRecord,
  User,
} from '../types';
import {
  INITIAL_CASES,
  INITIAL_EVIDENCE,
  INITIAL_CUSTODY_RECORDS,
  INITIAL_ACTIVITIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_HASH_RECORDS,
  INITIAL_USERS,
} from '../data/initialData';

const STORAGE_KEYS = {
  CASES: 'evidentx_db_cases',
  EVIDENCE: 'evidentx_db_evidence',
  CUSTODY: 'evidentx_db_custody',
  ACTIVITIES: 'evidentx_db_activities',
  AUDIT_LOGS: 'evidentx_db_audit_logs',
  HASH_RECORDS: 'evidentx_db_hash_records',
  USERS: 'evidentx_db_users',
  AUTH: 'evidentx_db_auth',
};

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed with default value
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? defaultValue;
  } catch (error) {
    console.error(`Failed to read ${key} from storage:`, error);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key} to storage:`, error);
  }
}

export const dbStorage = {
  // --- CASES ---
  getCases(): InvestigationCase[] {
    return safeGet<InvestigationCase[]>(STORAGE_KEYS.CASES, INITIAL_CASES);
  },

  saveCase(newCase: InvestigationCase): InvestigationCase[] {
    const current = this.getCases();
    // Prepend new case; if case already exists by ID, update it instead
    const existingIndex = current.findIndex((c) => c.id === newCase.id || c.caseNumber === newCase.caseNumber);
    let updated: InvestigationCase[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newCase;
    } else {
      updated = [newCase, ...current];
    }
    safeSet(STORAGE_KEYS.CASES, updated);
    return updated;
  },

  updateCase(caseId: number, updates: Partial<InvestigationCase>): InvestigationCase[] {
    const current = this.getCases();
    const updated = current.map((c) => (c.id === caseId ? { ...c, ...updates } : c));
    safeSet(STORAGE_KEYS.CASES, updated);
    return updated;
  },

  saveCases(cases: InvestigationCase[]): void {
    safeSet(STORAGE_KEYS.CASES, cases);
  },

  // --- EVIDENCE ---
  getEvidence(): Evidence[] {
    return safeGet<Evidence[]>(STORAGE_KEYS.EVIDENCE, INITIAL_EVIDENCE);
  },

  saveEvidence(newEvidence: Evidence): Evidence[] {
    const current = this.getEvidence();
    const existingIndex = current.findIndex((e) => e.id === newEvidence.id || e.evidenceNumber === newEvidence.evidenceNumber);
    let updated: Evidence[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newEvidence;
    } else {
      updated = [newEvidence, ...current];
    }
    safeSet(STORAGE_KEYS.EVIDENCE, updated);
    return updated;
  },

  updateEvidence(evidenceId: number, updates: Partial<Evidence>): Evidence[] {
    const current = this.getEvidence();
    const updated = current.map((e) => (e.id === evidenceId ? { ...e, ...updates } : e));
    safeSet(STORAGE_KEYS.EVIDENCE, updated);
    return updated;
  },

  saveEvidenceList(list: Evidence[]): void {
    safeSet(STORAGE_KEYS.EVIDENCE, list);
  },

  // --- CHAIN OF CUSTODY ---
  getCustodyRecords(): ChainOfCustodyRecord[] {
    return safeGet<ChainOfCustodyRecord[]>(STORAGE_KEYS.CUSTODY, INITIAL_CUSTODY_RECORDS);
  },

  saveCustodyRecord(rec: ChainOfCustodyRecord): ChainOfCustodyRecord[] {
    const current = this.getCustodyRecords();
    const updated = [rec, ...current];
    safeSet(STORAGE_KEYS.CUSTODY, updated);
    return updated;
  },

  saveCustodyRecords(list: ChainOfCustodyRecord[]): void {
    safeSet(STORAGE_KEYS.CUSTODY, list);
  },

  // --- ACTIVITIES ---
  getActivities(): InvestigationActivity[] {
    return safeGet<InvestigationActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  },

  saveActivity(act: InvestigationActivity): InvestigationActivity[] {
    const current = this.getActivities();
    const updated = [act, ...current];
    safeSet(STORAGE_KEYS.ACTIVITIES, updated);
    return updated;
  },

  saveActivities(list: InvestigationActivity[]): void {
    safeSet(STORAGE_KEYS.ACTIVITIES, list);
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return safeGet<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  saveAuditLog(log: AuditLog): AuditLog[] {
    const current = this.getAuditLogs();
    const updated = [log, ...current];
    safeSet(STORAGE_KEYS.AUDIT_LOGS, updated);
    return updated;
  },

  saveAuditLogs(list: AuditLog[]): void {
    safeSet(STORAGE_KEYS.AUDIT_LOGS, list);
  },

  // --- HASH RECORDS ---
  getHashRecords(): EvidenceHashRecord[] {
    return safeGet<EvidenceHashRecord[]>(STORAGE_KEYS.HASH_RECORDS, INITIAL_HASH_RECORDS);
  },

  saveHashRecord(rec: EvidenceHashRecord): EvidenceHashRecord[] {
    const current = this.getHashRecords();
    const updated = [rec, ...current];
    safeSet(STORAGE_KEYS.HASH_RECORDS, updated);
    return updated;
  },

  saveHashRecords(list: EvidenceHashRecord[]): void {
    safeSet(STORAGE_KEYS.HASH_RECORDS, list);
  },

  // --- USERS ---
  getUsers(): User[] {
    return safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  saveUser(newUser: User): User[] {
    const current = this.getUsers();
    const existingIndex = current.findIndex((u) => u.id === newUser.id || u.username === newUser.username);
    let updated: User[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newUser;
    } else {
      updated = [...current, newUser];
    }
    safeSet(STORAGE_KEYS.USERS, updated);
    return updated;
  },

  updateUser(userId: number, updates: Partial<User>): User[] {
    const current = this.getUsers();
    const updated = current.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    safeSet(STORAGE_KEYS.USERS, updated);
    return updated;
  },

  saveUsers(users: User[]): void {
    safeSet(STORAGE_KEYS.USERS, users);
  },

  // --- AUTH SESSION PERSISTENCE ---
  getAuth(): { isAuthenticated: boolean; currentUser: User | null; sessionToken: string | null } {
    return safeGet<{ isAuthenticated: boolean; currentUser: User | null; sessionToken: string | null }>(
      STORAGE_KEYS.AUTH,
      { isAuthenticated: true, currentUser: INITIAL_USERS[0], sessionToken: 'evx_sec_789f2a49_jwt' }
    );
  },

  saveAuth(isAuthenticated: boolean, currentUser: User | null, sessionToken: string | null): void {
    safeSet(STORAGE_KEYS.AUTH, { isAuthenticated, currentUser, sessionToken });
  },

  clearAuth(): void {
    safeSet(STORAGE_KEYS.AUTH, { isAuthenticated: false, currentUser: null, sessionToken: null });
  },
};
