import { CustomTemplate, ICustomTemplate, TemplateType, normalizeTemplateType, VALID_TEMPLATE_TYPES } from '../models/CustomTemplate';
import { User } from '../models/User';
import { getTournamentById } from './tournamentService';
import { calculateStandings } from './scoringEngine';

export async function migrateExistingTemplates(): Promise<{ migrated: number; needsReview: number }> {
  try {
    const rawTemplates = await CustomTemplate.collection.find({}).toArray();
    let migrated = 0;
    let needsReview = 0;

    for (const raw of rawTemplates) {
      const hasRawType = raw.templateType && VALID_TEMPLATE_TYPES.includes(raw.templateType as TemplateType);
      if (!hasRawType || (raw.category && raw.templateType === 'POINTS_TABLE' && raw.category !== 'standings')) {
        const normalized = normalizeTemplateType(raw.category || raw.templateType);
        await CustomTemplate.collection.updateOne(
          { _id: raw._id },
          { $set: { templateType: normalized } }
        );
        if (normalized === 'NEEDS_REVIEW') {
          needsReview++;
        } else {
          migrated++;
        }
      }
    }

    return { migrated, needsReview };
  } catch (err) {
    console.warn('[Migration] Error migrating templates:', err);
    return { migrated: 0, needsReview: 0 };
  }
}

export interface GetTemplatesOptions {
  templateType?: string;
  category?: string;
}

export async function getTemplates(
  user?: { _id?: any; role?: string; organizationName?: string },
  options?: GetTemplatesOptions
): Promise<ICustomTemplate[]> {
  const sectionFilter: any = {};
  if (options?.templateType) {
    sectionFilter.templateType = normalizeTemplateType(options.templateType);
  } else if (options?.category) {
    sectionFilter.templateType = normalizeTemplateType(options.category);
  }

  // If Super Admin, return all templates (filtered by section if requested)
  if (user?.role === 'admin') {
    return CustomTemplate.find(sectionFilter).sort({ createdAt: -1 });
  }

  // If unauthenticated, return only built-in and globally published templates
  if (!user || !user._id) {
    return CustomTemplate.find({
      ...sectionFilter,
      active: { $ne: false },
      $or: [
        { isBuiltIn: true },
        { visibility: 'GLOBAL', isPublished: true },
      ],
    }).sort({ createdAt: -1 });
  }

  // Authenticated organizer: can access:
  // 1. Built-in templates
  // 2. Globally published templates
  // 3. Restricted templates where their userId or organizationName is in allowedOrganizationIds
  // 4. Templates they created themselves
  const userIdStr = user._id.toString();
  const orgName = (user.organizationName || '').trim();
  const allowedTargets = [userIdStr, orgName].filter(Boolean);

  const query: any = {
    ...sectionFilter,
    active: { $ne: false },
    $or: [
      { isBuiltIn: true },
      { visibility: 'GLOBAL', isPublished: true },
      {
        visibility: 'ORGANIZATION_RESTRICTED',
        isPublished: true,
        allowedOrganizationIds: { $in: allowedTargets },
      },
      { userId: user._id },
    ],
  };

  return CustomTemplate.find(query).sort({ createdAt: -1 });
}

