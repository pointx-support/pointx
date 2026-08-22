import { BUILTIN_ESPORTS_FONTS, useFontStore } from '../store/fontStore';

const GOOGLE_FONTS_CSS_URL = `https://fonts.googleapis.com/css2?${BUILTIN_ESPORTS_FONTS.map(
  (f) => `family=${f.googleFontFamily || f.name}`
).join('&')}&display=swap`;

const CACHE_KEY = 'pointx_embedded_fonts_css_v1';
let memoryFontCssCache: string | null = null;

/**
 * Converts a remote URL (like a Google Font WOFF2 file) into a Base64 data URL.
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches Google Fonts CSS and inlines all remote WOFF2 font binaries into Base64 Data URIs.
 * Caches the result in localStorage and memory for instant subsequent exports.
 */
export async function getBase64EmbeddedFontCss(): Promise<string> {
  // 1. Return from in-memory cache if available
  if (memoryFontCssCache) {
    return appendCustomUploadedFonts(memoryFontCssCache);
  }

  // 2. Return from localStorage cache if available
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored && stored.length > 500) {
        memoryFontCssCache = stored;
        return appendCustomUploadedFonts(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  try {
    // 3. Fetch Google Fonts CSS
    const response = await fetch(GOOGLE_FONTS_CSS_URL);
    let cssText = await response.text();

    // 4. Find all font URLs inside url(...)
    const urlMatches = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+)\)/g));
    const uniqueUrls = Array.from(new Set(urlMatches.map((m) => m[1])));

    // 5. Fetch and convert each font URL to Base64 in parallel
    const replacements = await Promise.all(
      uniqueUrls.map(async (fontUrl) => {
        try {
          const base64 = await urlToBase64(fontUrl);
          return { fontUrl, base64 };
        } catch (e) {
          console.warn('Failed to inline font URL:', fontUrl, e);
          return { fontUrl, base64: fontUrl };
        }
      })
    );

    // 6. Replace remote URLs with Base64 Data URIs in the CSS string
    for (const { fontUrl, base64 } of replacements) {
      if (base64.startsWith('data:')) {
        cssText = cssText.split(fontUrl).join(base64);
      }
    }

    // 7. Save to cache
    memoryFontCssCache = cssText;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, cssText);
      } catch {
        // Ignore quota errors
      }
    }

    return appendCustomUploadedFonts(cssText);
  } catch (err) {
    console.warn('Could not fetch and inline Google Fonts:', err);
    return appendCustomUploadedFonts('');
  }
}

/**
 * Appends admin-uploaded custom fonts (which are already in base64 format) to the font stylesheet.
 */
function appendCustomUploadedFonts(baseCss: string): string {
  const customFonts = useFontStore.getState().customFonts;
  if (!customFonts || customFonts.length === 0) {
    return baseCss;
  }

  const customFontFaces = customFonts
    .map(
      (f) => `
@font-face {
  font-family: '${f.name}';
  src: url('${f.dataUrl}') format('${f.format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`
    )
    .join('\n');

  return `${baseCss}\n${customFontFaces}`;
}

/**
 * Preloads and caches all fonts in the background on app startup.
 */
export function preloadAndCacheFonts(): void {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    getBase64EmbeddedFontCss().catch(() => {});
  }, 1000);
}
