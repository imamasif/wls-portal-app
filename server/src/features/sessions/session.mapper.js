import { CreateSessionReqDTO, UpdateSessionReqDTO } from './session.req.js';
import { SessionResDTO } from './session.res.js';

export class SessionMapper {
  static toCreateReqDTO(body) {
    return new CreateSessionReqDTO(body);
  }

  static toUpdateReqDTO(body) {
    return new UpdateSessionReqDTO(body);
  }

  static toResDTO(domainEntity) {
    if (!domainEntity) return null;
    return new SessionResDTO(domainEntity);
  }

  static toResDTOList(domainEntities) {
    return domainEntities.map(entity => this.toResDTO(entity));
  }
}