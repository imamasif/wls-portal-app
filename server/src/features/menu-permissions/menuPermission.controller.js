import express from 'express';
import { menuPermissionUseCase } from './menuPermission.usecase.js';
import { MenuPermissionMapper } from './menuPermission.mapper.js';
import { CreateMenuPermissionSchema, UpdateMenuPermissionSchema } from './menuPermission.schema.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const role = req.query.role;
    const permissions = role ? await menuPermissionUseCase.getByRole(role) : await menuPermissionUseCase.getAll();
    res.json(MenuPermissionMapper.toResDTOList(permissions));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', validateSchema(CreateMenuPermissionSchema), async (req, res) => {
  try {
    const dto = MenuPermissionMapper.toCreateReq(req.body);
    const created = await menuPermissionUseCase.create(dto);
    res.status(201).json(MenuPermissionMapper.toResDTO(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateSchema(UpdateMenuPermissionSchema), async (req, res) => {
  try {
    const dto = MenuPermissionMapper.toUpdateReq(req.body);
    const updated = await menuPermissionUseCase.update(req.params.id, dto);
    if (!updated) return res.status(404).json({ message: 'Menu permission not found' });
    res.json(MenuPermissionMapper.toResDTO(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await menuPermissionUseCase.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Menu permission not found' });
    res.json({ message: 'Menu permission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;