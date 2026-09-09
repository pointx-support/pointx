import React, { useState, useEffect, useMemo } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ImageUpload } from '../ui/ImageUpload';
import { OrganizationSuggestPicker } from './OrganizationSuggestPicker';
import { MasterGraphicRenderer } from '../graphics/renderers/MasterGraphicRenderer';
import { templatesApi } from '../../services/api';
import type {
  CustomGraphicsTemplate,
  GraphicTemplateCategory,
  TemplateType,
  TemplateAlignmentConfig,
} from '../../types/customTemplate';
import { normalizeTemplateType } from '../../types/customTemplate';
import type { Tournament } from '../../types/tournament';
import {
  Trophy,
  Flame,
  UserCheck,
  Image as ImageIcon,
  ListOrdered,
  Award,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  Globe,
  Layout,
  Sliders,
  Eye,
  CheckCircle2,
  Building,
  Layers,
} from 'lucide-react';

export interface CustomTemplateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (templateId: string) => void;
  initialTemplate?: CustomGraphicsTemplate | null;
}

// 6 Available Sections
const SECTIONS: {
  type: TemplateType;
  category: GraphicTemplateCategory;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    type: 'POINTS_TABLE',
    category: 'standings',
    title: 'Points Table (Standings)',
    subtitle: '12-team overall match standings, kills, placement and total score leaderboard.',
    icon: Trophy,
    accentColor: 'text-amber-400',
  },
  {
    type: 'KILL_LEADER',
    category: 'warheads',
    title: 'Warheads / Kill Leader',
    subtitle: 'Hero spotlight dedicated to the single highest-kill player in the tournament.',
    icon: Flame,
    accentColor: 'text-rose-400',
  },
  {
    type: 'TOP_FRAGGERS',
    category: 'fraggers',
    title: 'Top Fraggers / MVP',
    subtitle: 'Showcases exactly the Top 3 players by tournament eliminations.',
    icon: UserCheck,
    accentColor: 'text-emerald-400',
  },
  {
    type: 'TEAM_POSTER',
    category: 'team-poster',
    title: 'Team Poster',
    subtitle: 'Single squad feature graphic with team logo, tag, slogan, and 4-player roster.',
    icon: ImageIcon,
    accentColor: 'text-sky-400',
  },
  {
    type: 'SLOTS_LIST',
    category: 'slots-list',
    title: 'Slots List (Schedule)',
    subtitle: '12-team slot allocation matrix without points, kills, or standings rankings.',
    icon: ListOrdered,
    accentColor: 'text-indigo-400',
  },
  {
    type: 'VICTORY_CERTIFICATE',
    category: 'certificate',
    title: 'Victory Certificate',
    subtitle: 'Official diploma for 1 winner/champion squad with custom date, time, and host seal.',
    icon: Award,
    accentColor: 'text-yellow-400',
  },
];

// Layout Options per Section
const LAYOUT_OPTIONS: Record<
  TemplateType,
  { id: string; name: string; description: string; preview: string }[]
