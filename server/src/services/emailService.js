const nodemailer = require('nodemailer');

/**
 * Email Service - Gửi email OTP xác thực
 * Sử dụng Nodemailer với Gmail
 */

// Tạo transporter với cấu hình Gmail
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('⚠️ [EMAIL SERVICE] Chưa cấu hình EMAIL_USER hoặc EMAIL_APP_PASSWORD trong .env');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Gửi email chứa mã OTP
 * @param {string} to - Email người nhận
 * @param {string} otpCode - Mã OTP 6 số
 * @returns {Promise<boolean>} - true nếu gửi thành công
 */
const sendOtpEmail = async (to, otpCode) => {
  const transporter = createTransporter();
  
  // Nếu chưa cấu hình email, throw error
  if (!transporter) {
    throw new Error('Email service chưa được cấu hình. Vui lòng kiểm tra EMAIL_USER và EMAIL_APP_PASSWORD trong .env');
  }

  try {
    const mailOptions = {
      from: {
        name: 'Travelling App',
        address: process.env.EMAIL_USER,
      },
      to,
      subject: 'Mã xác thực OTP - Travelling App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background-color: #f8f9fa;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #667eea;
              font-family: 'Courier New', monospace;
            }
            .info-text {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-title {
              font-weight: 600;
              color: #856404;
              margin: 0 0 5px 0;
            }
            .warning-text {
              color: #856404;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .divider {
              height: 1px;
              background-color: #e9ecef;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✈️ Travelling App</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Xác thực tài khoản của bạn</h2>
              <p style="color: #666; font-size: 16px;">
                Chào bạn! Chúng tôi đã nhận được yêu cầu tạo tài khoản với email này.
              </p>
              
              <p style="color: #666; font-size: 16px;">
                Vui lòng sử dụng mã OTP bên dưới để hoàn tất đăng ký:
              </p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <div class="info-text">Mã này có hiệu lực trong <strong>3 phút</strong></div>
              </div>
              
              <div class="warning">
                <p class="warning-title">⚠️ Lưu ý bảo mật</p>
                <p class="warning-text">
                  Không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên Travelling App. 
                  Chúng tôi sẽ không bao giờ yêu cầu mã OTP qua điện thoại hoặc email.
                </p>
              </div>
              
              <div class="divider"></div>
              
              <p style="color: #999; font-size: 14px; margin-bottom: 0;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Travelling App. All rights reserved.
              </p>
              <p style="margin: 0;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Travelling App - Mã xác thực OTP

Xin chào!

Mã OTP của bạn là: ${otpCode}

Mã này có hiệu lực trong 3 phút.

⚠️ Lưu ý bảo mật:
Không chia sẻ mã OTP này với bất kỳ ai. Travelling App sẽ không bao giờ yêu cầu mã OTP qua điện thoại hoặc email.

Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.

---
© ${new Date().getFullYear()} Travelling App
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL SERVICE] Email OTP đã được gửi thành công');
    console.log(`   → To: ${to}`);
    console.log(`   → Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Lỗi khi gửi email:', error.message);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
};
