import mongoose from 'mongoose';

const signatorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    role: { type: String, required: true }, // e.g. "SECRETARY", "EXECUTIVE DIRECTOR", "MANAGING DIRECTOR", "DIRECTOR"
    email: { type: String, default: '' },
    isSigned: { type: Boolean, default: false },
    signatureDataUrl: { type: String, default: null },
    signDate: { type: String, default: null },
    signTime: { type: String, default: null },
    signedAt: { type: Date, default: null },
  },
  { _id: true }
);

const meetingMinutesSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Board Meeting Minutes' },
    meetingDate: { type: String, default: 'November 7th, 2026' },
    meetingTime: { type: String, default: '9:00 AM Eastern Time' },
    location: { type: String, default: 'Online- Zoom' },
    callToOrder: { type: String, default: 'IIPC Canada 2026 3rd Quarter Meeting' },
    contentHtml: { type: String, default: '' },
    uploadedDocxName: { type: String, default: null },

    signatories: [signatorySchema],

    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_SIGNATURES', 'COMPLETED', 'DISPATCHED'],
      default: 'PENDING_SIGNATURES',
    },

    generatedDocxPath: { type: String, default: null },
    generatedPdfPath: { type: String, default: null },
    docxUrl: { type: String, default: null },
    pdfUrl: { type: String, default: null },

    emailDispatched: { type: Boolean, default: false },
    emailDispatchedAt: { type: Date, default: null },
    emailRecipients: {
      type: [String],
      default: ['info@iipccanada.com', 'accounts@iipccanada.com'],
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const MeetingMinutes = mongoose.model('MeetingMinutes', meetingMinutesSchema);
