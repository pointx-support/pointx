import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomTemplate extends Document {
  customId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  aspectRatio: '16:9' | '4:5' | '1:1' | '9:16';
  alignment: Record<string, any>;
  isBuiltIn: boolean;
  isPublished: boolean;
  visibility: 'GLOBAL' | 'ORGANIZATION_RESTRICTED';
  allowedOrganizationIds: string[];
  active: boolean;
  version: number;
  templateType: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomTemplateSchema = new Schema<ICustomTemplate>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    aspectRatio: {
      type: String,
      enum: ['16:9', '4:5', '1:1', '9:16'],
      default: '16:9',
    },
    alignment: { type: Schema.Types.Mixed, required: true },
    isBuiltIn: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    visibility: {
      type: String,
      enum: ['GLOBAL', 'ORGANIZATION_RESTRICTED'],
      default: 'GLOBAL',
      index: true,
    },
    allowedOrganizationIds: {
      type: [String],
      default: [],
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    templateType: { type: String, default: 'standings', maxlength: 50 },
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

export const CustomTemplate = mongoose.model<ICustomTemplate>('CustomTemplate', CustomTemplateSchema);
