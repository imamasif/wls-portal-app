export class CreateEventReqDTO {
  constructor({
    title,
    targetAmount,
    currency = "CAD",
    startDate,
    endDate,
    description,
    comments = "",
    pictures = [],
    status = "ACTIVE",
    createdBy = null,
  }) {
    this.title = title?.trim();
    this.targetAmount = Number(targetAmount) || 0;
    this.currency = (currency || "CAD").trim().toUpperCase();
    this.startDate = startDate ? new Date(startDate) : new Date();
    this.endDate = endDate ? new Date(endDate) : new Date();
    this.description = description?.trim();
    this.comments = comments?.trim() || "";
    this.pictures = Array.isArray(pictures)
      ? pictures.filter((p) => p && typeof p === "string" && p.trim().length > 0)
      : [];
    this.status = status || "ACTIVE";
    this.createdBy = createdBy || null;
  }
}

export class UpdateEventReqDTO {
  constructor(data) {
    if (data.title !== undefined) this.title = data.title.trim();
    if (data.targetAmount !== undefined)
      this.targetAmount = Number(data.targetAmount);
    if (data.currency !== undefined)
      this.currency = data.currency.trim().toUpperCase();
    if (data.startDate !== undefined) this.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) this.endDate = new Date(data.endDate);
    if (data.description !== undefined)
      this.description = data.description.trim();
    if (data.comments !== undefined) this.comments = data.comments.trim();
    if (data.pictures !== undefined && Array.isArray(data.pictures)) {
      this.pictures = data.pictures.filter(
        (p) => p && typeof p === "string" && p.trim().length > 0
      );
    }
    if (data.status !== undefined) this.status = data.status;
  }
}

export class CreateDonationReqDTO {
  constructor({
    eventId,
    userId,
    donorName = "",
    donorEmail = "",
    firstName = "",
    lastName = "",
    phone = "",
    isNewUser = false,
    pledgeAmount,
    currency = "CAD",
    receivedAmount = 0,
    receivedCurrency = "CAD",
    comments = "",
    paymentMethod = "OTHER",
    paymentProofUrl = "",
    addedBy = null,
  }) {
    this.eventId = eventId;
    this.userId = userId;
    this.firstName = firstName?.trim() || "";
    this.lastName = lastName?.trim() || "";
    this.phone = phone?.trim() || "";
    this.isNewUser = Boolean(isNewUser);

    const composedName = `${this.firstName} ${this.lastName}`.trim();
    this.donorName = composedName || donorName?.trim() || "";
    this.donorEmail = donorEmail?.trim()?.toLowerCase() || "";
    this.pledgeAmount = Number(pledgeAmount) || 0;
    this.currency = (currency || "CAD").trim().toUpperCase();
    this.receivedAmount = Number(receivedAmount) || 0;
    this.receivedCurrency = (receivedCurrency || this.currency).trim().toUpperCase();
    this.comments = comments?.trim() || "";
    this.paymentMethod = paymentMethod?.trim() || "OTHER";
    this.paymentProofUrl = paymentProofUrl || "";
    this.addedBy = addedBy || null;
  }
}

export class UpdateDonationReqDTO {
  constructor(data) {
    if (data.pledgeAmount !== undefined)
      this.pledgeAmount = Number(data.pledgeAmount);
    if (data.currency !== undefined)
      this.currency = data.currency.trim().toUpperCase();
    if (data.receivedAmount !== undefined)
      this.receivedAmount = Number(data.receivedAmount);
    if (data.receivedCurrency !== undefined)
      this.receivedCurrency = data.receivedCurrency.trim().toUpperCase();
    if (data.status !== undefined) this.status = data.status;
    if (data.comments !== undefined) this.comments = data.comments.trim();
    if (data.paymentMethod !== undefined)
      this.paymentMethod = data.paymentMethod.trim();
    if (data.paymentProofUrl !== undefined)
      this.paymentProofUrl = data.paymentProofUrl;
    if (data.receivedDate !== undefined)
      this.receivedDate = data.receivedDate ? new Date(data.receivedDate) : null;
  }
}

export class MarkPaymentReqDTO {
  constructor({
    receivedAmount,
    receivedCurrency,
    receivedDate,
    paymentProofUrl,
    comments,
    status,
  }) {
    this.receivedAmount = Number(receivedAmount) || 0;
    if (receivedCurrency)
      this.receivedCurrency = receivedCurrency.trim().toUpperCase();
    this.receivedDate = receivedDate ? new Date(receivedDate) : new Date();
    if (paymentProofUrl !== undefined) this.paymentProofUrl = paymentProofUrl;
    if (comments !== undefined) this.comments = comments.trim();
    if (status !== undefined) this.status = status;
  }
}
