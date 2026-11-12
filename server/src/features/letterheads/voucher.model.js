import mongoose from 'mongoose';

const voucherItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    taxable: { type: Boolean, default: true },
    receiptNumber: { type: Number, default: 1 },
    receiptTitle: { type: String, default: '' },
  },
  { _id: true }
);

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['PAYMENT_VOUCHER', 'PETTY_CASH', 'INVOICE'],
      default: 'PAYMENT_VOUCHER',
    },
    issueDate: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    title: { type: String, default: '' },
    letterheadType: {
      type: String,
      enum: ['iipc', 'bp', 'custom', 'none'],
      default: 'iipc',
    },
    customLogoUrl: { type: String, default: null },

    // Payee (Party paying to)
    payee: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      emtEmail: { type: String, default: '' }, // Interac E-transfer email
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      taxRegistrationNumber: { type: String, default: '' }, // GST/HST number
    },

    // Payer (Bill to)
    payer: {
      name: { type: String, default: 'Alam Mohammed' },
      address: { type: String, default: '132 main st south, Rockwood ON n0b 2k0' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    items: [voucherItemSchema],

    subtotal: { type: Number, default: 0 },

    taxConfig: {
      applyTax: { type: Boolean, default: true },
      taxType: { type: String, default: 'HST' },
      rate: { type: Number, default: 13 },
      taxAmount: { type: Number, default: 0 },
    },

    totalAmount: { type: Number, default: 0 },
    termsNotes: { type: String, default: '' },

    // Signatures / Approvals Configuration (Prepared by, Checked by, Approved By)
    signaturesConfig: {
      enabled: { type: Boolean, default: false },
      preparedBy: {
        title: { type: String, default: 'Prepared by' },
        name: { type: String, default: '' },
        date: { type: String, default: '' },
        signatureDataUrl: { type: String, default: null },
      },
      checkedBy: {
        title: { type: String, default: 'Checked by' },
        name: { type: String, default: '' },
        date: { type: String, default: '' },
        signatureDataUrl: { type: String, default: null },
      },
      approvedBy: {
        title: { type: String, default: 'Approved By' },
        name: { type: String, default: '' },
        date: { type: String, default: '' },
        signatureDataUrl: { type: String, default: null },
      },
    },

    // Attached receipt image (data URL or uploaded path)
    receiptImageUrl: { type: String, default: null },
    receiptFileName: { type: String, default: null },
    receiptImageUrls: [{ type: String }],
    receipts: [
      {
        receiptNumber: { type: Number, default: 1 },
        title: { type: String, default: '' },
        vendor: { type: String, default: '' },
        url: { type: String, default: '' },
        subtotal: { type: Number, default: 0 },
      },
    ],

    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'PAID', 'CANCELLED'],
      default: 'GENERATED',
    },

    pdfUrl: { type: String, default: null },
    pdfLocalPath: { type: String, default: null },
    docxUrl: { type: String, default: null },
    docxLocalPath: { type: String, default: null },

    googleDriveFolderId: { type: String, default: null },
    googleDriveFileId: { type: String, default: null },
    googleDriveLink: { type: String, default: null },
    googleDriveUploadedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

export const VoucherModel = mongoose.model('Voucher', voucherSchema);
export const Voucher = VoucherModel;
export default VoucherModel;
