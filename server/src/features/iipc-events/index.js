import express from "express";
import { IipcEventsController } from "./iipcEvents.controller.js";
import { validateSchema } from "../../common/middleware/validateSchema.js";
import {
  createEventSchema,
  updateEventSchema,
  createDonationSchema,
  updateDonationSchema,
  markPaymentSchema,
  submitProofSchema,
} from "./iipcEvents.schema.js";

const router = express.Router();

// Payment / Banking Channels (Defined before /:id)
router.get("/channels", IipcEventsController.getAllPaymentChannels);

// Public donation pledge without login
router.post("/public/pledge", IipcEventsController.createPublicDonation);

// Events CRUD
router.get("/", IipcEventsController.getAllEvents);
router.post("/", validateSchema(createEventSchema), IipcEventsController.createEvent);
router.get("/:id", IipcEventsController.getEventById);
router.put("/:id", validateSchema(updateEventSchema), IipcEventsController.updateEvent);
router.delete("/:id", IipcEventsController.deleteEvent);

// Event Report
router.get("/:id/report", IipcEventsController.getEventReport);

// Donations under an Event
router.get("/:id/donations", IipcEventsController.getDonationsByEvent);
router.post("/:id/donations", validateSchema(createDonationSchema), IipcEventsController.createDonation);

// Direct donation operations
router.post("/donations", validateSchema(createDonationSchema), IipcEventsController.createDonation);
router.put("/donations/:donationId", validateSchema(updateDonationSchema), IipcEventsController.updateDonation);
router.patch("/donations/:donationId/pay", validateSchema(markPaymentSchema), IipcEventsController.markPayment);
router.patch("/donations/:donationId/proof", validateSchema(submitProofSchema), IipcEventsController.submitProof);

// User donations
router.get("/user/:userId/donations", IipcEventsController.getDonationsByUser);

export default router;
export { IipcEventsController };
export * from "./iipcEvents.model.js";
export * from "./iipcEvents.usecase.js";
export * from "./iipcEvents.mapper.js";
export * from "./iipcEvents.req.js";
export * from "./iipcEvents.res.js";
