require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;

console.log('🔄 Sending email via Brevo API...');
console.log('API Key:', BREVO_API_KEY ? BREVO_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');

fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    sender: { name: "CampusFlow", email: "noreply@campusflow.com" },
    to: [{ email: "soham.kadu24@vit.edu", name: "Test User" }],
    subject: "CampusFlow Test OTP",
    htmlContent: "<h1>🎓 Your OTP: 123456</h1><p>Email service is working!</p>"
  })
})
.then(response => {
  if (!response.ok) {
    return response.json().then(err => {
      throw new Error(JSON.stringify(err));
    });
  }
  return response.json();
})
.then(data => {
  console.log('✅ Email sent successfully!');
  console.log('Response:', data);
  process.exit(0);
})
.catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
