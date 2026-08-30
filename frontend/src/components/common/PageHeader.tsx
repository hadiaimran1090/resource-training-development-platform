import React from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  dateFilterText?: string;
  onExport?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  dateFilterText = 'Q3 2026 (To Date)',
  onExport,
}) => {
  return (
    <div className={`flex flex-col md:flex-row ${title ? 'justify-between items-start md:items-end' : 'justify-end items-center'} mb-4 gap-4`}>
      {title && (
        <div>
          {eyebrow && (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:border-slate-300 transition-colors">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{dateFilterText}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </div>

        {onExport ? (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        ) : (
          <button
            aria-label="Download Report"
            className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-500 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
