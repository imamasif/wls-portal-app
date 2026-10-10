import mongoose from "mongoose";
import { UserModel } from "../users/user.model.js";
import { AssessmentModel } from "../wls-assessments/wlsAssessment.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";
import { RuleModel } from "../rules/rule.model.js";
import { UserRole } from "../types/user.js";

// Canonical criteria mapping for score key normalization
const CRITERIA_ALIAS_MAP = {
  arabicreading: "arabicReading",
  arabicrecitation: "arabicReading",
  recitation: "arabicReading",
  reading: "arabicReading",
  tajweed: "arabicReading",

  attire: "attire",
  dresscode: "attire",
  clothing: "attire",

  presentation: "presentation",
  cameraposition: "presentation",
  camera: "presentation",
  cameralightsound: "presentation",
  videoquality: "presentation",

  hifz: "hifz",
  memorization: "hifz",

  ontimedelivery: "onTimeDelivery",
  timely: "onTimeDelivery",
  delivery: "onTimeDelivery",

  transferenceofspirit: "transferenceOfSpirit",
  spirit: "transferenceOfSpirit",

  bodylanguage: "bodyLanguage",
  posture: "bodyLanguage",
};

export const DEFAULT_CRITERIA_CONFIG = [
  {
    key: "arabicReading",
    label: "Arabic Reading / Tajweed",
    maxScore: 10,
    color: "#20c997",
  },
  {
    key: "attire",
    label: "Attire / Dress Code",
    maxScore: 10,
    color: "#4dabf7",
  },
  {
    key: "presentation",
    label: "Presentation (Camera, Sound & Light)",
    maxScore: 10,
    color: "#748ffc",
  },
  {
    key: "hifz",
    label: "Memorization Accuracy / Hifz",
    maxScore: 10,
    color: "#ff922b",
  },
  {
    key: "onTimeDelivery",
    label: "On Time Delivery",
    maxScore: 10,
    color: "#51cf66",
  },
  {
    key: "transferenceOfSpirit",
    label: "Transference of Spirit",
    maxScore: 10,
    color: "#f06595",
  },
  {
    key: "bodyLanguage",
    label: "Body Language",
    maxScore: 10,
    color: "#cc5de8",
  },
];

function normalizeCriterionKey(rawKey) {
  if (!rawKey) return null;
  const clean = String(rawKey).toLowerCase().replace(/[^a-z]/g, "");
  return CRITERIA_ALIAS_MAP[clean] || rawKey;
}

