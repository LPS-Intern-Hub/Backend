const nodemailer = require('nodemailer');

// Create Mailtrap transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/new-password/${resetToken}`;

    const mailOptions = {
        from: '"SIMAGANG Support" <noreply@simagang.com>',
        to: email,
        subject: 'Reset Password - SIMAGANG',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content p {
            margin: 0 0 20px;
            font-size: 16px;
            color: #555;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            padding: 14px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #777;
          }
          .footer p {
            margin: 5px 0;
          }
          .link-text {
            word-break: break-all;
            color: #667eea;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Password</h1>
          </div>
          <div class="content">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mereset password akun SIMAGANG Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="info-box">
              <p><strong>Link ini akan kadaluarsa dalam 1 jam</strong></p>
              <p>Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>
            </div>
            
            <p style="margin-top: 30px;">Atau copy dan paste link berikut ke browser Anda:</p>
            <p class="link-text">${resetUrl}</p>
          </div>
          <div class="footer">
            <p><strong>SIMAGANG - Sistem Manajemen Magang</strong></p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

module.exports = {
    sendPasswordResetEmail
};
