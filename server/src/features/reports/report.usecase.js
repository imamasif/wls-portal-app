import mongoose from 'mongoose';

export class ReportUseCase {
  // 1. User Demographics & Status (Great for Pie/Bar Charts)
  static async getUserAnalytics() {
    const UserModel = mongoose.models.User;
    if (!UserModel) throw new Error('User model not initialized.');

    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });

    // Aggregation for Role Distribution (Pie Chart data)
    const roleDistribution = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { _id: 0, role: '$_id', count: 1 } }
    ]);

    // Aggregation for Country Distribution (Bar/Map Chart data)
    const countryDistribution = await UserModel.aggregate([
      { $match: { country: { $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $project: { _id: 0, country: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    return {
      totalUsers,
      activeUsers,
      roleDistribution,
      countryDistribution
    };
  }

  // 2. Assessment Results Analytics (Great for Line/Bar Graphs)
  static async getAssessmentAnalytics() {
    const AssessmentModel = mongoose.models.Assessment || mongoose.model('Assessment');
    if (!AssessmentModel) {
      return { totalAssessments: 0, averageScore: 0, scoreDistribution: [] };
    }

    const totalAssessments = await AssessmentModel.countDocuments();
    
    const stats = await AssessmentModel.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' }
        }
      }
    ]);

    const averageScore = stats.length > 0 ? Math.round(stats[0].averageScore * 100) / 100 : 0;

    // Score ranges distribution for graph plotting
    const scoreDistribution = await AssessmentModel.aggregate([
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 50, 70, 85, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    return {
      totalAssessments,
      averageScore,
      scoreDistribution
    };
  }

  // 3. Reporting Groups Performance Summary
  static async getGroupPerformanceReports() {
    const GroupModel = mongoose.models.Group || mongoose.model('Group');
    if (!GroupModel) return [];

    return await GroupModel.aggregate([
      {
        $lookup: {
          from: 'assessments',
          localField: '_id',
          foreignField: 'groupId',
          as: 'assessments'
        }
      },
      {
        $project: {
          groupId: '$_id',
          groupName: '$name',
          memberCount: { $size: { $ifNull: ['$members', []] } },
          averageGroupScore: { $avg: '$assessments.score' }
        }
      }
    ]);
  }
}

export const reportUseCase = ReportUseCase;