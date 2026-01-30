const BREVO_API_KEY = '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';

const emailData = {
  sender: { name: "CampusFlow", email: "noreply@campusflow.com" },
  to: [{ email: "soham.kadu24@vit.edu", name: "Test User" }],
  subject: "CampusFlow Email Test",
  htmlContent: `
    <html>
      <body>
        <h1>🎓 CampusFlow Email Test</h1>
        <p>This is a test email from CampusFlow using Brevo API.</p>
        <p>If you received this, the email service is working correctly!</p>
      </body>
    </html>
  `
};

console.log('🔄 Sending test email via Brevo API...');

fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify(emailData)
})
.then(response => {
  if (!response.ok) {
    return response.json().then(err => { throw err; });
  }
  return response.json();
})
.then(data => {
  console.log('✅ Email sent successfully!');
  console.log('Response:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
