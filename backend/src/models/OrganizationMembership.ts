import mongoose, { Document, Schema } from 'mongoose';

export type OrganizationRole = 'owner' | 'admin' | 'staff' | 'member';

export interface IOrganizationMembership extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'staff', 'member'],
      default: 'member',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index to prevent duplicate memberships
OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  'OrganizationMembership',
  OrganizationMembershipSchema
);
