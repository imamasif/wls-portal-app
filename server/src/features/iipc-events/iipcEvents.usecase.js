import mongoose from "mongoose";
import {
  IipcEventModel,
  IipcDonationModel,
  IipcPaymentChannelModel,
} from "./iipcEvents.model.js";
import { UserModel } from "../users/user.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { IipcEventsMapper } from "./iipcEvents.mapper.js";

export class IipcEventsUseCase {
  /**
   * Calculate aggregated metrics for an event
   */
  static async calculateEventSummary(eventId, targetAmount = 0, currency = "CAD") {
    const eventObjId = new mongoose.Types.ObjectId(eventId);

    const aggregateResult = await IipcDonationModel.aggregate([
      { $match: { eventId: eventObjId, status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: null,
          totalPledged: { $sum: "$pledgeAmount" },
          totalReceived: { $sum: "$receivedAmount" },
          totalDonorsCount: { $sum: 1 },
          receivedDonorsCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "RECEIVED"] },
                    { $eq: ["$status", "OVERPAID"] },
                    { $gte: ["$receivedAmount", "$pledgeAmount"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = aggregateResult[0] || {
      totalPledged: 0,
      totalReceived: 0,
      totalDonorsCount: 0,
      receivedDonorsCount: 0,
    };

    const targetExpected = Number(targetAmount) || 0;
    const totalPledged = stats.totalPledged || 0;
    const totalReceived = stats.totalReceived || 0;
    const remainingAmount = Math.max(0, targetExpected - totalReceived);
    const surplusAmount = Math.max(0, totalReceived - targetExpected);
    const isTargetMet = targetExpected > 0 && totalReceived >= targetExpected;

    const percentagePledged =
      targetExpected > 0 ? Math.round((totalPledged / targetExpected) * 100) : 0;
    const percentageReceived =
      targetExpected > 0 ? Math.round((totalReceived / targetExpected) * 100) : 0;

    return {
      targetExpected,
      totalPledged,
      totalReceived,
      remainingAmount,
      surplusAmount,
      isTargetMet,
      percentagePledged,
      percentageReceived,
      totalDonorsCount: stats.totalDonorsCount,
      receivedDonorsCount: stats.receivedDonorsCount,
      pendingDonorsCount: stats.totalDonorsCount - stats.receivedDonorsCount,
      currency,
    };
  }

  /**
   * Get all projects/events with aggregate stats
   */
  static async getAllEvents(filters = {}) {
    const query = {};
    if (filters.status && filters.status !== "ALL") {
      query.status = filters.status;
    }

    const events = await IipcEventModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const results = await Promise.all(
      events.map(async (event) => {
        const summary = await this.calculateEventSummary(
          event._id,
          event.targetAmount,
          event.currency
        );
        return { event, summary };
      })
    );

    return IipcEventsMapper.toEventResDTOList(results);
  }

  /**
   * Get a single project/event by ID with full metrics
   */
  static async getEventById(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid Event ID format.");
    }
    const event = await IipcEventModel.findById(eventId).lean();
    if (!event) throw new Error("Project / Event not found.");

    const summary = await this.calculateEventSummary(
      event._id,
      event.targetAmount,
      event.currency
    );

    return IipcEventsMapper.toEventResDTO(event, summary);
  }

  /**
   * Create a new project/event and broadcast user notification
   */
  static async createEvent(dto, adminUserId) {
    const eventDoc = new IipcEventModel({
      title: dto.title,
      targetAmount: dto.targetAmount,
      currency: dto.currency || "CAD",
      startDate: dto.startDate,
      endDate: dto.endDate,
      description: dto.description,
      comments: dto.comments || "",
      pictures: dto.pictures || [],
      status: dto.status || "ACTIVE",
      createdBy: adminUserId || null,
    });

    const savedEvent = await eventDoc.save();

    // Broadcast notification to all users about new project donation appeal
    try {
      const allUsers = await UserModel.find({}, "_id name email").lean();
      if (allUsers && allUsers.length > 0) {
        const formattedAmount = `${savedEvent.currency} ${savedEvent.targetAmount.toLocaleString()}`;
        const notifications = allUsers.map((u) => ({
          recipient: u._id,
          sender: adminUserId || null,
          title: `📢 New Donation Appeal: ${savedEvent.title}`,
          message: `A new project "${savedEvent.title}" has launched targeting ${formattedAmount}. Please visit IIPC Events to make your pledge and support the cause.`,
          type: "ALERT",
          priority: "HIGH",
          actionUrl: "iipc-events",
          metadata: {
            eventId: savedEvent._id.toString(),
            projectTitle: savedEvent.title,
            targetAmount: savedEvent.targetAmount,
            currency: savedEvent.currency,
          },
        }));

        await NotificationModel.insertMany(notifications, { ordered: false });
      }
    } catch (notifErr) {
      console.warn("Failed to broadcast project creation notifications:", notifErr.message);
    }

    const summary = await this.calculateEventSummary(
      savedEvent._id,
      savedEvent.targetAmount,
      savedEvent.currency
    );

    return IipcEventsMapper.toEventResDTO(savedEvent, summary);
  }

  /**
   * Update an existing project/event
   */
  static async updateEvent(eventId, dto) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid Event ID format.");
    }

    const updateFields = {};
    if (dto.title !== undefined) updateFields.title = dto.title;
    if (dto.targetAmount !== undefined) updateFields.targetAmount = dto.targetAmount;
    if (dto.currency !== undefined) updateFields.currency = dto.currency;
    if (dto.startDate !== undefined) updateFields.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateFields.endDate = dto.endDate;
    if (dto.description !== undefined) updateFields.description = dto.description;
    if (dto.comments !== undefined) updateFields.comments = dto.comments;
    if (dto.pictures !== undefined) updateFields.pictures = dto.pictures;
    if (dto.status !== undefined) updateFields.status = dto.status;

    const updatedEvent = await IipcEventModel.findByIdAndUpdate(
      eventId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedEvent) throw new Error("Project / Event not found.");

    const summary = await this.calculateEventSummary(
      updatedEvent._id,
      updatedEvent.targetAmount,
      updatedEvent.currency
    );

    return IipcEventsMapper.toEventResDTO(updatedEvent, summary);
  }

  /**
   * Delete an event and all associated pledges
   */
  static async deleteEvent(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid Event ID format.");
    }
    await IipcDonationModel.deleteMany({ eventId });
    const deleted = await IipcEventModel.findByIdAndDelete(eventId);
    if (!deleted) throw new Error("Project / Event not found.");
    return { success: true, message: "Project and associated pledges removed." };
  }

