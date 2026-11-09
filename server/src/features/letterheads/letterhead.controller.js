import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  mergeDocxWithTemplate,
  generatePdfFromDocx,
  generateCustomizedDocument,
  mergeTwoFilesToDocxAndPdf,
} from './letterhead.service.js';

const router = express.Router();

const uploadsDir = path.resolve('server/uploads');
const generatedDir = path.resolve('server/generated_documents');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.docx';
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Middleware: restrict to SUPER_USER
function requireSuperUser(req, res, next) {
  const role = (
    req.headers['x-user-role'] ||
    req.headers['role'] ||
    req.body?.userRole ||
    req.query?.userRole ||
    ''
  ).toUpperCase();

  if (
    role === 'SUPER_USER' ||
    role === 'UNIVERSITY_SUPER_USER' ||
    role.includes('SUPER')
  ) {
    return next();
  }

  if (req.user && (req.user.role === 'SUPER_USER' || req.user.role === 'university_super_user')) {
    return next();
  }

  return res.status(403).json({
    error: 'Access Denied: Only Super Users are authorized to access Letterhead Studio.',
  });
}

// 1. Generate Letterhead for Card 1 (IIPC) & Card 2 (BP)
router.post('/generate', upload.single('file'), requireSuperUser, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please provide a Word document (.docx) to apply letterhead.' });
    }

    const templateType = (req.body.template || 'iipc').toLowerCase();
    const includeBismillah = req.body.includeBismillah === 'true' || req.body.includeBismillah === true;
    const includeWatermark = req.body.includeWatermark === 'true' || req.body.includeWatermark === true;
    const customDate = req.body.customDate || null;

    const assetsDir = path.resolve('server/src/features/letterheads/assets');
    const templatePath =
      templateType === 'bp'
        ? path.join(assetsDir, 'bp_template.docx')
        : path.join(assetsDir, 'iipc_template.docx');

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: `Letterhead template file not found for ${templateType}.` });
    }

    const docId = `lh_${templateType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const outputDocxPath = path.join(generatedDir, `${docId}.docx`);
    const outputPdfPath = path.join(generatedDir, `${docId}.pdf`);

    // 1. Merge docx with letterhead
    await mergeDocxWithTemplate(templatePath, req.file.path, outputDocxPath, {
      includeBismillah,
      includeWatermark,
    });

    // 2. Generate PDF conversion
    await generatePdfFromDocx(req.file.path, templateType, outputPdfPath, {
      includeBismillah,
      includeWatermark,
      date: customDate,
    });

    // Clean up uploaded temp file
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (cleanErr) {
      console.warn('Upload cleanup note:', cleanErr.message);
    }

    const originalBase = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const prefix = templateType === 'bp' ? 'BP_Letterhead' : 'IIPC_Letterhead';

    return res.status(200).json({
      success: true,
      docId,
      template: templateType,
      docxUrl: `/api/letterheads/download/${docId}/docx`,
      pdfUrl: `/api/letterheads/download/${docId}/pdf`,
      previewUrl: `/api/letterheads/preview/${docId}`,
      docxName: `${prefix}_${originalBase}.docx`,
      pdfName: `${prefix}_${originalBase}.pdf`,
    });
  } catch (err) {
    console.error('Error generating letterhead:', err);
    return res.status(500).json({ error: err.message || 'Failed to process document letterhead' });
  }
});

// 2. Card 3: Advanced Document Customizer & E-Signature Studio
router.post('/customize', upload.single('file'), requireSuperUser, async (req, res) => {
  try {
    const baseType = (req.body.baseType || 'blank').toLowerCase();
    let elements = [];
    try {
      elements = typeof req.body.elements === 'string' ? JSON.parse(req.body.elements) : req.body.elements || [];
    } catch {
      elements = [];
    }

    let options = {};
    try {
      options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options || {};
    } catch {
      options = {};
    }

    const docId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const outputDocxPath = path.join(generatedDir, `${docId}.docx`);
    const outputPdfPath = path.join(generatedDir, `${docId}.pdf`);

    const userDocxPath = req.file ? req.file.path : null;

    await generateCustomizedDocument({
      baseType,
      userDocxPath,
      elements,
      options,
      outputDocxPath,
      outputPdfPath,
    });

    if (userDocxPath && fs.existsSync(userDocxPath)) {
      try {
        fs.unlinkSync(userDocxPath);
      } catch (cleanErr) {
        console.warn('Upload cleanup note:', cleanErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      docId,
      docxUrl: `/api/letterheads/download/${docId}/docx`,
      pdfUrl: `/api/letterheads/download/${docId}/pdf`,
      previewUrl: `/api/letterheads/preview/${docId}`,
      docxName: `Customized_Document_${Date.now()}.docx`,
      pdfName: `Customized_Document_${Date.now()}.pdf`,
    });
  } catch (err) {
    console.error('Error generating custom document:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate customized document' });
  }
});

// 3. CARD 4: Universal Two-Files Merger (User Template + User Content)
router.post(
  '/merge-two-files',
  upload.fields([
    { name: 'templateFile', maxCount: 1 },
    { name: 'contentFile', maxCount: 1 },
  ]),
  requireSuperUser,
  async (req, res) => {
    try {
      const templateFile = req.files?.templateFile?.[0];
      const contentFile = req.files?.contentFile?.[0];

      if (!templateFile) {
        return res.status(400).json({ error: 'Please provide File 1: The Template Document (.docx) with header/footer.' });
      }
      if (!contentFile) {
        return res.status(400).json({ error: 'Please provide File 2: The Content Document (.docx or .txt) with body text.' });
      }

      const docId = `lh_merge_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const outputDocxPath = path.join(generatedDir, `${docId}.docx`);
      const outputPdfPath = path.join(generatedDir, `${docId}.pdf`);

      await mergeTwoFilesToDocxAndPdf({
        templateFilePath: templateFile.path,
        contentFilePath: contentFile.path,
        outputDocxPath,
        outputPdfPath,
      });

      // Cleanup uploads
      try {
        if (fs.existsSync(templateFile.path)) fs.unlinkSync(templateFile.path);
        if (fs.existsSync(contentFile.path)) fs.unlinkSync(contentFile.path);
      } catch (cleanErr) {
        console.warn('Cleanup note:', cleanErr.message);
      }

      const tplBase = path.basename(templateFile.originalname, path.extname(templateFile.originalname));
      const cntBase = path.basename(contentFile.originalname, path.extname(contentFile.originalname));

      return res.status(200).json({
        success: true,
        docId,
        docxUrl: `/api/letterheads/download/${docId}/docx`,
        pdfUrl: `/api/letterheads/download/${docId}/pdf`,
        previewUrl: `/api/letterheads/preview/${docId}`,
        docxName: `Merged_${tplBase}_${cntBase}.docx`,
        pdfName: `Merged_${tplBase}_${cntBase}.pdf`,
      });
    } catch (err) {
      console.error('Two-files merge error:', err);
      return res.status(500).json({ error: err.message || 'Failed to merge template and content documents' });
    }
  }
);

// 4. Download Generated File
router.get('/download/:id/:type', (req, res) => {
  try {
    const { id, type } = req.params;
    const safeType = type === 'pdf' ? 'pdf' : 'docx';
    const filePath = path.join(generatedDir, `${id}.${safeType}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Requested file not found or expired.' });
    }

    const downloadName = req.query.name || `Document_${id}.${safeType}`;
    return res.download(filePath, downloadName);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Stream PDF for in-browser preview
router.get('/preview/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(generatedDir, `${id}.pdf`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF preview not found.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (err) {
    console.error('Preview error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
