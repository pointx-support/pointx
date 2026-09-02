import { Router, Request, Response } from 'express';

const router = Router();
const inMemorySyncState: Record<string, any> = {};

router.get('/state', (req: Request, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';
  res.status(200).json({
    success: true,
    data: inMemorySyncState[tournamentId] || null,
  });
});

router.post('/state', (req: Request, res: Response) => {
  const body = req.body;
  const tourId = body.tournamentId || 'default';
  inMemorySyncState[tourId] = {
    ...inMemorySyncState[tourId],
    ...body,
    timestamp: Date.now(),
  };

  res.status(200).json({
    success: true,
    timestamp: Date.now(),
  });
});

export default router;