  /**
   * Fetch donations for an event, sorted alphabetically by donor name with sequence # 1, 2, 3...
   */
  static async getDonationsByEvent(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid Event ID format.");
    }

    const donations = await IipcDonationModel.find({ eventId })
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    // Sort alphabetically by donor name
    donations.sort((a, b) => {
      const nameA = (a.userId?.name || a.donorName || "").toLowerCase();
      const nameB = (b.userId?.name || b.donorName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return IipcEventsMapper.toDonationResDTOList(donations);
  }

  /**
   * Fetch donations made by or associated with a specific user
   */
  static async getDonationsByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid User ID format.");
    }

    const donations = await IipcDonationModel.find({ userId })
      .populate("eventId", "title targetAmount currency startDate endDate description pictures status")
      .sort({ createdAt: -1 })
      .lean();

    return IipcEventsMapper.toDonationResDTOList(donations);
  }

  /**
   * Create a donation / pledge (by Super User on behalf or by user self)
   */
  static async createDonation(dto, currentUserId) {
    if (!mongoose.Types.ObjectId.isValid(dto.eventId)) {
      throw new Error("Invalid Event ID format.");
    }

    const event = await IipcEventModel.findById(dto.eventId);
    if (!event) throw new Error("Selected project / event does not exist.");

    let donorName = dto.donorName;
    let donorEmail = dto.donorEmail;

    // Handle new donor creation or auto-linking in User Administration
    if (dto.isNewUser || (!dto.userId && donorEmail)) {
      const cleanEmail = (donorEmail || "").toLowerCase().trim();
      if (!cleanEmail) {
        throw new Error("Donor email is required to add them to the system.");
      }

      let user = await UserModel.findOne({ email: cleanEmail });
      if (!user) {
        const fullName =
          dto.donorName ||
          `${dto.firstName || ""} ${dto.lastName || ""}`.trim() ||
          cleanEmail.split("@")[0] ||
          "New Donor";

        user = await UserModel.create({
          name: fullName,
          email: cleanEmail,
          password: "DefaultPledge123!",
          role: "USER",
          phone: dto.phone || "",
          phones: dto.phone
            ? [{ number: dto.phone, type: "Mobile", isPrimary: true }]
            : [],
          city: "Toronto",
          country: "Canada",
          isActive: true,
          createdBy: currentUserId ? `Admin (${currentUserId})` : "SuperUser Pledge Entry",
          auditTrail: [
            {
              action: "USER_CREATED_VIA_PLEDGE",
              performedBy: currentUserId || "SuperUser",
              performedAt: new Date(),
              details: `Auto-created user while recording pledge for project: ${event.title}`,
            },
          ],
        });
      } else if (dto.phone && !user.phone) {
        user.phone = dto.phone;
        await user.save();
      }

      dto.userId = user._id;
      donorName = user.name;
      donorEmail = user.email;
    } else if (dto.userId && mongoose.Types.ObjectId.isValid(dto.userId)) {
      const user = await UserModel.findById(dto.userId).lean();
      if (user) {
        donorName = user.name || donorName;
        donorEmail = user.email || donorEmail;
      }
    } else if (currentUserId && !dto.userId) {
      dto.userId = currentUserId;
      const user = await UserModel.findById(currentUserId).lean();
      if (user) {
        donorName = user.name || donorName;
        donorEmail = user.email || donorEmail;
      }
    }

    const pledgeAmount = Number(dto.pledgeAmount) || 0;
    const receivedAmount = Number(dto.receivedAmount) || 0;

    let calculatedStatus = "PLEDGED";
    if (receivedAmount > pledgeAmount && pledgeAmount > 0) {
      calculatedStatus = "OVERPAID";
    } else if (receivedAmount >= pledgeAmount && pledgeAmount > 0) {
      calculatedStatus = "RECEIVED";
    } else if (receivedAmount > 0) {
      calculatedStatus = "PARTIALLY_RECEIVED";
    }

    const donationDoc = new IipcDonationModel({
      eventId: dto.eventId,
      userId: dto.userId,
      donorName: donorName || "Unknown Donor",
      donorEmail: donorEmail || "",
      pledgeAmount,
      currency: dto.currency || event.currency || "CAD",
      receivedAmount,
      receivedCurrency: dto.receivedCurrency || dto.currency || event.currency || "CAD",
      status: dto.status || calculatedStatus,
      comments: dto.comments || "",
      paymentMethod: dto.paymentMethod || "OTHER",
      paymentProofUrl: dto.paymentProofUrl || "",
      receivedDate: receivedAmount > 0 ? new Date() : null,
      addedBy: currentUserId || null,
    });

    const savedDonation = await donationDoc.save();
    const populated = await IipcDonationModel.findById(savedDonation._id)
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    return IipcEventsMapper.toDonationResDTO(populated);
  }

