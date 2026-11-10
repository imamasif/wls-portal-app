import {
  SaveDailyReportReqDTO,
  AddAreaReqDTO,
  RenameAreaReqDTO,
  AddTaskReqDTO,
  UpdateTaskReqDTO,
} from "./buildingMaintenance.req.js";
import {
  BuildingMaintenanceResDTO,
  BuildingMaintenanceDateListResDTO,
} from "./buildingMaintenance.res.js";

export class BuildingMaintenanceMapper {
  static toSaveDailyReportReqDTO(body) {
    return new SaveDailyReportReqDTO(body);
  }

  static toAddAreaReqDTO(body) {
    return new AddAreaReqDTO(body);
  }

  static toRenameAreaReqDTO(body) {
    return new RenameAreaReqDTO(body);
  }

  static toAddTaskReqDTO(body) {
    return new AddTaskReqDTO(body);
  }

  static toUpdateTaskReqDTO(body) {
    return new UpdateTaskReqDTO(body);
  }

  static toBuildingMaintenanceResDTO(doc) {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    return new BuildingMaintenanceResDTO(docObj);
  }

  static toBuildingMaintenanceDateListResDTO(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map((doc) => {
      const docObj = doc.toObject ? doc.toObject() : doc;
      return new BuildingMaintenanceDateListResDTO(docObj);
    });
  }
}
