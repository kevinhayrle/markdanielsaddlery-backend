const mailjet = require('node-mailjet')
  .apiConnect(process.env.MJ_API_KEY, process.env.MJ_API_SECRET);

/**
 * Sends a 6-digit OTP via email using Mailjet.
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - User name
 * @param {'signup'|'reset'} type - Purpose of OTP
 */
function sendOTPEmail(email, otp, name = '', type = 'signup') {
  const greeting = name ? `Hello ${name},` : `Hello,`;

  const purposeText =
    type === 'reset'
      ? `Use this OTP to reset your Mark Daniel Saddlery password:`
      : `Use this OTP to verify your email and complete your Mark Daniel Saddlery registration:`;

  const subject =
    type === 'reset'
      ? 'Reset Your Mark Daniel Saddlery Password'
      : 'Verify Your Mark Daniel Saddlery Email';

  return mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: process.env.MJ_SENDER_EMAIL,
          Name: 'Mark Daniel Saddlery'
        },
        To: [{ Email: email }],
        Subject: subject,
        HTMLPart: `
          <p>${greeting}</p>
          <p>${purposeText}</p>
          <h2 style="
            font-size: 24px;
            color: #000;
            text-align: center;
            background-color: #f4f4f4;
            padding: 12px;
            border-radius: 4px;
            letter-spacing: 4px;
          ">
            ${otp}
          </h2>
          <p>This code is valid for 10 minutes.</p>
          <p style="font-size: 12px; color: #777;">
            If you did not request this, please ignore this email.
          </p>
        `
      }
    ]
  })
  .then(result => {
    console.log('✅ OTP sent via Mailjet:', result.body.Messages[0].Status);
    return true;
  })
  .catch(err => {
    console.error('❌ OTP failed via Mailjet:', err.statusCode, err.message);
    throw err;
  });
}

module.exports = { sendOTPEmail };
