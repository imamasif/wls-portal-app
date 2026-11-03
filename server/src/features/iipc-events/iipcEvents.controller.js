import { IipcEventsUseCase } from "./iipcEvents.usecase.js";
import { IipcEventsMapper } from "./iipcEvents.mapper.js";

export class IipcEventsController {
  static async getAllEvents(req, res) {
    try {
      const { status } = req.query;
      const events = await IipcEventsUseCase.getAllEvents({ status });
      return res.status(200).json(events);
    } catch (err) {
      console.error("Error in getAllEvents:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await IipcEventsUseCase.getEventById(id);
      return res.status(200).json(event);
    } catch (err) {
      console.error("Error in getEventById:", err);
      return res.status(err.message.includes("not found") ? 404 : 400).json({ error: err.message });
    }
  }

  static async createEvent(req, res) {
    try {
      const dto = IipcEventsMapper.toCreateEventReqDTO(req.body);
      const adminUserId = req.body.createdBy || req.headers["x-user-id"] || null;
      const event = await IipcEventsUseCase.createEvent(dto, adminUserId);
      return res.status(201).json(event);
    } catch (err) {
      console.error("Error in createEvent:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const dto = IipcEventsMapper.toUpdateEventReqDTO(req.body);
      const updated = await IipcEventsUseCase.updateEvent(id, dto);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Error in updateEvent:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const result = await IipcEventsUseCase.deleteEvent(id);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in deleteEvent:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async getDonationsByEvent(req, res) {
    try {
      const { id } = req.params;
      const donations = await IipcEventsUseCase.getDonationsByEvent(id);
      return res.status(200).json(donations);
    } catch (err) {
      console.error("Error in getDonationsByEvent:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async getDonationsByUser(req, res) {
    try {
      const { userId } = req.params;
      const donations = await IipcEventsUseCase.getDonationsByUser(userId);
      return res.status(200).json(donations);
    } catch (err) {
      console.error("Error in getDonationsByUser:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async createDonation(req, res) {
    try {
      const dto = IipcEventsMapper.toCreateDonationReqDTO(req.body);
      const currentUserId = req.body.addedBy || req.headers["x-user-id"] || null;
      const donation = await IipcEventsUseCase.createDonation(dto, currentUserId);
      return res.status(201).json(donation);
    } catch (err) {
      console.error("Error in createDonation:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateDonation(req, res) {
    try {
      const { donationId } = req.params;
      const dto = IipcEventsMapper.toUpdateDonationReqDTO(req.body);
      const updated = await IipcEventsUseCase.updateDonation(donationId, dto);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Error in updateDonation:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async markPayment(req, res) {
    try {
      const { donationId } = req.params;
      const dto = IipcEventsMapper.toMarkPaymentReqDTO(req.body);
      const currentUserId = req.headers["x-user-id"] || null;
      const updated = await IipcEventsUseCase.markPayment(donationId, dto, currentUserId);
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Error in markPayment:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async submitProof(req, res) {
    try {
      const { donationId } = req.params;
      const { paymentProofUrl, comments } = req.body;
      const updated = await IipcEventsUseCase.submitProof(donationId, {
        paymentProofUrl,
        comments,
      });
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Error in submitProof:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async getAllPaymentChannels(req, res) {
    try {
      const channels = await IipcEventsUseCase.getAllPaymentChannels();
      return res.status(200).json(channels);
    } catch (err) {
      console.error("Error in getAllPaymentChannels:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async createPublicDonation(req, res) {
    try {
      const donation = await IipcEventsUseCase.createPublicDonation(req.body);
      return res.status(201).json(donation);
    } catch (err) {
      console.error("Error in createPublicDonation:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  static async getEventReport(req, res) {
    try {
      const { id } = req.params;
      const report = await IipcEventsUseCase.getEventReport(id);
      return res.status(200).json(report);
    } catch (err) {
      console.error("Error in getEventReport:", err);
      return res.status(400).json({ error: err.message });
    }
  }
}