export async function getTemplateById(
  templateId: string,
  user?: { _id?: any; role?: string; organizationName?: string },
  requiredSection?: string
): Promise<ICustomTemplate | null> {
  const query: any = {
    $or: [{ customId: templateId }],
  };
  if (templateId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: templateId });
  }

  const template = await CustomTemplate.findOne(query);
  if (!template) return null;

  const isCreator = Boolean(user?._id && template.userId && template.userId.toString() === user._id.toString());
  const isAdmin = user?.role === 'admin';

  // Inactive templates are only visible to admin or creator
  if (!template.active && !isAdmin && !isCreator) {
    const err: any = new Error('Template is inactive or not found.');
    err.statusCode = 404;
    throw err;
  }

  // Validate required section if provided (Requirement 16)
  if (requiredSection) {
    const expectedType = normalizeTemplateType(requiredSection);
    if (template.templateType !== expectedType) {
      const err: any = new Error(
        `Template section mismatch: requested '${requiredSection}' but template is '${template.templateType}'.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Super Admin can access any template
  if (isAdmin) {
    return template;
  }

  // Built-in templates are universally accessible
  if (template.isBuiltIn) {
    return template;
  }

  // Creator can always access their template
  if (isCreator) {
    return template;
  }

  // Check if globally published
  if (template.visibility === 'GLOBAL' && template.isPublished) {
    return template;
  }

  // Organization-restricted check
  if (template.visibility === 'ORGANIZATION_RESTRICTED') {
    if (!user || !user._id) {
      const err: any = new Error('Forbidden: Authentication required to access this organization template.');
      err.statusCode = 403;
      throw err;
    }

    const userIdStr = user._id.toString();
    const orgName = (user.organizationName || '').trim();
    const isAllowed = template.allowedOrganizationIds.some(
      (id) => id === userIdStr || (orgName && id.toLowerCase() === orgName.toLowerCase())
    );

    if (!isAllowed) {
      const err: any = new Error('Forbidden: You do not have permission to access this organization template.');
      err.statusCode = 403;
      throw err;
    }

    return template;
  }

  return template;
}

export async function createTemplate(userId: string, data: any, role?: string): Promise<ICustomTemplate> {
  const customId = data.id || `custom-tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const visibility = data.visibility === 'ORGANIZATION_RESTRICTED' ? 'ORGANIZATION_RESTRICTED' : 'GLOBAL';
  const allowedOrganizationIds = Array.isArray(data.allowedOrganizationIds)
    ? data.allowedOrganizationIds.map(String)
    : [];

  const templateType = normalizeTemplateType(data.templateType || data.category);

  return CustomTemplate.create({
    ...data,
    customId,
    userId,
    visibility,
    allowedOrganizationIds,
    templateType,
    category: data.category || templateType,
    active: data.active !== undefined ? !!data.active : true,
    version: 1,
    isBuiltIn: role === 'admin' ? !!data.isBuiltIn : false,
    isPublished: data.isPublished !== undefined ? !!data.isPublished : true,
  });
}

export async function updateTemplate(
  templateId: string,
  userId: string,
  updates: Partial<ICustomTemplate> & Record<string, any>,
  role?: string
): Promise<ICustomTemplate | null> {
  const query: any = {
    $or: [{ customId: templateId }],
  };
  if (templateId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: templateId });
  }

  if (role !== 'admin') {
    query.userId = userId;
    query.isBuiltIn = { $ne: true };
    delete (updates as any).isBuiltIn;
  }

  const processedUpdates: any = { ...updates };
  if (processedUpdates.templateType || processedUpdates.category) {
    processedUpdates.templateType = normalizeTemplateType(
      processedUpdates.templateType || processedUpdates.category
    );
  }

  // Increment version on update
  const safeUpdates = {
    ...processedUpdates,
    $inc: { version: 1 },
  };

  return CustomTemplate.findOneAndUpdate(query, safeUpdates, { returnDocument: 'after' });
}

export async function deleteTemplate(
  templateId: string,
  userId?: string,
  role?: string
): Promise<boolean> {
  const query: any = {
    $or: [{ customId: templateId }],
  };
  if (templateId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: templateId });
  }

  if (role !== 'admin') {
    query.userId = userId;
    query.isBuiltIn = { $ne: true };
  }

  const res = await CustomTemplate.deleteOne(query);
  return res.deletedCount > 0;
}

export async function getOrganizationsForTemplatePicker(
  searchQuery?: string
): Promise<Array<{ id: string; name: string; email: string; logoUrl?: string }>> {
  const query: any = {
    $or: [
      { role: 'organizer' },
      { organizationName: { $exists: true, $ne: '' } }
    ]
  };

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$and = [
      {
        $or: [
          { organizationName: regex },
          { name: regex },
          { email: regex }
        ]
      }
    ];
  }

  const users = await User.find(query)
    .select('_id name email organizationName organizationLogoUrl')
    .sort({ organizationName: 1, name: 1 })
    .limit(100)
    .lean();

  return users.map((u: any) => ({
    id: u._id.toString(),
    name: u.organizationName || u.name,
    email: u.email,
    logoUrl: u.organizationLogoUrl,
  }));
}

/**
 * Builds strictly section-specific data for a template and tournament.
 * Prevents universal points table data from leaking into non-points-table templates.
 */
