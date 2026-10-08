import React from 'react';
import { Table, Layers, Grid } from 'lucide-react';
import { DENSITIES, REBAR_STANDARD_DATA } from '../constants/engineering';
import { formatNumber } from '../utils/units';

export const ReferenceTablesView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Table 1: Rebar Properties */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm dark:shadow-xl">
        <h3 className="text-lg font-wood font-normal text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1 tracking-wide">
          <Grid className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Standard Steel Rebar Mechanical & Weight Table
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Nominal rebar sizes based on BDS 1313 / ASTM A615 / IS 1786. Unit weight theoretical: W = D² / 162.2 kg/m.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left calculation-table">
            <thead className="bg-slate-100 dark:bg-[#151C2B] text-slate-700 dark:text-slate-400 font-mono uppercase border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="py-2.5 px-3">Diameter (Ø mm)</th>
                <th className="py-2.5 px-3">Cross Section Area (mm²)</th>
                <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Unit Weight (kg/m)</th>
                <th className="py-2.5 px-3">Weight per 12 m Bar (kg)</th>
                <th className="py-2.5 px-3">12 m Bars per Tonne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
              {Object.entries(REBAR_STANDARD_DATA).map(([dia, data]) => {
                const wt12m = data.unitWeight * 12;
                const barsPerTon = wt12m > 0 ? Math.floor(1000 / wt12m) : 0;

                return (
                  <tr key={dia} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors boq-row">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-200">Ø {dia} mm</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{data.area} mm²</td>
                    <td className="py-2 px-3 font-semibold text-cyan-700 dark:text-cyan-300">{data.unitWeight} kg/m</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{formatNumber(wt12m, 2)} kg</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{barsPerTon} bars</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Material Densities */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm dark:shadow-xl">
        <h3 className="text-lg font-wood font-normal text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1 tracking-wide">
          <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Civil Engineering Material Bulk & Compacted Densities
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Typical engineering design unit masses (BNBC / IS 875 Part 1 / Eurocode 1).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left calculation-table">
            <thead className="bg-slate-100 dark:bg-[#151C2B] text-slate-700 dark:text-slate-400 font-mono uppercase border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Density (kg/m³)</th>
                <th className="py-2.5 px-3">Density (lb/ft³ - pcf)</th>
                <th className="py-2.5 px-3">Typical Application Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
              {[
                { name: 'Reinforced Cement Concrete (RCC)', kg: DENSITIES.rcc, note: 'Includes 1% to 2% reinforcement steel mass' },
                { name: 'Plain Cement Concrete (PCC)', kg: DENSITIES.concrete, note: 'Mass foundation beds beneath footings' },
                { name: 'Mild Steel / Deformed Rebar', kg: DENSITIES.steel, note: 'ASTM A615 / BDS 1313 500W grade' },
                { name: 'Loose Bulk Cement (OPC/PCC)', kg: DENSITIES.cement, note: 'Standard loose packed powder in 50 kg bags' },
                { name: 'Dry Clean Sand (Fine Aggregate)', kg: DENSITIES.sand_dry, note: 'Zone II / FM 1.5 – 2.5 dry state' },
                { name: 'Crushed Stone Aggregate', kg: DENSITIES.aggregate, note: 'Graded coarse aggregate (20mm down)' },
                { name: 'Brick Masonry (Clay Bricks)', kg: DENSITIES.brick_masonry, note: 'Including cement mortar joints' },
                { name: 'Ordinary Potable Water', kg: DENSITIES.water, note: '1 Liter = exactly 1 kg at 4°C' },
                { name: 'Compacted Soil / Subgrade', kg: DENSITIES.soil_compacted, note: 'Optimum moisture content standard proctor' },
              ].map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors boq-row">
                  <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-slate-200">{m.name}</td>
                  <td className="py-2 px-3 font-semibold text-cyan-700 dark:text-cyan-300">{m.kg} kg/m³</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{formatNumber(m.kg * 0.062428, 1)} lb/ft³</td>
                  <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 3: Nominal Mixes Guide */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm dark:shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
          <Table className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Nominal Concrete Mix Proportions & Benchmark Cement Consumption
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Nominal volumetric ratios for preliminary quantity estimation. High performance mix requires design mix.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left calculation-table">
            <thead className="bg-slate-100 dark:bg-[#151C2B] text-slate-700 dark:text-slate-400 font-mono uppercase border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="py-2.5 px-3">Grade (Approx)</th>
                <th className="py-2.5 px-3">Nominal Ratio (C : S : A)</th>
                <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Cement Bags per m³</th>
                <th className="py-2.5 px-3">Recommended Structural Uses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
              {[
                { grade: 'M10', ratio: '1 : 3 : 6', bags: '~ 4.5 bags', use: 'Foundation bed leveling (PCC), non-structural mass concrete' },
                { grade: 'M15', ratio: '1 : 2 : 4', bags: '~ 6.4 bags', use: 'Boundary walls, lintels, paths, lightly loaded slabs' },
                { grade: 'M20', ratio: '1 : 1.5 : 3', bags: '~ 8.2 bags', use: 'Standard residential RCC beams, slabs, and columns' },
                { grade: 'M25', ratio: '1 : 1 : 2', bags: '~ 11.2 bags', use: 'Heavy loaded columns, water retaining tanks, piles' },
              ].map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors boq-row">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-200">{c.grade}</td>
                  <td className="py-2.5 px-3 font-semibold text-cyan-700 dark:text-cyan-300">{c.ratio}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{c.bags}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400">{c.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