export class ReportService {
  static async getAnalyticsReport({ sessionId, userId, role, groupNumber }) {
    // 1. Fetch available sessions from MongoDB
    const allSessions = await WlsSessionModel.find({})
      .sort({ sessionDateTimeToronto: -1 })
      .lean();

    // 2. Fetch active criteria rules
    const rulesFromDb = await RuleModel.find({ isActive: true }).lean();
    const criteriaConfig = [...DEFAULT_CRITERIA_CONFIG];

    if (Array.isArray(rulesFromDb) && rulesFromDb.length > 0) {
      rulesFromDb.forEach((rule) => {
        const canonicalKey = normalizeCriterionKey(rule.key);
        const existingIdx = criteriaConfig.findIndex(
          (c) => c.key === canonicalKey,
        );
        if (existingIdx !== -1) {
          criteriaConfig[existingIdx].label = rule.criterion;
          if (rule.maxScore) criteriaConfig[existingIdx].maxScore = rule.maxScore;
        } else {
          criteriaConfig.push({
            key: canonicalKey,
            label: rule.criterion,
            maxScore: rule.maxScore || 10,
            color: "#845ef7",
          });
        }
      });
    }

    const isStudent = role === UserRole.USER;

    // 3. Build MongoDB Assessment Query
    const query = {};

    if (isStudent && userId) {
      // Security: regular student can ONLY see their own records
      query.userId = new mongoose.Types.ObjectId(userId);
    } else if (userId && userId !== "ALL") {
      try {
        query.userId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        query.userId = userId;
      }
    }

    if (sessionId && sessionId !== "ALL") {
      try {
        query.sessionId = new mongoose.Types.ObjectId(sessionId);
      } catch (e) {
        query.sessionId = sessionId;
      }
    }

    if (groupNumber && groupNumber !== "ALL") {
      query.groupNumber = Number(groupNumber);
    }

    // 4. Fetch populated assessments
    const rawAssessments = await AssessmentModel.find(query)
      .populate("userId", "name email role profilePictureUrl")
      .populate("sessionId", "topicName sessionDateTimeToronto status groupAssignments")
      .sort({ createdAt: -1 })
      .lean();

    // 5. Enrich Assessments with normalized criteria and evaluators
    const enrichedAssessments = rawAssessments.map((a) => {
      const studentName = a.userId?.name || "Student";
      const studentEmail = a.userId?.email || "";
      const studentAvatar = a.userId?.profilePictureUrl || "";
      const sessionTopic = a.sessionId?.topicName || "WLS Session";
      const sessionDate =
        a.sessionId?.sessionDateTimeToronto || a.createdAt || new Date();
      const rawSessionId = a.sessionId?._id
        ? a.sessionId._id.toString()
        : a.sessionId
        ? a.sessionId.toString()
        : "";

      // Extract and normalize criteria scores for this student
      const studentCriteriaScores = {};
      criteriaConfig.forEach((cfg) => {
        studentCriteriaScores[cfg.key] = {
          key: cfg.key,
          label: cfg.label,
          score: 0,
          maxScore: cfg.maxScore,
          hasScore: false,
          percentage: 0,
        };
      });

      const criteriaSums = {};
      const criteriaCounts = {};

      if (Array.isArray(a.evaluations) && a.evaluations.length > 0) {
        a.evaluations.forEach((ev) => {
          let scores = ev.scores;
          if (scores instanceof Map) {
            scores = Object.fromEntries(scores);
          }
          if (scores && typeof scores === "object") {
            Object.entries(scores).forEach(([rawKey, val]) => {
              if (rawKey === "sessionId") return;
              const canonicalKey = normalizeCriterionKey(rawKey);
              const numVal = Number(val);
              if (!isNaN(numVal)) {
                if (!criteriaSums[canonicalKey]) {
                  criteriaSums[canonicalKey] = 0;
                  criteriaCounts[canonicalKey] = 0;
                }
                criteriaSums[canonicalKey] += numVal;
                criteriaCounts[canonicalKey] += 1;
              }
            });
          }
        });
      }

      Object.keys(criteriaSums).forEach((key) => {
        if (studentCriteriaScores[key]) {
          const avgScore = Number(
            (criteriaSums[key] / criteriaCounts[key]).toFixed(1),
          );
          studentCriteriaScores[key].score = avgScore;
          studentCriteriaScores[key].hasScore = true;
          studentCriteriaScores[key].percentage = Math.round(
            (avgScore / studentCriteriaScores[key].maxScore) * 100,
          );
        }
      });

      // Evaluator list
      const evaluators = (a.evaluations || []).map((ev) => ({
        evaluatorId: ev.evaluatorId,
        evaluatorName: ev.evaluatorName || "Admin Evaluator",
        status: ev.status,
        feedback: ev.feedback || "",
        scores: ev.scores,
        evaluatedAt: ev.evaluatedAt,
      }));

      // Calculate or verify final score
      let calculatedScore = a.finalScore;
      if (!calculatedScore && a.evaluations && a.evaluations.length > 0) {
        let totalGot = 0;
        let totalMax = 0;
        Object.values(studentCriteriaScores).forEach((item) => {
          if (item.hasScore) {
            totalGot += item.score;
            totalMax += item.maxScore;
          }
        });
        if (totalMax > 0) {
          calculatedScore = Math.round((totalGot / totalMax) * 100);
        }
      }

      return {
        _id: a._id.toString(),
        sessionId: rawSessionId,
        sessionTopic,
        sessionDate,
        userId: a.userId?._id ? a.userId._id.toString() : a.userId,
        studentName,
        studentEmail,
        studentAvatar,
        groupNumber: a.groupNumber || 1,
        status: a.status || "PENDING",
        conclusionStatus:
          a.conclusionStatus ||
          (calculatedScore >= 70
            ? "PASSED"
            : calculatedScore > 0
            ? "FAILED"
            : "PENDING"),
        finalScore: calculatedScore || 0,
        submissionUrl:
          a.submissionUrl ||
          (Array.isArray(a.submissionUrls) && a.submissionUrls[0]) ||
          "",
        missedReason: a.missedReason || "",
        evaluations: evaluators,
        criteriaScores: studentCriteriaScores,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

    // 6. Aggregate Criteria Performance across all matching assessments
    const criteriaAgg = {};
    criteriaConfig.forEach((cfg) => {
      criteriaAgg[cfg.key] = {
        criterion: cfg.label,
        key: cfg.key,
        totalScore: 0,
        count: 0,
        maxScore: cfg.maxScore,
        color: cfg.color,
      };
    });

    enrichedAssessments.forEach((a) => {
      Object.entries(a.criteriaScores).forEach(([key, val]) => {
        if (val.hasScore && criteriaAgg[key]) {
          criteriaAgg[key].totalScore += val.score;
          criteriaAgg[key].count += 1;
        }
      });
    });

    const criteriaPerformanceData = Object.values(criteriaAgg).map((item) => ({
      criterion: item.criterion,
      key: item.key,
      averageScore:
        item.count > 0 ? Number((item.totalScore / item.count).toFixed(1)) : 0,
      percentage:
        item.count > 0
          ? Math.round((item.totalScore / (item.count * item.maxScore)) * 100)
          : 0,
      evaluatedCount: item.count,
      maxScore: item.maxScore,
      color: item.color,
    }));

    // 7. Aggregate Group Performance
    const groupMap = {};
    enrichedAssessments.forEach((a) => {
      const gNum = a.groupNumber || 1;
      const gKey = `Group ${gNum}`;
      if (!groupMap[gKey]) {
        groupMap[gKey] = {
          group: gKey,
          groupNumber: gNum,
          totalStudents: 0,
          submittedCount: 0,
          evaluatedCount: 0,
          scoreSum: 0,
          passedCount: 0,
          criteriaSums: {},
          criteriaCounts: {},
        };
      }

      groupMap[gKey].totalStudents += 1;
      if (a.submissionUrl || ["SUBMITTED", "UNDER_REVIEW", "COMPLETED"].includes(a.status)) {
        groupMap[gKey].submittedCount += 1;
      }
      if (a.evaluations && a.evaluations.length > 0) {
        groupMap[gKey].evaluatedCount += 1;
        groupMap[gKey].scoreSum += a.finalScore;
        if (a.finalScore >= 70) groupMap[gKey].passedCount += 1;

        Object.entries(a.criteriaScores).forEach(([k, v]) => {
          if (v.hasScore) {
            if (!groupMap[gKey].criteriaSums[k]) {
              groupMap[gKey].criteriaSums[k] = 0;
              groupMap[gKey].criteriaCounts[k] = 0;
            }
            groupMap[gKey].criteriaSums[k] += v.score;
            groupMap[gKey].criteriaCounts[k] += 1;
          }
        });
      }
    });

    const groupPerformanceData = Object.values(groupMap)
      .sort((a, b) => a.groupNumber - b.groupNumber)
      .map((g) => {
        const criteriaAverages = {};
        criteriaConfig.forEach((cfg) => {
          const sum = g.criteriaSums[cfg.key] || 0;
          const count = g.criteriaCounts[cfg.key] || 0;
          criteriaAverages[cfg.key] =
            count > 0 ? Number((sum / count).toFixed(1)) : 0;
        });

        return {
          group: g.group,
          groupNumber: g.groupNumber,
          totalStudents: g.totalStudents,
          submittedCount: g.submittedCount,
          evaluatedCount: g.evaluatedCount,
          averageScore:
            g.evaluatedCount > 0
              ? Math.round(g.scoreSum / g.evaluatedCount)
              : 0,
          passRate:
            g.evaluatedCount > 0
              ? Math.round((g.passedCount / g.evaluatedCount) * 100)
              : 0,
          criteriaAverages,
        };
      });

    // 8. Status Distribution Data for Pie Chart
    const statusCounts = {
      COMPLETED: 0,
      UNDER_REVIEW: 0,
      PARTIAL_SAVED: 0,
      SUBMITTED: 0,
      PENDING: 0,
    };

    enrichedAssessments.forEach((a) => {
      const s = String(a.status).toUpperCase();
      if (statusCounts[s] !== undefined) {
        statusCounts[s] += 1;
      } else if (s === "REVIEWED") {
        statusCounts.COMPLETED += 1;
      } else {
        statusCounts.PENDING += 1;
      }
    });

    const statusData = [
      {
        name: "Completed / Graded",
        value: statusCounts.COMPLETED,
        color: "#2b8a3e",
      },
      {
        name: "Under Review / Grading",
        value: statusCounts.UNDER_REVIEW + statusCounts.PARTIAL_SAVED,
        color: "#1c7ed6",
      },
      {
        name: "Submitted (Pending Review)",
        value: statusCounts.SUBMITTED,
        color: "#f59f00",
      },
      {
        name: "Pending Video Submission",
        value: statusCounts.PENDING,
        color: "#868e96",
      },
    ].filter((item) => item.value > 0);

    // 9. Overall Metrics
    const evaluatedList = enrichedAssessments.filter(
      (a) => a.evaluations && a.evaluations.length > 0,
    );
    const scoreSum = evaluatedList.reduce((acc, a) => acc + a.finalScore, 0);
    const passedList = evaluatedList.filter((a) => a.finalScore >= 70);

    const overallAverageScore =
      evaluatedList.length > 0 ? Math.round(scoreSum / evaluatedList.length) : 0;
    const passRate =
      evaluatedList.length > 0
        ? Math.round((passedList.length / evaluatedList.length) * 100)
        : 0;

    const metrics = {
      totalStudents: enrichedAssessments.length,
      totalSubmissions: enrichedAssessments.filter(
        (a) =>
          a.submissionUrl ||
          ["SUBMITTED", "UNDER_REVIEW", "COMPLETED"].includes(a.status),
      ).length,
      evaluatedCount: evaluatedList.length,
      overallAverageScore,
      passRate,
      activeGroupsCount: Object.keys(groupMap).length,
      multiAdminCount: enrichedAssessments.filter(
        (a) => a.evaluations && a.evaluations.length >= 2,
      ).length,
    };

    // 10. Student Summary Trajectory (for student personal view)
    let studentSummary = null;
    if (isStudent && enrichedAssessments.length > 0) {
      studentSummary = {
        studentName: enrichedAssessments[0].studentName,
        studentEmail: enrichedAssessments[0].studentEmail,
        totalSessionsAttended: enrichedAssessments.length,
        averageScore: overallAverageScore,
        passRate,
        sessionTrajectory: enrichedAssessments.map((a) => ({
          sessionId: a.sessionId,
          sessionTopic: a.sessionTopic,
          date: new Date(a.sessionDate).toLocaleDateString(),
          score: a.finalScore,
          status: a.status,
          conclusionStatus: a.conclusionStatus,
        })),
      };
    }

    // Return comprehensive payload
    return {
      success: true,
      isStudentView: isStudent,
      metrics,
      statusData,
      groupPerformanceData,
      criteriaPerformanceData,
      criteriaConfig,
      assessments: enrichedAssessments,
      sessions: allSessions.map((s) => ({
        _id: s._id.toString(),
        topicName: s.topicName,
        sessionDateTimeToronto: s.sessionDateTimeToronto,
        status: s.status,
      })),
      studentSummary,
    };
  }
}
