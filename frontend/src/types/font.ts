export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string; // Base64 data URL e.g. data:font/woff2;base64,...
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
  fileName: string;
  uploadedAt: string;
  isBuiltIn?: boolean;
}

export interface BuiltinFontDefinition {
  name: string;
  category: 'Esports Display' | 'Condensed Heavy' | 'Modern Tech' | 'Clean Sans';
  googleFontFamily?: string;
  previewText?: string;
}
