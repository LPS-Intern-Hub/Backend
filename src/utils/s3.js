const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload file to S3 bucket
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - File name with path (e.g., 'presences/123456.jpg')
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise} - S3 upload result with Location (URL)
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
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
    throw error;
  }
};

/**
 * Delete file from S3 bucket
 * @param {string} fileKey - File key/path in S3 (e.g., 'presences/123456.jpg')
 * @returns {Promise}
 */
const deleteFromS3 = async (fileKey) => {
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
    throw error;
  }
};

module.exports = {
  s3Client,
  uploadToS3,
  deleteFromS3
};