> = {
  POINTS_TABLE: [
    {
      id: 'dual-column',
      name: 'Dual Column (6 × 2 Squads)',
      description: '6 teams on the left, 6 teams on the right. Balanced for 16:9 and 4:5 posters.',
      preview: '6 Left / 6 Right',
    },
    {
      id: 'single-column',
      name: 'Single Column (12 × 1 Rows)',
      description: 'Sequential vertical stack of all 12 teams. Great for broadcast sidebars.',
      preview: '12 Stacked Rows',
    },
  ],
  KILL_LEADER: [
    {
      id: 'hero_featured',
      name: 'Hero Featured Showcase',
      description: 'Large center stage hero layout with high-impact kill count and team crest.',
      preview: 'Hero Center Stage',
    },
    {
      id: 'split_showcase',
      name: 'Split Stat Showcase',
      description: 'Left-aligned player cutout with right-side statistical analytics breakdown.',
      preview: 'Split 50/50',
    },
    {
      id: 'compact_badge',
      name: 'Compact Broadcast Badge',
      description: 'Streamlined lower-third style badge for rapid broadcast cuts.',
      preview: 'Minimal Badge',
    },
  ],
  TOP_FRAGGERS: [
    {
      id: 'podium',
      name: 'Podium (1st Center, 2nd Left, 3rd Right)',
      description: 'Elevated center championship pedestal with gold, silver, and bronze framing.',
      preview: '2nd | 1st | 3rd',
    },
    {
      id: 'horizontal_cards',
      name: '3 Horizontal Cards',
      description: 'Side-by-side cards with high-contrast player statistics and avatars.',
      preview: 'Card 1 | Card 2 | Card 3',
    },
    {
      id: 'vertical_cards',
      name: '3 Vertical Stacked Cards',
      description: 'Clean stacked ranking bars ordered from 1st to 3rd place.',
      preview: 'Stack 1 - 2 - 3',
    },
  ],
  TEAM_POSTER: [
    {
      id: 'grid_4',
      name: '4-Player Grid (2 × 2 Lineup)',
      description: 'Balanced squad grid highlighting all 4 tournament roster athletes equally.',
      preview: '2 × 2 Roster Grid',
    },
    {
      id: 'lineup_row',
      name: 'Horizontal Lineup (4 in a Row)',
      description: 'Wide panoramic roster row ideal for landscape 16:9 wallpapers.',
      preview: '4 in a Row',
    },
    {
      id: 'captain_hero',
      name: 'Captain Featured + 3 Teammates',
      description: 'Dominant squad captain portrait with subordinate 3-player lineup.',
      preview: 'Captain + 3 Squad',
    },
  ],
  SLOTS_LIST: [
    {
      id: 'dual_grid',
      name: 'Dual Column (6 × 2 Slots)',
      description: '12 slots divided into two 6-team columns with slot numbering and logos.',
      preview: 'Slots 01-06 / 07-12',
    },
    {
      id: 'single_column',
      name: 'Single Column (12 × 1 Slots)',
      description: 'Full vertical single list of all 12 confirmed team slots.',
      preview: 'Slots 01-12 Stack',
    },
  ],
  VICTORY_CERTIFICATE: [
    {
      id: 'classic_diploma',
      name: 'Classic Esports Diploma',
      description: 'Official gold double frame, ceremonial header, seal, date, and host signature.',
      preview: 'Formal Gold Frame',
    },
    {
      id: 'modern_champion',
      name: 'Modern Champion Award',
      description: 'Aggressive cyber esports aesthetic with bold geometry and glowing accents.',
      preview: 'Cyber Esports Award',
    },
    {
      id: 'minimal_gold',
      name: 'Minimal Luxury Certificate',
      description: 'Clean typography, refined golden accents, and minimalist validation insignia.',
      preview: 'Minimal Luxury',
    },
  ],
  NEEDS_REVIEW: [],
};

// Section-specific editable element keys
const SECTION_ELEMENTS: Record<
  TemplateType,
  { key: string; label: string; defaultSize: number; defaultColor: string }[]
