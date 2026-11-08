import {
  UniversityResDTO,
  DepartmentResDTO,
  SemesterResDTO,
  CourseResDTO,
  LectureResDTO,
  EnrollmentResDTO,
  ProgressResDTO,
  CertificateResDTO,
  MessageResDTO,
} from "./university.res.js";

export class UniversityMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new UniversityResDTO(doc);
  }
}

export class DepartmentMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new DepartmentResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(DepartmentMapper.toDTO) : [];
  }
}

export class SemesterMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new SemesterResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(SemesterMapper.toDTO) : [];
  }
}

export class CourseMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new CourseResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(CourseMapper.toDTO) : [];
  }
}

export class LectureMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new LectureResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(LectureMapper.toDTO) : [];
  }
}

export class EnrollmentMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new EnrollmentResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(EnrollmentMapper.toDTO) : [];
  }
}

export class ProgressMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new ProgressResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(ProgressMapper.toDTO) : [];
  }
}

export class CertificateMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new CertificateResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(CertificateMapper.toDTO) : [];
  }
}

export class MessageMapper {
  static toDTO(doc) {
    if (!doc) return null;
    return new MessageResDTO(doc);
  }
  static toDTOList(docs) {
    return Array.isArray(docs) ? docs.map(MessageMapper.toDTO) : [];
  }
}
