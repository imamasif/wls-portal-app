// wlsReporting.usecase.js
import { WlsReportingModel } from "./wlsReporting.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";

export class WlsReportingUseCase {
  static async getAnalyticsReport() {
    try {
      const assessments = await WlsReportingModel.find({})
        .populate("userId", "name email role")
        .populate("sessionId", "topicName sessionDateTimeToronto status")
        .populate("evaluations.adminId", "name email role")
        .lean();

      const totalSubmissions = assessments.length;
      const multiAdminCount = assessments.filter(
        (item) => item.evaluations && item.evaluations.length >= 2,
      ).length;

      const scoredAssessments = assessments.filter(
        (item) => typeof item.finalScore === "number" && item.finalScore > 0,
      );
      const totalScoreSum = scoredAssessments.reduce(
        (acc, curr) => acc + curr.finalScore,
        0,
      );
      const overallAverageScore =
        scoredAssessments.length > 0
          ? Math.round(totalScoreSum / scoredAssessments.length)
          : 0;

      const activeGroups = new Set(
        assessments.map((item) => item.groupNumber || 1),
      );
      const activeGroupsCount = activeGroups.size;

      // Status Breakdown Donut Chart
      const completedCount = assessments.filter((item) =>
        ["COMPLETED", "REVIEWED"].includes(item.status),
      ).length;
      const pendingCount = assessments.filter((item) =>
        ["PENDING", "ASSIGNED"].includes(item.status),
      ).length;

      const statusData = [
        {
          name: "Completed / Reviewed",
          value: completedCount,
          color: "#40c057",
        },
        { name: "Pending Review", value: pendingCount, color: "#fab005" },
      ];

      // 1. Group-wise Bar Chart Data
      const groupMap = {};
      // 2. Session / Topic breakdown
      const sessionMap = {};
      // 3. Time Frequency breakdown (YYYY-MM)
      const frequencyMap = {};

      assessments.forEach((item) => {
        const groupKey = `Group ${item.groupNumber || 1}`;
        if (!groupMap[groupKey])
          groupMap[groupKey] = { totalScore: 0, count: 0 };
        if (item.finalScore > 0) {
          groupMap[groupKey].totalScore += item.finalScore;
          groupMap[groupKey].count += 1;
        }

        // Session / Topic metrics
        const session = item.sessionId;
        const topic = session?.topicName || "General Topic";
        const dateKey = session?.sessionDateTimeToronto
          ? new Date(session.sessionDateTimeToronto).toISOString().split("T")[0]
          : "2026-09-01";
        const monthKey = dateKey.substring(0, 7);

        if (!sessionMap[topic]) {
          sessionMap[topic] = { topic, totalSubmissions: 0, scoreSum: 0 };
        }
        sessionMap[topic].totalSubmissions += 1;
        sessionMap[topic].scoreSum += item.finalScore || 0;

        if (!frequencyMap[monthKey]) {
          frequencyMap[monthKey] = {
            period: monthKey,
            submissions: 0,
            scoreSum: 0,
          };
        }
        frequencyMap[monthKey].submissions += 1;
        frequencyMap[monthKey].scoreSum += item.finalScore || 0;
      });

      const groupPerformanceData = Object.keys(groupMap).map((groupName) => {
        const stats = groupMap[groupName];
        return {
          group: groupName,
          averageScore:
            stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
        };
      });

      const sessionReportData = Object.values(sessionMap).map((s) => ({
        topic: s.topic,
        totalSubmissions: s.totalSubmissions,
        averageScore:
          s.totalSubmissions > 0
            ? Math.round(s.scoreSum / s.totalSubmissions)
            : 0,
      }));

      const frequencyReportData = Object.values(frequencyMap).map((f) => ({
        period: f.period,
        submissions: f.submissions,
        averageScore:
          f.submissions > 0 ? Math.round(f.scoreSum / f.submissions) : 0,
      }));

      // Formatted assessments with individual admin breakdown vs aggregate score
      const formattedAssessments = assessments.map((item) => {
        const adminScoresBreakdown = (item.evaluations || []).map((ev) => ({
          adminName: ev.adminId?.name || "Admin",
          score: ev.score,
          feedback: ev.feedback,
        }));

        return {
          ...item,
          evaluations: (item.evaluations || []).map((ev) => ({
            ...ev,
            evaluatorName: ev.adminId?.name || "Admin",
          })),
          adminScoresBreakdown,
        };
      });

      return {
        success: true,
        metrics: {
          totalSubmissions,
          multiAdminCount,
          overallAverageScore,
          activeGroupsCount,
        },
        statusData,
        groupPerformanceData,
        sessionReportData,
        frequencyReportData,
        assessments: formattedAssessments,
      };
    } catch (error) {
      console.error("Error generating analytics report:", error);
      throw new Error("Failed to generate analytics report.");
    }
  }
}
