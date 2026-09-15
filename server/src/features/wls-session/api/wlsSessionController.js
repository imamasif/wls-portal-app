const validateCreateReq = require('./schemas/createWlsSession.ajv');
const CreateWlsSessionReqDto = require('../dto/req/CreateWlsSessionReqDto');

class WlsSessionController {
  constructor({ createWlsSessionUseCase, deleteWlsSessionUseCase }) {
    this.createWlsSessionUseCase = createWlsSessionUseCase;
    this.deleteWlsSessionUseCase = deleteWlsSessionUseCase;
  }

  create = async (req, res) => {
    const valid = validateCreateReq(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateReq.errors });
    }

    const dto = new CreateWlsSessionReqDto(req.body);
    const result = await this.createWlsSessionUseCase.execute(dto);
    return res.status(201).json(result);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const result = await this.deleteWlsSessionUseCase.execute(id);
    if (!result.success) {
      return res.status(400).json({ message: result.reason });
    }
    return res.status(200).json({ message: 'Session successfully deleted' });
  };
}

module.exports = WlsSessionController;