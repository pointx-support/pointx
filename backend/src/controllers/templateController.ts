import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../services/templateService';

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await getTemplates((req as any).user?._id?.toString());
    return res.status(200).json({ success: true, data: templates.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function createNewTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const template = await createTemplate(req.user._id.toString(), req.body);
    return res.status(201).json({ success: true, data: template.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const updated = await updateTemplate(id, req.user._id.toString(), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }
    return res.status(200).json({ success: true, data: updated.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const deleted = await deleteTemplate(id, req.user._id.toString());
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }
    return res.status(200).json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    next(error);
  }
}