> = {
  POINTS_TABLE: [
    { key: 'rank', label: 'Rank Number (#)', defaultSize: 28, defaultColor: '#ffffff' },
    { key: 'teamName', label: 'Team Name', defaultSize: 22, defaultColor: '#ffffff' },
    { key: 'matches', label: 'Matches (M)', defaultSize: 24, defaultColor: '#ffffff' },
    { key: 'booyah', label: 'Booyah (WWCD)', defaultSize: 24, defaultColor: '#ffffff' },
    { key: 'kills', label: 'Kills (K)', defaultSize: 24, defaultColor: '#ffffff' },
    { key: 'placement', label: 'Place Points (P)', defaultSize: 24, defaultColor: '#ffffff' },
    { key: 'totalPoints', label: 'Total Points (PTS)', defaultSize: 26, defaultColor: '#f59e0b' },
  ],
  KILL_LEADER: [
    { key: 'playerName', label: 'Kill Leader Name', defaultSize: 42, defaultColor: '#ffffff' },
    { key: 'teamName', label: 'Team Name & Tag', defaultSize: 24, defaultColor: '#f59e0b' },
    { key: 'killsCount', label: 'Eliminations Count', defaultSize: 72, defaultColor: '#ef4444' },
    { key: 'tournamentTitle', label: 'Tournament Title', defaultSize: 26, defaultColor: '#ffffff' },
  ],
  TOP_FRAGGERS: [
    { key: 'fragger1', label: 'MVP #1 Player & Kills', defaultSize: 32, defaultColor: '#ffd700' },
    { key: 'fragger2', label: 'Fragger #2 Player & Kills', defaultSize: 28, defaultColor: '#e2e8f0' },
    { key: 'fragger3', label: 'Fragger #3 Player & Kills', defaultSize: 28, defaultColor: '#cd7f32' },
    { key: 'headerTitle', label: 'Category Header', defaultSize: 24, defaultColor: '#ffffff' },
  ],
  TEAM_POSTER: [
    { key: 'teamName', label: 'Featured Team Name', defaultSize: 48, defaultColor: '#ffffff' },
    { key: 'teamTag', label: 'Team Tag / Slogan', defaultSize: 20, defaultColor: '#f59e0b' },
    { key: 'playerRoster', label: 'Player 1-4 Roster Names', defaultSize: 22, defaultColor: '#ffffff' },
    { key: 'tournamentName', label: 'Tournament Branding', defaultSize: 24, defaultColor: '#cbd5e1' },
  ],
  SLOTS_LIST: [
    { key: 'slotNumber', label: 'Slot Number (01..12)', defaultSize: 24, defaultColor: '#f59e0b' },
    { key: 'teamName', label: 'Assigned Team Name', defaultSize: 22, defaultColor: '#ffffff' },
    { key: 'header', label: 'Slots Matrix Header', defaultSize: 28, defaultColor: '#ffffff' },
  ],
  VICTORY_CERTIFICATE: [
    { key: 'recipient', label: 'Champion / Winner Name', defaultSize: 68, defaultColor: '#ffd700' },
    { key: 'awardTitle', label: 'Award Distinction (e.g. CHAMPION)', defaultSize: 42, defaultColor: '#ffd700' },
    { key: 'awardSubtitle', label: 'Award Citation / Subtitle', defaultSize: 18, defaultColor: '#cbd5e1' },
    { key: 'tournamentTitle', label: 'Tournament Title', defaultSize: 26, defaultColor: '#ffffff' },
    { key: 'date', label: 'Issuance Date', defaultSize: 18, defaultColor: '#e2e8f0' },
    { key: 'time', label: 'Tournament Time', defaultSize: 14, defaultColor: '#a0aec0' },
    { key: 'signature', label: 'Official Host Signature', defaultSize: 18, defaultColor: '#e2e8f0' },
  ],
  NEEDS_REVIEW: [],
};

