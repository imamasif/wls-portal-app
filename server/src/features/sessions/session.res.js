export class SessionResDTO {
  constructor(session) {
    this.id = session._id ? session._id.toString() : session.id;
    this.week = session.week;
    this.topicTitle = session.topicTitle;
    this.verseSequences = session.verseSequences || [];
    this.createdAt = session.createdAt;
  }
}