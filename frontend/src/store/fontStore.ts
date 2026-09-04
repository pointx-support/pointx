import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomFont, BuiltinFontDefinition } from '../types/font';

export const BUILTIN_ESPORTS_FONTS: BuiltinFontDefinition[] = [
  { name: 'Rajdhani', category: 'Esports Display', googleFontFamily: 'Rajdhani:wght@600;700;800' },
  { name: 'Teko', category: 'Condensed Heavy', googleFontFamily: 'Teko:wght@600;700;800' },
  { name: 'Bebas Neue', category: 'Condensed Heavy', googleFontFamily: 'Bebas+Neue' },
  { name: 'Space Grotesk', category: 'Modern Tech', googleFontFamily: 'Space+Grotesk:wght@600;700;800' },
  { name: 'Chakra Petch', category: 'Modern Tech', googleFontFamily: 'Chakra+Petch:wght@600;700;800' },
  { name: 'Sora', category: 'Esports Display', googleFontFamily: 'Sora:wght@600;700;800' },
  { name: 'Montserrat', category: 'Clean Sans', googleFontFamily: 'Montserrat:wght@700;800;900' },
  { name: 'Anton', category: 'Condensed Heavy', googleFontFamily: 'Anton' },
  { name: 'Russo One', category: 'Esports Display', googleFontFamily: 'Russo+One' },
  { name: 'Oxanium', category: 'Modern Tech', googleFontFamily: 'Oxanium:wght@600;700;800' },
  { name: 'Orbitron', category: 'Modern Tech', googleFontFamily: 'Orbitron:wght@700;800;900' }
];

export interface FontStoreState {
  customFonts: CustomFont[];

  // Actions
  uploadCustomFont: (name: string, file: File) => Promise<CustomFont>;
  deleteCustomFont: (id: string) => void;
  getAllFontNames: () => string[];
  registerAllFontsInDocument: () => void;
  getSvgDefsFontStyle: () => string;
}

export const useFontStore = create<FontStoreState>()(
  persist(
    (set, get) => ({
      customFonts: [],

      uploadCustomFont: async (name: string, file: File): Promise<CustomFont> => {
        const cleanName = name.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const ext = file.name.split('.').pop()?.toLowerCase() || 'woff2';

        let format: CustomFont['format'] = 'woff2';
        if (ext === 'ttf') format = 'truetype';
        else if (ext === 'otf') format = 'opentype';
        else if (ext === 'woff') format = 'woff';

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const newFont: CustomFont = {
          id: `font-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
          name: cleanName,
          dataUrl,
          format,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        };

        // Dynamically add FontFace to document
        if (typeof document !== 'undefined' && 'fonts' in document) {
          try {
            const fontFace = new FontFace(cleanName, `url(${dataUrl})`);
            await fontFace.load();
            document.fonts.add(fontFace);
          } catch (err) {
            console.warn('FontFace registration error:', err);
          }
        }

        set((state) => ({
          customFonts: [newFont, ...state.customFonts.filter((f) => f.name.toLowerCase() !== cleanName.toLowerCase())]
        }));

        return newFont;
      },

      deleteCustomFont: (id: string) => {
        set((state) => ({
          customFonts: state.customFonts.filter((f) => f.id !== id)
        }));
      },

      getAllFontNames: () => {
        const { customFonts } = get();
        const builtins = BUILTIN_ESPORTS_FONTS.map((f) => f.name);
        const customs = customFonts.map((f) => f.name);
        return Array.from(new Set([...customs, ...builtins]));
      },

      registerAllFontsInDocument: () => {
        if (typeof document === 'undefined' || !('fonts' in document)) return;
        const { customFonts } = get();

        customFonts.forEach(async (font) => {
          try {
            const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
            await fontFace.load();
            document.fonts.add(fontFace);
          } catch (e) {
            console.warn('Error loading custom font face:', font.name, e);
          }
        });
      },

      getSvgDefsFontStyle: () => {
        const { customFonts } = get();

        // 1. Google Fonts imports for standard esports fonts
        const googleFamilies = BUILTIN_ESPORTS_FONTS.map((f) => `family=${f.googleFontFamily || f.name}`).join('&');
        const googleImport = `@import url('https://fonts.googleapis.com/css2?${googleFamilies}&display=swap');\n`;

        // 2. Base64 embedded @font-face declarations for custom uploaded fonts
        const customFontFaces = customFonts
          .map((f) => {
            const cleanName = (f.name || 'CustomFont').replace(/[^a-zA-Z0-9 _\-]/g, '').slice(0, 50);
            const cleanFormat = (f.format || 'woff2').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
            const cleanDataUrl = (f.dataUrl || '').replace(/['"\\()<>]/g, '');
            return `
@font-face {
  font-family: '${cleanName}';
  src: url('${cleanDataUrl}') format('${cleanFormat}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
          })
          .join('\n');

        return `${googleImport}\n${customFontFaces}`;
      }
    }),
    {
      name: 'pointx_custom_fonts_v2'
    }
  )
);
