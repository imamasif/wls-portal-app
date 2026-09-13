import express from 'express';
import { UserUseCase } from './domain/user.usecase.js';
import { UserMapper } from './domain/user.mapper.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';
import { CreateUserSchema, UpdateUserSchema } from './dto/user.schema.js';

const router = express.Router();

router.post('/', validateSchema(CreateUserSchema), async (req, res) => {
  try {
    const dto = UserMapper.toCreateReqDTO(req.body);
    const created = await UserUseCase.createUser(dto);
    res.status(201).json(UserMapper.toResDTO(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await UserUseCase.getAllUsers();
    res.json(UserMapper.toResDTOList(users));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await UserUseCase.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(UserMapper.toResDTO(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateSchema(UpdateUserSchema), async (req, res) => {
  try {
    const dto = UserMapper.toUpdateReqDTO(req.body);
    const updated = await UserUseCase.updateUser(req.params.id, dto);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(UserMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await UserUseCase.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;