import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  className,
}) => {
  const changeColor = {
    positive: 'text-[var(--status-live)] bg-[var(--status-live)]/10 border-[var(--status-live)]/30',
    negative: 'text-[var(--status-danger)] bg-[var(--status-danger)]/10 border-[var(--status-danger)]/30',
    neutral: 'text-[var(--text-secondary)] bg-[var(--bg-surface-inset)] border-[var(--border-subtle)]',
  }[changeType];

  return (
    <Card className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
          {title}
        </span>
        {icon && <div className="text-[var(--accent-primary)]">{icon}</div>}
      </div>
      <div className="my-3 flex items-baseline gap-2.5">
        <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
          {value}
        </span>
        {change && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-mono font-bold border', changeColor)}>
            {change}
          </span>
        )}
      </div>
      {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
    </Card>
  );
};

export interface ChartCardBaseProps {
  title: string;
  description?: string;
  data: Array<Record<string, any>>;
  className?: string;
  height?: number;
}

export interface AreaChartCardProps extends ChartCardBaseProps {
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  color = '#6366f1',
  className,
  height = 260,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export interface BarChartCardProps extends ChartCardBaseProps {
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  color = '#38bdf8',
  className,
  height = 260,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export interface LineChartCardProps extends ChartCardBaseProps {
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export const LineChartCard: React.FC<LineChartCardProps> = ({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  color = '#10b981',
  className,
  height = 260,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export interface DonutChartCardProps extends ChartCardBaseProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  description,
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  className,
  height = 260,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
