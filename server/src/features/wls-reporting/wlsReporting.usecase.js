import { WlsReportingModel } from './wlsReporting.model.js';

export class WlsReportingUseCase {
  static async getAnalyticsReport() {
    try {
      // Fetch all reporting records and populate user details
      const assessments = await WlsReportingModel.find({})
        .populate('userId', 'name email role')
        .populate('evaluations.adminId', 'name email role')
        .lean();

      const totalSubmissions = assessments.length;

      // Count submissions evaluated by 2 or more admins
      const multiAdminCount = assessments.filter(
        (item) => item.evaluations && item.evaluations.length >= 2
      ).length;

      // Calculate overall portal average score
      const scoredAssessments = assessments.filter((item) => typeof item.finalScore === 'number' && item.finalScore > 0);
      const totalScoreSum = scoredAssessments.reduce((acc, curr) => acc + curr.finalScore, 0);
      const overallAverageScore = scoredAssessments.length > 0 
        ? Math.round(totalScoreSum / scoredAssessments.length) 
        : 0;

      // Count active distinct groups
      const activeGroups = new Set(assessments.map((item) => item.groupNumber || 1));
      const activeGroupsCount = activeGroups.size;

      // Submission & Review Status breakdown for Donut Chart
      const completedCount = assessments.filter((item) => item.status === 'COMPLETED' || item.status === 'REVIEWED').length;
      const pendingCount = assessments.filter((item) => item.status === 'PENDING').length;

      const statusData = [
        { name: 'Completed / Reviewed', value: completedCount, color: '#40c057' },
        { name: 'Pending Review', value: pendingCount, color: '#fab005' }
      ];

      // Group-wise performance data for Bar Chart
      const groupMap = {};
      assessments.forEach((item) => {
        const groupKey = `Group ${item.groupNumber || 1}`;
        if (!groupMap[groupKey]) {
          groupMap[groupKey] = { totalScore: 0, count: 0 };
        }
        if (item.finalScore > 0) {
          groupMap[groupKey].totalScore += item.finalScore;
          groupMap[groupKey].count += 1;
        }
      });

      const groupPerformanceData = Object.keys(groupMap).map((groupName) => {
        const stats = groupMap[groupName];
        const avg = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
        return { group: groupName, averageScore: avg };
      });

      // Format assessments list for the audit trail table
      const formattedAssessments = assessments.map((item) => ({
        ...item,
        evaluations: (item.evaluations || []).map((ev) => ({
          ...ev,
          evaluatorName: ev.adminId?.name || 'Admin'
        }))
      }));

      return {
        success: true,
        metrics: {
          totalSubmissions,
          multiAdminCount,
          overallAverageScore,
          activeGroupsCount
        },
        statusData,
        groupPerformanceData,
        assessments: formattedAssessments
      };
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw new Error('Failed to generate analytics report.');
    }
  }
}