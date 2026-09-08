import { CustomTemplate, ICustomTemplate, TemplateType, normalizeTemplateType, VALID_TEMPLATE_TYPES } from '../models/CustomTemplate';
import { User } from '../models/User';

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

