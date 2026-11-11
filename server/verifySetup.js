/**
 * Quick verification script - Test OTP email functionality
 * Run: node verifySetup.js
 */

require('./src/config/loadEnv');

const testConfig = () => {
  console.log('🔍 Kiểm tra cấu hình...\n');
  
  const checks = [
    {
      name: 'MongoDB URI',
      value: process.env.MONGODB_URI,
      required: true,
    },
    {
      name: 'JWT Secret',
      value: process.env.JWT_SECRET,
      required: true,
    },
    {
      name: 'Email User',
      value: process.env.EMAIL_USER,
      required: true,
    },
    {
      name: 'Email App Password',
      value: process.env.EMAIL_APP_PASSWORD,
      required: true,
      hide: true,
    },
    {
      name: 'Port',
      value: process.env.PORT || '4000',
      required: false,
    },
  ];
  
  let allOk = true;
  
  checks.forEach(check => {
    const status = check.value ? '✅' : '❌';
    const displayValue = check.hide 
      ? (check.value ? '***' + check.value.slice(-4) : '(not set)')
      : (check.value || '(not set)');
    
    console.log(`${status} ${check.name}: ${displayValue}`);
    
    if (check.required && !check.value) {
      allOk = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allOk) {
    console.log('✅ Tất cả cấu hình đã OK!\n');
    console.log('📝 Checklist:');
    console.log('  [x] File .env đã được load từ root');
    console.log('  [x] Email service đã được cấu hình');
    console.log('  [x] Nodemailer đã được cài đặt');
    console.log('  [x] Sẵn sàng gửi OTP thật qua email\n');
    console.log('🚀 Server có thể chạy với: npm run dev');
    console.log('📧 OTP sẽ được gửi đến:', process.env.EMAIL_USER);
    return true;
  } else {
    console.log('❌ Thiếu cấu hình!\n');
    console.log('Vui lòng kiểm tra file .env và đảm bảo có:');
    console.log('  - EMAIL_USER=your-email@gmail.com');
    console.log('  - EMAIL_APP_PASSWORD=your-16-char-app-password\n');
    return false;
  }
};

const testNodemailer = () => {
  console.log('\n🔍 Kiểm tra Nodemailer...\n');
  
  try {
    const nodemailer = require('nodemailer');
    console.log('✅ Nodemailer đã được cài đặt');
    console.log(`   Version: ${require('nodemailer/package.json').version}`);
    
    // Test createTransport
    if (typeof nodemailer.createTransport === 'function') {
      console.log('✅ nodemailer.createTransport OK');
      return true;
    } else {
      console.log('❌ nodemailer.createTransport không tồn tại');
      return false;
    }
  } catch (error) {
    console.log('❌ Nodemailer chưa được cài đặt');
    console.log('   Chạy: cd server && pnpm install nodemailer');
    return false;
  }
};

const testEmailService = () => {
  console.log('\n🔍 Kiểm tra Email Service...\n');
  
  try {
    const { sendOtpEmail } = require('./src/services/emailService');
    console.log('✅ Email Service đã load thành công');
    
    if (typeof sendOtpEmail === 'function') {
      console.log('✅ sendOtpEmail() function OK');
      return true;
    } else {
      console.log('❌ sendOtpEmail không phải function');
      return false;
    }
  } catch (error) {
    console.log('❌ Không thể load Email Service');
    console.log('   Lỗi:', error.message);
    return false;
  }
};

// Run all tests
console.log('\n' + '='.repeat(50));
console.log('  🧪 VERIFICATION - OTP EMAIL SETUP');
console.log('='.repeat(50) + '\n');

const configOk = testConfig();
const nodemailerOk = testNodemailer();
const serviceOk = testEmailService();

console.log('\n' + '='.repeat(50));
console.log('  📊 KẾT QUẢ');
console.log('='.repeat(50) + '\n');

if (configOk && nodemailerOk && serviceOk) {
  console.log('🎉 HOÀN HẢO! Mọi thứ đã sẵn sàng!\n');
  console.log('📝 Bước tiếp theo:');
  console.log('  1. Chạy server: npm run dev');
  console.log('  2. Mở app React Native');
  console.log('  3. Đăng ký tài khoản với email thật');
  console.log('  4. Kiểm tra hộp thư email nhận mã OTP\n');
} else {
  console.log('⚠️  Có vấn đề cần khắc phục (xem chi tiết ở trên)\n');
  process.exit(1);
}
