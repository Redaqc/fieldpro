/**
 * File Storage Service
 * Handle file uploads to AWS S3 or local storage
 * Replaces Base44 storage functionality
 */

import AWS from 'aws-sdk';
import fs from 'fs/promises';
import path from 'path';
import { badRequest } from '../middleware/errorHandler.js';

// Storage configuration
const storageType = process.env.STORAGE_TYPE || 'local'; // 'local' or 's3'
const localStoragePath = process.env.LOCAL_STORAGE_PATH || './uploads';

// S3 configuration
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET
};

let s3Client = null;

function getS3Client() {
  if (!s3Client && s3Config.accessKeyId && s3Config.secretAccessKey) {
    AWS.config.update({
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      region: s3Config.region
    });
    s3Client = new AWS.S3();
  }
  return s3Client;
}

/**
 * Upload file
 * @param {Object} file - File object (from multer)
 * @param {string} folder - Folder path
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFile(file, folder = 'general') {
  if (!file) {
    throw badRequest('File is required');
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = `${folder}/${filename}`;

  if (storageType === 's3') {
    return await uploadToS3(file, filepath);
  } else {
    return await uploadToLocal(file, filepath);
  }
}

/**
 * Upload to S3
 */
async function uploadToS3(file, filepath) {
  const s3 = getS3Client();

  if (!s3) {
    throw new Error('S3 not configured');
  }

  const params = {
    Bucket: s3Config.bucket,
    Key: filepath,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  try {
    const result = await s3.upload(params).promise();

    return {
      success: true,
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Upload to local storage
 */
async function uploadToLocal(file, filepath) {
  try {
    // Ensure directory exists
    const dir = path.join(localStoragePath, path.dirname(filepath));
    await fs.mkdir(dir, { recursive: true });

    // Write file
    const fullPath = path.join(localStoragePath, filepath);
    await fs.writeFile(fullPath, file.buffer);

    return {
      success: true,
      url: `/storage/${filepath}`,
      path: fullPath,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('Local storage error:', error);
    throw new Error(`Failed to upload to local storage: ${error.message}`);
  }
}

/**
 * Delete file
 * @param {string} fileUrl - File URL or key
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(fileUrl) {
  if (!fileUrl) {
    throw badRequest('File URL is required');
  }

  if (storageType === 's3') {
    return await deleteFromS3(fileUrl);
  } else {
    return await deleteFromLocal(fileUrl);
  }
}

/**
 * Delete from S3
 */
async function deleteFromS3(fileUrl) {
  const s3 = getS3Client();

  if (!s3) {
    throw new Error('S3 not configured');
  }

  // Extract key from URL
  const key = fileUrl.includes(s3Config.bucket)
    ? fileUrl.split(`${s3Config.bucket}/`)[1]
    : fileUrl;

  const params = {
    Bucket: s3Config.bucket,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
}

/**
 * Delete from local storage
 */
async function deleteFromLocal(fileUrl) {
  try {
    // Extract path from URL
    const relativePath = fileUrl.replace('/storage/', '');
    const fullPath = path.join(localStoragePath, relativePath);

    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Local storage delete error:', error);
    throw new Error(`Failed to delete from local storage: ${error.message}`);
  }
}

/**
 * Get file URL
 * @param {string} filepath - File path
 * @returns {string} Public URL
 */
export function getFileUrl(filepath) {
  if (storageType === 's3') {
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${filepath}`;
  } else {
    return `/storage/${filepath}`;
  }
}

/**
 * Upload multiple files
 * @param {Array} files - Array of file objects
 * @param {string} folder - Folder path
 * @returns {Promise<Array>} Upload results
 */
export async function uploadMultipleFiles(files, folder = 'general') {
  if (!files || files.length === 0) {
    throw badRequest('Files are required');
  }

  const results = [];

  for (const file of files) {
    try {
      const result = await uploadFile(file, folder);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        filename: file.originalname,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get signed URL for private file (S3 only)
 * @param {string} key - S3 key
 * @param {number} expiresIn - Expiration in seconds (default 1 hour)
 * @returns {string} Signed URL
 */
export function getSignedUrl(key, expiresIn = 3600) {
  if (storageType !== 's3') {
    throw new Error('Signed URLs only available for S3 storage');
  }

  const s3 = getS3Client();
  if (!s3) {
    throw new Error('S3 not configured');
  }

  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Expires: expiresIn
  };

  return s3.getSignedUrl('getObject', params);
}

export default {
  uploadFile,
  deleteFile,
  getFileUrl,
  uploadMultipleFiles,
  getSignedUrl
};
