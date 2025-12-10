
import { MedusaService } from "@medusajs/framework/utils"
import { InvoiceConfig } from "./models/invoice-config";
import { Invoice, InvoiceStatus } from "./models/invoice";
import PdfPrinter from "pdfmake"
import { InferTypeOf, OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types"
import axios from "axios"

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
}

const printer = new PdfPrinter(fonts)

type GeneratePdfParams = {
  order: OrderDTO
  items: OrderLineItemDTO[]
}

class InvoiceGeneratorService extends MedusaService({
  InvoiceConfig,
  Invoice
}) {
  async generatePdf(params: GeneratePdfParams & {
    invoice_id: string
  }): Promise<Buffer> {
    const invoice = await this.retrieveInvoice(params.invoice_id)

    // Generate new content
    const pdfContent = Object.keys(invoice.pdfContent).length ? 
      invoice.pdfContent : 
      await this.createInvoiceContent(params, invoice)

    await this.updateInvoices({
      id: invoice.id,
      pdfContent
    })

    // get PDF as a Buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
  
      const pdfDoc = printer.createPdfKitDocument(pdfContent as any)
      
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      pdfDoc.on('error', err => reject(err));
  
      pdfDoc.end(); // Finalize PDF stream
    });
  }

  private async createInvoiceContent(
    params: GeneratePdfParams, 
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs()
    const config = invoiceConfigs[0] || {}

    // Route to appropriate template based on config
    if (config.template_type === 'indian_gst') {
      return this.createIndianGSTInvoiceContent(params, invoice, config)
    }

    return this.createDefaultInvoiceContent(params, invoice, config)
  }

  private async createDefaultInvoiceContent(
    params: GeneratePdfParams, 
    invoice: InferTypeOf<typeof Invoice>,
    config: any
  ): Promise<Record<string, any>> {

    // Create table for order items
    const itemsTable = [
      [
        { text: 'Item', style: 'tableHeader' },
        { text: 'Quantity', style: 'tableHeader' },
        { text: 'Unit Price', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' }
      ],
      ...(await Promise.all(params.items.map(async item => [
        { text: item.title || 'Unknown Item', style: 'tableRow' },
        { text: item.quantity.toString(), style: 'tableRow' },
        { text: await this.formatAmount(
          item.unit_price, 
          params.order.currency_code
        ), style: 'tableRow' },
        { text: await this.formatAmount(
          Number(item.total), 
          params.order.currency_code
        ), style: 'tableRow' }
      ])))
    ]

    const invoiceId = `INV-${invoice.display_id.toString().padStart(6, '0')}`
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString()

    // return the PDF content structure
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          /** Company Logo */
          {
            width: '*',
            stack: [
              ...(config.company_logo ? [
                {
                  image: await this.imageUrlToBase64(config.company_logo),
                  width: 80,
                  height: 40,
                  fit: [80, 40],
                  margin: [0, 0, 0, 10]
                }
              ] : []),
              {
                text: config.company_name || 'Your Company Name',
                style: 'companyName',
                margin: [0, 0, 0, 0]
              }
            ]
          },
          /** Invoice Title */
          {
            width: 'auto',
            stack: [
              {
                text: 'INVOICE',
                style: 'invoiceTitle',
                alignment: 'right',
                margin: [0, 0, 0, 0]
              }
            ]
          }
        ]
      },
      content: [
        {
          margin: [0, 20, 0, 0],
          columns: [
            /** Company Details */
            {
              width: '*',
              stack: [
                {
                  text: 'COMPANY DETAILS',
                  style: 'sectionHeader',
                  margin: [0, 0, 0, 8]
                },
                config.company_phone && {
                  text: config.company_phone,
                  style: 'companyContact',
                  margin: [0, 0, 0, 4]
                },
                config.company_email && {
                  text: config.company_email,
                  style: 'companyContact',
                  margin: [0, 0, 0, 0]
                }
              ]
            },
            /** Invoice Details */
            {
              width: 'auto',
              table: {
                widths: [80, 120],
                body: [
                  [
                    { text: 'Invoice ID:', style: 'label' },
                    { text: invoiceId, style: 'value' }
                  ],
                  [
                    { text: 'Invoice Date:', style: 'label' },
                    { text: invoiceDate, style: 'value' }
                  ],
                  [
                    { text: 'Order ID:', style: 'label' },
                    { 
                      text: params.order.display_id.toString().padStart(6, '0'), 
                      style: 'value'
                    }
                  ],
                  [
                    { text: 'Order Date:', style: 'label' },
                    { 
                      text: new Date(params.order.created_at).toLocaleDateString(), 
                      style: 'value'
                    }
                  ]
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 20]
            }
          ]
        },
        {
          text: '\n'
        },
        /** Billing and Shipping Addresses */
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: 'BILL TO',
                  style: 'sectionHeader',
                  margin: [0, 0, 0, 8]
                },
                {
                  text: params.order.billing_address ? 
                    `${params.order.billing_address.first_name || ''} ${params.order.billing_address.last_name || ''}
                    ${params.order.billing_address.address_1 || ''}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ''}
                    ${params.order.billing_address.city || ''}, ${params.order.billing_address.province || ''} ${params.order.billing_address.postal_code || ''}
                    ${params.order.billing_address.country_code || ''}${params.order.billing_address.phone ? `\n${params.order.billing_address.phone}` : ''}` : 
                    'No billing address provided',
                  style: 'addressText'
                }
              ]
            },
            {
              width: '*',
              stack: [
                {
                  text: 'SHIP TO',
                  style: 'sectionHeader',
                  margin: [0, 0, 0, 8]
                },
                {
                  text: params.order.shipping_address ? 
                    `${params.order.shipping_address.first_name || ''} ${params.order.shipping_address.last_name || ''}
                    ${params.order.shipping_address.address_1 || ''} ${params.order.shipping_address.address_2 ? `\n${params.order.shipping_address.address_2}` : ''}
                    ${params.order.shipping_address.city || ''}, ${params.order.shipping_address.province || ''} ${params.order.shipping_address.postal_code || ''}
                    ${params.order.shipping_address.country_code || ''}${params.order.shipping_address.phone ? `\n${params.order.shipping_address.phone}` : ''}` : 
                    'No shipping address provided',
                  style: 'addressText'
                }
              ]
            }
          ]
        },
        {
          text: '\n\n'
        },
        /** Items Table */
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: itemsTable
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#f8f9fa' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3;
            },
            vLineWidth: function (i: number, node: any) {
              return 0.3;
            },
            hLineColor: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? '#cbd5e0' : '#e2e8f0';
            },
            vLineColor: function () {
              return '#e2e8f0';
            },
            paddingLeft: function () {
              return 8;
            },
            paddingRight: function () {
              return 8;
            },
            paddingTop: function () {
              return 6;
            },
            paddingBottom: function () {
              return 6;
            }
          }
        },
        {
          text: '\n'
        },
        /** Totals Section */
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                widths: ['auto', 'auto'],
                body: [
                  [
                    { text: 'Subtotal:', style: 'totalLabel' },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.subtotal), 
                        params.order.currency_code), 
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Tax:', style: 'totalLabel' },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.tax_total), 
                        params.order.currency_code), 
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Shipping:', style: 'totalLabel' },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.shipping_methods?.[0]?.total || 0), 
                        params.order.currency_code), 
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Discount:', style: 'totalLabel' },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.discount_total), 
                        params.order.currency_code), 
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Total:', style: 'totalLabel' },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.total), 
                        params.order.currency_code), 
                      style: 'totalValue'
                    }
                  ]
                ]
              },
              layout: {
                fillColor: function (rowIndex: number) {
                  return (rowIndex === 3) ? '#f8f9fa' : null;
                },
                hLineWidth: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3;
                },
                vLineWidth: function () {
                  return 0.3;
                },
                hLineColor: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? '#cbd5e0' : '#e2e8f0';
                },
                vLineColor: function () {
                  return '#e2e8f0';
                },
                paddingLeft: function () {
                  return 8;
                },
                paddingRight: function () {
                  return 8;
                },
                paddingTop: function () {
                  return 6;
                },
                paddingBottom: function () {
                  return 6;
                }
              }
            }
          ]
        },
        {
          text: '\n\n'
        },
        /** Notes Section */
        ...(config.notes ? [
          {
            text: 'Notes',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            text: config.notes,
            style: 'notesText',
            margin: [0, 0, 0, 20]
          }
        ] : []),
        {
          text: 'Thank you for your business!',
          style: 'thankYouText',
          alignment: 'center',
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {
        companyName: {
          fontSize: 22,
          bold: true,
          color: '#1a365d',
          margin: [0, 0, 0, 5]
        },
        companyAddress: {
          fontSize: 11,
          color: '#4a5568',
          lineHeight: 1.3
        },
        companyContact: {
          fontSize: 10,
          color: '#4a5568'
        },
        invoiceTitle: {
          fontSize: 24,
          bold: true,
          color: '#2c3e50'
        },
        label: {
          fontSize: 10,
          color: '#6c757d',
          margin: [0, 0, 8, 0]
        },
        value: {
          fontSize: 10,
          bold: true,
          color: '#2c3e50'
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#2c3e50',
          backgroundColor: '#f8f9fa',
          padding: [8, 12]
        },
        addressText: {
          fontSize: 10,
          color: '#495057',
          lineHeight: 1.3
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#ffffff',
          fillColor: '#495057'
        },
        tableRow: {
          fontSize: 9,
          color: '#495057'
        },
        totalLabel: {
          fontSize: 10,
          bold: true,
          color: '#495057'
        },
        totalValue: {
          fontSize: 10,
          bold: true,
          color: '#2c3e50'
        },
        notesText: {
          fontSize: 10,
          color: '#6c757d',
          italics: true,
          lineHeight: 1.4
        },
        thankYouText: {
          fontSize: 12,
          color: '#28a745',
          italics: true
        }
      },
      defaultStyle: {
        font: 'Helvetica'
      }
    }
  }

  private async formatAmount(amount: number, currency: string): Promise<string> {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  private async imageUrlToBase64(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const base64 = Buffer.from(response.data).toString('base64')
    const mimeType = response.headers['content-type'] || 'image/png'
    return `data:${mimeType};base64,${base64}`
  }

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = convert(integerPart);
    if (decimalPart > 0) {
      result += ' and ' + convert(decimalPart) + ' Paise';
    }
    return result;
  }

  private async createIndianGSTInvoiceContent(
    params: GeneratePdfParams,
    invoice: InferTypeOf<typeof Invoice>,
    config: any
  ): Promise<Record<string, any>> {
    const invoiceId = `INV-${invoice.display_id.toString().padStart(6, '0')}`;
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-IN');

    // Calculate GST components based on state
    const subtotal = Number(params.order.subtotal);
    const taxTotal = Number(params.order.tax_total);
    
    // Get shipping total from shipping_methods or shipping_total
    const shippingTotal = params.order.shipping_total 
      ? Number(params.order.shipping_total)
      : params.order.shipping_methods?.[0]?.total 
        ? Number(params.order.shipping_methods[0].total)
        : 0;
    
    
    // Determine if transaction is intra-state or inter-state
    // Province field now contains state codes (like "27" for Maharashtra, "24" for Gujarat)
    const companyStateCode = config.state_code?.trim();
    const customerStateCode = params.order.billing_address?.province?.trim();
        
    // Check if state codes match exactly (both should be GST state codes like "27", "24", etc.)
    const isIntraState = !!(companyStateCode && customerStateCode && companyStateCode === customerStateCode);
  
    
    // Calculate GST based on transaction type
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isIntraState) {
      // Intra-state: Split tax between CGST and SGST
      cgst = taxTotal / 2; // CGST (half of total tax)
      sgst = taxTotal / 2; // SGST (half of total tax)
      igst = 0;
    } else {
      // Inter-state: All tax goes to IGST
      cgst = 0;
      sgst = 0;
      igst = taxTotal;
    }

    // Format amounts for Indian currency
    const formatINR = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    };

    // Create items table with HSN/SAC codes
    const itemsTable = [
      [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Item & Description', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader', alignment: 'center' },
        { text: 'Tax', style: 'tableHeader', alignment: 'center' },
        { text: 'Tax Amount', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
      ],
      ...params.items.map((item, index) => {
        const itemTotal = Number(item.total);
        const itemSubtotal = Number(item.subtotal);
        const taxAmount = itemTotal - itemSubtotal;
        const taxRate = itemSubtotal > 0 ? (taxAmount / itemSubtotal * 100).toFixed(0) : '0';

        return [
          { text: (index + 1).toString(), style: 'tableRow', alignment: 'center' },
          { text: item.title || 'Unknown Item', style: 'tableRow' },
          { text: item.quantity.toString(), style: 'tableRow', alignment: 'center' },
          { text: taxRate + '%', style: 'tableRow', alignment: 'center' },
          { text: taxAmount.toFixed(2), style: 'tableRow', alignment: 'right' },
          { text: itemTotal.toFixed(2), style: 'tableRow', alignment: 'right' }
        ];
      })
    ];

    const total = Number(params.order.total);
    const totalInWords = this.numberToWords(total);

    return {
      pageSize: 'A4',
      pageMargins: [15, 15, 15, 15],
      content: [
        // Header with logo and company info
        {
          table: {
            widths: ['25%', '50%', '25%'],
            body: [
              [
                {
                  stack: [
                    ...(config.company_logo ? [
                      {
                        image: await this.imageUrlToBase64(config.company_logo),
                        width: 60,
                        height: 60,
                        fit: [60, 60],
                        margin: [0, 5, 0, 0]
                      }
                    ] : [])
                  ],
                  border: [true, true, false, false]
                },
                {
                  stack: [
                    { text: config.company_name || 'Company Name', style: 'companyName', alignment: 'center' },
                    { text: config.state_name || 'State', style: 'companyState', alignment: 'center' },
                    { text: config.gstin ? `GSTIN: ${config.gstin}` : '', style: 'companyDetails', alignment: 'center' },
                    { text: config.company_email || '', style: 'companyDetails', alignment: 'center' }
                  ],
                  border: [false, true, false, false],
                  margin: [0, 5, 0, 0]
                },
                {
                  stack: [
                    { text: 'TAX INVOICE', style: 'invoiceTitle', alignment: 'right', margin: [0, 10, 5, 0] }
                  ],
                  border: [false, true, true, false]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },

        // Invoice and Order details
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  columns: [
                    { text: `Invoice No: ${invoiceId}`, style: 'label', width: '50%' },
                    { text: `Date: ${invoiceDate}`, style: 'label', width: '50%', alignment: 'right' }
                  ],
                  margin: [5, 5, 5, 5]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },

        // Billing address
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'Bill To', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { 
                      text: params.order.billing_address ? 
                        `${params.order.billing_address.first_name || ''} ${params.order.billing_address.last_name || ''}\n${params.order.billing_address.address_1 || ''}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ''}\n${params.order.billing_address.city || ''}, ${params.order.billing_address.province || ''} ${params.order.billing_address.postal_code || ''}\n${params.order.billing_address.country_code || ''}${params.order.billing_address.phone ? `\nPhone: ${params.order.billing_address.phone}` : ''}${params.order.billing_address.province ? `\nState: ${params.order.billing_address.province}` : ''}` : 
                        'No billing address',
                      style: 'addressText'
                    }
                  ],
                  margin: [5, 5, 5, 5]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },

        // Items table
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 60, 35, 60, 70],
            body: itemsTable
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        },

        // Total in words
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'Total in Words', style: 'label', margin: [0, 0, 0, 3] },
                    { text: `Indian Rupee ${totalInWords} Only`, style: 'totalWords', bold: true }
                  ],
                  margin: [5, 5, 5, 5]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },

        // GST and totals
        {
          table: {
            widths: ['*', 55, 70],
            body: [
              [
                { text: 'Sub Total', style: 'totalLabel', border: [true, true, false, false] },
                { text: '', style: 'totalLabel', border: [false, true, false, false] },
                { text: subtotal.toFixed(2), style: 'totalValue', alignment: 'right', border: [false, true, true, false] }
              ],
              [
                { text: 'Shipping', style: 'totalLabel', border: [true, false, false, false] },
                { text: '', style: 'totalLabel', border: [false, false, false, false] },
                { text: shippingTotal.toFixed(2), style: 'totalValue', alignment: 'right', border: [false, false, true, false] }
              ],
              [
                { text: 'IGST@18%', style: 'totalLabel', border: [true, false, false, false] },
                { text: '%', style: 'totalLabel', alignment: 'center', border: [false, false, false, false] },
                { text: igst.toFixed(2), style: 'totalValue', alignment: 'right', border: [false, false, true, false] }
              ],
              [
                { text: 'CGST@9%', style: 'totalLabel', border: [true, false, false, false] },
                { text: '18%', style: 'totalLabel', alignment: 'center', border: [false, false, false, false] },
                { text: cgst.toFixed(2), style: 'totalValue', alignment: 'right', border: [false, false, true, false] }
              ],
              [
                { text: 'SGST@9%', style: 'totalLabel', border: [true, false, false, false] },
                { text: '18%', style: 'totalLabel', alignment: 'center', border: [false, false, false, false] },
                { text: sgst.toFixed(2), style: 'totalValue', alignment: 'right', border: [false, false, true, false] }
              ],
              [
                { text: 'Total', style: 'totalLabel', bold: true, fontSize: 10, border: [true, true, false, true] },
                { text: '', border: [false, true, false, true] },
                { text: total.toFixed(2), style: 'totalValue', bold: true, fontSize: 10, alignment: 'right', border: [false, true, true, true] }
              ]
            ]
          },
          layout: {
            hLineWidth: (i, node) => {
              if (i === 0 || i === 2 || i === node.table.body.length - 1 || i === node.table.body.length) {
                return 1;
              }
              return 0;
            },
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        },

        // Notes and Payment info
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    ...(config.notes ? [
                      { text: 'Notes', style: 'label', margin: [0, 0, 0, 5] },
                      { text: config.notes, style: 'notesText', margin: [0, 0, 0, 5] }
                    ] : []),
                    { text: 'Thanks for your business.', style: 'thanksText' }
                  ],
                  margin: [5, 5, 5, 5]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },

        // Terms and signature
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    { text: 'Terms & Conditions', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: 'Refunds/replacements are possible only for defective items with an\nunboxing video\nas proof.', style: 'termsText', fontSize: 7 }
                  ],
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5]
                },
                {
                  stack: [
                    { text: '', margin: [0, 0, 0, 20] },
                    { text: config.authorized_signatory || 'Authorized Signatory', style: 'signatureText', alignment: 'right', margin: [0, 0, 0, 5] },
                    { text: 'Authorized Signature', style: 'signatureLabel', alignment: 'right', fontSize: 7, color: '#666666' }
                  ],
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        }
      ],
      styles: {
        companyName: {
          fontSize: 16,
          bold: true,
          color: '#000000'
        },
        companyState: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 2, 0, 2]
        },
        companyDetails: {
          fontSize: 8,
          color: '#000000',
          margin: [0, 1, 0, 1]
        },
        invoiceTitle: {
          fontSize: 18,
          bold: true,
          color: '#000000'
        },
        label: {
          fontSize: 9,
          color: '#000000'
        },
        sectionHeader: {
          fontSize: 9,
          bold: true,
          color: '#000000'
        },
        addressText: {
          fontSize: 8,
          color: '#000000',
          lineHeight: 1.2
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#000000',
          fillColor: '#ffffff'
        },
        tableRow: {
          fontSize: 8,
          color: '#000000'
        },
        totalLabel: {
          fontSize: 9,
          color: '#000000'
        },
        totalValue: {
          fontSize: 9,
          color: '#000000'
        },
        totalWords: {
          fontSize: 9,
          color: '#000000'
        },
        taxLabel: {
          fontSize: 7,
          color: '#666666',
          italics: true
        },
        notesText: {
          fontSize: 8,
          color: '#000000'
        },
        thanksText: {
          fontSize: 8,
          color: '#000000'
        },
        termsText: {
          fontSize: 7,
          color: '#000000',
          lineHeight: 1.3
        },
        signatureText: {
          fontSize: 9,
          color: '#000000'
        }
      },
      defaultStyle: {
        font: 'Helvetica',
        lineHeight: 1.1
      }
    };
  }
}

export default InvoiceGeneratorService
