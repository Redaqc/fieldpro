/**
 * Storage Routes
 * File upload and management endpoints
 */

import express from 'express';
import multer from 'multer';
import * as storageService from '../services/storage.js';
import { badRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * POST /api/storage/upload
 * Upload single file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    throw badRequest('No file uploaded');
  }

  const folder = req.body.folder || 'general';
  const result = await storageService.uploadFile(req.file, folder);

  res.json(result);
});

/**
 * POST /api/storage/upload-multiple
 * Upload multiple files
 */
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw badRequest('No files uploaded');
  }

  const folder = req.body.folder || 'general';
  const results = await storageService.uploadMultipleFiles(req.files, folder);

  res.json({
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
});

/**
 * DELETE /api/storage/delete
 * Delete file
 * Body: { file_url }
 */
router.delete('/delete', async (req, res) => {
  const { file_url } = req.body;

  if (!file_url) {
    throw badRequest('File URL is required');
  }

  await storageService.deleteFile(file_url);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});

/**
 * GET /api/storage/signed-url/:key
 * Get signed URL for private file (S3 only)
 */
router.get('/signed-url/:key', (req, res) => {
  const { key } = req.params;
  const expiresIn = parseInt(req.query.expires) || 3600;

  const signedUrl = storageService.getSignedUrl(key, expiresIn);

  res.json({
    url: signedUrl,
    expires_in: expiresIn
  });
});

export default router;
