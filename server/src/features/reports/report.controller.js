import express from "express";

const router = express.Router();

// GET /api/reports/analytics-report - Direct self-contained payload test
router.get("/analytics-report", async (req, res) => {
  console.log(
    "-> [ReportController DIRECT] GET /api/reports/analytics-report hit!",
  );

  const mockData = {
    success: true,
    metrics: {
      totalSubmissions: 3,
      multiAdminCount: 2,
      overallAverageScore: 91,
      activeGroupsCount: 2,
    },
    statusData: [
      { name: "Completed / Reviewed", value: 2, color: "#40c057" },
      { name: "Pending Review", value: 1, color: "#fab005" },
    ],
    groupPerformanceData: [
      { group: "Group 1", averageScore: 95 },
      { group: "Group 2", averageScore: 88 },
    ],
    sessionReportData: [
      { topic: "Tafseer & Recitation Module - Week 1", averageScore: 91 },
    ],
    frequencyReportData: [{ period: "Sep 2026", submissions: 3 }],
    assessments: [
      {
        _id: "demo_1",
        sessionId: "session_demo_1",
        userId: { name: "Syed Imam", email: "syed@iipccanada.com" },
        groupNumber: 1,
        status: "COMPLETED",
        finalScore: 95,
        evaluations: [
          {
            evaluatorName: "Syed Imam",
            score: 95,
            feedback: "Outstanding recitation and analytical presentation.",
          },
        ],
        createdAt: new Date(),
      },
      {
        _id: "demo_2",
        sessionId: "session_demo_1",
        userId: { name: "Aisha Rahman", email: "aisha@iipc.org" },
        groupNumber: 2,
        status: "SUBMITTED",
        finalScore: 88,
        evaluations: [
          {
            evaluatorName: "Sheikh Ahmed Khan",
            score: 88,
            feedback: "Very good execution of assignment goals.",
          },
        ],
        createdAt: new Date(),
      },
      {
        _id: "demo_3",
        sessionId: "session_demo_2",
        userId: { name: "Bilal Khan", email: "bilal@iipc.org" },
        groupNumber: 1,
        status: "PENDING",
        finalScore: 0,
        evaluations: [],
        createdAt: new Date(),
      },
    ],
  };

  return res.status(200).json(mockData);
});

// Add to wlsReporting.controller.js
router.essions = async (req, res) => {
  try {
    const sessions = await WlsSessionModel.find().sort({
      sessionDateTimeToronto: -1,
    });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default router;
