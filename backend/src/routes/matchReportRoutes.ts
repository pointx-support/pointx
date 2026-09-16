import { Router, Request, Response } from 'express';
import {
  getMatchReport,
  getAllMatchReportsForTournament,
  formatMatchReportCsv,
} from '../services/matchReportService';

const router = Router();

// 1. Fetch finalized match report
router.get('/:tournamentId/:matchId', async (req: Request, res: Response) => {
  try {
    const { tournamentId, matchId } = req.params;
    const version = req.query.version ? Number(req.query.version) : undefined;

    const report = await getMatchReport(tournamentId, matchId, version);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'MATCH_REPORT_NOT_FOUND',
        message: `No finalized match report found for tournament ${tournamentId} match ${matchId}.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch match report',
    });
  }
});

// 2. Export match report as CSV or JSON download
router.get('/:tournamentId/:matchId/export', async (req: Request, res: Response) => {
  try {
    const { tournamentId, matchId } = req.params;
    const format = ((req.query.format as string) || 'json').toLowerCase();
    const version = req.query.version ? Number(req.query.version) : undefined;

    const report = await getMatchReport(tournamentId, matchId, version);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'MATCH_REPORT_NOT_FOUND',
      });
    }

    if (format === 'csv') {
      const csv = formatMatchReportCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="pointx_report_${tournamentId}_match${report.matchNumber}_v${report.version}.csv"`
      );
      return res.status(200).send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="pointx_report_${tournamentId}_match${report.matchNumber}_v${report.version}.json"`
    );
    return res.status(200).json(report);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export match report',
    });
  }
});

// 3. Fetch all match reports for a tournament
router.get('/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const reports = await getAllMatchReportsForTournament(tournamentId);

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournament match reports',
    });
  }
});

export default router;
