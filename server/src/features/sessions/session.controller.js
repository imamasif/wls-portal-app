import express from 'express';
import { sessionUseCase } from './session.usecase.js';
import { SessionMapper } from './session.mapper.js';
import { CreateSessionSchema, UpdateSessionSchema } from './session.schema.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';

const router = express.Router();

router.post('/', validateSchema(CreateSessionSchema), async (req, res) => {
  try {
    const dto = SessionMapper.toCreateReqDTO(req.body);
    const created = await sessionUseCase.createSession(dto);
    res.status(201).json(SessionMapper.toResDTO(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const sessions = await sessionUseCase.getAllSessions();
    res.json(SessionMapper.toResDTOList(sessions));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await sessionUseCase.getSessionById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(SessionMapper.toResDTO(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateSchema(UpdateSessionSchema), async (req, res) => {
  try {
    const dto = SessionMapper.toUpdateReqDTO(req.body);
    const updated = await sessionUseCase.updateSession(req.params.id, dto);
    if (!updated) return res.status(404).json({ message: 'Session not found' });
    res.json(SessionMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await sessionUseCase.deleteSession(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;