export class CreateSessionReqDTO {
  constructor({ week, topicTitle, verseSequences }) {
    this.week = week;
    this.topicTitle = topicTitle;
    this.verseSequences = verseSequences || [];
  }
}

export class UpdateSessionReqDTO {
  constructor(payload) {
    if (payload.week) this.week = payload.week;
    if (payload.topicTitle) this.topicTitle = payload.topicTitle;
    if (payload.verseSequences) this.verseSequences = payload.verseSequences;
  }
}