import React, { useState, useMemo } from 'react';
import { FORMULA_LIBRARY } from '../constants/engineering';
import { Search, BookOpen, Calculator, Copy, Check, Download } from 'lucide-react';
import { CalculationResult } from '../types';
import { exportCalculationToPDF } from '../utils/pdfExport';
import { useToast } from './Common/Toast';

export const FormulaLibraryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toast = useToast();

  const categories = useMemo(() => {
    const set = new Set<string>();
    FORMULA_LIBRARY.forEach(f => set.add(f.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredFormulas = useMemo(() => {
    return FORMULA_LIBRARY.filter(f => {
      const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.notes.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyFormula = (formulaText: string, id: string) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPDF = () => {
    try {
      const formulaResult: CalculationResult = {
        title: `Engineering Formula Reference Sheet (${selectedCategory})`,
        primaryValue: `${filteredFormulas.length}`,
        primaryUnit: 'Standard Equations',
        primaryCategory: 'Civil Formula Reference',
        formula: 'Standard Civil & Structural Mechanics Formulations',
        substitutedFormula: 'BNBC 2020 / ACI 318 / BDS 1313 / IS 456 Specification Compliant',
        inputsSummary: [
          { label: 'Category Filter', value: selectedCategory },
          { label: 'Search Query', value: searchQuery || 'None (All in category)' },
          { label: 'Formulas Included', value: `${filteredFormulas.length} formulas` },
        ],
        secondaryValues: filteredFormulas.slice(0, 10).map(f => ({
          label: f.name,
          value: f.formula,
          unit: f.category,
        })),
        breakdown: filteredFormulas.slice(0, 8).map(f => ({
          step: f.name,
          expression: f.formula,
          result: f.notes,
        })),
        assumptions: [
          { label: 'Source Codes', value: 'ACI 318-19, BNBC 2020, BDS 1313, IS 456' },
        ],
        engineeringNotes: 'Authoritative engineering formula reference compiled for jobsite and design office auditing.',
        engineeringBasis: {
          calculationBasis: 'Standard Engineering Mechanics & Building Codes',
          formulaMethod: 'Governing Structural & Material Equations',
          standardCode: 'BNBC 2020 / ACI 318-19 / IS 456',
          materialAssumption: 'Standard Civil Engineering Practice',
          densityConstants: 'Theoretical & empirical constants',
        },
      };

      exportCalculationToPDF(formulaResult, {
        fitToOnePage: true,
        autoDownload: true,
      });
      toast.success('Formula Reference Sheet exported as 1-Page A4 PDF');
    } catch (err) {
      console.error('Failed to export formula PDF:', err);
      toast.error('Failed to generate PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm dark:shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-wood font-normal text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-wide">
              <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Engineering Formula Library
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Searchable catalog of standard formulas, notation, and mechanical relationships used in civil & structural practice.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search formulas or variables..."
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50 shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleExportPDF}
              title="Export formula cheat sheet to printable 1-page A4 PDF"
              className="px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200 dark:border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFormulas.map(item => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-lg flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <button
                  onClick={() => handleCopyFormula(item.formula, item.id)}
                  title="Copy formula text"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{item.name}</h4>

              {/* Equation Box */}
              <div className="p-3 rounded-lg border border-cyan-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-[#070B12] font-mono text-sm text-cyan-700 dark:text-cyan-300 mb-4 overflow-x-auto shadow-inner">
                {item.formula}
              </div>

              {/* Variables List */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Variables & Units
                </span>
                <ul className="space-y-1 text-xs">
                  {item.variables.map((v, idx) => (
                    <li key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{v.symbol}</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{v.description}</span>
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{v.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3 leading-relaxed">
              {item.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