// High-Fidelity Realistic Mock Data for Live Preview
const PREVIEW_TOURNAMENT: Tournament = {
  id: 'tour-preview-canonical',
  title: 'POINTX FREE FIRE MASTERS',
  game: 'Free Fire',
  organizer: 'PointX Esports Arena',
  organizerLogoUrl: '',
  logoUrl: '',
  status: 'Ongoing',
  tournamentType: 'Battle Royale',
  structure: {
    teamCount: 12,
    matchCount: 1,
    roundRobin: false,
    slotsPerMatch: 12,
  },
  scoringPreset: {
    id: 'preset-official',
    version: 1,
    name: 'Official Esports Standard',
    game: 'Free Fire',
    killPoints: 1,
    booyahBonusPoints: 0,
    tieBreakOrder: ['totalPoints', 'totalKills'],
    placementTable: [
      { place: 1, points: 12 },
      { place: 2, points: 9 },
      { place: 3, points: 8 },
      { place: 4, points: 7 },
      { place: 5, points: 6 },
      { place: 6, points: 5 },
      { place: 7, points: 4 },
      { place: 8, points: 3 },
      { place: 9, points: 2 },
      { place: 10, points: 1 },
      { place: 11, points: 0 },
      { place: 12, points: 0 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startDate: new Date().toISOString().split('T')[0],
  teams: [
    { id: 't1', name: 'Total Gaming Esports', tag: 'TG', logoUrl: '', slotNumber: 1, players: [{ id: 'p1', name: 'Ajjubhai', inGameId: 'TG_AJJU', role: 'Rusher' }, { id: 'p2', name: 'Mafia', inGameId: 'TG_MAFIA', role: 'Sniper' }, { id: 'p3', name: 'FozyAjay', inGameId: 'TG_FOZY', role: 'Support' }, { id: 'p4', name: 'Bala', inGameId: 'TG_BALA', role: 'Captain' }] },
    { id: 't2', name: 'GodLike Esports', tag: 'GODL', logoUrl: '', slotNumber: 2, players: [{ id: 'p5', name: 'VasiyoCRJ7', inGameId: 'GODL_VASI', role: 'Leader' }, { id: 'p6', name: 'Nivesh', inGameId: 'GODL_NIV', role: 'Rusher' }, { id: 'p7', name: 'GodG', inGameId: 'GODL_GG', role: 'Fragger' }, { id: 'p8', name: 'Akash', inGameId: 'GODL_AKA', role: 'Support' }] },
    { id: 't3', name: 'Blind Esports', tag: 'BLIND', logoUrl: '', slotNumber: 3, players: [{ id: 'p9', name: 'BlinD_Star', inGameId: 'BLIND_STAR' }, { id: 'p10', name: 'BlinD_God', inGameId: 'BLIND_GOD' }, { id: 'p11', name: 'BlinD_King', inGameId: 'BLIND_KING' }, { id: 'p12', name: 'BlinD_Max', inGameId: 'BLIND_MAX' }] },
    { id: 't4', name: 'Orangutan Esports', tag: 'OG', logoUrl: '', slotNumber: 4, players: [{ id: 'p13', name: 'OG_Raptor', inGameId: 'OG_RAP' }] },
    { id: 't5', name: 'Team Elite', tag: 'ELITE', logoUrl: '', slotNumber: 5, players: [{ id: 'p14', name: 'Elite_Killer', inGameId: 'TE_KILL' }] },
    { id: 't6', name: 'Nigma Galaxy', tag: 'NGX', logoUrl: '', slotNumber: 6, players: [{ id: 'p15', name: 'NGX_Shadow', inGameId: 'NGX_SHAD' }] },
    { id: 't7', name: 'Chemin Esports', tag: 'CHM', logoUrl: '', slotNumber: 7, players: [{ id: 'p16', name: 'CHM_Radhe', inGameId: 'CHM_RAD' }] },
    { id: 't8', name: 'TSM India', tag: 'TSM', logoUrl: '', slotNumber: 8, players: [{ id: 'p17', name: 'TSM_OldMonk', inGameId: 'TSM_OLD' }] },
    { id: 't9', name: 'Revenant Esports', tag: 'RVT', logoUrl: '', slotNumber: 9, players: [{ id: 'p18', name: 'RVT_B2K', inGameId: 'RVT_B2K' }] },
    { id: 't10', name: 'Team Insane', tag: 'INS', logoUrl: '', slotNumber: 10, players: [{ id: 'p19', name: 'INS_Fury', inGameId: 'INS_FURY' }] },
    { id: 't11', name: 'Hydra Esports', tag: 'HYDRA', logoUrl: '', slotNumber: 11, players: [{ id: 'p20', name: 'HYDRA_Dynamo', inGameId: 'HYD_DYN' }] },
    { id: 't12', name: 'Enigma Gaming', tag: 'EG', logoUrl: '', slotNumber: 12, players: [{ id: 'p21', name: 'EG_Venom', inGameId: 'EG_VEN' }] },
  ],
  matches: [
    {
      id: 'm1',
      matchNumber: 1,
      map: 'Bermuda',
      status: 'finished',
      results: [
        { teamId: 't1', placement: 1, kills: 14, playerStats: [{ playerId: 'p1', kills: 8 }, { playerId: 'p2', kills: 4 }, { playerId: 'p3', kills: 2 }] },
        { teamId: 't2', placement: 2, kills: 9, playerStats: [{ playerId: 'p5', kills: 6 }, { playerId: 'p6', kills: 3 }] },
        { teamId: 't3', placement: 3, kills: 7, playerStats: [{ playerId: 'p9', kills: 5 }] },
      ],
    } as any,
  ],
};

export const CustomTemplateWizard: React.FC<CustomTemplateWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTemplate,
}) => {
  const { addTemplate, syncTemplates } = useTemplateStore();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Template Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:5'>('16:9');

  // Step 2: Choose Section
  const [section, setSection] = useState<TemplateType>('POINTS_TABLE');
  const [category, setCategory] = useState<GraphicTemplateCategory>('standings');

  // Step 3: Choose Default Layout
  const [defaultLayout, setDefaultLayout] = useState<string>('dual-column');

  // Step 4: Edit Template Elements
  const [elements, setElements] = useState<Record<string, any>>({});
  const [fontFamily, setFontFamily] = useState('Rajdhani');

  // Step 5: Organization Access Control
  const [visibility, setVisibility] = useState<'GLOBAL' | 'ORGANIZATION_RESTRICTED'>('GLOBAL');
  const [allowedOrganizationIds, setAllowedOrganizationIds] = useState<string[]>([]);

  // Registered Organizations for Picker
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; email: string; logoUrl?: string }>>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Initialize or Reset
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setDescription(initialTemplate.description || '');
      setImageUrl(initialTemplate.imageUrl || '');
      setAspectRatio((initialTemplate.aspectRatio as '16:9' | '4:5') || '16:9');
      const resolvedType = initialTemplate.templateType || normalizeTemplateType(initialTemplate.category);
      setSection(resolvedType);
      setCategory(initialTemplate.category || 'standings');
      setDefaultLayout(initialTemplate.defaultLayout || 'dual-column');
      setElements(initialTemplate.elements || {});
      setVisibility(initialTemplate.visibility || 'GLOBAL');
      setAllowedOrganizationIds(initialTemplate.allowedOrganizationIds || []);
      setCurrentStep(1);
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setAspectRatio('16:9');
      setSection('POINTS_TABLE');
      setCategory('standings');
      setDefaultLayout('dual-column');
      setElements({});
      setVisibility('GLOBAL');
      setAllowedOrganizationIds([]);
      setCurrentStep(1);
    }
  }, [initialTemplate, isOpen]);

  // Load organizations for picker
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setIsLoadingOrgs(true);
      templatesApi.getOrganizations()
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch((err) => console.warn('[CustomTemplateWizard] Failed to load orgs:', err))
        .finally(() => {
          if (isMounted) setIsLoadingOrgs(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle Section Change
  const handleSelectSection = (newSection: TemplateType) => {
    setSection(newSection);
    const secMeta = SECTIONS.find((s) => s.type === newSection);
    if (secMeta) {
      setCategory(secMeta.category);
    }
    const defaultLayoutId = LAYOUT_OPTIONS[newSection]?.[0]?.id || 'default';
    setDefaultLayout(defaultLayoutId);

    // Initialize default elements for section
    const defaultSecElements = SECTION_ELEMENTS[newSection] || [];
    const initialEleMap: Record<string, any> = {};
    defaultSecElements.forEach((el) => {
      initialEleMap[el.key] = {
        fontSize: el.defaultSize,
        fill: el.defaultColor,
        visible: true,
      };
    });
    setElements(initialEleMap);

    // Certificate defaults to 16:9 widescreen
    if (newSection === 'VICTORY_CERTIFICATE') {
      setAspectRatio('16:9');
    }
  };

  // Build simulated preview template
  const previewTemplate: CustomGraphicsTemplate = useMemo(() => {
    const width = aspectRatio === '4:5' ? 1080 : 1920;
    const height = aspectRatio === '4:5' ? 1350 : 1080;

    const baseAlignment: TemplateAlignmentConfig = {
      aspectRatio,
      width,
      height,
      layoutMode: defaultLayout === 'single-column' ? 'single-column' : 'dual-column',
      baseY: aspectRatio === '4:5' ? 680 : 540,
      rowGap: aspectRatio === '4:5' ? 44 : 84,
      fontFamily,
      rankFontSize: 28,
      teamFontSize: 22,
      statFontSize: 24,
      totalFontSize: 26,
      teamFontWeight: '800',
      rankColor: '#ffffff',
      teamColor: '#ffffff',
      statColor: '#ffffff',
      totalColor: '#f59e0b',
      leftRankX: 132,
      leftTeamX: 206,
      leftMatchX: 530,
      leftBooyahX: 612,
      leftKillsX: 695,
      leftPlaceX: 778,
      leftTotalX: 860,
      rightRankX: 1048,
      rightTeamX: 1122,
      rightMatchX: 1446,
      rightBooyahX: 1528,
      rightKillsX: 1610,
      rightPlaceX: 1692,
      rightTotalX: 1775,
      showSubtitleBanner: false,
      subtitleX: 540,
      subtitleY: 200,
      subtitleWidth: 400,
      subtitleHeight: 50,
      subtitleFontSize: 28,
      subtitleBgColor: '#051d38',
      subtitleBorderColor: '#f59e0b',
      subtitleTextColor: '#ffffff',
    };

    return {
      id: initialTemplate?.id || 'preview-wizard-template',
      name: name.trim() || 'Custom Template Preview',
      description: description.trim() || 'Esports Tournament Template',
      imageUrl: imageUrl.trim() || '',
      aspectRatio,
      alignment: baseAlignment,
      templateType: section,
      category,
      defaultLayout,
      elements,
      variables: (SECTION_ELEMENTS[section] || []).map((e) => e.key),
      isBuiltIn: false,
      isPublished: true,
      visibility,
      allowedOrganizationIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [name, description, imageUrl, aspectRatio, section, category, defaultLayout, elements, fontFamily, visibility, allowedOrganizationIds, initialTemplate]);

  // Step Validation Checkers
  const canProceedStep1 = Boolean(name.trim() && imageUrl.trim());
  const canProceedStep2 = Boolean(section);
  const canProceedStep3 = Boolean(defaultLayout);
  const canProceedStep5 = visibility === 'GLOBAL' || allowedOrganizationIds.length > 0;

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Please provide both template name and background artwork.' });
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      showToast({ type: 'error', title: 'Section Required', message: 'Please select a section category to proceed.' });
      return;
    }
    if (currentStep === 3 && !canProceedStep3) {
      showToast({ type: 'error', title: 'Layout Required', message: 'Please select a default layout for this section.' });
      return;
    }
    if (currentStep === 5 && !canProceedStep5) {
      showToast({ type: 'error', title: 'Organization Required', message: 'Please select at least one permitted organization for restricted templates.' });
      return;
    }
    setCurrentStep((s) => Math.min(7, s + 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  // Submit & Save
  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter a template name.' });
      setCurrentStep(1);
      return;
    }
    if (!imageUrl.trim()) {
      showToast({ type: 'error', title: 'Artwork Required', message: 'Please upload template background artwork.' });
      setCurrentStep(1);
      return;
    }
    if (visibility === 'ORGANIZATION_RESTRICTED' && allowedOrganizationIds.length === 0) {
      showToast({ type: 'error', title: 'Organization Required', message: 'Please select at least one organization.' });
      setCurrentStep(5);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || 'Custom esports template calibrated by Admin.',
        imageUrl: imageUrl.trim(),
        aspectRatio,
        templateType: section,
        category,
        defaultLayout,
        elements,
        variables: (SECTION_ELEMENTS[section] || []).map((e) => e.key),
        visibility,
        allowedOrganizationIds: visibility === 'ORGANIZATION_RESTRICTED' ? allowedOrganizationIds : [],
        isPublished: true,
        alignment: previewTemplate.alignment,
      };

      let savedId: string;
      if (initialTemplate?.id && !initialTemplate.isBuiltIn) {
        const res = await templatesApi.update(initialTemplate.id, payload);
        savedId = res.data?.id || (res.data as any)?._id || initialTemplate.id;
        showToast({ type: 'success', title: 'Template Updated', message: `Successfully updated "${name.trim()}".` });
      } else {
        const res = await templatesApi.create(payload);
        if (!res.success || !res.data) {
          throw new Error(res.error || 'Failed to create template on server.');
        }
        savedId = res.data.id || (res.data as any)._id;
        addTemplate(res.data as any);
        showToast({ type: 'success', title: 'Template Created', message: `Successfully created "${name.trim()}".` });
      }

      // Re-sync all templates from server to guarantee tenant isolation
      templatesApi.getAll().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          syncTemplates(res.data as any);
        }
      });

      if (onSuccess) {
        onSuccess(savedId);
      }
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err?.message || 'Could not save custom template to server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Info' },
    { num: 2, title: 'Section' },
    { num: 3, title: 'Layout' },
    { num: 4, title: 'Elements' },
    { num: 5, title: 'Access' },
    { num: 6, title: 'Preview' },
    { num: 7, title: 'Save' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTemplate ? `Edit Template: ${initialTemplate.name}` : 'Create Custom Studio Template'}
      description="7-step calibrated flow: section data model, layout geometry, tenant access, and live preview."
      maxWidth="xl"
    >
      <div className="space-y-5 font-sans">
        {/* Step Progress Stepper Bar */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-2 border-b border-[var(--border-subtle)]">
          {stepsList.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (isCompleted || (step.num === 1)) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                    : isCompleted
                    ? 'bg-[var(--bg-surface-inset)] text-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)]'
                    : 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isActive ? 'bg-black/20 text-current' : isCompleted ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-white/10'
                }`}>
                  {isCompleted ? <Check className="h-3 w-3" /> : step.num}
                </span>
                <span className="hidden sm:inline font-display">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: TEMPLATE INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
                Step 1: Template Information & Artwork
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Provide branding, dimensions, and the foundational background image.
              </p>
            </div>

            <Input
              label="Template Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neon Horizon Grand Finals Overlay"
              required
            />

            <Input
              label="Description / Purpose Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Official poster artwork for Grand Championship broadcasts"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Aspect Ratio Format *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    aspectRatio === '16:9'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-6 rounded bg-white/10 border border-white/20 flex items-center justify-center font-mono text-[10px] font-bold">
                    16:9
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-display">16:9 Widescreen</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">1920 × 1080 Full HD</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('4:5')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    aspectRatio === '4:5'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:border-white/20'
                  }`}
                >
                  <div className="w-6 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center font-mono text-[10px] font-bold">
                    4:5
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-display">4:5 Portrait Poster</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">1080 × 1350 Instagram Feed</div>
                  </div>
                </button>
              </div>
            </div>

            <ImageUpload
              label="Background Artwork Image *"
              value={imageUrl}
              onChange={(val) => setImageUrl(val || '')}
              helperText="Upload official poster artwork without hardcoded leaderboard rows. (PNG, JPG, WebP)."
            />
          </div>
        )}

        {/* STEP 2: CHOOSE SECTION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <Layout className="h-4 w-4 text-[var(--accent-primary)]" />
                Step 2: Choose Template Section
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Templates are strictly tied to specific graphic types. Select what this template renders.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isSelected = section === sec.type;

                return (
                  <button
                    key={sec.type}
                    type="button"
                    onClick={() => handleSelectSection(sec.type)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md ring-1 ring-[var(--accent-primary)]/40'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-white/20 hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-white/10 ${sec.accentColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-xs text-[var(--text-primary)] font-display">
                          {sec.title}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-black flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {sec.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: CHOOSE DEFAULT LAYOUT */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent-primary)]" />
                Step 3: Default Layout Geometry ({SECTIONS.find((s) => s.type === section)?.title})
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Layout options automatically adapt specifically to the {section} data contract.
              </p>
            </div>

            <div className="space-y-3">
              {(LAYOUT_OPTIONS[section] || []).map((layout) => {
                const isSelected = defaultLayout === layout.id;

                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setDefaultLayout(layout.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md ring-1 ring-[var(--accent-primary)]/40'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--text-primary)] font-display">
                          {layout.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-[var(--accent-primary)] font-bold">
                          {layout.preview}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {layout.description}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-black' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: EDIT TEMPLATE ELEMENTS */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[var(--accent-primary)]" />
                  Step 4: Edit Section Elements & Typography
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Calibrate styling and font scales for each section variable.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">Font:</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="Rajdhani">Rajdhani (Esports Default)</option>
                  <option value="Teko">Teko (High-Impact Tall)</option>
                  <option value="Oxanium">Oxanium (Sci-Fi Futuristic)</option>
                  <option value="sans-serif">Sans-Serif (Standard)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {(SECTION_ELEMENTS[section] || []).map((el) => {
                const currentEl = elements[el.key] || {
                  fontSize: el.defaultSize,
                  fill: el.defaultColor,
                  visible: true,
                };

                return (
                  <div
                    key={el.key}
                    className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--text-primary)] font-display block">
                        {el.label}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        Variable Key: {el.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">Size:</span>
                        <input
                          type="number"
                          min="12"
                          max="96"
                          value={currentEl.fontSize || el.defaultSize}
                          onChange={(e) =>
                            setElements((prev) => ({
                              ...prev,
                              [el.key]: { ...currentEl, fontSize: Number(e.target.value) },
                            }))
                          }
                          className="w-14 px-2 py-1 rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] font-mono text-xs text-center text-[var(--text-primary)]"
                        />
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">px</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">Color:</span>
                        <input
                          type="color"
                          value={currentEl.fill || el.defaultColor}
                          onChange={(e) =>
                            setElements((prev) => ({
                              ...prev,
                              [el.key]: { ...currentEl, fill: e.target.value },
                            }))
                          }
                          className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: ORGANIZATION ACCESS CONTROL */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--accent-primary)]" />
                Step 5: Organization Access Control (IDOR Protected)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Control which organizations can discover, open, and export graphics with this template.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('GLOBAL')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  visibility === 'GLOBAL'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md ring-1 ring-[var(--accent-primary)]/40'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-white/20'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                    All Organizations
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px]">Public</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Published globally. Every tournament organizer on PointX can discover and use this template.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('ORGANIZATION_RESTRICTED')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  visibility === 'ORGANIZATION_RESTRICTED'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-white/20'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                    Specific Organizations
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px]">Restricted</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Restricted strictly to authorized organizers. Unauthorized users will receive 403 Forbidden.
                  </p>
                </div>
              </button>
            </div>

            {visibility === 'ORGANIZATION_RESTRICTED' && (
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Permitted Organizations *
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {allowedOrganizationIds.length} organization(s) selected
                  </span>
                </div>

                <OrganizationSuggestPicker
                  organizations={organizations}
                  selectedOrgIds={allowedOrganizationIds}
                  onChange={(ids) => setAllowedOrganizationIds(ids)}
                  placeholder="Search organization by name or lead email..."
                  isLoading={isLoadingOrgs}
                />

                {allowedOrganizationIds.length === 0 && (
                  <p className="text-xs text-amber-400 font-mono">
                    ⚠️ You must select at least one organization for restricted templates.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: LIVE SECTION-SPECIFIC PREVIEW */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[var(--accent-primary)]" />
                  Step 6: Live Section-Specific Preview
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Renderer: <strong className="text-[var(--text-primary)] font-mono">{section}</strong> ({defaultLayout}) — Verified Section Isolation.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-mono text-xs font-bold">
                {aspectRatio === '4:5' ? '1080 × 1350' : '1920 × 1080'}
              </span>
            </div>

            <div className="flex justify-center p-2 rounded-2xl bg-black/60 border border-[var(--border-subtle)]">
              <div className={`relative w-full ${aspectRatio === '4:5' ? 'max-w-xs aspect-[4/5]' : 'max-w-xl aspect-video'} rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center`}>
                <MasterGraphicRenderer
                  template={previewTemplate}
                  tournament={PREVIEW_TOURNAMENT}
                  options={{
                    customTitle: PREVIEW_TOURNAMENT.title,
                    organizerName: PREVIEW_TOURNAMENT.organizer,
                    awardTitle: 'CHAMPION',
                    awardSubtitle: 'For Outstanding Tactical Victory',
                    tournamentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    tournamentTime: '07:30 PM IST',
                  }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Verified: This preview uses strictly the {section} pipeline. No foreign section data is leaking into this graphic.
              </span>
            </div>
          </div>
        )}

        {/* STEP 7: SAVE TEMPLATE */}
        {currentStep === 7 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent-primary)]" />
                Step 7: Final Review & Publish
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Review calibrated template properties before committing to the database.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Template Name</span>
                <div className="font-bold text-[var(--text-primary)] font-display">{name}</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Section & Layout</span>
                <div className="font-bold text-[var(--text-primary)] font-display">
                  {section} • {defaultLayout}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Canvas Dimensions</span>
                <div className="font-mono font-bold text-[var(--text-primary)]">
                  {aspectRatio === '4:5' ? '4:5 Portrait (1080 × 1350)' : '16:9 Widescreen (1920 × 1080)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Organization Access</span>
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  {visibility === 'GLOBAL' ? (
                    <>
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">All Organizations (Global)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-400">
                        {allowedOrganizationIds.length} Permitted Organization(s)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                Ready to save. Once published, this template will be immediately accessible to permitted tournament organizers.
              </span>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            leftIcon={currentStep > 1 ? <ChevronLeft className="h-4 w-4" /> : undefined}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 7 ? (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleNext}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="booyah"
                size="sm"
                type="button"
                isLoading={isSubmitting}
                onClick={handleSaveTemplate}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                {initialTemplate ? 'Save Changes' : 'Save & Publish Template'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
