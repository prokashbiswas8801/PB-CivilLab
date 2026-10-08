/**
 * PB CivilLab — Professional Engineering PDF Export Engine (Multi-Page A4)
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * Architecture:
 * 1. FULL MULTI-PAGE PAGINATION:
 *    Dynamically tracks vertical flow; never clips long tables or formulas.
 *    Repeats table headers across page breaks; keeps sign-offs cohesive.
 * 2. DYNAMIC A4 ORIENTATION & MARGINS:
 *    Full support for A4 Portrait (210×297mm) and Landscape (297×210mm).
 *    Normal (14mm) and Compact (10mm) margin profiles matching preview.
 * 3. PREVIEW SECTION SYNCHRONIZATION:
 *    Strictly matches the exact sections enabled by the user in preview.
 * 4. MANDATORY BRANDING & CREATOR CREDITS:
 *    Permanent PB CivilLab header, creator credits (Prokash Biswas),
 *    document reference, status, and running "Page X of Y" pagination.
 */

import { jsPDF } from 'jspdf';
import { CalculationResult, ReportProjectMeta, ReportSectionOptions, DEFAULT_REPORT_SECTIONS, ReportStatus } from '../types';

export interface PDFExportOptions {
  projectMeta?: ReportProjectMeta;
  settings?: any;
  customTitle?: string;
  autoDownload?: boolean;
  orientation?: 'portrait' | 'landscape';
  margin?: 'normal' | 'compact';
  sectionOptions?: Partial<ReportSectionOptions>;
  // Backwards compatibility with test runners
  documentNumber?: string;
  reportStatus?: ReportStatus;
  date?: string;
}

/**
 * Generates and downloads a clean, professional multi-page A4 Engineering Report PDF.
 */
