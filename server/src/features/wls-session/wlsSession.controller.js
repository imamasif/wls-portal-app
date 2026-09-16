import { validateCreateWlsSession } from './wlsSession.schema.js';
import { CreateWlsSessionReqDto } from './wlsSession.req.js';

export class WlsSessionController {
  constructor(useCase) {
    this.useCase = useCase;
  }

  getAll = async (req, res) => {
    try {
      const data = await this.useCase.getAllSessions();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  create = async (req, res) => {
    if (!validateCreateWlsSession(req.body)) {
      return res.status(400).json({ errors: validateCreateWlsSession.errors });
    }
    try {
      const dto = new CreateWlsSessionReqDto(req.body);
      const result = await this.useCase.createSession(dto);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  updateStatus = async (req, res) => {
    try {
      const { status, cancelReason } = req.body;
      const result = await this.useCase.updateStatus(req.params.id, status, cancelReason);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      await this.useCase.deleteSession(req.params.id);
      res.json({ message: 'Session deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const dto = new CreateWlsSessionReqDto(req.body);
      const result = await this.useCase.updateSession(req.params.id, dto);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}