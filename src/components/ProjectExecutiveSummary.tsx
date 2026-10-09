import React, { useState, useMemo } from 'react';
import {
  Building2,
  Layers,
  Grid,
  AlignJustify,
  Mountain,
  FileSpreadsheet,
  Download,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Plus,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProjectWorkspace, CalculationResult, HistoryItem, TakeoffItem, AppSettings } from '../types';
import { formatNumber, formatCurrency } from '../utils/units';
import { exportCalculationToPDF } from '../utils/pdfExport';
import { useToast } from './Common/Toast';

interface ProjectExecutiveSummaryProps {
  project: ProjectWorkspace;
  onNavigate: (viewId: string) => void;
  onOpenWorkspaceModal?: () => void;
  onAddSampleCalculations?: () => void;
  settings?: AppSettings;
}

interface SummaryRow {
  id: string;
  category: string;
  icon: React.ReactNode;
  primaryQty: string;
  secondaryQty: string;
  itemCount: number;
  estimatedValuation: string;
  status: string;
  statusColor: string;
  actionViewId: string;
  actionLabel: string;
  detailNotes: string;
}

export const ProjectExecutiveSummary: React.FC<ProjectExecutiveSummaryProps> = ({
  project,
  onNavigate,
  onOpenWorkspaceModal,
  onAddSampleCalculations,
  settings,
}) => {
  const toast = useToast();
  const [filterTab, setFilterTab] = useState<'all' | 'structural' | 'finishes' | 'takeoff'>('all');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const history = project.history || [];
  const takeoffItems = project.takeoffItems || [];
  const boqItems = project.boqItems || [];
  const currencySymbol = project.currencySymbol || '৳';

  // =========================================================================
  // Aggregation Engine: Parse History & Takeoff Items
  // =========================================================================
  const aggregated = useMemo(() => {
    let totalConcreteM3 = 0;
    let concreteEntriesCount = 0;
    let concreteCost = 0;

    let totalSteelKg = 0;
    let steelEntriesCount = 0;
    let steelCost = 0;

    let totalBricks = 0;
    let brickworkEntriesCount = 0;
    let masonryCost = 0;

    let totalPlasterM2 = 0;
    let plasterEntriesCount = 0;
    let plasterCost = 0;

    let totalEarthworkM3 = 0;
    let earthworkEntriesCount = 0;
    let earthworkCost = 0;

    let totalTakeoffValuation = 0;

    // 1. Scan Project History Items
    history.forEach(item => {
      const res = item.result;
      if (!res) return;

      const title = (res.title || '').toLowerCase();
      const toolId = (item.toolId || '').toLowerCase();
      const primaryVal = parseFloat(String(res.primaryValue).replace(/,/g, '')) || 0;
      const primaryUnit = (res.primaryUnit || '').toLowerCase();

      // Check Concrete
      if (
        toolId.includes('concrete') ||
        title.includes('concrete') ||
        title.includes('slab') ||
        title.includes('beam') ||
        title.includes('column') ||
        title.includes('footing')
      ) {
        concreteEntriesCount++;
        if (primaryUnit.includes('m³') || primaryUnit.includes('cum') || res.primaryCategory === 'volume') {
          totalConcreteM3 += res.primaryRawValue ?? primaryVal;
        } else if (primaryUnit.includes('cft')) {
          totalConcreteM3 += (res.primaryRawValue ?? primaryVal) / 35.3147;
        } else {
          // Check inputsSummary for Wet Concrete Volume
          const wetVolInput = res.inputsSummary?.find(i => i.label.toLowerCase().includes('wet concrete volume'));
          if (wetVolInput) {
            const parsed = parseFloat(wetVolInput.value.replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) totalConcreteM3 += parsed;
          }
        }
      }

      // Check Rebar / Steel
      if (
        toolId.includes('rebar') ||
        toolId.includes('bbs') ||
        title.includes('rebar') ||
        title.includes('steel') ||
        title.includes('reinforcement') ||
        title.includes('bar bending')
      ) {
        steelEntriesCount++;
        if (primaryUnit.includes('kg')) {
          totalSteelKg += res.primaryRawValue ?? primaryVal;
        } else if (primaryUnit.includes('ton') || primaryUnit.includes('tonne')) {
          totalSteelKg += (res.primaryRawValue ?? primaryVal) * 1000;
        } else if (primaryUnit.includes('lb')) {
          totalSteelKg += (res.primaryRawValue ?? primaryVal) * 0.453592;
        } else {
          // Look in secondary values for Total Weight in kg
          const wtSec = res.secondaryValues?.find(s => s.label.toLowerCase().includes('total weight') || s.label.toLowerCase().includes('bar weight'));
          if (wtSec) {
            const parsed = parseFloat(wtSec.value.replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) totalSteelKg += parsed;
          }
        }
      }

      // Check Brickwork / Masonry
      if (toolId.includes('brick') || title.includes('brick') || title.includes('masonry')) {
        brickworkEntriesCount++;
        if (primaryUnit.includes('brick') || primaryUnit.includes('pcs') || primaryUnit.includes('nos')) {
          totalBricks += res.primaryRawValue ?? primaryVal;
        } else {
          const brickSec = res.secondaryValues?.find(s => s.label.toLowerCase().includes('brick'));
          if (brickSec) {
            const parsed = parseFloat(brickSec.value.replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) totalBricks += parsed;
          }
        }
      }

      // Check Plaster
      if (toolId.includes('plaster') || title.includes('plaster')) {
        plasterEntriesCount++;
        if (primaryUnit.includes('m²') || primaryUnit.includes('sq.m')) {
          totalPlasterM2 += res.primaryRawValue ?? primaryVal;
        } else if (primaryUnit.includes('sq.ft') || primaryUnit.includes('sft')) {
          totalPlasterM2 += (res.primaryRawValue ?? primaryVal) * 0.092903;
        } else {
          const areaInput = res.inputsSummary?.find(i => i.label.toLowerCase().includes('area'));
          if (areaInput) {
            const parsed = parseFloat(areaInput.value.replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) totalPlasterM2 += parsed;
          }
        }
      }

      // Check Earthwork
      if (toolId.includes('earthwork') || title.includes('earthwork') || title.includes('excavation') || title.includes('trench')) {
        earthworkEntriesCount++;
        if (primaryUnit.includes('m³') || primaryUnit.includes('cum')) {
          totalEarthworkM3 += res.primaryRawValue ?? primaryVal;
        } else if (primaryUnit.includes('cft')) {
          totalEarthworkM3 += (res.primaryRawValue ?? primaryVal) / 35.3147;
        }
      }

      // Extract Costs if present in secondary values
      res.secondaryValues?.forEach(s => {
        const lbl = s.label.toLowerCase();
        if (lbl.includes('cost') || lbl.includes('amount') || lbl.includes('price')) {
          const num = parseFloat(s.value.replace(/[^0-9.-]/g, ''));
          if (!isNaN(num) && num > 0) {
            if (toolId.includes('concrete')) concreteCost += num;
            else if (toolId.includes('rebar')) steelCost += num;
            else if (toolId.includes('brick')) masonryCost += num;
            else if (toolId.includes('plaster')) plasterCost += num;
            else if (toolId.includes('earthwork')) earthworkCost += num;
          }
        }
      });
    });

    // 2. Scan Takeoff Items
    takeoffItems.forEach(item => {
      const desc = (item.description || '').toLowerCase();
      const unit = (item.unit || '').toLowerCase();
      const qty = item.totalQty || item.quantity || 0;
      const amt = item.amount || 0;
      totalTakeoffValuation += amt;

      if (unit === 'm³' && (desc.includes('concrete') || desc.includes('rcc') || desc.includes('pcc'))) {
        totalConcreteM3 += qty;
        concreteEntriesCount++;
        concreteCost += amt;
      } else if (unit === 'cft' && (desc.includes('concrete') || desc.includes('rcc') || desc.includes('pcc'))) {
        totalConcreteM3 += qty / 35.3147;
        concreteEntriesCount++;
        concreteCost += amt;
      } else if ((unit === 'kg' || unit === 'ton') && (desc.includes('steel') || desc.includes('rebar') || desc.includes('reinforcement'))) {
        totalSteelKg += unit === 'ton' ? qty * 1000 : qty;
        steelEntriesCount++;
        steelCost += amt;
      } else if (desc.includes('brick') || desc.includes('masonry')) {
        if (unit === 'pcs' || unit === 'nos') totalBricks += qty;
        brickworkEntriesCount++;
        masonryCost += amt;
      } else if (desc.includes('plaster')) {
        if (unit === 'm²') totalPlasterM2 += qty;
        else if (unit === 'sq.ft' || unit === 'cft') totalPlasterM2 += qty * 0.092903;
        plasterEntriesCount++;
        plasterCost += amt;
      } else if (desc.includes('earthwork') || desc.includes('excavation')) {
        if (unit === 'm³') totalEarthworkM3 += qty;
        else if (unit === 'cft') totalEarthworkM3 += qty / 35.3147;
        earthworkEntriesCount++;
        earthworkCost += amt;
      }
    });

    // 3. Scan BOQ Items
    boqItems.forEach(item => {
      totalTakeoffValuation += item.amount || 0;
    });

    const totalValuation =
      totalTakeoffValuation > 0
        ? totalTakeoffValuation
        : concreteCost + steelCost + masonryCost + plasterCost + earthworkCost;

    return {
      totalConcreteM3,
      totalConcreteCFT: totalConcreteM3 * 35.3147,
      concreteEntriesCount,
      concreteCost,

      totalSteelKg,
      totalSteelTonnes: totalSteelKg / 1000,
      steelEntriesCount,
      steelCost,

      totalBricks,
      brickworkEntriesCount,
      masonryCost,

      totalPlasterM2,
      totalPlasterSqFt: totalPlasterM2 * 10.7639,
      plasterEntriesCount,
      plasterCost,

      totalEarthworkM3,
      totalEarthworkCFT: totalEarthworkM3 * 35.3147,
      earthworkEntriesCount,
      earthworkCost,

      totalValuation,
      totalItemsCount: history.length + takeoffItems.length + boqItems.length,
    };
  }, [history, takeoffItems, boqItems]);

  // =========================================================================
  // Table Rows Model
  // =========================================================================
  const summaryRows: SummaryRow[] = useMemo(() => {
    return [
      {
        id: 'concrete',
        category: 'Structural Concrete & Mixes',
        icon: <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
        primaryQty: `${formatNumber(aggregated.totalConcreteM3, 2)} m³`,
        secondaryQty: `${formatNumber(aggregated.totalConcreteCFT, 1)} CFT`,
        itemCount: aggregated.concreteEntriesCount,
        estimatedValuation:
          aggregated.concreteCost > 0
            ? `${currencySymbol} ${formatNumber(aggregated.concreteCost, 0)}`
            : '—',
        status: aggregated.totalConcreteM3 > 0 ? 'Calculated' : 'Pending',
        statusColor:
          aggregated.totalConcreteM3 > 0
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'concrete-volume',
        actionLabel: 'Add Concrete',
        detailNotes: 'Slabs, beams, columns, footings wet volume & cement bag mix',
      },
      {
        id: 'rebar',
        category: 'Reinforcing Steel (RCC / BBS)',
        icon: <Grid className="w-4 h-4 text-orange-500 dark:text-orange-400" />,
        primaryQty: `${formatNumber(aggregated.totalSteelKg, 1)} kg`,
        secondaryQty: `${formatNumber(aggregated.totalSteelTonnes, 3)} Tonnes`,
        itemCount: aggregated.steelEntriesCount,
        estimatedValuation:
          aggregated.steelCost > 0
            ? `${currencySymbol} ${formatNumber(aggregated.steelCost, 0)}`
            : '—',
        status: aggregated.totalSteelKg > 0 ? 'Calculated' : 'Pending',
        statusColor:
          aggregated.totalSteelKg > 0
            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'rebar-weight',
        actionLabel: 'Add Rebar',
        detailNotes: 'TMT bar tonnage, BBS cutting length deductions & unit weights',
      },
      {
        id: 'masonry',
        category: 'Brickwork & Masonry Walls',
        icon: <AlignJustify className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
        primaryQty: `${Math.round(aggregated.totalBricks).toLocaleString()} Pcs`,
        secondaryQty: `${formatNumber(aggregated.totalBricks * 0.002, 2)} m³ wall`,
        itemCount: aggregated.brickworkEntriesCount,
        estimatedValuation:
          aggregated.masonryCost > 0
            ? `${currencySymbol} ${formatNumber(aggregated.masonryCost, 0)}`
            : '—',
        status: aggregated.totalBricks > 0 ? 'Calculated' : 'Pending',
        statusColor:
          aggregated.totalBricks > 0
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'brickwork',
        actionLabel: 'Add Brickwork',
        detailNotes: 'Standard modular clay bricks, 5" / 10" walls & dry mortar',
      },
      {
        id: 'plaster',
        category: 'Plaster & Surface Finishes',
        icon: <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
        primaryQty: `${formatNumber(aggregated.totalPlasterM2, 1)} m²`,
        secondaryQty: `${formatNumber(aggregated.totalPlasterSqFt, 1)} sq.ft`,
        itemCount: aggregated.plasterEntriesCount,
        estimatedValuation:
          aggregated.plasterCost > 0
            ? `${currencySymbol} ${formatNumber(aggregated.plasterCost, 0)}`
            : '—',
        status: aggregated.totalPlasterM2 > 0 ? 'Calculated' : 'Pending',
        statusColor:
          aggregated.totalPlasterM2 > 0
            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'plaster',
        actionLabel: 'Add Plaster',
        detailNotes: '12mm / 20mm internal-external plaster surface area & cement bags',
      },
      {
        id: 'earthwork',
        category: 'Earthwork & Foundation Haulage',
        icon: <Mountain className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />,
        primaryQty: `${formatNumber(aggregated.totalEarthworkM3, 2)} m³`,
        secondaryQty: `${formatNumber(aggregated.totalEarthworkCFT, 1)} CFT`,
        itemCount: aggregated.earthworkEntriesCount,
        estimatedValuation:
          aggregated.earthworkCost > 0
            ? `${currencySymbol} ${formatNumber(aggregated.earthworkCost, 0)}`
            : '—',
        status: aggregated.totalEarthworkM3 > 0 ? 'Calculated' : 'Pending',
        statusColor:
          aggregated.totalEarthworkM3 > 0
            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'earthwork',
        actionLabel: 'Add Earthwork',
        detailNotes: 'Excavation pit/trench volumes, bulking swell & haulage balance',
      },
      {
        id: 'takeoff',
        category: 'Quantity Takeoff & BOQ Items',
        icon: <FileSpreadsheet className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
        primaryQty: `${takeoffItems.length + boqItems.length} lines`,
        secondaryQty:
          aggregated.totalValuation > 0
            ? `${currencySymbol} ${formatNumber(aggregated.totalValuation, 0)}`
            : 'Unpriced',
        itemCount: takeoffItems.length + boqItems.length,
        estimatedValuation:
          aggregated.totalValuation > 0
            ? `${currencySymbol} ${formatNumber(aggregated.totalValuation, 0)}`
            : '—',
        status: takeoffItems.length + boqItems.length > 0 ? 'Logged' : 'Pending',
        statusColor:
          takeoffItems.length + boqItems.length > 0
            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-300 dark:border-white/10',
        actionViewId: 'estimation',
        actionLabel: 'Open BOQ',
        detailNotes: 'Detailed schedule of work items, contractor rates and extensions',
      },
    ];
  }, [aggregated, currencySymbol, takeoffItems.length, boqItems.length]);

  const filteredRows = useMemo(() => {
    if (filterTab === 'structural') {
      return summaryRows.filter(r => r.id === 'concrete' || r.id === 'rebar');
    }
    if (filterTab === 'finishes') {
      return summaryRows.filter(r => r.id === 'masonry' || r.id === 'plaster');
    }
    if (filterTab === 'takeoff') {
      return summaryRows.filter(r => r.id === 'earthwork' || r.id === 'takeoff');
    }
    return summaryRows;
  }, [summaryRows, filterTab]);

  // =========================================================================
  // PDF Export Generation for Executive Summary
  // =========================================================================
  const handleExportSummaryPDF = () => {
    try {
      setIsExportingPDF(true);

      const summaryResult: CalculationResult = {
        title: `Project Executive Summary: ${project.name}`,
        primaryValue: `${formatNumber(aggregated.totalConcreteM3, 1)} m³ Conc. | ${formatNumber(aggregated.totalSteelTonnes, 2)} t Steel`,
        primaryUnit: 'Materials Summary',
        status: 'valid',
        projectMeta: project.meta,
        inputsSummary: [
          { label: 'Project Name', value: project.name },
          { label: 'Client / Owner', value: project.meta?.client || 'Site Client' },
          { label: 'Jobsite Location', value: project.meta?.location || 'Jobsite' },
          { label: 'Document Number', value: project.meta?.documentNumber || 'PBCL-2026' },
          { label: 'Report Status', value: project.meta?.reportStatus || 'Approved' },
          { label: 'Prepared By', value: project.meta?.preparedBy || 'Lead Engineer' },
        ],
        secondaryValues: [
          {
            label: 'Total Concrete Volume',
            value: `${formatNumber(aggregated.totalConcreteM3, 2)} m³ (${formatNumber(aggregated.totalConcreteCFT, 1)} CFT)`,
          },
          {
            label: 'Total Reinforcing Steel',
            value: `${formatNumber(aggregated.totalSteelKg, 1)} kg (${formatNumber(aggregated.totalSteelTonnes, 3)} Tonnes)`,
          },
          {
            label: 'Total Modular Bricks',
            value: `${Math.round(aggregated.totalBricks).toLocaleString()} Pcs`,
          },
          {
            label: 'Total Wall Plaster Area',
            value: `${formatNumber(aggregated.totalPlasterM2, 1)} m² (${formatNumber(aggregated.totalPlasterSqFt, 1)} sq.ft)`,
          },
          {
            label: 'Total Earthwork Excavation',
            value: `${formatNumber(aggregated.totalEarthworkM3, 2)} m³ (${formatNumber(aggregated.totalEarthworkCFT, 1)} CFT)`,
          },
          {
            label: 'Estimated Work Items',
            value: `${aggregated.totalItemsCount} logged calculations`,
          },
          {
            label: 'Total Project Valuation',
            value: `${currencySymbol} ${formatNumber(aggregated.totalValuation, 0)}`,
          },
        ],
        breakdown: [
          {
            step: '1. Concrete Infrastructure',
            expression: `${aggregated.concreteEntriesCount} logged calculations & takeoff records`,
            result: `${formatNumber(aggregated.totalConcreteM3, 2)} m³ (${formatNumber(aggregated.totalConcreteCFT, 1)} CFT)`,
          },
          {
            step: '2. Reinforcement Steel (BBS)',
            expression: `${aggregated.steelEntriesCount} rebar schedules & takeoffs`,
            result: `${formatNumber(aggregated.totalSteelKg, 1)} kg (${formatNumber(aggregated.totalSteelTonnes, 3)} Metric Tonnes)`,
          },
          {
            step: '3. Masonry & Architectural Finishes',
            expression: `${Math.round(aggregated.totalBricks).toLocaleString()} Bricks, ${formatNumber(aggregated.totalPlasterM2, 1)} m² Plaster`,
            result: `${aggregated.brickworkEntriesCount + aggregated.plasterEntriesCount} finish calculations`,
          },
          {
            step: '4. Foundation Earthwork & BOQ Lines',
            expression: `${formatNumber(aggregated.totalEarthworkM3, 2)} m³ excavation + ${takeoffItems.length} takeoff lines`,
            result: `${currencySymbol} ${formatNumber(aggregated.totalValuation, 0)} estimated`,
          },
        ],
        formula: 'Σ(All Active Project Workspace Work Packages & Materials)',
        substitutedFormula: `Concrete = ${formatNumber(aggregated.totalConcreteM3, 2)} m³ | Steel = ${formatNumber(aggregated.totalSteelTonnes, 2)} Tonnes | Bricks = ${Math.round(aggregated.totalBricks)} pcs`,
        assumptions: [
          {
            label: 'Source Workspace',
            value: `All metrics compiled from verified computations in active workspace "${project.name}".`,
          },
          {
            label: 'Standard Densities',
            value: 'Reinforcing steel: 7,850 kg/m³. Concrete wet volume conversion factor: 1 m³ = 35.3147 CFT.',
          },
        ],
        engineeringNotes:
          'Executive roll-up of verified quantities for procurement, site planning, and progress billing. Calculated per BNBC / ACI 318 / IS 456 standards.',
      };

      exportCalculationToPDF(summaryResult, {
        projectMeta: project.meta,
        settings,
        fitToOnePage: true,
        autoDownload: true,
      });

      toast.success('Project Executive Summary exported to PDF');
    } catch (e) {
      console.error('Failed to export executive summary PDF:', e);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const hasAnyData = aggregated.totalItemsCount > 0;

  return (
    <section
      aria-labelledby="executive-summary-heading"
      className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm dark:shadow-xl transition-all"
    >
      {/* ===================================================================
          1. Header Banner & Workspace Meta
          =================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                Active Project Workspace
              </span>
              <span className="text-xs font-mono text-slate-400">
                {project.meta?.documentNumber || 'PBCL-2026-0001'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {project.meta?.reportStatus || 'Draft'}
              </span>
            </div>

            <h2
              id="executive-summary-heading"
              className="text-lg sm:text-xl font-wood font-normal text-slate-900 dark:text-slate-100 tracking-wide mt-1"
            >
              {project.name}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Client: <strong className="text-slate-700 dark:text-slate-300 font-medium">{project.meta?.client || 'Site Client'}</strong></span>
              <span>·</span>
              <span>Location: <strong className="text-slate-700 dark:text-slate-300 font-medium">{project.meta?.location || 'Jobsite'}</strong></span>
              <span>·</span>
              <span>Prepared by: <strong className="text-slate-700 dark:text-slate-300 font-medium">{project.meta?.preparedBy || 'Lead Engineer'}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportSummaryPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            title="Download printable single-page A4 executive PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPDF ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {onOpenWorkspaceModal && (
            <button
              type="button"
              onClick={onOpenWorkspaceModal}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
              title="Open Project Workspace Manager to switch or create projects"
            >
              <FolderKanban className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Switch Project</span>
            </button>
          )}

          {!hasAnyData && onAddSampleCalculations && (
            <button
              type="button"
              onClick={onAddSampleCalculations}
              className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all flex items-center gap-1.5 active:scale-95"
              title="Pre-fill sample engineering data into this workspace"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================
          2. Executive Key Metric Cards (4 Responsive Tiles)
          =================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-5">
        {/* Metric 1: Concrete Volume */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
            <span>Total Concrete Volume</span>
            <Layers className="w-4 h-4 text-amber-500 opacity-80" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatNumber(aggregated.totalConcreteM3, 2)}{' '}
            <span className="text-xs font-sans text-slate-500 dark:text-slate-400">m³</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            ≈ {formatNumber(aggregated.totalConcreteCFT, 1)} CFT
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-medium">
            {aggregated.concreteEntriesCount} calculations logged
          </div>
        </div>

        {/* Metric 2: Steel Weight */}
        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">
            <span>Total Rebar / Steel</span>
            <Grid className="w-4 h-4 text-orange-500 opacity-80" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatNumber(aggregated.totalSteelKg, 1)}{' '}
            <span className="text-xs font-sans text-slate-500 dark:text-slate-400">kg</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            {formatNumber(aggregated.totalSteelTonnes, 3)} Metric Tonnes
          </div>
          <div className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-1 font-medium">
            {aggregated.steelEntriesCount} BBS & rebar schedules
          </div>
        </div>

        {/* Metric 3: Masonry & Plaster */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
            <span>Masonry & Surface</span>
            <AlignJustify className="w-4 h-4 text-rose-500 opacity-80" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {Math.round(aggregated.totalBricks).toLocaleString()}{' '}
            <span className="text-xs font-sans text-slate-500 dark:text-slate-400">Bricks</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            Plaster: {formatNumber(aggregated.totalPlasterM2, 1)} m²
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            {aggregated.brickworkEntriesCount + aggregated.plasterEntriesCount} masonry records
          </div>
        </div>

        {/* Metric 4: Valuation & Work Lines */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <span>Project Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 opacity-80" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {currencySymbol} {formatNumber(aggregated.totalValuation, 0)}
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            {aggregated.totalItemsCount} Total logged items
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            Takeoff & priced estimates
          </div>
        </div>
      </div>

      {/* ===================================================================
          3. Filter Bar & Summary Table
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Packages ({summaryRows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('structural')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterTab === 'structural'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Structural
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('finishes')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterTab === 'finishes'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Masonry & Finishes
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('takeoff')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterTab === 'takeoff'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Earthwork & BOQ
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredRows.length} material categories
        </span>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Material / Work Package</th>
              <th className="py-3 px-4 text-right">Calculated Quantity</th>
              <th className="py-3 px-4 text-right">Secondary Unit</th>
              <th className="py-3 px-4 text-center">Entries</th>
              <th className="py-3 px-4 text-right">Est. Valuation</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {filteredRows.map(row => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Category & Details */}
                <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 shrink-0">
                      {row.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {row.category}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        {row.detailNotes}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Primary Quantity */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                  {row.primaryQty}
                </td>

                {/* Secondary Unit */}
                <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                  {row.secondaryQty}
                </td>

                {/* Entries Count */}
                <td className="py-3.5 px-4 text-center">
                  <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                    {row.itemCount}
                  </span>
                </td>

                {/* Valuation */}
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {row.estimatedValuation}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${row.statusColor}`}
                  >
                    {row.status}
                  </span>
                </td>

                {/* Jump to Calculator */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onNavigate(row.actionViewId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold text-[11px] transition-all active:scale-95"
                  >
                    <span>{row.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================================================================
          4. Collapsible History Log Drawer for this Workspace
          =================================================================== */}
      {history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-1"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>
                View {history.length} logged calculation records in this project workspace
              </span>
            </div>
            {isHistoryExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isHistoryExpanded && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.toolName}
                    </span>
                    <span className="text-slate-400 text-[10px]">·</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-medium truncate">
                      {item.summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.toolId)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline text-[11px] font-semibold"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          5. Empty State Guidance (when workspace is brand new)
          =================================================================== */}
      {!hasAnyData && (
        <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 hidden sm:block" />
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Workspace is currently awaiting site calculations
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Run any concrete, rebar, masonry, or earthwork calculator and click &ldquo;Save to Project History&rdquo; to populate this table automatically.
              </div>
            </div>
          </div>

          {onAddSampleCalculations && (
            <button
              type="button"
              onClick={onAddSampleCalculations}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0 active:scale-95 shadow-sm shadow-cyan-500/20"
            >
              Load Demo Calculations
            </button>
          )}
        </div>
      )}
    </section>
  );
};