  /**
   * Update donation/pledge details
   */
  static async updateDonation(donationId, dto) {
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      throw new Error("Invalid Donation ID format.");
    }

    const existing = await IipcDonationModel.findById(donationId);
    if (!existing) throw new Error("Donation / pledge record not found.");

    if (dto.pledgeAmount !== undefined) existing.pledgeAmount = dto.pledgeAmount;
    if (dto.currency !== undefined) existing.currency = dto.currency;
    if (dto.receivedAmount !== undefined) existing.receivedAmount = dto.receivedAmount;
    if (dto.receivedCurrency !== undefined) existing.receivedCurrency = dto.receivedCurrency;
    if (dto.comments !== undefined) existing.comments = dto.comments;
    if (dto.paymentMethod !== undefined) existing.paymentMethod = dto.paymentMethod;
    if (dto.paymentProofUrl !== undefined) existing.paymentProofUrl = dto.paymentProofUrl;
    if (dto.receivedDate !== undefined) existing.receivedDate = dto.receivedDate;

    // Recalculate status if not explicitly provided
    if (dto.status) {
      existing.status = dto.status;
    } else {
      if (existing.receivedAmount > existing.pledgeAmount && existing.pledgeAmount > 0) {
        existing.status = "OVERPAID";
      } else if (existing.receivedAmount >= existing.pledgeAmount && existing.pledgeAmount > 0) {
        existing.status = "RECEIVED";
      } else if (existing.receivedAmount > 0) {
        existing.status = "PARTIALLY_RECEIVED";
      } else {
        existing.status = "PLEDGED";
      }
    }

    await existing.save();

