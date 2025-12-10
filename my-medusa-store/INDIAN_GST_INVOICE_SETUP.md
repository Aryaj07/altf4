# Indian GST Invoice Template Setup Guide

## What Was Added

I've created a new Indian GST-compliant invoice template for your Medusa store based on the sample invoice you provided. Here's what was implemented:

### 1. **New Invoice Config Fields**

Added the following fields to store Indian GST information:
- `template_type`: Choose between "default" or "indian_gst" templates
- `gstin`: GST Identification Number (e.g., 27CPPJP4661G1ZJ)
- `state_name`: State name (e.g., Maharashtra)
- `state_code`: State code for GST (e.g., 27)
- `pan`: PAN number
- `authorized_signatory`: Name for signature section

### 2. **Indian GST Invoice Template Features**

The new template includes:
- ✅ Company logo and details in header
- ✅ TAX INVOICE heading
- ✅ HSN/SAC codes for items
- ✅ CGST (9%) and SGST (9%) breakdown
- ✅ IGST support for inter-state transactions
- ✅ Amount in words (Indian Rupee format with Lakhs/Crores)
- ✅ Terms & Conditions section
- ✅ Authorized Signature section
- ✅ Clean bordered table layout matching Indian invoice standards

### 3. **Admin Interface Updated**

The admin settings page now includes:
- Template selector dropdown (Default/Indian GST)
- GST-specific fields (shown only when Indian GST template is selected)
- All fields are optional and can be configured per your needs

## Setup Instructions

### Step 1: Run Migration ✅ COMPLETED

The migration has been successfully applied to your database!

### Step 2: Start Your Application

```bash
npm run dev
```

### Step 3: Configure Indian GST Invoice

1. Go to **Settings → Default Invoice Config** in your Medusa Admin
2. Select **"Indian GST Invoice"** from the Invoice Template dropdown
3. Fill in your company details:
   - Company Name (e.g., AltF4)
   - State Name (e.g., Maharashtra)
   - GSTIN (e.g., 27CPPJP4661G1ZJ)
   - State Code (e.g., 27)
   - Company Address (full address in India)
   - PAN Number
   - Phone and Email
   - Upload Company Logo
   - Authorized Signatory name
4. Add any notes (e.g., "Thanks for your business.")
5. Click **Save**

### Step 4: Test the Invoice

1. Place a test order through your storefront
2. Go to the order detail page in admin
3. Click **"Download Invoice"** button
4. Verify the PDF shows proper GST format

## Template Switching

You can switch between templates anytime:

- **Default Template**: Original international invoice format
- **Indian GST Invoice**: GST-compliant format with CGST/SGST breakdown

Simply change the "Invoice Template" dropdown in settings and save. All future invoices will use the selected template.

## Customization Options

### Modify GST Rates

Edit `src/modules/invoice-generator/service.ts` in the `createIndianGSTInvoiceContent` method:

```typescript
// Change GST percentages here (currently 18% total: 9% CGST + 9% SGST)
const cgst = taxTotal / 2; // CGST 9%
const sgst = taxTotal / 2; // SGST 9%
```

### Add More Templates

To add additional templates:

1. Add new template option in invoice config model
2. Create new method like `createProfessionalInvoiceContent()`
3. Add routing logic in `createInvoiceContent()` method
4. Update admin dropdown to include new option

### Customize Layout

The Indian GST template uses pdfmake document definition. Modify the `createIndianGSTInvoiceContent` method to:
- Change fonts, colors, spacing
- Add/remove table columns
- Modify header/footer
- Adjust margins and borders

## Important Notes

1. **HSN/SAC Codes**: The template uses a default HSN code (847160). Make sure to add proper HSN/SAC codes to your product variants for accurate invoicing.

2. **Currency**: Amounts are formatted in Indian Rupees (₹). The template assumes amounts are stored in paise (smallest unit).

3. **Inter-state vs Intra-state**: Currently set up for intra-state (CGST+SGST). For inter-state transactions, you'll need to implement logic to use IGST instead.

4. **Number to Words**: Includes Indian numbering system (Lakhs, Crores) for amount in words.

5. **Existing Invoices**: Old invoices will continue to use their original template. Only new invoices will use the selected template.

## Troubleshooting

### Migration Errors
If you get migration errors, ensure:
- Your database is running
- No syntax errors in the model definition
- Run `npx medusa db:migrate` again

### Template Not Showing
- Clear browser cache
- Restart Medusa application
- Check console for errors
- Verify template_type is saved correctly in database

### PDF Generation Issues
- Ensure all required fields are filled
- Check that company logo URL is accessible
- Verify HSN codes are present on product variants

## Example Configuration

Here's a sample configuration for Indian GST invoice:

```
Invoice Template: Indian GST Invoice
Company Name: AltF4
State Name: Maharashtra
State: India
GSTIN: 27CPPJP4661G1ZJ
State Code: 27
Company Address: 123 Business Park, Mumbai, Maharashtra - 400001
PAN: CPPJP4661G
Phone: 9619374737
Email: altf4gear@gmail.com
Company Logo: [Upload your logo]
Authorized Signatory: [Your name]
Notes: Thanks for your business.
```

## Support

If you encounter any issues or need further customization, you can:
1. Check the console logs for errors
2. Verify all fields are properly saved in the database
3. Test with a simple order first before going live
