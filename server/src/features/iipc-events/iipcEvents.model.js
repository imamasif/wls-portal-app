import mongoose from "mongoose";

// Schema for Project / Event
const IipcEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "CAD",
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    comments: {
      type: String,
      default: "",
      trim: true,
    },
    pictures: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Schema for Pledge / Donation
const IipcDonationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IipcEvent",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    donorName: {
      type: String,
      default: "",
      trim: true,
    },
    donorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    pledgeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "CAD",
      trim: true,
      uppercase: true,
    },
    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivedCurrency: {
      type: String,
      default: "CAD",
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "PLEDGED",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "OVERPAID",
        "CANCELLED",
      ],
      default: "PLEDGED",
      index: true,
    },
    pledgeDate: {
      type: Date,
      default: Date.now,
    },
    receivedDate: {
      type: Date,
      default: null,
    },
    paymentProofUrl: {
      type: String,
      default: "",
    },
    comments: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "OTHER", // WHATSAPP, E_TRANSFER, CASH, BANK_TRANSFER, ONLINE, OTHER
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

IipcDonationSchema.index({ eventId: 1, userId: 1 });

export const IipcEventModel =
  mongoose.models.IipcEvent || mongoose.model("IipcEvent", IipcEventSchema);

export const IipcDonationModel =
  mongoose.models.IipcDonation ||
  mongoose.model("IipcDonation", IipcDonationSchema);

// Schema for Donation Banking & Payment Channels
const IipcPaymentChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    channelType: {
      type: String,
      enum: [
        "BANK_TRANSFER",
        "E_TRANSFER",
        "PAYPAL",
        "CANADA_HELPS",
        "WEBSITE",
        "OTHER",
      ],
      default: "BANK_TRANSFER",
      index: true,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    accountName: {
      type: String,
      default: "",
      trim: true,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    swiftCode: {
      type: String,
      default: "",
      trim: true,
    },
    iban: {
      type: String,
      default: "",
      trim: true,
    },
    transitNumber: {
      type: String,
      default: "",
      trim: true,
    },
    institutionNumber: {
      type: String,
      default: "",
      trim: true,
    },
    branchNumber: {
      type: String,
      default: "",
      trim: true,
    },
    abaRouting: {
      type: String,
      default: "",
      trim: true,
    },
    branchAddress: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    currencies: {
      type: [String],
      default: ["CAD", "USD"],
    },
    craNumber: {
      type: String,
      default: "80654 8632 RR0001",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const IipcPaymentChannelModel =
  mongoose.models.IipcPaymentChannel ||
  mongoose.model("IipcPaymentChannel", IipcPaymentChannelSchema);
