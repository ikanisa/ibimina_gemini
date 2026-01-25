/**
 * Member Statement PDF Generator
 * Generates PDF statements for individual members
 */

import type { MemberStatement } from '../types';

interface MemberStatementPDFOptions {
    statement: MemberStatement;
    institutionName?: string;
}

/**
 * Generate a PDF statement for a member
 */
export async function generateMemberStatementPDF(
    options: MemberStatementPDFOptions
): Promise<Blob> {
    const { statement, institutionName } = options;

    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Colors
        const primaryColor: [number, number, number] = [34, 197, 94]; // Green
        const textColor: [number, number, number] = [51, 65, 85]; // Slate

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('MEMBER STATEMENT', 14, 20);

        if (institutionName) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(institutionName, 14, 28);
        }

        // Member info section
        let yPos = 45;
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Member Information', 14, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${statement.member.full_name}`, 20, yPos);
        yPos += 6;
        doc.text(`Phone: ${statement.member.phone}`, 20, yPos);
        if (statement.member.national_id) {
            yPos += 6;
            doc.text(`ID: ${statement.member.national_id}`, 20, yPos);
        }
        yPos += 6;
        doc.text(`Generated: ${new Date(statement.generated_at).toLocaleDateString()}`, 20, yPos);

        // Savings Summary
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Savings Summary', 14, yPos);

        // Summary boxes
        yPos += 5;
        const boxWidth = 45;
        const boxHeight = 25;
        const boxes = [
            { label: 'Current Balance', value: statement.savings.current_balance, color: [34, 197, 94] as [number, number, number] },
            { label: 'Total Contributions', value: statement.savings.total_contributions, color: [59, 130, 246] as [number, number, number] },
            { label: 'Loan Balance', value: statement.loans.active_loan_balance, color: [245, 158, 11] as [number, number, number] },
            { label: 'Arrears', value: statement.savings.arrears, color: [239, 68, 68] as [number, number, number] },
        ];

        boxes.forEach((box, i) => {
            const xPos = 14 + (i * (boxWidth + 3));
            doc.setFillColor(...(box.color));
            doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(box.label, xPos + 3, yPos + 8);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${statement.currency} ${box.value.toLocaleString()}`, xPos + 3, yPos + 18);
            doc.setFont('helvetica', 'normal');
        });

        doc.setTextColor(...textColor);

        // Loan Details (if any)
        if (statement.loans.has_active_loan) {
            yPos += boxHeight + 15;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Loan Details', 14, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Loans Taken: ${statement.currency} ${statement.loans.total_loans_taken.toLocaleString()}`, 20, yPos);
            yPos += 6;
            doc.text(`Total Repaid: ${statement.currency} ${statement.loans.total_loans_repaid.toLocaleString()}`, 20, yPos);
            yPos += 6;
            doc.text(`Outstanding: ${statement.currency} ${statement.loans.active_loan_balance.toLocaleString()}`, 20, yPos);
        }

        // Group Memberships
        if (statement.groups.length > 0) {
            yPos += 15;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Group Memberships', 14, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            statement.groups.forEach((group) => {
                doc.text(`• ${group.name} (${group.role})`, 20, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text(`  Expected: ${statement.currency} ${group.expected_amount.toLocaleString()} ${group.contribution_frequency}`, 25, yPos);
                doc.setFontSize(10);
                yPos += 7;
            });
        }

        // Recent Transactions
        if (statement.recent_transactions.length > 0) {
            yPos += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Recent Transactions', 14, yPos);

            yPos += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Date', 20, yPos);
            doc.text('Type', 60, yPos);
            doc.text('Amount', 110, yPos);
            doc.text('Status', 150, yPos);

            yPos += 6;
            doc.setFont('helvetica', 'normal');

            statement.recent_transactions.slice(0, 10).forEach((tx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(new Date(tx.date).toLocaleDateString(), 20, yPos);
                doc.text(tx.type, 60, yPos);
                doc.text(`${statement.currency} ${tx.amount.toLocaleString()}`, 110, yPos);
                doc.text(tx.status, 150, yPos);
                yPos += 6;
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
                14,
                285
            );
            doc.text('Thank you for being a valued member!', 14, 290);
        }

        return doc.output('blob');
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF statement');
    }
}

/**
 * Upload PDF to Supabase storage and get public URL
 */
export async function uploadStatementPDF(
    pdfBlob: Blob,
    memberId: string,
    supabase: ReturnType<typeof import('@/lib/supabase').supabase extends infer T ? () => T : never>
): Promise<{ url: string; path: string } | null> {
    try {
        const fileName = `statement-${memberId}-${Date.now()}.pdf`;
        const filePath = `statements/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('reports')
            .getPublicUrl(filePath);

        return {
            url: urlData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}
