import Ajv from "ajv";
import { WLS_SESSION_STATUSES } from "../../common/constants/enums.js";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const createWlsSessionSchema = {
  type: "object",
  properties: {
    topicName: { type: "string", minLength: 3 },
    sessionDateTimeToronto: { type: "string" },
    description: { type: "string" },
    videoDeadline: { type: "string" },
    pdfBookletUrls: { type: "array", items: { type: "string" } },
    quranVideoUrls: { type: "array", items: { type: "string" } },
    groupAssignments: { type: "object" },
    status: {
      type: "string",
      enum: Object.values(WLS_SESSION_STATUSES),
      default: WLS_SESSION_STATUSES.NEW,
    },
  },
  required: ["topicName", "sessionDateTimeToronto"],
  additionalProperties: true,
};

export const validateCreateWlsSession = ajv.compile(createWlsSessionSchema);
