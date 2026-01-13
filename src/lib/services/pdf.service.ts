/**
 * PDF Generation Service
 * Generates PDF reports for group contributions
 */

export interface MemberContributionData {
  memberId: string;
  memberName: string;
  phone: string;
  periodTotal: number;
  overallTotal: number;
  periodCount: number;
  overallCount: number;
}

export interface GroupReportData {
  groupId: string;
  groupName: string;
  reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
  periodStart?: string;
  periodEnd?: string;
  periodTotal: number;
  overallTotal: number;
  memberCount: number;
  currency: string;
  memberContributions: MemberContributionData[];
  institutionName?: string;
}

export interface GeneratePDFOptions {
  data: GroupReportData;
  outputPath?: string;
}

/**
 * Generate PDF report for group contributions
 * This is a client-side implementation using jsPDF
 * For server-side, use a library like pdfkit or puppeteer
 */
export async function generateGroupReportPDF(
  options: GeneratePDFOptions
): Promise<Blob> {
  const { data } = options;

  // Dynamic import of jsPDF (if available)
  // For production, you might want to use a server-side PDF generation
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Set font
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    
    // Title
    const title = `${data.groupName} - ${data.reportType} Contribution Report`;
    doc.text(title, 14, 20);

    // Institution name (if provided)
    if (data.institutionName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Institution: ${data.institutionName}`, 14, 30);
    }

    // Period information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (data.periodStart && data.periodEnd) {
      doc.text(`Period: ${data.periodStart} to ${data.periodEnd}`, 14, 40);
    } else {
      doc.text('Overall Report', 14, 40);
    }

    // Summary section
    let yPos = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Period Total: ${data.currency} ${data.periodTotal.toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Overall Total: ${data.currency} ${data.overallTotal.toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Member Count: ${data.memberCount}`, 20, yPos);

    // Member contributions table
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Member Contributions', 14, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Table headers
    doc.text('Member Name', 14, yPos);
    doc.text('Period Total', 80, yPos);
    doc.text('Overall Total', 130, yPos);
    doc.text('Count', 180, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    
    // Table rows
    data.memberContributions.forEach((member, index) => {
      if (yPos > 270) {
        // Add new page if needed
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(member.memberName.substring(0, 25), 14, yPos);
      doc.text(`${data.currency} ${member.periodTotal.toLocaleString()}`, 80, yPos);
      doc.text(`${data.currency} ${member.overallTotal.toLocaleString()}`, 130, yPos);
      doc.text(`${member.periodCount}/${member.overallCount}`, 180, yPos);
      
      yPos += 6;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        14,
        285
      );
    }

    // Generate blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF. jsPDF may not be available.');
  }
}

/**
 * Generate PDF and upload to Supabase Storage
 */
export async function generateAndUploadPDF(
  options: GeneratePDFOptions,
  storagePath: string
): Promise<{ url: string; path: string }> {
  const pdfBlob = await generateGroupReportPDF(options);
  
  // Upload to Supabase Storage
  // This should be done server-side or via Supabase Edge Function
  // For now, return a placeholder
  const fileName = `group-report-${options.data.groupId}-${Date.now()}.pdf`;
  const fullPath = `${storagePath}/${fileName}`;
  
  // In actual implementation, upload to Supabase Storage
  // const { data, error } = await supabase.storage
  //   .from('group-reports')
  //   .upload(fullPath, pdfBlob, {
  //     contentType: 'application/pdf',
  //     upsert: false
  //   });
  
  // Get public URL
  // const { data: urlData } = supabase.storage
  //   .from('group-reports')
  //   .getPublicUrl(fullPath);
  
  return {
    url: '', // urlData.publicUrl,
    path: fullPath,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'RWF'): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
