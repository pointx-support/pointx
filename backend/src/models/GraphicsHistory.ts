import mongoose, { Document, Schema } from 'mongoose';

export interface IGraphicsHistory extends Document {
  customId: string;
  userId: mongoose.Types.ObjectId;
  tournamentId: string;
  templateId: string;
  templateName: string;
  aspectRatio: string;
  format: 'png' | 'jpeg';
  resolution: string;
  page?: number;
  totalPages?: number;
  dataUrl?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
}

const GraphicsHistorySchema = new Schema<IGraphicsHistory>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tournamentId: { type: String, required: true, index: true },
    templateId: { type: String, required: true },
    templateName: { type: String, required: true },
    aspectRatio: { type: String, default: '16:9' },
    format: { type: String, enum: ['png', 'jpeg'], default: 'png' },
    resolution: { type: String, default: '1080p' },
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    dataUrl: { type: String },
    cloudinaryUrl: { type: String },
    cloudinaryPublicId: { type: String },
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

GraphicsHistorySchema.index({ tournamentId: 1, createdAt: -1 });

export const GraphicsHistory = mongoose.model<IGraphicsHistory>('GraphicsHistory', GraphicsHistorySchema);
