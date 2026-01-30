const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'a118e2001@smtp-brevo.com',
    pass: 'h6jFJCLUzzOflSkE',
  },
});

const mailOptions = {
  from: 'CampusFlow <noreply@campusflow.com>',
  to: 'soham.kadu24@vit.edu',
  subject: 'CampusFlow OTP Verification Test',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 CampusFlow</h1>
          <p>Email Verification</p>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with CampusFlow! To complete your registration, please use the following OTP:</p>
          <div class="otp-box">
            <div class="otp-code">123456</div>
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 CampusFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

console.log('🔄 Testing Brevo SMTP connection...');

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
