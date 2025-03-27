const TEMPLATES: Record<string, string> = {
  invoice: `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .invoice-number { font-size: 16px; color: #666; }
    .customer-details { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .total-row { font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">Invoice #: {invoice_number}</div>
      <div>Due Date: {due_date}</div>
    </div>
  </div>
  
  <div class="customer-details">
    <div><strong>Bill To:</strong></div>
    <div>{customer_name}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{item_description}</td>
        <td>${"{amount}"}</td>
      </tr>
      <tr class="total-row">
        <td style="text-align: right;"><strong>Total:</strong></td>
        <td>${"{amount}"}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>
  `,

  receipt: `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .receipt { max-width: 400px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .date { font-size: 14px; color: #666; }
    .details { margin-bottom: 20px; }
    .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total { font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="title">RECEIPT</div>
      <div class="date">Date: {date}</div>
      <div>Receipt #: {receipt_number}</div>
    </div>
    
    <div class="details">
      <div><strong>Customer:</strong> {customer_name}</div>
    </div>
    
    <div class="items">
      <div class="item">
        <span>{item_name}</span>
        <span>${"{amount}"}</span>
      </div>
      <div class="item total">
        <span>Total:</span>
        <span>${"{amount}"}</span>
      </div>
    </div>
    
    <div class="footer">
      Thank you for your purchase!
    </div>
  </div>
</body>
</html>
  `,

  contract: `
<!DOCTYPE html>
<html>
<head>
  <title>Contract</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    .contract { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; margin-bottom: 10px; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; }
    .signature-name { margin-top: 10px; }
  </style>
</head>
<body>
  <div class="contract">
    <div class="header">
      <div class="title">CONTRACT AGREEMENT</div>
    </div>
    
    <div class="section">
      <div class="section-title">PARTIES</div>
      <p>This agreement is made between:</p>
      <p><strong>{party1_name}</strong> (hereinafter referred to as "Party 1")</p>
      <p>and</p>
      <p><strong>{party2_name}</strong> (hereinafter referred to as "Party 2")</p>
    </div>
    
    <div class="section">
      <div class="section-title">PURPOSE</div>
      <p>{contract_purpose}</p>
    </div>
    
    <div class="section">
      <div class="section-title">TERM</div>
      <p>This agreement shall commence on {start_date} and continue until {end_date}, unless terminated earlier in accordance with the terms of this agreement.</p>
    </div>
    
    <div class="signature">
      <div>
        <div class="signature-line"></div>
        <div class="signature-name">{party1_name}</div>
        <div>Date: _______________</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-name">{party2_name}</div>
        <div>Date: _______________</div>
      </div>
    </div>
  </div>
</body>
</html>
  `,
}

export function getDefaultTemplate(templateId: string): string | null {
  return TEMPLATES[templateId] || null
}

export const DEFAULT_CSV_TEMPLATES = {
  invoice: `invoice_number,customer_name,item_description,amount,due_date
INV-001,John Doe,Web Development Services,1500.00,2023-12-31
INV-002,Jane Smith,Graphic Design Project,750.00,2023-12-15
INV-003,Acme Corp,Software Maintenance,2000.00,2023-11-30`,

  receipt: `receipt_number,customer_name,item_name,amount,date
REC-001,John Doe,Monthly Subscription,29.99,2023-10-15
REC-002,Jane Smith,Premium Package,99.99,2023-10-16
REC-003,Acme Corp,Enterprise License,499.99,2023-10-17`,

  contract: `party1_name,party2_name,contract_purpose,start_date,end_date
ABC Company,XYZ Corporation,Software development services,2023-11-01,2024-10-31
Design Studio Inc,Marketing Agency LLC,Brand redesign project,2023-12-01,2024-03-31
Tech Solutions,Client Company,IT consulting services,2024-01-15,2024-07-15`,
}

export function getDefaultCSV(templateId: string): string | null {
  return DEFAULT_CSV_TEMPLATES[templateId] || null
}

