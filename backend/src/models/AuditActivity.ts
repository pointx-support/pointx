import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditActivity extends Document {
  customId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  category: 'tournament' | 'match' | 'scoring' | 'graphics' | 'obs' | 'security';
  details: string;
  ipAddress?: string;
  timestamp: string;
  createdAt: Date;
}

const AuditActivitySchema = new Schema<IAuditActivity>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    userName: { type: String },
    userEmail: { type: String },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ['tournament', 'match', 'scoring', 'graphics', 'obs', 'security'],
      required: true,
      index: true,
    },
    details: { type: String, required: true },
    ipAddress: { type: String },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.customId || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditActivitySchema.index({ createdAt: -1 });

export const AuditActivity = mongoose.model<IAuditActivity>('AuditActivity', AuditActivitySchema);
