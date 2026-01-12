/**
 * Receipt Generator
 * Generates printable transaction receipts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ReceiptData {
    transactionId: string;
    date: string;
    time: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'CONTRIBUTION' | 'LOAN_REPAYMENT';
    amount: number;
    currency: string;
    memberName: string;
    memberPhone: string;
    reference?: string;
    momoRef?: string;
    channel: string;
    groupName?: string;
    institutionName: string;
    staffName?: string;
    notes?: string;
}

// ============================================================================
// RECEIPT TEMPLATE
// ============================================================================

function generateReceiptHtml(data: ReceiptData): string {
    const typeLabels: Record<string, string> = {
        DEPOSIT: 'Deposit',
        WITHDRAWAL: 'Withdrawal',
        TRANSFER: 'Transfer',
        CONTRIBUTION: 'Group Contribution',
        LOAN_REPAYMENT: 'Loan Repayment',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${data.transactionId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      padding: 20px;
      max-width: 300px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 1px dashed #000;
      padding-bottom: 12px;
    }
    .logo { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .institution { font-size: 10px; color: #666; }
    .title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin: 12px 0;
      text-transform: uppercase;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
    }
    .label { color: #666; }
    .value { font-weight: 500; text-align: right; }
    .amount-row {
      margin: 16px 0;
      padding: 8px;
      background: #f5f5f5;
      text-align: center;
    }
    .amount {
      font-size: 20px;
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 12px 0;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 16px;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      border: 1px solid #ccc;
      margin: 12px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #999;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SACCO+</div>
    <div class="institution">${escapeHtml(data.institutionName)}</div>
  </div>

  <div class="title">${typeLabels[data.type] || data.type} Receipt</div>

  <div class="row">
    <span class="label">Date:</span>
    <span class="value">${escapeHtml(data.date)}</span>
  </div>
  <div class="row">
    <span class="label">Time:</span>
    <span class="value">${escapeHtml(data.time)}</span>
  </div>
  <div class="row">
    <span class="label">Receipt #:</span>
    <span class="value">${escapeHtml(data.transactionId.slice(0, 8).toUpperCase())}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="label">Member:</span>
    <span class="value">${escapeHtml(data.memberName)}</span>
  </div>
  <div class="row">
    <span class="label">Phone:</span>
    <span class="value">${escapeHtml(data.memberPhone)}</span>
  </div>
  ${data.groupName ? `
  <div class="row">
    <span class="label">Group:</span>
    <span class="value">${escapeHtml(data.groupName)}</span>
  </div>
  ` : ''}

  <div class="divider"></div>

  <div class="row">
    <span class="label">Channel:</span>
    <span class="value">${escapeHtml(data.channel)}</span>
  </div>
  ${data.momoRef ? `
  <div class="row">
    <span class="label">MoMo Ref:</span>
    <span class="value">${escapeHtml(data.momoRef)}</span>
  </div>
  ` : ''}
  ${data.reference ? `
  <div class="row">
    <span class="label">Reference:</span>
    <span class="value">${escapeHtml(data.reference)}</span>
  </div>
  ` : ''}

  <div class="amount-row">
    <div style="color: #666; font-size: 10px; margin-bottom: 4px;">Amount</div>
    <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
  </div>

  ${data.notes ? `
  <div class="row">
    <span class="label">Notes:</span>
    <span class="value">${escapeHtml(data.notes)}</span>
  </div>
  ` : ''}

  ${data.staffName ? `
  <div class="divider"></div>
  <div class="row">
    <span class="label">Processed by:</span>
    <span class="value">${escapeHtml(data.staffName)}</span>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your transaction!</p>
    <p style="margin-top: 8px;">This receipt was generated automatically.</p>
    <p style="margin-top: 4px;">Keep for your records.</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 8px 16px; cursor: pointer;">
      Print Receipt
    </button>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate and print a transaction receipt
 */
export function printReceipt(data: ReceiptData): void {
    const html = generateReceiptHtml(data);

    // Open print window
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
        console.error('Failed to open print window');
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Trigger print after content loads
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };
}

/**
 * Generate receipt HTML for preview
 */
export function generateReceiptPreview(data: ReceiptData): string {
    return generateReceiptHtml(data);
}

/**
 * Convert transaction data to receipt format
 */
export function transactionToReceiptData(
    transaction: {
        id: string;
        created_at: string;
        occurred_at?: string;
        type?: string;
        transaction_type?: string;
        amount: number;
        currency: string;
        channel: string;
        momo_ref?: string | null;
        reference?: string | null;
        member_name?: string | null;
        payer_name?: string | null;
        member_phone?: string | null;
        group_name?: string | null;
        staff_name?: string | null;
        notes?: string | null;
    },
    institutionName: string
): ReceiptData {
    const date = new Date(transaction.occurred_at || transaction.created_at);

    return {
        transactionId: transaction.id,
        date: date.toLocaleDateString('en-GB'),
        time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        type: (transaction.transaction_type || transaction.type || 'DEPOSIT') as ReceiptData['type'],
        amount: transaction.amount,
        currency: transaction.currency,
        memberName: transaction.member_name || transaction.payer_name || 'Unknown',
        memberPhone: transaction.member_phone || 'N/A',
        reference: transaction.reference || undefined,
        momoRef: transaction.momo_ref || undefined,
        channel: transaction.channel,
        groupName: transaction.group_name || undefined,
        institutionName,
        staffName: transaction.staff_name || undefined,
        notes: transaction.notes || undefined,
    };
}

export default {
    printReceipt,
    generateReceiptPreview,
    transactionToReceiptData,
};
