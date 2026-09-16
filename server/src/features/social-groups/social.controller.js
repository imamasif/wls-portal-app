import express from 'express';
import { socialGroupUseCase } from './social.usecase.js';
import { SocialMapper } from './social.mapper.js';
import { CreateSocialGroupSchema, UpdateSocialGroupSchema, AssignSocialMemberSchema } from './social.schema.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';

const router = express.Router();

router.post('/', validateSchema(CreateSocialGroupSchema), async (req, res) => {
  try {
    const dto = SocialMapper.toCreateReqDTO(req.body);
    const created = await socialGroupUseCase.createGroup(dto);
    res.status(201).json(SocialMapper.toResDTO(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const groups = await socialGroupUseCase.getAllGroups();
    res.json(SocialMapper.toResDTOList(groups));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const group = await socialGroupUseCase.getGroupById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Social group not found' });
    res.json(SocialMapper.toResDTO(group));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateSchema(UpdateSocialGroupSchema), async (req, res) => {
  try {
    const dto = SocialMapper.toUpdateReqDTO(req.body);
    const updated = await socialGroupUseCase.updateGroup(req.params.id, dto);
    if (!updated) return res.status(404).json({ message: 'Social group not found' });
    res.json(SocialMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await socialGroupUseCase.deleteGroup(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Social group not found' });
    res.json({ message: 'Social group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:groupId/members', validateSchema(AssignSocialMemberSchema), async (req, res) => {
  try {
    const dto = SocialMapper.toAssignMemberReqDTO(req.body);
    const updated = await socialGroupUseCase.assignMember(req.params.groupId, dto);
    if (!updated) return res.status(404).json({ message: 'Social group not found' });
    res.json(SocialMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const updated = await socialGroupUseCase.removeMember(req.params.groupId, req.params.userId);
    if (!updated) return res.status(404).json({ message: 'Social group not found' });
    res.json(SocialMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;