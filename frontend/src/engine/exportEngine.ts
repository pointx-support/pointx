import JSZip from 'jszip';
import type { ExportFormat, ShareOptions } from '../types/export';
import type { CalculatedStanding } from '../types/standings';
import { getBase64EmbeddedFontCss } from './fontEmbedder';

/**
 * Generates clean, filesystem-safe filenames for tournament graphics exports.
 */
export function sanitizeGraphicFilename(
  tournamentTitle: string,
  graphicType = 'OVERALL_STANDINGS',
  templateName?: string,
  pageIndex = 1,
  ext: ExportFormat = 'png'
): string {
  const cleanTitle = (tournamentTitle || 'TOURNAMENT')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);

  const cleanType = graphicType.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const cleanTemplate = templateName ? `_${templateName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)}` : '';
  const pageStr = pageIndex > 1 ? `_P${pageIndex}` : '';
  const extension = ext === 'jpeg' ? 'jpg' : ext;

  return `${cleanTitle}_${cleanType}${cleanTemplate}${pageStr}.${extension}`;
}

/**
 * Converts any relative or remote image links inside the SVG into embedded Base64 Data URIs.
 * This is required because browsers block external sub-resources when an SVG is loaded into an Image via Blob URL.
 */
async function inlineSvgImages(svgElement: SVGSVGElement): Promise<SVGSVGElement> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const imageElements = Array.from(clone.querySelectorAll('image'));

  await Promise.all(
    imageElements.map(async (img) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href');
      if (href && !href.startsWith('data:')) {
        try {
          const response = await fetch(href);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute('href', dataUrl);
          img.removeAttribute('xlink:href');
        } catch (e) {
          console.warn('Could not inline SVG image:', href, e);
        }
      }
    })
  );

  return clone;
}

/**
 * Converts an SVG Element to a high-resolution raster Blob (PNG / JPEG / WebP)
 * with all background template artwork and fonts cleanly embedded.
 */
export async function renderSvgToBlob(
  svgElement: SVGSVGElement,
  options: {
    format?: ExportFormat;
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  const format = options.format || 'png';
  const width = options.width || 1920;
  const height = options.height || 1080;
  const quality = options.quality !== undefined ? options.quality : 0.95;

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

  // Wait for Google web fonts to be fully loaded
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  // Pre-process and inline background images as Base64 Data URIs
  const inlinedSvg = await inlineSvgImages(svgElement);

  // Inject 100% self-contained Base64 @font-face definitions into SVG defs
  const fontStyles = await getBase64EmbeddedFontCss();
  let defs = inlinedSvg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    inlinedSvg.insertBefore(defs, inlinedSvg.firstChild);
  }
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = fontStyles;
  defs.appendChild(styleEl);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(inlinedSvg);

  // Ensure standard SVG XMLNS attributes
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context initialization failed.'));
        return;
      }

      // If JPEG format, draw opaque background to prevent black alpha matte
      if (format === 'jpeg') {
        ctx.fillStyle = '#13100f';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob rasterization failed.'));
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG into raster image: ${err}`));
    };

    img.src = url;
  });
}

/**
 * Direct shortcut to export SVG to PNG Blob.
 */
export async function exportSvgToPng(svgElement: SVGSVGElement, width = 1920, height = 1080): Promise<Blob> {
  return renderSvgToBlob(svgElement, { format: 'png', width, height });
}

/**
 * Exports standings to formatted CSV string.
 */
export function exportStandingsToCSV(standings: CalculatedStanding[], tournamentTitle = 'Tournament'): string {
  const meta = `# Tournament: ${tournamentTitle}`;
  const headers = ['Rank', 'Team Name', 'Team Tag', 'Matches Played', 'Booyahs', 'Placement Points', 'Kill Points', 'Total Points'];
  const rows = standings.map((s) => [
    s.rank,
    `"${s.teamName.replace(/"/g, '""')}"`,
    `"${s.teamTag.replace(/"/g, '""')}"`,
    s.matchesPlayed,
    s.booyahs,
    s.placementPoints,
    s.killPoints,
    s.totalPoints
  ]);

  return [meta, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Triggers a native file download in the browser.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Shares a graphic file blob using the native Web Share API (mobile/desktop).
 */
export async function shareGraphicBlob(blob: Blob, metadata: ShareOptions): Promise<boolean> {
  const mimeType = blob.type || 'image/png';
  const file = new File([blob], metadata.filename, { type: mimeType });

  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: metadata.title,
        text: metadata.text || `${metadata.title} — Official Tournament Points Table`
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
      throw err;
    }
  }

  // Fallback: trigger standard download
  downloadBlobFile(blob, metadata.filename);
  return false;
}

/**
 * Bundles multiple graphic blobs into a single compressed .ZIP archive.
 */
export async function createBatchGraphicsZip(
  graphics: { filename: string; blob: Blob }[],
  zipFilename = 'TOURNAMENT_GRAPHICS_BUNDLE.zip'
): Promise<void> {
  const zip = new JSZip();

  graphics.forEach((g) => {
    zip.file(g.filename, g.blob);
  });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  downloadBlobFile(zipBlob, zipFilename);
}