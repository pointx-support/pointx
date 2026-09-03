import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  targetRole: 'all' | 'admin' | 'organizer';
  createdAt: string;
}

export interface IPlatformSettings extends Document {
  key: string;
  maintenanceMode: boolean;
  maintenanceReason: string;
  allowRegistrations: boolean;
  maxTournamentsPerOrganizer: number;
  maxTeamsPerTournament: number;
  defaultExportResolution: string;
  requireOnboardingVerification: boolean;
  demoTournamentsEnabled: boolean;
  systemAnnouncements: ISystemAnnouncement[];
  createdAt: Date;
  updatedAt: Date;
}

const SystemAnnouncementSchema = new Schema<ISystemAnnouncement>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    isActive: { type: Boolean, default: true },
    targetRole: { type: String, enum: ['all', 'admin', 'organizer'], default: 'all' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global_config' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceReason: { type: String, default: 'Scheduled database indexing and system upgrade.' },
    allowRegistrations: { type: Boolean, default: true },
    maxTournamentsPerOrganizer: { type: Number, default: 25 },
    maxTeamsPerTournament: { type: Number, default: 48 },
    defaultExportResolution: { type: String, default: '4k' },
    requireOnboardingVerification: { type: Boolean, default: true },
    demoTournamentsEnabled: { type: Boolean, default: false },
    systemAnnouncements: { type: [SystemAnnouncementSchema], default: [] },
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
