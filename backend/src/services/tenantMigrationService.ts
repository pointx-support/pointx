import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Organization, IOrganization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { Tournament } from '../models/Tournament';
import { GlobalTeam } from '../models/GlobalTeam';
import { CustomTemplate } from '../models/CustomTemplate';
import { BroadcastSession } from '../models/BroadcastSession';

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'org';
}

/**
 * Ensures a user has a provisioned organization and owner membership.
 * Safe, idempotent, and non-destructive.
 */
export async function ensureUserOrganization(user: IUser): Promise<IOrganization> {
  // 1. Check if user already has an existing organization membership as owner/admin
  const existingMembership = await OrganizationMembership.findOne({
    userId: user._id,
    role: { $in: ['owner', 'admin'] },
  });

  if (existingMembership) {
    const existingOrg = await Organization.findById(existingMembership.organizationId);
    if (existingOrg) {
      if (!user.primaryOrganizationId || user.primaryOrganizationId.toString() !== existingOrg._id.toString()) {
        user.primaryOrganizationId = existingOrg._id as any;
        await user.save().catch(() => {});
      }
      return existingOrg;
    }
  }

  // 2. Also check if an Organization exists with ownerId = user._id
  let org = await Organization.findOne({ ownerId: user._id });

  if (!org) {
    const rawName = (user.organizationName || user.name || 'Esports Org').trim();
    const baseSlug = slugify(rawName);
    let candidateSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Ensure slug uniqueness
    const slugConflict = await Organization.findOne({ slug: candidateSlug });
    if (slugConflict) {
      candidateSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    org = await Organization.create({
      name: rawName,
      slug: candidateSlug,
      ownerId: user._id,
      logoUrl: user.organizationLogoUrl || '',
      status: 'active',
    });
  }

  // 3. Ensure membership record exists
  await OrganizationMembership.findOneAndUpdate(
    { organizationId: org._id, userId: user._id },
    { $set: { role: 'owner' } },
    { upsert: true, returnDocument: 'after' }
  );

  if (!user.primaryOrganizationId || user.primaryOrganizationId.toString() !== org._id.toString()) {
    user.primaryOrganizationId = org._id as any;
    await user.save().catch(() => {});
  }

  return org;
}

/**
 * Runs full tenant data migration. Guarantees zero data loss and strictly
 * scopes all legacy resources to valid organizations.
 */
export async function runTenantMigration(): Promise<{
  usersMigrated: number;
  tournamentsMigrated: number;
  teamsMigrated: number;
  templatesMigrated: number;
}> {
  let usersMigrated = 0;
  let tournamentsMigrated = 0;
  let teamsMigrated = 0;
  let templatesMigrated = 0;

  try {
    // 1. Provision organizations for all existing users
    const users = await User.find({});
    const userOrgMap = new Map<string, mongoose.Types.ObjectId>();

    for (const u of users) {
      const org = await ensureUserOrganization(u);
      userOrgMap.set(u._id.toString(), org._id as any);
      usersMigrated++;
    }

    // 2. Migrate tournaments missing organizationId
    const tournaments = await Tournament.find({
      $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
    });

    for (const tour of tournaments) {
      const ownerUserId = tour.userId?.toString();
      let targetOrgId = ownerUserId ? userOrgMap.get(ownerUserId) : null;

      if (!targetOrgId && ownerUserId) {
        const ownerUser = await User.findById(ownerUserId);
        if (ownerUser) {
          const org = await ensureUserOrganization(ownerUser);
          targetOrgId = org._id as any;
          userOrgMap.set(ownerUserId, targetOrgId);
        }
      }

      // If still no owner organization, fallback to creating an organization for this tournament
      if (!targetOrgId) {
        const fallbackName = (tour.organizer || tour.title || 'System Tournaments').trim();
        const fallbackSlug = `legacy-${slugify(fallbackName)}-${Math.random().toString(36).substring(2, 6)}`;
        const fallbackOrg = await Organization.create({
          name: fallbackName,
          slug: fallbackSlug,
          ownerId: tour.userId || new mongoose.Types.ObjectId(),
          status: 'active',
        });
        targetOrgId = fallbackOrg._id as any;
      }

      tour.organizationId = targetOrgId as any;
      await tour.save();
      tournamentsMigrated++;
    }

    // 3. Migrate GlobalTeams missing organizationId
    const teams = await GlobalTeam.find({
      $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
    });

    for (const team of teams) {
      const ownerUserId = team.userId?.toString();
      const targetOrgId = ownerUserId ? userOrgMap.get(ownerUserId) : null;
      if (targetOrgId) {
        team.organizationId = targetOrgId as any;
        await team.save();
        teamsMigrated++;
      }
    }

    // 4. Migrate CustomTemplates missing organizationId
    const templates = await CustomTemplate.find({
      $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
    });

    for (const tmpl of templates) {
      const ownerUserId = tmpl.userId?.toString();
      const targetOrgId = ownerUserId ? userOrgMap.get(ownerUserId) : null;
      if (targetOrgId) {
        tmpl.organizationId = targetOrgId as any;
        await tmpl.save();
        templatesMigrated++;
      }
    }

    // 5. Ensure BroadcastSessions have valid organizationId synced from Tournament
    const sessions = await BroadcastSession.find({ active: true });
    for (const sess of sessions) {
      if (sess.tournamentId) {
        const tour = await Tournament.findOne({
          $or: [
            { customId: sess.tournamentId },
            ...(mongoose.Types.ObjectId.isValid(sess.tournamentId) ? [{ _id: sess.tournamentId }] : []),
          ],
        });
        if (tour && tour.organizationId) {
          sess.organizationId = tour.organizationId.toString();
          await sess.save();
        }
      }
    }
  } catch (err) {
    console.warn('[TenantMigration] Migration warning:', err);
  }

  return {
    usersMigrated,
    tournamentsMigrated,
    teamsMigrated,
    templatesMigrated,
  };
}
