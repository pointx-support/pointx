import { describe, it, expect } from 'vitest';
import { writePsdBuffer } from 'ag-psd';
import {
  colorToHex,
  classifyLayer,
  analyzePsdTemplateBuffer,
} from '../psdTemplateAnalyzer';

describe('PSD Template Analyzer Engine', () => {
  describe('colorToHex', () => {
    it('converts RGB object to hex string', () => {
      expect(colorToHex({ r: 255, g: 215, b: 0 })).toBe('#ffd700');
      expect(colorToHex({ r: 245, g: 158, b: 11 })).toBe('#f59e0b');
      expect(colorToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    });

    it('handles fallbacks and existing strings', () => {
      expect(colorToHex('#ffffff')).toBe('#ffffff');
      expect(colorToHex(undefined)).toBe('#ffffff');
    });
  });

  describe('classifyLayer', () => {
    it('detects Team Name layers across naming conventions', () => {
      const el1 = classifyLayer({ name: 'Team 1', left: 100, top: 200, right: 300, bottom: 230 } as any);
      expect(el1?.type).toBe('teamName');
      expect(el1?.slotNumber).toBe(1);

      const el2 = classifyLayer({ name: 'Slot 12', left: 100, top: 600, right: 300, bottom: 630 } as any);
      expect(el2?.type).toBe('teamName');
      expect(el2?.slotNumber).toBe(12);

      const el3 = classifyLayer({ name: 'Team C', left: 100, top: 300, right: 300, bottom: 330 } as any);
      expect(el3?.type).toBe('teamName');
      expect(el3?.slotNumber).toBe(3); // C = 3
    });

    it('detects Rank / Serial Number layers', () => {
      const r1 = classifyLayer({ name: '1', left: 50, top: 200, right: 80, bottom: 230 } as any);
      expect(r1?.type).toBe('rank');
      expect(r1?.slotNumber).toBe(1);

      const r12 = classifyLayer({ name: '#12', left: 50, top: 600, right: 80, bottom: 630 } as any);
      expect(r12?.type).toBe('rank');
      expect(r12?.slotNumber).toBe(12);
    });

    it('detects Stats, Logos, and Header titles', () => {
      const kills = classifyLayer({ name: 'Kills Column', left: 400, top: 150 } as any);
      expect(kills?.type).toBe('kills');

      const total = classifyLayer({ name: 'Total Pts', left: 500, top: 150 } as any);
      expect(total?.type).toBe('total');

      const orgLogo = classifyLayer({ name: 'Org Logo Placeholder', left: 80, top: 50 } as any);
      expect(orgLogo?.type).toBe('orgLogo');

      const tourneyTitle = classifyLayer({ name: 'Tournament Title Header', left: 960, top: 80 } as any);
      expect(tourneyTitle?.type).toBe('tourneyTitle');
    });
  });

  describe('analyzePsdTemplateBuffer', () => {
    it('automatically extracts 12 team slots, row gap, coordinates, and builds single-column alignment', () => {
      const psdData: any = {
        width: 1920,
        height: 1080,
        children: [
          { name: 'Background Artwork', top: 0, left: 0, bottom: 1080, right: 1920 },
          { name: 'Tournament Title', top: 60, left: 960, right: 1400, bottom: 100, text: { style: { fontSize: 36, fillColor: { r: 255, g: 255, b: 255 } } } },
          { name: 'Org Logo', top: 50, left: 100, right: 180, bottom: 130 },
          { name: 'Total Pts', top: 180, left: 600, right: 660, bottom: 210 },
          { name: 'Kills', top: 180, left: 520, right: 580, bottom: 210 },
          // 12 sequential team slots
          { name: '1', top: 220, left: 120, bottom: 250, right: 150 },
          { name: 'Team 1', top: 220, left: 200, bottom: 250, right: 480, text: { style: { fontSize: 24, fillColor: { r: 255, g: 255, b: 255 } } } },
          { name: '2', top: 280, left: 120, bottom: 310, right: 150 },
          { name: 'Team 2', top: 280, left: 200, bottom: 310, right: 480 },
          { name: '3', top: 340, left: 120, bottom: 370, right: 150 },
          { name: 'Team 3', top: 340, left: 200, bottom: 370, right: 480 },
          { name: '4', top: 400, left: 120, bottom: 430, right: 150 },
          { name: 'Team 4', top: 400, left: 200, bottom: 430, right: 480 },
          { name: '5', top: 460, left: 120, bottom: 490, right: 150 },
          { name: 'Team 5', top: 460, left: 200, bottom: 490, right: 480 },
          { name: '6', top: 520, left: 120, bottom: 550, right: 150 },
          { name: 'Team 6', top: 520, left: 200, bottom: 550, right: 480 },
          { name: '7', top: 580, left: 120, bottom: 610, right: 150 },
          { name: 'Team 7', top: 580, left: 200, bottom: 610, right: 480 },
          { name: '8', top: 640, left: 120, bottom: 670, right: 150 },
          { name: 'Team 8', top: 640, left: 200, bottom: 670, right: 480 },
          { name: '9', top: 700, left: 120, bottom: 730, right: 150 },
          { name: 'Team 9', top: 700, left: 200, bottom: 730, right: 480 },
          { name: '10', top: 760, left: 120, bottom: 790, right: 150 },
          { name: 'Team 10', top: 760, left: 200, bottom: 790, right: 480 },
          { name: '11', top: 820, left: 120, bottom: 850, right: 150 },
          { name: 'Team 11', top: 820, left: 200, bottom: 850, right: 480 },
          { name: '12', top: 880, left: 120, bottom: 910, right: 150 },
          { name: 'Team 12', top: 880, left: 200, bottom: 910, right: 480 },
        ],
      };

      const buffer = writePsdBuffer(psdData);
      const result = analyzePsdTemplateBuffer(buffer);

      expect(result.success).toBe(true);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.aspectRatio).toBe('16:9');
      expect(result.layoutMode).toBe('single-column');
      expect(result.detectedSummary.teamsCount).toBe(12);
      expect(result.detectedSummary.ranksCount).toBe(12);

      // Verify alignment coordinates
      expect(result.alignment.leftTeamX).toBe(200);
      expect(result.alignment.leftRankX).toBe(120);
      expect(result.alignment.leftTotalX).toBe(600);
      expect(result.alignment.leftKillsX).toBe(520);
      expect(result.alignment.baseY).toBe(220);
      expect(result.alignment.rowGap).toBe(60); // 280 - 220 = 60

      // Verify granular slot overrides are accurately preserved
      expect(result.alignment.slots?.[1]?.teamName?.x).toBe(200);
      expect(result.alignment.slots?.[1]?.teamName?.y).toBe(220);
      expect(result.alignment.slots?.[12]?.teamName?.y).toBe(880);
    });

    it('automatically detects dual-column layout (6 Left + 6 Right)', () => {
      const psdDual: any = {
        width: 1920,
        height: 1080,
        children: [
          { name: 'BG', top: 0, left: 0, bottom: 1080, right: 1920 },
          // Left column (Slots 1-6 at X=150)
          { name: 'Team 1', top: 250, left: 150, bottom: 280, right: 450 },
          { name: 'Team 2', top: 310, left: 150, bottom: 340, right: 450 },
          { name: 'Team 3', top: 370, left: 150, bottom: 400, right: 450 },
          { name: 'Team 4', top: 430, left: 150, bottom: 460, right: 450 },
          { name: 'Team 5', top: 490, left: 150, bottom: 520, right: 450 },
          { name: 'Team 6', top: 550, left: 150, bottom: 580, right: 450 },
          // Right column (Slots 7-12 at X=1050)
          { name: 'Team 7', top: 250, left: 1050, bottom: 280, right: 1350 },
          { name: 'Team 8', top: 310, left: 1050, bottom: 340, right: 1350 },
          { name: 'Team 9', top: 370, left: 1050, bottom: 400, right: 1350 },
          { name: 'Team 10', top: 430, left: 1050, bottom: 460, right: 1350 },
          { name: 'Team 11', top: 490, left: 1050, bottom: 520, right: 1350 },
          { name: 'Team 12', top: 550, left: 1050, bottom: 580, right: 1350 },
        ],
      };

      const buffer = writePsdBuffer(psdDual);
      const result = analyzePsdTemplateBuffer(buffer);

      expect(result.success).toBe(true);
      expect(result.layoutMode).toBe('dual-column');
      expect(result.alignment.leftTeamX).toBe(150);
      expect(result.alignment.rightTeamX).toBe(1050);
      expect(result.alignment.baseY).toBe(250);
      expect(result.alignment.rowGap).toBe(60);
    });
  });
});
