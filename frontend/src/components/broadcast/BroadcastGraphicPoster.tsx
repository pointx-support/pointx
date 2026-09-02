import React, { useMemo } from 'react';
import type { Tournament } from '../../types/tournament';
import type { GraphicsRenderData } from '../../types/graphics';
import { useTemplateStore } from '../../store/templateStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import { getOrdinalSuffix } from '../../utils/format';
import { DynamicCustomTemplate } from '../graphics/templates/DynamicCustomTemplate';

export interface BroadcastGraphicPosterProps {
  tournament: Tournament;
  isTransparent?: boolean;
}

export const BroadcastGraphicPoster: React.FC<BroadcastGraphicPosterProps> = ({
  tournament,
  isTransparent = true
}) => {
  const { templates, getActiveTemplate } = useTemplateStore();

  const urlParams = useMemo(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  }, []);

  const requestedTemplateId = urlParams?.get('templateId') || urlParams?.get('template');
  const requestedHue = urlParams?.get('hue') ? Number(urlParams.get('hue')) : 0;
  const requestedScope = urlParams?.get('scope') || 'overall';
  const customTitle = urlParams?.get('title') || tournament.title || 'PointX Championship';
  const customOrg = urlParams?.get('org') || tournament.organizer || 'PointX Esports';

  const template = useMemo(() => {
    if (requestedTemplateId) {
      const match = templates.find((t) => t.id === requestedTemplateId);
      if (match) return match;
    }
    return getActiveTemplate() || templates[0];
  }, [requestedTemplateId, templates, getActiveTemplate]);

  const isOverall = requestedScope === 'overall';
  const scopeNumber = !isOverall ? Number(requestedScope) : undefined;

  const standings = useMemo(() => {
    return calculateTournamentStandings(tournament, {
      matchRange: scopeNumber ? { start: scopeNumber, end: scopeNumber } : undefined
    });
  }, [tournament, scopeNumber]);

  const graphicSubtitle = isOverall
    ? 'OVERALL'
    : `${getOrdinalSuffix(scopeNumber || 1).toUpperCase()} MATCH`;

  const renderData: GraphicsRenderData = {
    tournamentTitle: customTitle,
    tournamentLogo: tournament.logoUrl,
    organizerName: customOrg,
    organizerLogo: tournament.organizerLogoUrl,
    rows: standings,
    page: 1,
    totalPages: 1,
    totalMatchesCount: isOverall ? tournament.matches.length : 1,
    subtitle: graphicSubtitle
  };

  const isPortrait = template.aspectRatio === '4:5';

  return (
    <div
      className={`w-screen h-screen flex items-center justify-center overflow-hidden select-none ${
        isTransparent ? 'bg-transparent' : 'bg-black'
      }`}
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      <div
        className={`w-full h-full max-w-full max-h-full flex items-center justify-center ${
          isPortrait ? 'aspect-[4/5]' : 'aspect-video'
        }`}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <DynamicCustomTemplate
          template={template}
          data={renderData}
          hueRotate={requestedHue}
          isInteractive={false}
        />
      </div>
    </div>
  );
};
