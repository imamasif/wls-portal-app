import {
  CreateEventReqDTO,
  UpdateEventReqDTO,
  CreateDonationReqDTO,
  UpdateDonationReqDTO,
  MarkPaymentReqDTO,
} from "./iipcEvents.req.js";
import {
  IipcEventResDTO,
  IipcDonationResDTO,
  IipcEventReportResDTO,
} from "./iipcEvents.res.js";

export class IipcEventsMapper {
  static toCreateEventReqDTO(body) {
    return new CreateEventReqDTO(body);
  }

  static toUpdateEventReqDTO(body) {
    return new UpdateEventReqDTO(body);
  }

  static toCreateDonationReqDTO(body) {
    return new CreateDonationReqDTO(body);
  }

  static toUpdateDonationReqDTO(body) {
    return new UpdateDonationReqDTO(body);
  }

  static toMarkPaymentReqDTO(body) {
    return new MarkPaymentReqDTO(body);
  }

  static toEventResDTO(doc, summary = null) {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    return new IipcEventResDTO(docObj, summary);
  }

  static toEventResDTOList(docsWithSummaries) {
    if (!Array.isArray(docsWithSummaries)) return [];
    return docsWithSummaries.map((item) => {
      const doc = item.event || item;
      const summary = item.summary || null;
      const docObj = doc.toObject ? doc.toObject() : doc;
      return new IipcEventResDTO(docObj, summary);
    });
  }

  static toDonationResDTO(doc, sequenceNumber = null) {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    return new IipcDonationResDTO(docObj, sequenceNumber);
  }

  static toDonationResDTOList(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map((doc, index) => {
      const docObj = doc.toObject ? doc.toObject() : doc;
      return new IipcDonationResDTO(docObj, index + 1);
    });
  }

  static toReportResDTO(eventDoc, summary, donationDocs) {
    return new IipcEventReportResDTO(eventDoc, summary, donationDocs);
  }
}
