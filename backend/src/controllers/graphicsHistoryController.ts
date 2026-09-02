import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { GraphicsHistory } from '../models/GraphicsHistory';

export async function getGraphicsHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const tournamentId = req.query.tournamentId as string | undefined;

    const query: any = { userId: req.user._id };
    if (tournamentId) query.tournamentId = tournamentId;

    const history = await GraphicsHistory.find(query).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ success: true, data: history.map((h) => h.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function saveGraphicRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const record = req.body;
    const customId = record.id || `rec-${Date.now()}`;

    const saved = await GraphicsHistory.findOneAndUpdate(
      { customId },
      {
        ...record,
        customId,
        userId: req.user._id,
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({ success: true, data: saved.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function deleteGraphicRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const { id } = req.params;
    await GraphicsHistory.deleteOne({ customId: id, userId: req.user._id });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
