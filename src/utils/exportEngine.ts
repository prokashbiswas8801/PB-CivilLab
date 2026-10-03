/**
 * PB CivilLab — Export & Report Generator Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * CRITICAL RULE:
 * Consumes the authoritative CalculationResult object directly.
 * Never recalculates engineering outputs independently.
 */

import { CalculationResult, ReportProjectMeta } from '../types';

/**
 * Generates clean, engineering-formatted CSV data from CalculationResult.
 */
export function generateCSVReport(
  result: CalculationResult,
  projectMeta?: ReportProjectMeta
): string {
  const lines: string[] = [];

  // Header / Branding
  lines.push('PB CivilLab — Civil Engineering Smart Toolkit');
  lines.push('Author: Prokash Biswas | Calculate Smarter. Build Better.');
  lines.push(`Calculation Sheet: "${result.title}"`);
  lines.push(`Document No: "${projectMeta?.documentNumber || result.documentId || 'PBCL-DRAFT'}"`);
  lines.push(`Report Status: "${projectMeta?.reportStatus || 'Draft'}"`);
  lines.push(`Date: "${projectMeta?.date || new Date().toLocaleDateString('en-US')}"`);
  lines.push('');

  // Project Information
  if (projectMeta) {
    lines.push('--- PROJECT INFORMATION ---');
    if (projectMeta.projectName) lines.push(`Project Name,"${projectMeta.projectName}"`);
    if (projectMeta.projectId) lines.push(`Project ID,"${projectMeta.projectId}"`);
    if (projectMeta.client) lines.push(`Client / Owner,"${projectMeta.client}"`);
    if (projectMeta.contractor) lines.push(`Contractor,"${projectMeta.contractor}"`);
    if (projectMeta.consultant) lines.push(`Consultant,"${projectMeta.consultant}"`);
    if (projectMeta.location) lines.push(`Jobsite Location,"${projectMeta.location}"`);
    if (projectMeta.drawingNumber) lines.push(`Drawing Number,"${projectMeta.drawingNumber}"`);
    if (projectMeta.drawingRevision) lines.push(`Drawing Revision,"${projectMeta.drawingRevision}"`);
    lines.push('');
  }

  // Primary Result
  lines.push('--- PRIMARY ENGINEERING RESULT ---');
  lines.push(`Parameter,Value,Unit`);
  lines.push(`Primary Output,"${result.primaryValue}","${result.primaryUnit}"`);
  lines.push('');

  // Input Parameters
  if (result.inputsSummary && result.inputsSummary.length > 0) {
    lines.push('--- INPUT PARAMETERS ---');
    lines.push(`Parameter,Specified Value,Unit`);
    result.inputsSummary.forEach(inp => {
      lines.push(`"${inp.label}","${inp.value}","${inp.unit || ''}"`);
    });
    lines.push('');
  }

  // Secondary Outputs
  if (result.secondaryValues && result.secondaryValues.length > 0) {
    lines.push('--- CALCULATED OUTPUTS ---');
    lines.push(`Item,Computed Value,Unit`);
    result.secondaryValues.forEach(sec => {
      lines.push(`"${sec.label}","${sec.value}","${sec.unit || ''}"`);
    });
    lines.push('');
  }

  // Calculation Trace
  if (result.calculationTrace && result.calculationTrace.length > 0) {
    lines.push('--- CALCULATION TRACE ---');
    lines.push(`Step,Formula,Expression,Result`);
    result.calculationTrace.forEach(tr => {
      lines.push(`"${tr.label}","${tr.formula || ''}","${tr.expression}","${tr.result}"`);
    });
    lines.push('');
  }

  // Engineering Basis & Notes
  lines.push('--- ENGINEERING BASIS & STANDARDS ---');
  if (result.formula) lines.push(`Formula,"${result.formula}"`);
  if (result.substitutedFormula) lines.push(`Substituted,"${result.substitutedFormula}"`);
  if (result.engineeringBasis) {
    lines.push(`Method,"${result.engineeringBasis.calculationBasis}"`);
    lines.push(`Standards,"${result.engineeringBasis.standardCode || 'Standard Theoretical'}"`);
    lines.push(`Material Assumption,"${result.engineeringBasis.materialAssumption}"`);
    lines.push(`Constants,"${result.engineeringBasis.densityConstants}"`);
    if (result.engineeringBasis.toleranceNote) {
      lines.push(`Tolerance Note,"${result.engineeringBasis.toleranceNote}"`);
    }
  }
  if (result.engineeringNotes) {
    lines.push(`Site Notes,"${result.engineeringNotes}"`);
  }
  lines.push('');

  // Verification Block
  lines.push('--- VERIFICATION & APPROVAL ---');
  lines.push(`Prepared By,"${projectMeta?.preparedBy || 'Not specified'}"`);
  lines.push(`Checked By,"${projectMeta?.checkedBy || 'Not specified'}"`);
  lines.push(`Approved By,"${projectMeta?.approvedBy || 'Not specified'}"`);
  lines.push('');

  // Disclaimer
  lines.push('--- DISCLAIMER ---');
  lines.push('"Engineering Note: This calculation provides computational assistance based on the inputs, assumptions, units and calculation method selected by the user. It does not replace project specifications, approved drawings, applicable codes and standards, manufacturer data, site verification, or professional engineering judgment."');

  return lines.join('\n');
}

/**
 * Downloads a string payload as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
