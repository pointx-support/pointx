import React from 'react';
import type { CustomGraphicsTemplate } from '../../../types/customTemplate';
import type { GraphicsRenderData } from '../../../types/graphics';
import { DynamicCustomTemplate } from '../templates/DynamicCustomTemplate';

export interface PointsTableRendererProps {
  template: CustomGraphicsTemplate;
  data: GraphicsRenderData;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  selectedElementKey?: string | string[] | null;
  selectedElementKeys?: string[] | null;
  onSelectElement?: (elementKey: string, e?: React.MouseEvent) => void;
  onDragElement?: (key: string, deltaX: number, deltaY: number) => void;
  isInteractive?: boolean;
  hueRotate?: number;
}

export const PointsTableRenderer: React.FC<PointsTableRendererProps> = (props) => {
  return <DynamicCustomTemplate {...props} />;
};
