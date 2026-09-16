import { CreateSocialGroupReqDTO, UpdateSocialGroupReqDTO, AssignSocialMemberReqDTO } from './social.req.js';
import { SocialGroupResDTO } from './social.res.js';

export class SocialMapper {
  static toCreateReqDTO(body) {
    return new CreateSocialGroupReqDTO(body);
  }

  static toUpdateReqDTO(body) {
    return new UpdateSocialGroupReqDTO(body);
  }

  static toAssignMemberReqDTO(body) {
    return new AssignSocialMemberReqDTO(body);
  }

  static toResDTO(domainEntity) {
    if (!domainEntity) return null;
    return new SocialGroupResDTO(domainEntity);
  }

  static toResDTOList(domainEntities) {
    return domainEntities.map(entity => this.toResDTO(entity));
  }
}