import mongoose, { Document, Schema } from 'mongoose';

export type TemplateType =
  | 'POINTS_TABLE'
  | 'KILL_LEADER'
  | 'TOP_FRAGGERS'
  | 'TEAM_POSTER'
  | 'SLOTS_LIST'
  | 'VICTORY_CERTIFICATE'
  | 'NEEDS_REVIEW';

export const VALID_TEMPLATE_TYPES: TemplateType[] = [
  'POINTS_TABLE',
  'KILL_LEADER',
  'TOP_FRAGGERS',
  'TEAM_POSTER',
  'SLOTS_LIST',
  'VICTORY_CERTIFICATE',
  'NEEDS_REVIEW',
];

export function normalizeTemplateType(val?: string): TemplateType {
  if (!val || !val.trim()) return 'NEEDS_REVIEW';
  const clean = val.trim();
  if (VALID_TEMPLATE_TYPES.includes(clean as TemplateType)) {
    return clean as TemplateType;
  }
  const lower = clean.toLowerCase();
  if (lower === 'standings' || lower === 'overall-standings' || lower === 'point-table' || lower === 'point_table' || lower === 'points_table') {
    return 'POINTS_TABLE';
  }
  if (lower === 'warheads' || lower === 'kill-leader' || lower === 'kill_leader') {
    return 'KILL_LEADER';
  }
  if (lower === 'fraggers' || lower === 'top-fraggers' || lower === 'top_fraggers' || lower === 'mvp') {
    return 'TOP_FRAGGERS';
  }
  if (lower === 'team-poster' || lower === 'team_poster' || lower === 'roster') {
    return 'TEAM_POSTER';
  }
  if (lower === 'slots-list' || lower === 'slot-list' || lower === 'slots_list' || lower === 'slots') {
    return 'SLOTS_LIST';
  }
  if (lower === 'certificate' || lower === 'victory-certificate' || lower === 'victory_certificate' || lower === 'winner') {
    return 'VICTORY_CERTIFICATE';
  }
  return 'NEEDS_REVIEW';
}

export interface ICustomTemplate extends Document {
  customId: string;
  userId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
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
  templateType: TemplateType;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomTemplateSchema = new Schema<ICustomTemplate>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
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
    templateType: {
      type: String,
      enum: VALID_TEMPLATE_TYPES,
      default: 'POINTS_TABLE',
      index: true,
    },
    category: { type: String, maxlength: 50 },
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

