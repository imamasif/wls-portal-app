export class UserAnalyticsResDTO {
  constructor(data) {
    this.totalUsers = data.totalUsers || 0;
    this.activeUsers = data.activeUsers || 0;
    this.roleDistribution = data.roleDistribution || [];
    this.countryDistribution = data.countryDistribution || [];
  }
}

export class AssessmentAnalyticsResDTO {
  constructor(data) {
    this.totalAssessments = data.totalAssessments || 0;
    this.averageScore = data.averageScore || 0;
    this.scoreDistribution = data.scoreDistribution || [];
  }
}

export class GroupReportResDTO {
  constructor(data) {
    this.groupId = data.groupId || '';
    this.groupName = data.groupName || '';
    this.memberCount = data.memberCount || 0;
    this.averageGroupScore = data.averageGroupScore || 0;
  }
}