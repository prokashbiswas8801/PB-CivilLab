import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import { calculateConcreteRateAnalysis } from '../../utils/calculations';
import { AppSettings, CalculationResult, TakeoffItem, BOQItem } from '../../types';
import { formatNumber, formatCurrency } from '../../utils/units';
import { Plus, Trash2, Download, Printer, FileSpreadsheet, Layers } from 'lucide-react';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';
import { PrintPreviewModal } from '../Common/PrintPreviewModal';

interface EstimationCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const EstimationCalculator: React.FC<EstimationCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'takeoff' | 'boq' | 'rate_analysis' => {
    if (activeView === 'boq-calculator') return 'boq';
    if (activeView === 'rate-analysis') return 'rate_analysis';
    return 'takeoff';
  };

  const [activeTab, setActiveTab] = useState<'takeoff' | 'boq' | 'rate_analysis'>(getInitialTab);
  const [isPrintBOQOpen, setIsPrintBOQOpen] = useState(false);

  React.useEffect(() => {
    if (activeView) {
      if (activeView === 'boq-calculator') setActiveTab('boq');
      else if (activeView === 'rate-analysis') setActiveTab('rate_analysis');
      else if (activeView === 'quantity-takeoff') setActiveTab('takeoff');
    }
  }, [activeView]);

  // Quantity Takeoff State
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([
    {
      id: '1',
      itemNo: '1.01',
      description: 'Earthwork excavation in foundation trenches',
      length: 12.0,
      width: 1.2,
      height: 1.5,
      quantity: 1,
      unit: 'm³',
      rate: 180,
      totalQty: 21.6,
      amount: 3888,
    },
    {
      id: '2',
      itemNo: '1.02',
      description: 'PCC bed beneath footing (1:3:6)',
      length: 12.0,
      width: 1.2,
      height: 0.1,
      quantity: 1,
      unit: 'm³',
      rate: 6500,
      totalQty: 1.44,
      amount: 9360,
    },
    {
      id: '3',
      itemNo: '1.03',
      description: 'RCC M20 in Footings & Columns',
      length: 1.5,
      width: 1.5,
      height: 0.45,
      quantity: 6,
      unit: 'm³',
      rate: 9800,
      totalQty: 6.075,
      amount: 59535,
    },
    {
      id: '4',
      itemNo: '1.04',
      description: '500W Deformed Rebar Steel Fabrication',
      length: 1,
      width: 1,
      height: 1,
      quantity: 580,
      unit: 'kg',
      rate: 98,
      totalQty: 580,
      amount: 56840,
    },
  ]);

  // BOQ Parameters State
  const [boqWastagePct, setBoqWastagePct] = useState<string>('3');
  const [boqOverheadPct, setBoqOverheadPct] = useState<string>('10');
  const [boqContingencyPct, setBoqContingencyPct] = useState<string>('5');

  // Rate Analysis State
  const [cementBagRate, setCementBagRate] = useState<string>('560');
  const [sandCftRate, setSandCftRate] = useState<string>('45');
  const [stoneCftRate, setStoneCftRate] = useState<string>('135');
  const [masonDayRate, setMasonDayRate] = useState<string>('950');
  const [helperDayRate, setHelperDayRate] = useState<string>('650');
  const [mixerVibratorRate, setMixerVibratorRate] = useState<string>('350');
  const [profitPct, setProfitPct] = useState<string>('10');
  const [overheadPct, setOverheadPct] = useState<string>('5');

  // Takeoff Totals
  const takeoffSubtotal = useMemo(() => {
    return takeoffItems.reduce((acc, item) => acc + item.amount, 0);
  }, [takeoffItems]);

  const wasteAmount = (takeoffSubtotal * (parseFloat(boqWastagePct) || 0)) / 100;
  const overheadAmount = ((takeoffSubtotal + wasteAmount) * (parseFloat(boqOverheadPct) || 0)) / 100;
  const contingencyAmount = ((takeoffSubtotal + wasteAmount + overheadAmount) * (parseFloat(boqContingencyPct) || 0)) / 100;
  const boqGrandTotal = takeoffSubtotal + wasteAmount + overheadAmount + contingencyAmount;

  // Rate Analysis Result
  const rateAnalysisResult = useMemo(() => {
    return calculateConcreteRateAnalysis(
      parseFloat(cementBagRate) || 560,
      parseFloat(sandCftRate) || 45,
      parseFloat(stoneCftRate) || 135,
      parseFloat(masonDayRate) || 950,
      parseFloat(helperDayRate) || 650,
      parseFloat(mixerVibratorRate) || 350,
      parseFloat(profitPct) || 10,
      parseFloat(overheadPct) || 5
    );
  }, [
    cementBagRate,
    sandCftRate,
    stoneCftRate,
    masonDayRate,
    helperDayRate,
    mixerVibratorRate,
    profitPct,
    overheadPct,
  ]);

  // Takeoff / BOQ Summary Result Card
  const boqSummaryResult: CalculationResult = useMemo(() => {
    return {
      title: 'Bill of Quantities (BOQ) Grand Total',
      primaryValue: formatCurrency(boqGrandTotal, settings.currencySymbol),
      primaryUnit: settings.currency,
      secondaryValues: [
        { label: 'Subtotal Base Cost', value: formatCurrency(takeoffSubtotal, settings.currencySymbol) },
        { label: `Site Wastage (${boqWastagePct}%)`, value: formatCurrency(wasteAmount, settings.currencySymbol) },
        { label: `Contractor Overhead (${boqOverheadPct}%)`, value: formatCurrency(overheadAmount, settings.currencySymbol) },
        { label: `Contingencies (${boqContingencyPct}%)`, value: formatCurrency(contingencyAmount, settings.currencySymbol) },
        { label: 'Total Work Items', value: `${takeoffItems.length} lines` },
      ],
      breakdown: [
        { step: '1. Net Line Items Subtotal', expression: `Sum of all items`, result: formatCurrency(takeoffSubtotal, settings.currencySymbol) },
        { step: '2. Unforeseen Wastage', expression: `${boqWastagePct}% of Subtotal`, result: formatCurrency(wasteAmount, settings.currencySymbol) },
        { step: '3. Contractor Overhead & Tools', expression: `${boqOverheadPct}% of Subtotal + Waste`, result: formatCurrency(overheadAmount, settings.currencySymbol) },
        { step: '4. Physical Contingency', expression: `${boqContingencyPct}%`, result: formatCurrency(contingencyAmount, settings.currencySymbol) },
      ],
      formula: 'Grand Total = Subtotal + Wastage + Contractor Overhead + Contingency',
      substitutedFormula: `Total = ${formatCurrency(takeoffSubtotal, settings.currencySymbol)} + ${formatCurrency(wasteAmount, settings.currencySymbol)} + ${formatCurrency(overheadAmount, settings.currencySymbol)} + ${formatCurrency(contingencyAmount, settings.currencySymbol)} = ${formatCurrency(boqGrandTotal, settings.currencySymbol)}`,
      inputsSummary: [
        { label: 'Active Currency', value: `${settings.currency} (${settings.currencySymbol})` },
        { label: 'Line Item Count', value: `${takeoffItems.length} items` },
      ],
      assumptions: [
        { label: 'Tender Rate Basis', value: 'Includes materials, skilled/unskilled site labor, equipment hire and contractor profit margin.' },
      ],
      engineeringNotes: 'Unit rates should be cross-referenced against the current Public Works Department (PWD / LGED) Schedule of Rates.',
    };
  }, [takeoffSubtotal, wasteAmount, overheadAmount, contingencyAmount, boqGrandTotal, boqWastagePct, boqOverheadPct, boqContingencyPct, takeoffItems, settings]);

  const activeResult = activeTab === 'rate_analysis' ? rateAnalysisResult : boqSummaryResult;

  const handleUpdateItem = (idx: number, field: keyof TakeoffItem, val: any) => {
    const copy = [...takeoffItems];
    const item = { ...copy[idx], [field]: val };

    if (field === 'length' || field === 'width' || field === 'height' || field === 'quantity' || field === 'rate') {
      const l = item.length || 1;
      const w = item.width || 1;
      const h = item.height || 1;
      const q = item.quantity || 1;
      const r = item.rate || 0;

      if (item.unit === 'm³' || item.unit === 'CFT') {
        item.totalQty = Math.round(l * w * h * q * 1000) / 1000;
      } else if (item.unit === 'm²' || item.unit === 'sq.ft') {
        item.totalQty = Math.round(l * w * q * 100) / 100;
      } else if (item.unit === 'm' || item.unit === 'ft') {
        item.totalQty = Math.round(l * q * 100) / 100;
      } else {
        item.totalQty = q;
      }
      item.amount = Math.round(item.totalQty * r);
    }
    copy[idx] = item;
    setTakeoffItems(copy);
  };

  const handleAddItem = () => {
    const newItem: TakeoffItem = {
      id: Date.now().toString(),
      itemNo: `1.0${takeoffItems.length + 1}`,
      description: 'New construction work item',
      length: 1,
      width: 1,
      height: 1,
      quantity: 1,
      unit: 'm³',
      rate: 1000,
      totalQty: 1,
      amount: 1000,
    };
    setTakeoffItems([...takeoffItems, newItem]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-7 space-y-6 no-print">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'takeoff', label: 'Detailed Quantity Takeoff' },
            { id: 'boq', label: 'BOQ Bill of Quantities' },
            { id: 'rate_analysis', label: 'Rate Analysis (RCC M20)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1 & 2: Takeoff and BOQ */}
        {(activeTab === 'takeoff' || activeTab === 'boq') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Work Line Items ({takeoffItems.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintBOQOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                  title="Generate official BOQ / Takeoff Print Report (PDF)"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print {activeTab === 'boq' ? 'BOQ' : 'Takeoff'} Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-cyan-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Takeoff Line Item Cards */}
            <div className="space-y-3">
              {takeoffItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-[#0F172A] space-y-2.5 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={item.itemNo}
                        onChange={e => handleUpdateItem(idx, 'itemNo', e.target.value)}
                        className="w-16 rounded bg-[#111827] px-2 py-1 text-cyan-300 font-mono text-xs font-bold border border-white/5"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                        className="flex-1 rounded bg-[#111827] px-2.5 py-1 text-slate-100 text-xs font-medium border border-white/5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTakeoffItems(takeoffItems.filter(t => t.id !== item.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dimensions & Multi-Unit Selector for line item */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Length (L)</span>
                      <input
                        type="number"
                        step="any"
                        value={item.length}
                        onChange={e => handleUpdateItem(idx, 'length', parseFloat(e.target.value) || 0)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-slate-200 border border-white/5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Width (B)</span>
                      <input
                        type="number"
                        step="any"
                        value={item.width}
                        onChange={e => handleUpdateItem(idx, 'width', parseFloat(e.target.value) || 0)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-slate-200 border border-white/5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Depth / H</span>
                      <input
                        type="number"
                        step="any"
                        value={item.height}
                        onChange={e => handleUpdateItem(idx, 'height', parseFloat(e.target.value) || 0)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-slate-200 border border-white/5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Quantity</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-slate-200 border border-white/5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Unit</span>
                      <select
                        value={item.unit}
                        onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-cyan-300 font-bold border border-white/5"
                      >
                        <option value="m³">m³ (cum)</option>
                        <option value="CFT">CFT (cu.ft)</option>
                        <option value="m²">m² (sq.m)</option>
                        <option value="sq.ft">sq.ft</option>
                        <option value="m">m (meter)</option>
                        <option value="ft">ft (foot)</option>
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="bag">bag</option>
                        <option value="pcs">pcs / nos</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Rate ({settings.currencySymbol})</span>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={e => handleUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full rounded bg-[#111827] px-2 py-1 font-mono text-slate-200 border border-white/5"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Total: <strong className="text-slate-200">{formatNumber(item.totalQty, 3)} {item.unit}</strong>
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {formatCurrency(item.amount, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overhead & Contingencies Sliders */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-white/10 bg-[#0F172A] text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Site Wastage (%)</span>
                <input
                  type="number"
                  value={boqWastagePct}
                  onChange={e => setBoqWastagePct(e.target.value)}
                  className="w-full rounded bg-[#111827] px-2.5 py-1.5 text-slate-200 font-mono border border-white/5"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Contractor Overhead (%)</span>
                <input
                  type="number"
                  value={boqOverheadPct}
                  onChange={e => setBoqOverheadPct(e.target.value)}
                  className="w-full rounded bg-[#111827] px-2.5 py-1.5 text-slate-200 font-mono border border-white/5"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Contingencies (%)</span>
                <input
                  type="number"
                  value={boqContingencyPct}
                  onChange={e => setBoqContingencyPct(e.target.value)}
                  className="w-full rounded bg-[#111827] px-2.5 py-1.5 text-slate-200 font-mono border border-white/5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rate Analysis */}
        {activeTab === 'rate_analysis' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-slate-300">
              Unit Rate Analysis for 1 m³ (35.315 CFT) of RCC 1:1.5:3 concrete work according to standard civil analysis breakdown.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cement Rate ({settings.currencySymbol} / Bag)</label>
                <input
                  type="number"
                  value={cementBagRate}
                  onChange={e => setCementBagRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sand Rate ({settings.currencySymbol} / CFT)</label>
                <input
                  type="number"
                  value={sandCftRate}
                  onChange={e => setSandCftRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Stone Chips ({settings.currencySymbol} / CFT)</label>
                <input
                  type="number"
                  value={stoneCftRate}
                  onChange={e => setStoneCftRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Head Mason ({settings.currencySymbol} / Day)</label>
                <input
                  type="number"
                  value={masonDayRate}
                  onChange={e => setMasonDayRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Helper Labor ({settings.currencySymbol} / Day)</label>
                <input
                  type="number"
                  value={helperDayRate}
                  onChange={e => setHelperDayRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mixer & Vibrator ({settings.currencySymbol})</label>
                <input
                  type="number"
                  value={mixerVibratorRate}
                  onChange={e => setMixerVibratorRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Output Section */}
      <div className="lg:col-span-5 space-y-4">
        <ResultPanel
          result={activeResult}
          settings={settings}
          onSaveHistory={() => onSaveHistory(activeResult)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />

        {/* Quick-Access In-Place Unit Conversion Utility */}
        <QuickUnitConverter
          settings={settings}
          defaultCategory="volume"
          allowedCategories={['volume', 'area', 'length', 'mass']}
        />
      </div>

      {/* Dedicated BOQ / Takeoff Print Preview Engine */}
      <PrintPreviewModal
        isOpen={isPrintBOQOpen}
        onClose={() => setIsPrintBOQOpen(false)}
        result={activeResult}
        settings={settings}
        defaultOrientation="landscape"
      />
    </div>
  );
};
