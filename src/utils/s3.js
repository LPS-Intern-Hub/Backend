const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Validate AWS configuration
const validateAWSConfig = () => {
  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
  const missing = required.filter(key => !process.env[key] || process.env[key].startsWith('your-'));
  
  if (missing.length > 0) {
    console.warn('⚠️  AWS S3 not configured properly. Missing or placeholder values for:', missing.join(', '));
    console.warn('📝 Please update .env file with valid AWS credentials');
    return false;
  }
  return true;
};

const isS3Configured = validateAWSConfig();

// Configure AWS S3 Client (v3)
const s3Client = isS3Configured ? new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}) : null;

/**
 * Upload file to S3 bucket
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - File name with path (e.g., 'presences/123456.jpg')
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise} - S3 upload result with Location (URL)
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  // Fallback: Save to local if S3 not configured
  if (!isS3Configured || !s3Client) {
    console.warn('⚠️  S3 not configured, saving file locally instead');
    const localPath = `/uploads/${fileName}`;
    console.log('💾 Local path:', localPath);
    return { Location: localPath };
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType
    // ACL dihapus karena bucket menggunakan "Bucket owner enforced"
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    // Construct URL manually (v3 tidak return Location secara otomatis)
    const location = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${fileName}`;
    console.log('✅ File uploaded to S3:', location);
    
    return { Location: location };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    // Fallback to local path on error
    const localPath = `/uploads/${fileName}`;
    console.warn('⚠️  Falling back to local path:', localPath);
    return { Location: localPath };
  }
};

/**
 * Delete file from S3 bucket
 * @param {string} fileKey - File key/path in S3 (e.g., 'presences/123456.jpg')
 * @returns {Promise}
 */
const deleteFromS3 = async (fileKey) => {
  if (!isS3Configured || !s3Client) {
    console.warn('⚠️  S3 not configured, skipping delete');
    return;
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log('✅ File deleted from S3:', fileKey);
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    // Don't throw error on delete failure
  }
};

module.exports = {
  s3Client,
  uploadToS3,
  deleteFromS3,
  isS3Configured
};
