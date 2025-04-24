export interface Stat {
  title: string;
  value: number;
  total?: number;
  color: string;
  borderColor: string;
}

export interface Application {
  id?: string | number;
  company: string;
  location: string;
  position: string;
  status: string;
  date: string;
  color: string;
  hasNotes?: boolean;
  hasCommunications?: boolean;
  hasReminders?: boolean;
  hasDocuments?: boolean;
}

export interface Event {
  id: string | number;
  title: string;
  company: string;
  time: string;
  date: string;
  color: string;
}

export interface Note {
  id: string;
  applicationId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Communication {
  id: string;
  applicationId: string;
  type: 'email' | 'phone' | 'meeting' | 'other';
  subject: string;
  content: string;
  date: Date;
  direction: 'incoming' | 'outgoing';
  contactPerson?: string;
  createdAt: Date;
}

export interface FollowUpReminder {
  id: string;
  applicationId: string;
  date: Date;
  reminderText: string;
  isCompleted: boolean;
  createdAt: Date;
  notificationShown?: boolean;  
  notifyBefore?: number;       
}

export interface Document {
  id: string;
  applicationId: string;
  name: string;
  type: 'lebenslauf' | 'anschreiben' | 'zeugnis' | 'andere';
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  tags?: string[];
  version?: number;
  fileData?: string;
}

export interface StatusChange {
  id: string;
  applicationId: string;
  oldStatus: string | null;
  newStatus: string;
  timestamp: Date;
}

export type TimelineItemType = 'StatusChange' | 'Note' | 'Communication' | 'Reminder' | 'Document';

export interface TimelineItem {
  id: string;
  timestamp: Date;
  type: TimelineItemType;
  data: StatusChange | Note | Communication | FollowUpReminder | Document;
  title?: string;
  icon?: string;
}

export interface Pattern {
  id: string;
  name: string;
  type: 'cover' | 'resume' | 'email' | 'note';
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
  isDefault?: boolean;
}