export async function buildSectionDataForTemplate(
  templateId: string,
  tournamentId: string,
  options?: {
    user?: { _id?: any; role?: string; organizationName?: string };
    teamId?: string;
    recipientId?: string;
    awardTitle?: string;
  }
): Promise<{ templateType: TemplateType; [key: string]: any }> {
  // 1. Retrieve template with authorization check
  const template = await getTemplateById(templateId, options?.user);
  if (!template) {
    const err: any = new Error('Template not found.');
    err.statusCode = 404;
    throw err;
  }

  const templateType = template.templateType;
  if (!templateType || templateType === 'NEEDS_REVIEW' || !VALID_TEMPLATE_TYPES.includes(templateType)) {
    const err: any = new Error(`Unsupported or unreviewed template type: ${templateType || 'UNKNOWN'}`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Retrieve tournament
  const tournament = await getTournamentById(tournamentId, options?.user?._id?.toString(), options?.user?.role);
  if (!tournament) {
    const err: any = new Error('Tournament not found.');
    err.statusCode = 404;
    throw err;
  }

  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const matches = Array.isArray(tournament.matches) ? tournament.matches : [];

  // Helper to extract players with their total kills across tournament matches
  const getPlayersWithKills = () => {
    const playerStatsMap = new Map<string, { id: string; name: string; teamId: string; teamName: string; teamTag?: string; teamLogo?: string; kills: number }>();

    // Seed from team rosters
    for (const team of teams) {
      const roster = Array.isArray(team.players) ? team.players : [];
      for (const p of roster) {
        playerStatsMap.set(p.id, {
          id: p.id,
          name: p.name || 'Player',
          teamId: team.id,
          teamName: team.name,
          teamTag: team.tag,
          teamLogo: team.logoUrl,
          kills: 0,
        });
      }
    }

    // Accumulate kills from match player stats / eliminations
    for (const match of matches) {
      const eliminations = Array.isArray((match as any).eliminations) ? (match as any).eliminations : [];
      for (const elim of eliminations) {
        const killerId = elim.killerPlayerId || elim.killerId;
        if (killerId && playerStatsMap.has(killerId)) {
          playerStatsMap.get(killerId)!.kills += 1;
        }
      }

      // Check playerStats logged in match results
      const results = Array.isArray(match.results) ? match.results : [];
      for (const res of results) {
        const pStats = Array.isArray((res as any).playerStats) ? (res as any).playerStats : [];
        for (const ps of pStats) {
          if (ps.playerId && playerStatsMap.has(ps.playerId)) {
            playerStatsMap.get(ps.playerId)!.kills += Number(ps.kills) || 0;
          }
        }
      }
    }

    const list = Array.from(playerStatsMap.values());
    list.sort((a, b) => b.kills - a.kills);
    return list;
  };

  switch (templateType) {
    case 'POINTS_TABLE': {
      const standings = calculateStandings(teams, matches, (tournament as any).scoringRules || (tournament as any).scoringPreset);
      return {
        templateType: 'POINTS_TABLE',
        templateId: template.customId,
        tournamentTitle: tournament.title,
        tournamentLogo: tournament.logoUrl,
        organizerName: tournament.organizer,
        organizerLogo: tournament.organizerLogoUrl,
        rows: standings,
        totalMatchesCount: matches.length,
      };
    }

    case 'KILL_LEADER': {
      const rankedPlayers = getPlayersWithKills();
      const topPlayer = rankedPlayers[0] || {
        id: teams[0]?.players?.[0]?.id || 'demo-p1',
        name: teams[0]?.players?.[0]?.name || 'Kill Leader',
        teamId: teams[0]?.id || 't1',
        teamName: teams[0]?.name || 'Squad',
        teamTag: teams[0]?.tag,
        teamLogo: teams[0]?.logoUrl,
        kills: 0,
      };

      return {
        templateType: 'KILL_LEADER',
        templateId: template.customId,
        tournamentTitle: tournament.title,
        tournamentLogo: tournament.logoUrl,
        organizerName: tournament.organizer,
        organizerLogo: tournament.organizerLogoUrl,
        player: {
          id: topPlayer.id,
          name: topPlayer.name,
          teamId: topPlayer.teamId,
          teamName: topPlayer.teamName,
          teamTag: topPlayer.teamTag,
          teamLogo: topPlayer.teamLogo,
          kills: topPlayer.kills,
          tournamentName: tournament.title,
          rank: 1,
        },
      };
    }

    case 'TOP_FRAGGERS': {
      const rankedPlayers = getPlayersWithKills();
      const top3 = rankedPlayers.slice(0, 3);
      const players = (top3.length > 0 ? top3 : teams.slice(0, 3).map((t: any, i: number) => ({
        id: t.players?.[0]?.id || `p-${i + 1}`,
        name: t.players?.[0]?.name || `Fragger ${i + 1}`,
        teamId: t.id,
        teamName: t.name,
        teamTag: t.tag,
        teamLogo: t.logoUrl,
        kills: 0,
      }))).map((p, idx) => ({
        rank: idx + 1,
        playerName: p.name,
        teamName: p.teamName,
        teamTag: p.teamTag,
        teamLogo: p.teamLogo,
        kills: p.kills,
      }));

      return {
        templateType: 'TOP_FRAGGERS',
        templateId: template.customId,
        tournamentTitle: tournament.title,
        tournamentLogo: tournament.logoUrl,
        organizerName: tournament.organizer,
        organizerLogo: tournament.organizerLogoUrl,
        players,
        tournamentName: tournament.title,
      };
    }

    case 'TEAM_POSTER': {
      const selectedTeam = (options?.teamId ? teams.find((t: any) => t.id === options.teamId) : null) || teams[0] || {
        id: 'team-fallback',
        name: 'Team Alpha',
        tag: 'ALP',
        players: [],
      };

      const roster = Array.isArray(selectedTeam.players) ? selectedTeam.players : [];
      const players = roster.slice(0, 4).map((p: any) => (typeof p === 'string' ? p : p.name || 'Player'));

      return {
        templateType: 'TEAM_POSTER',
        templateId: template.customId,
        tournamentTitle: tournament.title,
        tournamentLogo: tournament.logoUrl,
        organizerName: tournament.organizer,
        organizerLogo: tournament.organizerLogoUrl,
        teamName: selectedTeam.name,
        teamLogo: selectedTeam.logoUrl,
        shortName: selectedTeam.tag || selectedTeam.name,
        players,
        tournamentName: tournament.title,
      };
    }

    case 'SLOTS_LIST': {
      const slots = teams.map((team: any, idx: number) => ({
        slot: idx + 1,
        teamName: team.name,
        shortName: team.tag || '',
        logo: team.logoUrl,
      }));

      return {
        templateType: 'SLOTS_LIST',
        templateId: template.customId,
        tournamentTitle: tournament.title,
        tournamentLogo: tournament.logoUrl,
        organizerName: tournament.organizer,
        organizerLogo: tournament.organizerLogoUrl,
        teams: slots,
      };
    }

    case 'VICTORY_CERTIFICATE': {
      const standings = calculateStandings(teams, matches, (tournament as any).scoringRules || (tournament as any).scoringPreset);
      let winnerTeam = options?.recipientId ? teams.find((t: any) => t.id === options.recipientId) : null;
      if (!winnerTeam && standings.length > 0) {
        winnerTeam = teams.find((t: any) => t.id === standings[0].teamId);
      }
      if (!winnerTeam) {
        winnerTeam = teams[0] || { id: 'w1', name: 'Champion Squad', tag: 'CHAMP' };
      }

      return {
        templateType: 'VICTORY_CERTIFICATE',
        templateId: template.customId,
        recipientName: winnerTeam.name,
        recipientLogo: winnerTeam.logoUrl,
        teamName: winnerTeam.name,
        awardTitle: options?.awardTitle?.trim() || 'CHAMPION',
        position: '1ST PLACE',
        tournamentName: tournament.title,
        tournamentDate: new Date().toISOString().split('T')[0],
        organizationName: tournament.organizer || 'PointX Arena',
        organizationLogo: tournament.organizerLogoUrl,
        certificateId: `CERT-${tournament.customId || tournament._id}-${winnerTeam.id || '1'}`,
        signature: tournament.organizer || 'PointX Official',
      };
    }

    default: {
      const err: any = new Error(`Unsupported template type: ${templateType}`);
      err.statusCode = 400;
      throw err;
    }
  }
}


