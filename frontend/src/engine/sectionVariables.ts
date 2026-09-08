import type { TemplateType } from '../types/customTemplate';

export interface SectionVariableDef {
  key: string;
  variable: string;
  label: string;
  description: string;
  sampleValue: string;
}

export const SECTION_VARIABLES: Record<TemplateType, SectionVariableDef[]> = {
  POINTS_TABLE: [
    { key: 'tournamentTitle', variable: '{{tournament_name}}', label: 'Tournament Title', description: 'Name of the tournament or championship', sampleValue: 'FREE FIRE MASTERS' },
    { key: 'organizer', variable: '{{organizer_name}}', label: 'Organizer Name', description: 'Host organization or league brand', sampleValue: 'POINTX ESPORTS' },
    { key: 'subtitle', variable: '{{subtitle}}', label: 'Scope Subtitle', description: 'Match or overall standings scope', sampleValue: 'OVERALL STANDINGS' },
    { key: 'rank', variable: '{{rank}}', label: 'Team Rank (#1..12)', description: 'Placement rank in standings', sampleValue: '#01' },
    { key: 'teamName', variable: '{{team_name}}', label: 'Team Name', description: 'Official registered team name', sampleValue: 'ALPHA SQUAD' },
    { key: 'teamLogo', variable: '{{team_logo}}', label: 'Team Logo', description: 'Team emblem image', sampleValue: '[Team Logo]' },
    { key: 'kills', variable: '{{kills}}', label: 'Elimination Points', description: 'Total match or cumulative kills', sampleValue: '18' },
    { key: 'place', variable: '{{placement_pts}}', label: 'Placement Points', description: 'Rank position points', sampleValue: '12' },
    { key: 'total', variable: '{{total_pts}}', label: 'Total Points', description: 'Grand total points (Kills + Placement)', sampleValue: '30' },
    { key: 'booyah', variable: '{{booyah_count}}', label: 'Booyah Count', description: 'Total #1 Booyahs achieved', sampleValue: '2' },
  ],
  KILL_LEADER: [
    { key: 'player_name', variable: '{{player_name}}', label: 'Kill Leader Name', description: 'Player with the most eliminations in the tournament', sampleValue: 'VIPERX' },
    { key: 'player_photo', variable: '{{player_photo}}', label: 'Player Avatar / Photo', description: 'Kill leader portrait image', sampleValue: '[Player Photo]' },
    { key: 'team_name', variable: '{{team_name}}', label: 'Team Name', description: 'Squad name of the kill leader', sampleValue: 'ALPHA SQUAD' },
    { key: 'team_logo', variable: '{{team_logo}}', label: 'Team Crest / Logo', description: 'Kill leader team crest', sampleValue: '[Team Logo]' },
    { key: 'total_kills', variable: '{{total_kills}}', label: 'Total Eliminations', description: 'Total tournament kills made by this player', sampleValue: '48' },
    { key: 'damage', variable: '{{damage}}', label: 'Total Damage', description: 'Cumulative damage dealt', sampleValue: '8,850' },
    { key: 'avg_kills', variable: '{{avg_kills}}', label: 'Avg Kills / Match', description: 'Average kills per battle', sampleValue: '8.0' },
    { key: 'tournament_name', variable: '{{tournament_name}}', label: 'Tournament Name', description: 'Official championship title', sampleValue: 'FREE FIRE MASTERS' },
    { key: 'organizer_name', variable: '{{organizer_name}}', label: 'Host Organization', description: 'Official hosting entity', sampleValue: 'POINTX ESPORTS' },
  ],
  TOP_FRAGGERS: [
    { key: 'player1_name', variable: '{{player1_name}}', label: '1st MVP Name', description: 'Tournament #1 Fragger player name', sampleValue: 'VIPERX' },
    { key: 'player1_kills', variable: '{{player1_kills}}', label: '1st MVP Kills', description: '#1 Fragger total eliminations', sampleValue: '48' },
    { key: 'player1_team', variable: '{{player1_team}}', label: '1st MVP Team', description: '#1 Fragger team name', sampleValue: 'ALPHA SQUAD' },
    { key: 'player1_photo', variable: '{{player1_photo}}', label: '1st MVP Photo', description: '#1 Fragger photo / avatar', sampleValue: '[Player 1 Photo]' },

    { key: 'player2_name', variable: '{{player2_name}}', label: '2nd MVP Name', description: 'Tournament #2 Fragger player name', sampleValue: 'GHOST_RIDER' },
    { key: 'player2_kills', variable: '{{player2_kills}}', label: '2nd MVP Kills', description: '#2 Fragger total eliminations', sampleValue: '42' },
    { key: 'player2_team', variable: '{{player2_team}}', label: '2nd MVP Team', description: '#2 Fragger team name', sampleValue: 'NEXUS ESPORTS' },
    { key: 'player2_photo', variable: '{{player2_photo}}', label: '2nd MVP Photo', description: '#2 Fragger photo / avatar', sampleValue: '[Player 2 Photo]' },

    { key: 'player3_name', variable: '{{player3_name}}', label: '3rd MVP Name', description: 'Tournament #3 Fragger player name', sampleValue: 'SHADOW_SNIPER' },
    { key: 'player3_kills', variable: '{{player3_kills}}', label: '3rd MVP Kills', description: '#3 Fragger total eliminations', sampleValue: '39' },
    { key: 'player3_team', variable: '{{player3_team}}', label: '3rd MVP Team', description: '#3 Fragger team name', sampleValue: 'VALOR WARRIORS' },
    { key: 'player3_photo', variable: '{{player3_photo}}', label: '3rd MVP Photo', description: '#3 Fragger photo / avatar', sampleValue: '[Player 3 Photo]' },

    { key: 'tournament_name', variable: '{{tournament_name}}', label: 'Tournament Name', description: 'Official championship title', sampleValue: 'FREE FIRE MASTERS' },
    { key: 'tournament_logo', variable: '{{tournament_logo}}', label: 'Tournament Logo', description: 'Championship branding logo', sampleValue: '[Tournament Logo]' },
    { key: 'organizer_name', variable: '{{organizer_name}}', label: 'Organizer Name', description: 'Host organization name', sampleValue: 'POINTX ARENA' },
  ],
  TEAM_POSTER: [
    { key: 'team_name', variable: '{{team_name}}', label: 'Team Name', description: 'Full showcase team name', sampleValue: 'ALPHA ESPORTS' },
    { key: 'team_tag', variable: '{{team_tag}}', label: 'Team Tag', description: '3-4 letter shorthand tag', sampleValue: 'ALP' },
    { key: 'team_logo', variable: '{{team_logo}}', label: 'Team Logo', description: 'Team crest/logo', sampleValue: '[Team Logo]' },
    { key: 'team_slogan', variable: '{{team_slogan}}', label: 'Team Slogan', description: 'Motto or slogan of the squad', sampleValue: 'VICTORY THROUGH SKILL' },
    { key: 'player1_name', variable: '{{player1_name}}', label: 'Player 1 (Captain)', description: 'IGL / Captain player name', sampleValue: 'AlphaCaptain' },
    { key: 'player1_photo', variable: '{{player1_photo}}', label: 'Player 1 Photo', description: 'Player 1 portrait image', sampleValue: '[Photo 1]' },
    { key: 'player2_name', variable: '{{player2_name}}', label: 'Player 2 (Rusher)', description: 'Primary rusher player name', sampleValue: 'GhostSniper' },
    { key: 'player2_photo', variable: '{{player2_photo}}', label: 'Player 2 Photo', description: 'Player 2 portrait image', sampleValue: '[Photo 2]' },
    { key: 'player3_name', variable: '{{player3_name}}', label: 'Player 3 (Sniper)', description: 'Marksman player name', sampleValue: 'NeonRusher' },
    { key: 'player3_photo', variable: '{{player3_photo}}', label: 'Player 3 Photo', description: 'Player 3 portrait image', sampleValue: '[Photo 3]' },
    { key: 'player4_name', variable: '{{player4_name}}', label: 'Player 4 (Support)', description: 'Support player name', sampleValue: 'ShadowSupport' },
    { key: 'player4_photo', variable: '{{player4_photo}}', label: 'Player 4 Photo', description: 'Player 4 portrait image', sampleValue: '[Photo 4]' },
    { key: 'tournament_name', variable: '{{tournament_name}}', label: 'Tournament Name', description: 'Official championship title', sampleValue: 'FREE FIRE MASTERS' },
  ],
  SLOTS_LIST: [
    { key: 'slot1', variable: '{{slot1}}', label: 'Slot 01 Number', description: 'Numbered slot 01', sampleValue: '#01' },
    { key: 'team1_name', variable: '{{team1_name}}', label: 'Slot 01 Team Name', description: 'Team assigned to Slot 01', sampleValue: 'ALPHA SQUAD' },
    { key: 'team1_logo', variable: '{{team1_logo}}', label: 'Slot 01 Team Logo', description: 'Emblem for Slot 01 team', sampleValue: '[Logo 1]' },
    { key: 'slot2', variable: '{{slot2}}', label: 'Slot 02 Number', description: 'Numbered slot 02', sampleValue: '#02' },
    { key: 'team2_name', variable: '{{team2_name}}', label: 'Slot 02 Team Name', description: 'Team assigned to Slot 02', sampleValue: 'BRAVO ESPORTS' },
    { key: 'team2_logo', variable: '{{team2_logo}}', label: 'Slot 02 Team Logo', description: 'Emblem for Slot 02 team', sampleValue: '[Logo 2]' },
    { key: 'slot12', variable: '{{slot12}}', label: 'Slot 12 Number', description: 'Numbered slot 12', sampleValue: '#12' },
    { key: 'team12_name', variable: '{{team12_name}}', label: 'Slot 12 Team Name', description: 'Team assigned to Slot 12', sampleValue: 'ZETA GAMING' },
    { key: 'tournament_name', variable: '{{tournament_name}}', label: 'Tournament Name', description: 'Championship name', sampleValue: 'FREE FIRE PRO LEAGUE' },
  ],
  VICTORY_CERTIFICATE: [
    { key: 'winner_name', variable: '{{winner_name}}', label: 'Winner / Team Name', description: 'Championship winner squad name', sampleValue: 'ALPHA CHAMPIONS' },
    { key: 'winner_logo', variable: '{{winner_logo}}', label: 'Winner Team Crest', description: 'Emblem of victorious squad', sampleValue: '[Winner Logo]' },
    { key: 'award_title', variable: '{{award_title}}', label: 'Award Position', description: 'Champion / Runner-Up / MVP', sampleValue: 'GRAND CHAMPION' },
    { key: 'award_subtitle', variable: '{{award_subtitle}}', label: 'Award Subtitle', description: 'Citation text for outstanding performance', sampleValue: 'For Outstanding Battle Royale Performance' },
    { key: 'tournament_name', variable: '{{tournament_name}}', label: 'Tournament Title', description: 'Name of the championship event', sampleValue: 'FREE FIRE MASTERS GRAND FINALS' },
    { key: 'tournament_date', variable: '{{tournament_date}}', label: 'Date of Issuance', description: 'Accreditation / completion date', sampleValue: 'October 14, 2026' },
    { key: 'organizer_name', variable: '{{organizer_name}}', label: 'Authorized Host', description: 'Organizer signature name', sampleValue: 'POINTX ESPORTS ARENA' },
    { key: 'organizer_signature', variable: '{{organizer_signature}}', label: 'Authorized Signature', description: 'Official signature line', sampleValue: 'Official Host' },
    { key: 'certificate_id', variable: '{{certificate_id}}', label: 'Certificate ID', description: 'Official verification accreditation ID', sampleValue: 'PTX-CERT-2026-A89F2' },
  ],
  NEEDS_REVIEW: [
    { key: 'review_note', variable: '{{review_note}}', label: 'Needs Review', description: 'Template section is unclassified and needs admin assignment', sampleValue: 'NEEDS_REVIEW' },
  ]
};

export function getVariablesForSection(templateType: TemplateType): SectionVariableDef[] {
  return SECTION_VARIABLES[templateType] || SECTION_VARIABLES.POINTS_TABLE;
}
