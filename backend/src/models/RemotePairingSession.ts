import mongoose, { Document, Schema } from 'mongoose';

export interface IRemotePairingSession extends Document {
  pairingToken: string;
  organizationId: string;
  tournamentId: string;
  matchId: string;
  sessionId: string;
  expiresAt: Date;
  isConsumed: boolean;
  consumedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RemotePairingSessionSchema = new Schema<IRemotePairingSession>(
  {
    pairingToken: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    tournamentId: { type: String, required: true, index: true },
    matchId: { type: String, default: 'none' },
    sessionId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    isConsumed: { type: Boolean, default: false, index: true },
    consumedByUserId: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const RemotePairingSession = mongoose.model<IRemotePairingSession>(
  'RemotePairingSession',
  RemotePairingSessionSchema
);
