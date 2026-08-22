import type {
  GraphicsTemplateDefinition,
  GraphicTemplateId,
  GraphicsRenderData,
  GraphicsRenderOptions
} from '../types/graphics';
import type { Tournament, CalculatedStanding } from '../types/tournament';
import { calculateTournamentStandings } from './standingsEngine';

export const GRAPHIC_TEMPLATES: GraphicsTemplateDefinition[] = [
  {
    id: 'overall-standings-legit',
    name: 'Legit Showdown (Cyan Neon)',
    category: 'overall-standings',
    description: 'Electric cyan futuristic cyber-city aesthetic with 2-column chamfered leaderboard containers.',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    maxRowsPerPage: 12,
    theme: {
      primaryColor: '#00f0ff',
      secondaryColor: '#0ea5e9',
      accentColor: '#38bdf8',
      backgroundGradient: 'linear-gradient(180deg, #020b18 0%, #061830 50%, #030d1e 100%)',
      badgeStyle: 'chamfered-cyan'
    }
  },
  {
    id: 'overall-standings-strikz',
    name: 'Strikz Paid Scrims (Orange Gold)',
    category: 'overall-standings',
    description: 'Warm fiery battleground aesthetic with 3D heraldic crest, gold header bars, and high-contrast white team boxes.',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    maxRowsPerPage: 12,
    theme: {
      primaryColor: '#f97316',
      secondaryColor: '#ea580c',
      accentColor: '#fbbf24',
      backgroundGradient: 'linear-gradient(180deg, #180902 0%, #2b1104 50%, #120601 100%)',
      badgeStyle: 'chamfered-orange'
    }
  }
];

export function getTemplateDefinition(templateId: GraphicTemplateId): GraphicsTemplateDefinition {
  return (
    GRAPHIC_TEMPLATES.find((t) => t.id === templateId) || GRAPHIC_TEMPLATES[0]
  );
}

/**
 * Prepares paginated standings data for rendering inside the selected graphics template.
 */
export function prepareGraphicsRenderData(
  tournament: Tournament,
  templateId: GraphicTemplateId,
  options?: GraphicsRenderOptions
): GraphicsRenderData {
  const template = getTemplateDefinition(templateId);
  const allStandings: CalculatedStanding[] = calculateTournamentStandings(tournament);

  const rowsPerPage = options?.rowsPerPage || template.maxRowsPerPage || 12;
  const totalPages = Math.max(1, Math.ceil(allStandings.length / rowsPerPage));
  const currentPage = Math.min(Math.max(1, options?.pageIndex || 1), totalPages);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageRows = allStandings.slice(startIndex, startIndex + rowsPerPage);

  const completedMatches = tournament.matches.filter(
    (m) => m.status === 'Finalized' || m.status === 'Completed'
  );

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title,
    tournamentLogo: tournament.logoUrl,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'STRIKZ ESPORTS',
    subtitle: options?.customSubtitle?.trim() || `OFFICIAL OVERALL STANDINGS • ${completedMatches.length} MATCHES`,
    page: currentPage,
    totalPages,
    rows: pageRows,
    totalMatchesCount: completedMatches.length
  };
}

/**
 * Exports an SVG element to high-resolution PNG using HTML5 Canvas.
 */
export async function exportSvgAsPng(
  svgElement: SVGSVGElement,
  filename = 'overall_standings.png',
  targetWidth = 1920,
  targetHeight = 1080
): Promise<void> {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure proper namespaces
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context creation failed.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob conversion failed.'));
            return;
          }
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          resolve();
        },
        'image/png',
        1.0
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}