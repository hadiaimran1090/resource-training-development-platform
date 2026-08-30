import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  subtitle?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  subtitle,
  highlighted = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      } ${
        highlighted ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50/20' : ''
      }`}
    >
      {highlighted && (
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/5 rounded-full pointer-events-none" />
      )}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">{title}</span>
        <Icon className="w-5 h-5 text-blue-600/70" />
      </div>
      <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-auto relative z-10">
        {value}
        {unit && <span className="text-lg font-semibold text-slate-400 ml-0.5">{unit}</span>}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-semibold relative z-10 ${
            trend.type === 'positive'
              ? 'text-emerald-600'
              : trend.type === 'negative'
              ? 'text-rose-600'
              : 'text-slate-500'
          }`}
        >
          {trend.type === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
          {trend.type === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
          {trend.type === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          <span>{trend.text}</span>
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-slate-400 mt-2 font-medium relative z-10">{subtitle}</div>
      )}
    </div>
  );
};
