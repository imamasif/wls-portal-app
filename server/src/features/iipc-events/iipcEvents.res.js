export class IipcEventResDTO {
  constructor(doc, summary = null) {
    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.title = doc.title;
    this.targetAmount = doc.targetAmount || 0;
    this.currency = doc.currency || "CAD";
    this.startDate = doc.startDate;
    this.endDate = doc.endDate;
    this.description = doc.description;
    this.comments = doc.comments || "";
    this.pictures = doc.pictures || [];
    this.status = doc.status || "ACTIVE";
    this.createdBy = doc.createdBy;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;

    if (summary) {
      this.summary = summary;
    }
  }
}

export class IipcDonationResDTO {
  constructor(doc, sequenceNumber = null) {
    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.eventId = doc.eventId ? (doc.eventId._id ? doc.eventId._id.toString() : doc.eventId.toString()) : null;
    this.userId = doc.userId ? (doc.userId._id ? doc.userId._id.toString() : doc.userId.toString()) : null;
    
    // Resolve user details if populated
    const populatedUser = doc.userId && typeof doc.userId === "object" ? doc.userId : null;
    this.donorName = populatedUser?.name || doc.donorName || "Unknown Donor";
    this.donorEmail = populatedUser?.email || doc.donorEmail || "";
    
    this.pledgeAmount = doc.pledgeAmount || 0;
    this.currency = doc.currency || "CAD";
    this.receivedAmount = doc.receivedAmount || 0;
    this.receivedCurrency = doc.receivedCurrency || this.currency;
    this.status = doc.status || "PLEDGED";
    this.pledgeDate = doc.pledgeDate;
    this.receivedDate = doc.receivedDate;
    this.paymentProofUrl = doc.paymentProofUrl || "";
    this.comments = doc.comments || "";
    this.paymentMethod = doc.paymentMethod || "OTHER";
    this.addedBy = doc.addedBy;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;

    // Remaining / Balance on this specific pledge
    this.balance = Math.max(0, this.pledgeAmount - this.receivedAmount);
    this.isFullyPaid = this.receivedAmount >= this.pledgeAmount;

    if (sequenceNumber !== null && sequenceNumber !== undefined) {
      this.sequenceNumber = sequenceNumber;
    }

    if (doc.eventId && typeof doc.eventId === "object" && doc.eventId.title) {
      this.eventTitle = doc.eventId.title;
      this.eventTarget = doc.eventId.targetAmount;
      this.eventCurrency = doc.eventId.currency;
    }
  }
}

export class IipcEventReportResDTO {
  constructor(eventDoc, summary, donorsList) {
    this.event = new IipcEventResDTO(eventDoc);
    this.summary = {
      targetExpected: summary.targetExpected || 0,
      totalPledged: summary.totalPledged || 0,
      totalReceived: summary.totalReceived || 0,
      remainingAmount: summary.remainingAmount || 0,
      surplusAmount: summary.surplusAmount || 0,
      isTargetMet: summary.isTargetMet || false,
      percentagePledged: summary.percentagePledged || 0,
      percentageReceived: summary.percentageReceived || 0,
      totalDonorsCount: summary.totalDonorsCount || 0,
      receivedDonorsCount: summary.receivedDonorsCount || 0,
      pendingDonorsCount: summary.pendingDonorsCount || 0,
      currency: summary.currency || "CAD",
    };
    this.donors = donorsList.map((d, idx) => new IipcDonationResDTO(d, idx + 1));
  }
}