    const populated = await IipcDonationModel.findById(donationId)
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    return IipcEventsMapper.toDonationResDTO(populated);
  }

  /**
   * Super User marks payment received
   */
  static async markPayment(donationId, dto, currentUserId) {
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      throw new Error("Invalid Donation ID format.");
    }

    const donation = await IipcDonationModel.findById(donationId);
    if (!donation) throw new Error("Pledge record not found.");

    const receivedAmount = Number(dto.receivedAmount);
    donation.receivedAmount = receivedAmount;

    if (dto.receivedCurrency) {
      donation.receivedCurrency = dto.receivedCurrency;
    }
    donation.receivedDate = dto.receivedDate || new Date();

    if (dto.paymentProofUrl) {
      donation.paymentProofUrl = dto.paymentProofUrl;
    }
    if (dto.comments) {
      donation.comments = donation.comments
        ? `${donation.comments} | Payment Note: ${dto.comments}`
        : dto.comments;
    }

    if (dto.status) {
      donation.status = dto.status;
    } else {
      if (receivedAmount > donation.pledgeAmount && donation.pledgeAmount > 0) {
        donation.status = "OVERPAID";
      } else if (receivedAmount >= donation.pledgeAmount && donation.pledgeAmount > 0) {
        donation.status = "RECEIVED";
      } else if (receivedAmount > 0) {
        donation.status = "PARTIALLY_RECEIVED";
      } else {
        donation.status = "PLEDGED";
      }
    }

    await donation.save();

    const populated = await IipcDonationModel.findById(donationId)
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    return IipcEventsMapper.toDonationResDTO(populated);
  }

  /**
   * User or Admin submits invoice proof / remarks
   */
  static async submitProof(donationId, { paymentProofUrl, comments }) {
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      throw new Error("Invalid Donation ID format.");
    }

    const donation = await IipcDonationModel.findById(donationId);
    if (!donation) throw new Error("Pledge record not found.");

    if (paymentProofUrl) donation.paymentProofUrl = paymentProofUrl;
    if (comments) {
      donation.comments = donation.comments
        ? `${donation.comments} | User Proof Note: ${comments}`
        : comments;
    }

    await donation.save();

    const populated = await IipcDonationModel.findById(donationId)
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    return IipcEventsMapper.toDonationResDTO(populated);
  }

  /**
   * Comprehensive Event Report:
   * Target Expected, Total Pledged, Total Received, Remaining/Surplus, Target Met,
   * plus sorted alphabetical list of donors with Sequence # 1, 2, 3...
   */
  static async getEventReport(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid Event ID format.");
    }

    const event = await IipcEventModel.findById(eventId).lean();
    if (!event) throw new Error("Project / Event not found.");

    const summary = await this.calculateEventSummary(
      event._id,
      event.targetAmount,
      event.currency
    );

    const donations = await IipcDonationModel.find({ eventId })
      .populate("userId", "name email")
      .lean();

    // Sort donors alphabetically by donor name
    donations.sort((a, b) => {
      const nameA = (a.userId?.name || a.donorName || "").toLowerCase();
      const nameB = (b.userId?.name || b.donorName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return IipcEventsMapper.toReportResDTO(event, summary, donations);
  }

  /**
   * Seed default institutional banking and donation channels if empty
   */
  static async seedDefaultPaymentChannelsIfEmpty() {
    const count = await IipcPaymentChannelModel.countDocuments();
    if (count > 0) return;

    const defaultChannels = [
      {
        name: "TD Canada Trust Bank",
        title: "Bank Wire / Direct Transfer",
        channelType: "BANK_TRANSFER",
        bankName: "TD (Toronto Dominion) Canada Trust Bank",
        accountName: "International Islamic Propagation Centre Canada",
        accountNumber: "5235155",
        swiftCode: "TDOMCATTTOR",
        iban: "026009593",
        transitNumber: "02219",
        institutionNumber: "004",
        branchNumber: "221",
        abaRouting: "026009593",
        branchAddress: "5001 19th Street, Unit 500, Red Deer, AB T4R 3R1, CANADA",
        instructions:
          "Should you wish to make a donation by bank transfer please use the banking details above. For US Donors please use ABA: 026009593. Kindly use 'PayPal' & 'CanadaHelps' only if donating via Credit Card. For all other transfers please use Bank transfer.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/TD_Bank_logo.svg/320px-TD_Bank_logo.svg.png",
        currencies: ["CAD", "USD"],
        craNumber: "80654 8632 RR0001",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Interac E-Transfer",
        title: "Interac E-Transfer (Auto-Deposit)",
        channelType: "E_TRANSFER",
        email: "accounts@iipccanada.com",
        instructions:
          "Send direct Interac e-Transfer to accounts@iipccanada.com from your banking app. Auto-deposit is enabled. Please mention project name in message.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Interac_Logo.svg/320px-Interac_Logo.svg.png",
        currencies: ["CAD"],
        craNumber: "80654 8632 RR0001",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "PayPal Giving Fund",
        title: "PayPal & Credit Card",
        channelType: "PAYPAL",
        url: "https://www.paypal.com/CA/fundraiser/charity/3971665",
        instructions:
          "If you don't have a PayPal account, you can donate directly with your Credit Card via the PayPal Giving Fund. No fees charged by PayPal.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/320px-PayPal.svg.png",
        currencies: ["CAD", "USD", "GBP", "EUR"],
        craNumber: "80654 8632 RR0001",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "CanadaHelps.org",
        title: "CanadaHelps Tax-Deductible Donation",
        channelType: "CANADA_HELPS",
        url: "https://www.canadahelps.org/en/dn/29287",
        instructions:
          "Donate safely via CanadaHelps.org using Credit Card, PayPal, or Google Pay. Instant official CRA tax receipt issued directly to your email.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/CanadaHelps_logo.svg/320px-CanadaHelps_logo.svg.png",
        currencies: ["CAD", "USD"],
        craNumber: "80654 8632 RR0001",
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "IIPC Official Website",
        title: "IIPC Canada Official Portal",
        channelType: "WEBSITE",
        url: "https://iipccanada.com/donate/",
        instructions:
          "Visit the official IIPC Canada donation portal to contribute to our ongoing worldwide da'wah and community welfare appeals.",
        logoUrl: "/iipc-logo1.png",
        currencies: ["CAD", "USD", "GBP", "EUR", "PKR"],
        craNumber: "80654 8632 RR0001",
        isActive: true,
        sortOrder: 5,
      },
    ];

    await IipcPaymentChannelModel.insertMany(defaultChannels);
  }

  /**
   * Retrieve all active institutional payment channels
   */
  static async getAllPaymentChannels() {
    await this.seedDefaultPaymentChannelsIfEmpty();
    return await IipcPaymentChannelModel.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
  }

  /**
   * Public Pledge: unauthenticated donation submission from shared campaign links
   */
  static async createPublicDonation(dto) {
    if (!dto.eventId || !mongoose.Types.ObjectId.isValid(dto.eventId)) {
      throw new Error("Invalid or missing Event ID.");
    }

    const event = await IipcEventModel.findById(dto.eventId);
    if (!event) throw new Error("Selected project / event does not exist.");

    const cleanEmail = (dto.donorEmail || "").toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error("Email is required to confirm your donation pledge.");
    }

    let user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      const fullName =
        dto.donorName ||
        `${dto.firstName || ""} ${dto.lastName || ""}`.trim() ||
        cleanEmail.split("@")[0] ||
        "Online Donor";

      user = await UserModel.create({
        name: fullName,
        email: cleanEmail,
        password: "DefaultPledge123!",
        role: "USER",
        phone: dto.phone || "",
        phones: dto.phone
          ? [{ number: dto.phone, type: "Mobile", isPrimary: true }]
          : [],
        city: "Canada",
        country: "Canada",
        isActive: true,
        createdBy: "Public Campaign Share",
        auditTrail: [
          {
            action: "USER_CREATED_VIA_PUBLIC_PLEDGE",
            performedBy: "Public Visitor",
            performedAt: new Date(),
            details: `Auto-registered through shared campaign link for: ${event.title}`,
          },
        ],
      });
    } else if (dto.phone && !user.phone) {
      user.phone = dto.phone;
      await user.save();
    }

    const pledgeAmount = Number(dto.pledgeAmount) || 0;
    const receivedAmount = Number(dto.receivedAmount) || 0;

    const donationDoc = new IipcDonationModel({
      eventId: event._id,
      userId: user._id,
      donorName: user.name,
      donorEmail: user.email,
      pledgeAmount,
      currency: dto.currency || event.currency || "CAD",
      receivedAmount,
      receivedCurrency: dto.currency || event.currency || "CAD",
      status: receivedAmount >= pledgeAmount && pledgeAmount > 0 ? "RECEIVED" : "PLEDGED",
      comments: dto.comments || "Registered via public campaign page",
      paymentMethod: dto.paymentMethod || "PUBLIC_SHARE",
      paymentProofUrl: dto.paymentProofUrl || "",
      receivedDate: receivedAmount > 0 ? new Date() : null,
      addedBy: user._id,
    });

    const savedDonation = await donationDoc.save();
    const populated = await IipcDonationModel.findById(savedDonation._id)
      .populate("userId", "name email")
      .populate("eventId", "title targetAmount currency")
      .lean();

    return IipcEventsMapper.toDonationResDTO(populated);
  }
}
