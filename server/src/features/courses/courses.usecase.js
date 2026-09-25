// server/src/features/courses/course.usecase.js
import { CourseModel } from "./courses.model.js";

export class CourseUseCase {
  async create(payload) {
    const course = new CourseModel(payload);
    return await course.save();
  }

  async getAll() {
    return await CourseModel.find({});
  }

  async addTopicOrLecture(courseId, topicName, lectureData) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    let topic = course.topics.find((t) => t.topicName === topicName);
    if (topic) {
      topic.lectures.push(lectureData);
    } else {
      course.topics.push({
        topicName,
        lectures: [lectureData],
      });
    }

    return await course.save();
  }

  async removeLecture(courseId, lectureId) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    for (let topic of course.topics) {
      topic.lectures = topic.lectures.filter((l) => !l._id.equals(lectureId));
    }

    return await course.save();
  }
}
