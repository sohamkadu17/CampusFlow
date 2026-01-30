const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

// Test email
async function testEmail() {
  try {
    console.log('🔧 Testing Brevo email configuration...');
    console.log('📧 SMTP Host:', process.env.BREVO_SMTP_HOST);
    console.log('👤 SMTP User:', process.env.BREVO_SMTP_USER);
    console.log('🔑 SMTP Pass:', process.env.BREVO_SMTP_PASS ? '***set***' : '❌ NOT SET');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'CampusFlow <noreply@campusflow.com>',
      to: 'kadusoham91@gmail.com', // Change this to your email
      subject: 'Test Email from CampusFlow',
      html: `
        <h1>✅ Brevo Email Service is Working!</h1>
        <p>If you received this email, your Brevo SMTP configuration is correct.</p>
        <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error(error);
  }
}

testEmail();
