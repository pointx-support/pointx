import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getOrganizationsForTemplatePicker,
  buildSectionDataForTemplate,
} from '../services/templateService';
import { updateAuthoritativeState } from '../services/realtimeSync';

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthenticatedRequest).user;
    const section = (req.query.section || req.query.templateType || req.query.category) as string | undefined;
    const templates = await getTemplates(user, section ? { templateType: section } : undefined);
    return res.status(200).json({ success: true, data: templates.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function getSingleTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = (req as AuthenticatedRequest).user;
    const requiredSection = (req.query.section || req.query.templateType) as string | undefined;
    const template = await getTemplateById(id, user, requiredSection);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }
    return res.status(200).json({ success: true, data: template.toJSON() });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function getTemplateSectionData(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const tournamentId = (req.query.tournamentId || req.query.tournament) as string;
    if (!tournamentId) {
      return res.status(400).json({ success: false, error: 'tournamentId query parameter is required.' });
    }

    const user = (req as AuthenticatedRequest).user;
    const teamId = req.query.teamId as string | undefined;
    const recipientId = (req.query.recipientId || req.query.winnerTeamId) as string | undefined;
    const awardTitle = req.query.awardTitle as string | undefined;

    const data = await buildSectionDataForTemplate(id, tournamentId, {
      user,
      teamId,
      recipientId,
      awardTitle,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function listOrganizationsForTemplatePicker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q || req.query.search) as string | undefined;
    const orgs = await getOrganizationsForTemplatePicker(q);
    return res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
}

export async function createNewTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const template = await createTemplate(req.user._id.toString(), req.body, req.user.role);
    return res.status(201).json({ success: true, data: template.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const updated = await updateTemplate(id, req.user._id.toString(), req.body, req.user.role);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Template not found or cannot be edited.' });
    }
    const templateData = updated.toJSON();
    const tournamentId = (req.query.tournamentId as string) || (req.body?.tournamentId as string) || 'default';
    updateAuthoritativeState(
      tournamentId,
      {
        activeTemplateId: templateData._id || templateData.id,
        activeTemplate: templateData,
      },
      undefined,
      'TEMPLATE_UPDATED'
    ).catch((err) => console.warn('[RealtimeSync] Template update broadcast error:', err));
    return res.status(200).json({ success: true, data: templateData });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const deleted = await deleteTemplate(id, req.user._id.toString(), req.user.role);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Template not found or cannot be deleted.' });
    }
    return res.status(200).json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    next(error);
  }
}
