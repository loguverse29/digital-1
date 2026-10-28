export type Role = 'ADMIN' | 'INVESTIGATOR' | 'VIEWER' | 'LEAD_INVESTIGATOR' | 'FORENSIC_ANALYST' | 'EVIDENCE_CUSTODIAN';

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceType =
  | 'DISK_IMAGE'
  | 'MEMORY_DUMP'
  | 'NETWORK_PCAP'
  | 'MOBILE_EXTRACTION'
  | 'LOG_ARCHIVE'
  | 'ENCRYPTED_MEDIA'
  | 'EMAIL_MBOX'
  | 'DOCUMENT';

export type VerificationStatus = 'PENDING' | 'VERIFIED_INTACT' | 'TAMPERED_MISMATCH';

export type CustodyAction =
  | 'COLLECTED'
  | 'TRANSFERRED'
  | 'LAB_ANALYSIS'
  | 'COURT_PRODUCTION'
  | 'SECURE_STORAGE_DEPOSIT'
  | 'RETURN_TO_OWNER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  badgeNumber: string;
  activeStatus: boolean;
}

export interface InvestigationCase {
  id: number;
  caseNumber: string;
  caseName: string;
  description: string;
  category: string;
  priority: Priority;
  assignedInvestigatorId: number;
  assignedInvestigatorName: string;
  status: CaseStatus;
  incidentDate: string;
  courtJurisdiction: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: number;
  evidenceNumber: string;
  caseId: number;
  evidenceName: string;
  evidenceType: EvidenceType;
  description: string;
  sourceDevice: string;
  collectorId: number;
  collectorName: string;
  collectionTimestamp: string;
  originalSha256Hash: string;
  controlledStorageIdentifier: string;
  originalFilename: string;
  fileSizeBytes: number;
  fileMimeType: string;
  verifiedStatus: VerificationStatus;
  lastVerificationTimestamp?: string;
  createdAt: string;
}

export interface EvidenceHashRecord {
  id: number;
  evidenceId: number;
  algorithm: string;
  originalHash: string;
  calculatedHash: string;
  verificationOutcome: 'MATCH' | 'MISMATCH';
  verificationTimestamp: string;
  verifyingUserName: string;
  notes?: string;
}

export interface ChainOfCustodyRecord {
  id: number;
  evidenceId: number;
  caseId: number;
  actorName: string;
  action: CustodyAction;
  previousCustodian: string;
  newCustodian: string;
  timestamp: string;
  location: string;
  remarks: string;
  custodySignatureToken: string;
}

export interface InvestigationActivity {
  id: number;
  caseId: number;
  evidenceId?: number;
  actorName: string;
  activityType: string;
  activityDescription: string;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}
