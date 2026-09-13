import { CreateUserReqDTO, UpdateUserReqDTO } from '../dto/user.req.js';
import { UserResDTO } from '../dto/user.res.js';

export class UserMapper {
  static toCreateReqDTO(body) {
    return new CreateUserReqDTO(body);
  }

  static toUpdateReqDTO(body) {
    return new UpdateUserReqDTO(body);
  }

  static toResDTO(domainEntity) {
    if (!domainEntity) return null;
    return new UserResDTO(domainEntity);
  }

  static toResDTOList(domainEntities) {
    return domainEntities.map(entity => this.toResDTO(entity));
  }
}