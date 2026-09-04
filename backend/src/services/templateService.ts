import { CustomTemplate, ICustomTemplate } from '../models/CustomTemplate';

export async function getTemplates(userId?: string): Promise<ICustomTemplate[]> {
  const query: any = {
    $or: [{ isBuiltIn: true }, { isPublished: true }],
  };
  if (userId) {
    query.$or.push({ userId });
  }
  return CustomTemplate.find(query).sort({ createdAt: -1 });
}

export async function createTemplate(userId: string, data: any): Promise<ICustomTemplate> {
  const customId = data.id || `custom-tmpl-${Date.now()}`;
  return CustomTemplate.create({
    ...data,
    customId,
    userId,
    isBuiltIn: false,
    isPublished: true,
  });
}

export async function updateTemplate(
  templateId: string,
  userId: string,
  updates: Partial<ICustomTemplate>,
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

  return CustomTemplate.findOneAndUpdate(query, { $set: updates }, { returnDocument: 'after' });
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