export function exportCalculationToPDF(
  result: CalculationResult,
  options: PDFExportOptions = {}
): jsPDF {
  const {
    projectMeta = {},
    customTitle,
    autoDownload = true,
    orientation = 'portrait',
    margin = 'normal',
    sectionOptions,
    documentNumber: optDocNum,
    reportStatus: optStatus,
    date: optDate,
  } = options;

  const sections: ReportSectionOptions = {
    ...DEFAULT_REPORT_SECTIONS,
    ...(sectionOptions || {}),
  };

  // Resolve metadata with backwards-compatibility fallbacks
  const effectiveMeta: ReportProjectMeta = {
    ...projectMeta,
    documentNumber: optDocNum || projectMeta.documentNumber || result.documentId || `PBCL-${Date.now().toString().slice(-6)}`,
    reportStatus: optStatus || projectMeta.reportStatus || (result.isPreliminary ? 'Draft' : 'Draft'),
    date: optDate || projectMeta.date || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
  };

  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const marginX = margin === 'compact' ? 10 : 14;
  const marginY = margin === 'compact' ? 10 : 14;
  const contentWidth = pageWidth - marginX * 2;
  const footerReservedHeight = 14;

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Palette definitions (High contrast, readable in color and monochrome print)
  const primaryNavy = [15, 23, 42];     // #0F172A
  const accentBlue = [2, 132, 199];     // #0284C7
  const textDark = [15, 23, 42];        // #0F172A
  const textMuted = [100, 116, 139];    // #64748B
  const borderLight = [203, 213, 225];  // #CBD5E1
  const borderDark = [30, 41, 59];      // #1E293B
  const bgLight = [248, 250, 252];      // #F8FAFC
  const bgHighlight = [240, 249, 255];  // #F0F9FF

  const docNumber = effectiveMeta.documentNumber || 'PBCL-DRAFT';
  const dateStr = effectiveMeta.date || '';
  const sheetTitle = customTitle?.trim() || result.title;
  const status = effectiveMeta.reportStatus || 'Draft';

  let y = marginY;
  const repeatingHeaderHeight = 13.5;

  // Running page break checker — reserves space for repeating header on subsequent pages
  function checkPageBreak(neededHeight: number, onNewPage?: () => void) {
    if (y + neededHeight > pageHeight - marginY - footerReservedHeight) {
      doc.addPage('a4', isLandscape ? 'landscape' : 'portrait');
      y = marginY + repeatingHeaderHeight + 3.5;
      if (onNewPage) {
        onNewPage();
      }
    }
  }

  // Repeating Header on subsequent pages of multi-page PDFs
  function drawRepeatingHeader(pageNum: number, totalPages: number) {
    const headerY = marginY;
    const hHeight = repeatingHeaderHeight;

    // 1. Background Box
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(marginX, headerY, contentWidth, hHeight, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.rect(marginX, headerY, contentWidth, hHeight, 'S');

    // 2. Top Accent Strip (Cyan/Sky)
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(marginX, headerY, contentWidth, 0.7, 'F');

    // 3. Company Logo (Emblem + Wordmark)
    drawCompanyLogoBadge(doc, marginX + 2.5, headerY + 2.5, 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('PB CivilLab', marginX + 12.5, headerY + 6.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Civil Engineering Smart Toolkit', marginX + 12.5, headerY + 9.8);

    // 4. Divider 1
    const div1X = marginX + (isLandscape ? 58 : 50);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.25);
    doc.line(div1X, headerY + 1.8, div1X, headerY + hHeight - 1.5);

    // 5. Document Name
    const docNameX = div1X + 3.5;
    const div2X = marginX + contentWidth - (isLandscape ? 65 : 55);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text('CALCULATION / DOCUMENT NAME', docNameX, headerY + 5.0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    const maxTitleW = div2X - docNameX - 3;
    const truncatedTitle = doc.splitTextToSize(sheetTitle, maxTitleW)[0] || sheetTitle;
    doc.text(truncatedTitle, docNameX, headerY + 9.6);

    // 6. Divider 2
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.25);
    doc.line(div2X, headerY + 1.8, div2X, headerY + hHeight - 1.5);

    // 7. Reference & Dynamic Page Numbering
    const metaX = marginX + contentWidth - 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`Doc: ${docNumber}  |  ${status}`, metaX, headerY + 5.0, { align: 'right' });

    // Dynamic Page Number: "Page X of Y"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text(`Page ${pageNum} of ${totalPages}`, metaX, headerY + 9.8, { align: 'right' });
  }

  // =========================================================================
  // 1. PAGE 1: MANDATORY OFFICIAL BRANDING HEADER
  // =========================================================================
  const headerHeight = 22;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.rect(marginX, y, contentWidth, headerHeight, 'F');
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.4);
  doc.rect(marginX, y, contentWidth, headerHeight, 'S');

  // Company Logo Vector Emblem Badge
  drawCompanyLogoBadge(doc, marginX + 3.5, y + 3.2, 9);

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('PB CivilLab', marginX + 14.5, y + 7.2);

  // Badge: Official Calculation Sheet
  const badgeX = marginX + 53;
  const badgeY = y + 3.2;
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(badgeX, badgeY, 34, 4.5, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text('ENGINEERING CALC SHEET', badgeX + 2, badgeY + 3.2);

  // Subtitle & Creator Credits (Mandatory branding requirement)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Civil Engineering Smart Toolkit & Verification Log', marginX + 14.5, y + 12.0);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Engineered by Prokash Biswas · Calculate Smarter. Build Better.', marginX + 14.5, y + 16.8);

  // Document Reference & Status (Right Column of Header)
  const metaRightX = marginX + contentWidth - 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`Doc Ref: ${docNumber}`, metaRightX, y + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Date: ${dateStr}`, metaRightX, y + 11.5, { align: 'right' });
  doc.text(`Status: ${status}`, metaRightX, y + 16.5, { align: 'right' });

  y += headerHeight + 3.5;

  // Title Strip
  const titleStripHeight = 11;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.rect(marginX, y, contentWidth, titleStripHeight, 'FD');

  const titleCol1 = contentWidth * 0.55;
  const titleCol2 = contentWidth * 0.25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CALCULATION SHEET', marginX + 3, y + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  const truncatedTitle = doc.splitTextToSize(sheetTitle, titleCol1 - 6)[0] || sheetTitle;
  doc.text(truncatedTitle, marginX + 3, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CATEGORY / DOMAIN', marginX + titleCol1 + 3, y + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const categoryLabel = (result.primaryCategory || 'Civil Structural').toUpperCase();
  doc.text(categoryLabel, marginX + titleCol1 + 3, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('ORIENTATION', marginX + titleCol1 + titleCol2 + 3, y + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(`A4 ${isLandscape ? 'Landscape' : 'Portrait'}`, marginX + titleCol1 + titleCol2 + 3, y + 8.5);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(marginX + titleCol1, y, marginX + titleCol1, y + titleStripHeight);
  doc.line(marginX + titleCol1 + titleCol2, y, marginX + titleCol1 + titleCol2, y + titleStripHeight);

  y += titleStripHeight + 3.5;

  // =========================================================================
  // 2. PROJECT INFORMATION SECTION (OPTIONAL)
  // =========================================================================
  if (sections.showProjectInfo) {
    const projectFields = [
      { label: 'Project Name', value: effectiveMeta.projectName },
      { label: 'Project ID', value: effectiveMeta.projectId },
      { label: 'Client / Owner', value: effectiveMeta.client },
      { label: 'Contractor', value: effectiveMeta.contractor },
      { label: 'Consultant', value: effectiveMeta.consultant },
      { label: 'Jobsite Location', value: effectiveMeta.location },
      { label: 'Drawing Number', value: effectiveMeta.drawingNumber },
      { label: 'Revision', value: effectiveMeta.drawingRevision },
      { label: 'Calculation Ref', value: effectiveMeta.calculationReference },
    ];

    const activeFields = effectiveMeta.showEmptyFields
      ? projectFields.map(f => ({ ...f, value: f.value || 'Not specified' }))
      : projectFields.filter(f => Boolean(f.value));

    if (activeFields.length > 0) {
      checkPageBreak(20);
      drawSectionHeader(doc, 'PROJECT & CLIENT INFORMATION', marginX, y, contentWidth);
      y += 5;

      const numCols = isLandscape ? 3 : 2;
      const colW = (contentWidth - (numCols - 1) * 2) / numCols;
      const rowH = 7.5;

      for (let i = 0; i < activeFields.length; i += numCols) {
        checkPageBreak(rowH + 2);
        for (let c = 0; c < numCols; c++) {
          const item = activeFields[i + c];
          if (item) {
            const cx = marginX + c * (colW + 2);
            doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
            doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
            doc.setLineWidth(0.2);
            doc.rect(cx, y, colW, rowH - 1, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.8);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(item.label.toUpperCase(), cx + 2, y + 2.6);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(textDark[0], textDark[1], textDark[2]);
            const val = doc.splitTextToSize(item.value || '', colW - 4)[0] || item.value || '';
            doc.text(val, cx + 2, y + 5.5);
          }
        }
        y += rowH;
      }
      y += 2.5;
    }
  }

  // =========================================================================
  // 3. PRIMARY ENGINEERING RESULT (OPTIONAL)
  // =========================================================================
  if (sections.showPrimaryResult) {
    checkPageBreak(20);
    const primaryBoxHeight = 17;
    doc.setFillColor(bgHighlight[0], bgHighlight[1], bgHighlight[2]);
    doc.setDrawColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, y, contentWidth, primaryBoxHeight, 1.2, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text('PRIMARY COMPUTED ENGINEERING OUTPUT QUANTITY', marginX + 4, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    const primaryDisplay = `${result.primaryValue} ${result.primaryUnit}`;
    doc.text(primaryDisplay, marginX + 4, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Authoritative Calculation Engine · Zero Truncation Drift', marginX + contentWidth - 4, y + 9.5, { align: 'right' });
    doc.text('Standard Engineering Precision', marginX + contentWidth - 4, y + 13.5, { align: 'right' });

    y += primaryBoxHeight + 3.5;
  }

  // =========================================================================
  // 4. INPUT PARAMETERS TABLE (OPTIONAL, MULTI-ROW SAFE)
  // =========================================================================
  if (sections.showInputs && result.inputsSummary && result.inputsSummary.length > 0) {
    checkPageBreak(18);
    drawSectionHeader(doc, 'SPECIFIED INPUT PARAMETERS', marginX, y, contentWidth);
    y += 5;

    const rowH = 5.2;
    const numCols = isLandscape ? 3 : 2;
    const halfWidth = (contentWidth - (numCols - 1) * 2.5) / numCols;

    for (let i = 0; i < result.inputsSummary.length; i += numCols) {
      checkPageBreak(rowH + 2, () => {
        drawSectionHeader(doc, 'SPECIFIED INPUT PARAMETERS (CONTINUED)', marginX, y, contentWidth);
        y += 5;
      });

      for (let c = 0; c < numCols; c++) {
        const item = result.inputsSummary[i + c];
        if (item) {
          const colX = marginX + c * (halfWidth + 2.5);
          drawTableRow(doc, item.label, `${item.value} ${item.unit || ''}`.trim(), colX, y, halfWidth);
        }
      }
      y += rowH;
    }
    y += 2.5;
  }

  // =========================================================================
  // 5. CALCULATED OUTPUTS & SECONDARY QUANTITIES (OPTIONAL)
  // =========================================================================
  if (sections.showSecondaryResults && result.secondaryValues && result.secondaryValues.length > 0) {
    checkPageBreak(18);
    drawSectionHeader(doc, 'CALCULATED OUTPUTS & SECONDARY METRICS', marginX, y, contentWidth);
    y += 5;

    const rowH = 5.2;
    const numCols = isLandscape ? 3 : 2;
    const halfWidth = (contentWidth - (numCols - 1) * 2.5) / numCols;

    for (let i = 0; i < result.secondaryValues.length; i += numCols) {
      checkPageBreak(rowH + 2, () => {
        drawSectionHeader(doc, 'CALCULATED OUTPUTS & SECONDARY METRICS (CONTINUED)', marginX, y, contentWidth);
        y += 5;
      });

      for (let c = 0; c < numCols; c++) {
        const item = result.secondaryValues[i + c];
        if (item) {
          const colX = marginX + c * (halfWidth + 2.5);
          drawTableRow(doc, item.label, `${item.value} ${item.unit || ''}`.trim(), colX, y, halfWidth, true);
        }
      }
      y += rowH;
    }
    y += 2.5;
  }

  // =========================================================================
  // 6. DETAILED BREAKDOWN & STEP SUMMARY TABLE (OPTIONAL)
  // =========================================================================
  const showBreakdown = sections.showDetailedTables && result.breakdown && result.breakdown.length > 0 && (!result.calculationTrace || result.calculationTrace.length === 0);
  if (showBreakdown && result.breakdown) {
    checkPageBreak(20);
    drawSectionHeader(doc, 'DETAILED ARITHMETIC BREAKDOWN & STEP SUMMARY', marginX, y, contentWidth);
    y += 5;

    // Table Header
    const colStepW = contentWidth * 0.35;
    const colExprW = contentWidth * 0.45;
    const colResW = contentWidth * 0.20;

    const drawBreakdownHeader = () => {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(borderDark[0], borderDark[1], borderDark[2]);
      doc.setLineWidth(0.3);
      doc.rect(marginX, y, contentWidth, 5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text('CALCULATION STEP', marginX + 2, y + 3.5);
      doc.text('EXPRESSION / DERIVATION', marginX + colStepW + 2, y + 3.5);
      doc.text('RESULT', marginX + colStepW + colExprW + 2, y + 3.5);
      y += 5;
    };

    drawBreakdownHeader();

    result.breakdown.forEach((b, idx) => {
      checkPageBreak(6, () => {
        drawSectionHeader(doc, 'DETAILED BREAKDOWN (CONTINUED)', marginX, y, contentWidth);
        y += 5;
        drawBreakdownHeader();
      });

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.2);
      doc.rect(marginX, y, contentWidth, 5.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(doc.splitTextToSize(b.step, colStepW - 4)[0] || b.step, marginX + 2, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(doc.splitTextToSize(b.expression, colExprW - 4)[0] || b.expression, marginX + colStepW + 2, y + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text(b.result, marginX + contentWidth - 3, y + 3.6, { align: 'right' });

      y += 5.2;
    });
    y += 2.5;
  }

  // =========================================================================
  // 7. GOVERNING FORMULA & CALCULATION TRACE (OPTIONAL)
  // =========================================================================
  if (sections.showCalculationTrace) {
    checkPageBreak(18);
    drawSectionHeader(doc, 'GOVERNING MATHEMATICAL EQUATION & TRACE', marginX, y, contentWidth);
    y += 5;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);

    const hasSubstituted = Boolean(result.substitutedFormula);
    const formulaBoxHeight = hasSubstituted ? 14 : 9;
    doc.rect(marginX, y, contentWidth, formulaBoxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('GOVERNING EQUATION:', marginX + 3, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    const formulaStr = result.formula || 'Standard Construction Formula';
    doc.text(formulaStr, marginX + 38, y + 4.2);

    if (hasSubstituted) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('SUBSTITUTED TRACE:', marginX + 3, y + 9.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      const substitutedStr = doc.splitTextToSize(result.substitutedFormula, contentWidth - 42)[0] || result.substitutedFormula;
      doc.text(substitutedStr, marginX + 38, y + 9.8);
    }
    y += formulaBoxHeight + 3;

    // Trace items if available
    if (result.calculationTrace && result.calculationTrace.length > 0) {
      result.calculationTrace.forEach((tr) => {
        checkPageBreak(6);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
        doc.setLineWidth(0.2);
        doc.rect(marginX, y, contentWidth, 5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`${tr.label}:`, marginX + 2, y + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(tr.expression, marginX + 35, y + 3.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.text(tr.result, marginX + contentWidth - 3, y + 3.5, { align: 'right' });

        y += 5;
      });
      y += 2.5;
    }
  }

  // =========================================================================
  // 8. ENGINEERING BASIS & STANDARDS (OPTIONAL)
  // =========================================================================
  if (sections.showEngineeringBasis && (result.engineeringBasis || result.assumptions?.length)) {
    checkPageBreak(18);
    drawSectionHeader(doc, 'ENGINEERING BASIS & GOVERNING STANDARDS', marginX, y, contentWidth);
    y += 5;

    const basis = result.engineeringBasis;
    const basisItems: { label: string; value: string }[] = [];

    if (basis?.calculationBasis) basisItems.push({ label: 'Method / Basis', value: basis.calculationBasis });
    if (basis?.standardCode) basisItems.push({ label: 'Standard Code', value: basis.standardCode });
    if (basis?.materialAssumption) basisItems.push({ label: 'Material Assumption', value: basis.materialAssumption });
    if (basis?.densityConstants) basisItems.push({ label: 'Density / Constants', value: basis.densityConstants });
    if (result.assumptions) {
      result.assumptions.forEach(a => basisItems.push({ label: `Assumption: ${a.label}`, value: a.value }));
    }

    const rowH = 5.2;
    const numCols = isLandscape ? 3 : 2;
    const halfWidth = (contentWidth - (numCols - 1) * 2.5) / numCols;

    for (let i = 0; i < basisItems.length; i += numCols) {
      checkPageBreak(rowH + 2);
      for (let c = 0; c < numCols; c++) {
        const item = basisItems[i + c];
        if (item) {
          const colX = marginX + c * (halfWidth + 2.5);
          drawTableRow(doc, item.label, item.value, colX, y, halfWidth);
        }
      }
      y += rowH;
    }

    if (basis?.toleranceNote) {
      checkPageBreak(6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`* ${basis.toleranceNote}`, marginX + 2, y + 3.5);
      y += 5;
    }
    y += 2.5;
  }

  // =========================================================================
  // 9. PRACTICAL JOBSITE NOTES & PRECAUTIONS (OPTIONAL)
  // =========================================================================
  if (sections.showEngineeringNotes && result.engineeringNotes) {
    checkPageBreak(16);
    drawSectionHeader(doc, 'JOBSITE QUALITY CONTROL & PRACTICAL PRECAUTIONS', marginX, y, contentWidth);
    y += 5;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);

    const splitNotes = doc.splitTextToSize(result.engineeringNotes, contentWidth - 6);
    const boxH = Math.max(8, splitNotes.length * 3.8 + 3.5);
    checkPageBreak(boxH);

    doc.rect(marginX, y, contentWidth, boxH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(splitNotes, marginX + 3, y + 4.5);

    y += boxH + 3.5;
  }

  // =========================================================================
  // 10. QUALITY ASSURANCE SIGN-OFF BLOCK (OPTIONAL)
  // =========================================================================
  if (sections.showVerification) {
    const signBlockHeight = 28;
    checkPageBreak(signBlockHeight + 4);

    // Background card for QA Sign-off block (exact match with print stylesheet & preview)
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(marginX, y, contentWidth, signBlockHeight, 1.2, 1.2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, contentWidth, signBlockHeight, 1.2, 1.2, 'S');

    // Accent line at top of sign-off block
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(marginX, y, contentWidth, 0.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('JOBSITE QUALITY ASSURANCE & VERIFICATION SIGN-OFF', marginX + 3, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('SITE QA PROTOCOL', marginX + contentWidth - 3, y + 3.8, { align: 'right' });

    const signColWidth = contentWidth / 3;
    const roles = [
      { title: 'PREPARED BY', defaultSub: 'Site Engineer', name: effectiveMeta.preparedBy },
      { title: 'CHECKED BY', defaultSub: 'Resident / QA Engineer', name: effectiveMeta.checkedBy },
      { title: 'APPROVED BY', defaultSub: 'Project Director', name: effectiveMeta.approvedBy },
    ];

    roles.forEach((r, idx) => {
      const rx = marginX + idx * signColWidth + 2;
      const boxW = signColWidth - 4;
      const boxH = signBlockHeight - 8;
      const boxY = y + 5.5;

      // Inner signature box with white background fill
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(rx, boxY, boxW, boxH, 0.8, 0.8, 'FD');

      const lineY = boxY + boxH - 5.5;
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.3);
      doc.line(rx + 4, lineY, rx + boxW - 4, lineY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(r.title, rx + boxW / 2, boxY + 4.0, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const fittedName = doc.splitTextToSize(r.name ? r.name : r.defaultSub, boxW - 4)[0] || (r.name || r.defaultSub);
      doc.text(fittedName, rx + boxW / 2, boxY + 8.5, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('Signature & Date', rx + boxW / 2, lineY + 3.2, { align: 'center' });
    });

    y += signBlockHeight;
  }

  // =========================================================================
  // 11. FOOTER DISCLAIMER & RUNNING PAGE NUMBERING (ALL PAGES)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  const footerY = pageHeight - marginY - 4;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // 1. Dynamic repeating header on subsequent pages of multi-page PDFs
    if (pageNum > 1) {
      drawRepeatingHeader(pageNum, totalPages);
    } else if (totalPages > 1) {
      // Dynamic page indicator on page 1 header of multi-page documents
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text(`Sheet 1 of ${totalPages}`, metaRightX, marginY + 19.8, { align: 'right' });
    }

    // 2. Running engineering footer on all pages with dynamic page numbering
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY, marginX + contentWidth, footerY);

    // Disclaimer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      'Engineering Note: Computational assistance based on user inputs & standard codes. Verify against approved project drawings before execution.',
      marginX,
      footerY + 3.2
    );

    // Mandatory Branding & Page X of Y
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(
      `PB CivilLab · Prokash Biswas | Calculate Smarter. Build Better. · Page ${pageNum} of ${totalPages}`,
      marginX + contentWidth,
      footerY + 3.2,
      { align: 'right' }
    );
  }

  // Trigger browser download if enabled
  if (autoDownload) {
    const safeTitle = sheetTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const safeDoc = docNumber.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `PB_CivilLab_${safeTitle}_${safeDoc}.pdf`;
    doc.save(filename);
  }

  return doc;
}

/**
 * Draws the official PB CivilLab company logo emblem badge (crisp vector graphics).
 * Precision-scaled civil engineering motif with centered monogram and blueprint crosshairs.
 */
function drawCompanyLogoBadge(
  doc: jsPDF,
  x: number,
  y: number,
  size: number = 8
) {
  // 1. Dark Navy background badge with rounded corners
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.roundedRect(x, y, size, size, 1.2, 1.2, 'F');

  // 2. Cyan accent outline
  doc.setDrawColor(2, 132, 199); // #0284C7
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, size, size, 1.2, 1.2, 'S');

  // 3. Civil engineering drafting crosshairs (subtle blueprint grid)
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.12);
  doc.line(x + 1.2, y + size / 2, x + size - 1.2, y + size / 2);
  doc.line(x + size / 2, y + 1.2, x + size / 2, y + size - 1.2);

  // 4. White "PB" Monogram centered
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 1.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PB', x + size / 2, y + size / 2 + size * 0.18, { align: 'center' });
}

/**
 * Helper to draw a section header bar
 */
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number
) {
  doc.setFillColor(2, 132, 199);
  doc.rect(x, y - 2.8, 1.8, 3.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 3.5, y);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(x + 3.5 + doc.getTextWidth(title) + 3, y - 0.8, x + width, y - 0.8);
}

/**
 * Helper to draw a clean key-value table row
 */
function drawTableRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  isHighlight = false
) {
  doc.setFillColor(isHighlight ? 240 : 248, isHighlight ? 249 : 250, isHighlight ? 255 : 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, 4.6, 'FD');

  const maxValWidth = width * 0.45;
  const maxLabelWidth = width - maxValWidth - 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(100, 116, 139);
  const fitLabel = doc.splitTextToSize(label, maxLabelWidth)[0] || label;
  doc.text(fitLabel, x + 2, y + 3.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(15, 23, 42);
  const fitVal = doc.splitTextToSize(value, maxValWidth)[0] || value;
  doc.text(fitVal, x + width - 2, y + 3.2, { align: 'right' });
}
