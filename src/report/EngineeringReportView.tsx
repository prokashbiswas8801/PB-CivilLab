/**
 * PB CivilLab — Canonical Engineering Report View Component
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * Renders the authoritative ReportDocumentModel identically for both
 * on-screen Preview and Native Browser Print via #pb-civillab-print-root.
 */

import React from 'react';
import { ReportDocumentModel } from './ReportDocumentModel';
import { Logo } from '../components/Logo';
import { AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './report.css';

interface Props {
  document: ReportDocumentModel;
  isPrintRoot?: boolean;
}

export const EngineeringReportView: React.FC<Props> = ({ document: doc, isPrintRoot = false }) => {
  const { header, project, layout, primaryResult, inputs, outputs, trace, breakdown, basis, signOff } = doc;
  const isLandscape = layout.orientation === 'landscape';
  const marginClass = layout.marginProfile === 'compact' ? 'margin-compact' : 'margin-normal';

  const hasProjectFields = Boolean(
    project.projectName ||
    project.projectId ||
    project.client ||
    project.consultant ||
    project.contractor ||
    project.location ||
    project.drawingNumber ||
    project.drawingRevision ||
    project.calculationReference
  );

  return (
    <article
      className={`pb-report-sheet ${isLandscape ? 'landscape' : 'portrait'} ${marginClass} text-slate-900 bg-white`}
    >
      {/* --------------------------------------------------------------------
       * 1. REPORT HEADER (Running Document Banner)
       * -------------------------------------------------------------------- */}
      <header className="pb-report-header border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo variant="icon" height={32} className="shrink-0 text-cyan-600" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                {header.appName}
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                {header.reportStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              {header.appTagline} • Civil Engineering Computational Engine
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] font-mono shrink-0">
          <p className="font-bold text-slate-900">{header.documentNumber}</p>
          <p className="text-slate-600">Rev: {header.revision} ({header.revisionDescription || 'Initial'})</p>
          <p className="text-slate-500">{header.date}</p>
        </div>
      </header>

      {/* --------------------------------------------------------------------
       * 2. SHEET TITLE & STATUS BANNER
       * -------------------------------------------------------------------- */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {doc.title}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Author: {header.authorCredit}
          </span>
        </div>

        {/* Validation Warning Banner if calculation was invalid */}
        {doc.status === 'invalid' && (
          <div className="mt-2.5 p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-start gap-2.5 pb-avoid-break">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Engineering Validation Notice:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-red-800">
                {doc.validationIssues?.map((issue, idx) => (
                  <li key={idx}><strong>{issue.field}:</strong> {issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------
       * 3. PROJECT METADATA TABLE (Optional)
       * -------------------------------------------------------------------- */}
      {layout.showProjectInfo && hasProjectFields && (
        <section className="mb-4 pb-avoid-break">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Project Information
          </h3>
          <table className="pb-report-table text-xs">
            <tbody>
              {project.projectName && (
                <tr>
                  <td className="w-1/4 font-semibold text-slate-600 bg-slate-50">Project Name</td>
                  <td className="font-medium text-slate-900">{project.projectName}</td>
                </tr>
              )}
              {project.projectId && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Project ID</td>
                  <td className="font-mono text-slate-900">{project.projectId}</td>
                </tr>
              )}
              {project.client && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Client / Owner</td>
                  <td className="text-slate-900">{project.client}</td>
                </tr>
              )}
              {project.consultant && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Consultant</td>
                  <td className="text-slate-900">{project.consultant}</td>
                </tr>
              )}
              {project.contractor && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Contractor</td>
                  <td className="text-slate-900">{project.contractor}</td>
                </tr>
              )}
              {project.location && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Jobsite Location</td>
                  <td className="text-slate-900">{project.location}</td>
                </tr>
              )}
              {project.drawingNumber && (
                <tr>
                  <td className="font-semibold text-slate-600 bg-slate-50">Drawing Reference</td>
                  <td className="font-mono text-slate-900">{project.drawingNumber} {project.drawingRevision ? `(Rev ${project.drawingRevision})` : ''}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 4. PRIMARY RESULT CALLOUT
       * -------------------------------------------------------------------- */}
      {layout.showPrimaryResult && (
        <section className="mb-4 p-3.5 rounded-lg bg-slate-50 border border-slate-300 pb-avoid-break">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {primaryResult.label}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {primaryResult.value}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {primaryResult.unit}
            </span>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 5. INPUT PARAMETERS TABLE
       * -------------------------------------------------------------------- */}
      {layout.showInputs && inputs.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Input Parameters
          </h3>
          <table className="pb-report-table text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                <th className="text-left w-1/2">Parameter</th>
                <th className="text-right w-1/4">Design Value</th>
                <th className="text-left w-1/4">Unit</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((inp, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="font-medium text-slate-800">{inp.label}</td>
                  <td className="text-right font-mono text-slate-900">{inp.value}</td>
                  <td className="text-slate-500 font-mono text-[11px]">{inp.unit || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 6. SECONDARY CALCULATED OUTPUTS
       * -------------------------------------------------------------------- */}
      {layout.showSecondaryResults && outputs.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Calculated Engineering Outputs
          </h3>
          <table className="pb-report-table text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                <th className="text-left w-1/2">Result Parameter</th>
                <th className="text-right w-1/2">Computed Value</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((out, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="font-medium text-slate-800">{out.label}</td>
                  <td className="text-right font-mono font-bold text-slate-900">{out.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 7. CALCULATION TRACE & FORMULA
       * -------------------------------------------------------------------- */}
      {layout.showCalculationTrace && trace.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Mathematical Calculation Trace
          </h3>
          {doc.formula && (
            <div className="mb-2 p-2 rounded bg-slate-50 border border-slate-200 text-xs font-mono pb-avoid-break">
              <span className="font-semibold text-slate-500 text-[10px] block uppercase">Governing Formula:</span>
              <p className="text-slate-900 mt-0.5">{doc.formula}</p>
            </div>
          )}
          <table className="pb-report-table text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                <th className="text-left w-12">Step</th>
                <th className="text-left">Description</th>
                <th className="text-left">Substitution</th>
                <th className="text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {trace.map((tr, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="font-mono text-slate-500 text-[11px]">{tr.stepNumber}</td>
                  <td className="font-medium text-slate-800">{tr.label}</td>
                  <td className="font-mono text-[11px] text-slate-600">{tr.expression}</td>
                  <td className="text-right font-mono font-bold text-slate-900">{tr.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 8. ENGINEERING BASIS & ASSUMPTIONS
       * -------------------------------------------------------------------- */}
      {layout.showEngineeringBasis && (basis || doc.assumptions.length > 0) && (
        <section className="mb-4 pb-avoid-break">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Engineering Basis & Standards
          </h3>
          <div className="text-xs space-y-1.5 p-3 rounded bg-slate-50 border border-slate-200">
            {basis?.standardCode && (
              <p><strong className="text-slate-700">Design Standard:</strong> {basis.standardCode} {basis.referenceClause ? `(${basis.referenceClause})` : ''}</p>
            )}
            {basis?.calculationBasis && (
              <p><strong className="text-slate-700">Calculation Method:</strong> {basis.calculationBasis}</p>
            )}
            {basis?.materialAssumption && (
              <p><strong className="text-slate-700">Material Assumptions:</strong> {basis.materialAssumption}</p>
            )}
            {basis?.densityConstants && (
              <p><strong className="text-slate-700">Constants Used:</strong> <span className="font-mono text-[11px]">{basis.densityConstants}</span></p>
            )}
            {doc.assumptions.map((ass, idx) => (
              <p key={idx}><strong className="text-slate-700">{ass.label}:</strong> {ass.value}</p>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 9. ENGINEERING & QUALITY CONTROL NOTES
       * -------------------------------------------------------------------- */}
      {layout.showEngineeringNotes && doc.engineeringNotes && (
        <section className="mb-4 pb-avoid-break">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
            Site Engineering Notes
          </h3>
          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {doc.engineeringNotes}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 10. QA VERIFICATION & SIGN-OFF BLOCK
       * -------------------------------------------------------------------- */}
      {layout.showVerification && (
        <section className="mt-6 pt-3 border-t-2 border-slate-900 pb-avoid-break">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2">
            Quality Assurance Verification & Sign-Off
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {signOff.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded border border-slate-300 bg-slate-50/50">
                <span className="text-[9px] font-bold font-mono uppercase text-slate-500 block">
                  {m.role}
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1 min-h-[16px]">
                  {m.name}
                </p>
                <div className="mt-3 pt-1 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>{m.title || 'Signature & Date'}</span>
                  {m.date && <span className="font-mono">{m.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------
       * 11. DISCLAIMER & FOOTER
       * -------------------------------------------------------------------- */}
      <footer className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-500 leading-tight pb-avoid-break">
        <p className="italic mb-1">{doc.disclaimer}</p>
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1">
          <span>Document Ref: {header.documentNumber} (Rev {header.revision})</span>
          <span>Generated by {header.appName} • {header.date}</span>
        </div>
      </footer>
    </article>
  );
};
