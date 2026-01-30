require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'a118e2001@smtp-brevo.com',
    pass: 'h6jFJCLU2zOfISkE'
  }
});

console.log('🔄 Sending test email...');

transporter.sendMail({
  from: '"CampusFlow" <soham.kadu24@vit.edu>',
  to: 'soham.kadu24@vit.edu',
  subject: 'CampusFlow OTP Test',
  html: '<h1>🎓 Your OTP: 123456</h1><p>If you received this, email is working!</p>'
})
.then(info => {
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  process.exit(0);
})
.catch(error => {
  console.error('❌ Error sending email:');
  console.error(error);
  process.exit(1);
});
