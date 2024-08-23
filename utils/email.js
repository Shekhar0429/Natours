const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1. create a transporter 
  const transporter = nodemailer.createTransport({
   host:process.env.EMAIL_HOST,
    auth: {
      user:process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  // 2) Define the email options
  const mailOptions = {
    from:'Shekhar chauhan <user@test.io>',
    to:options.email,
    subject:options.subject,
    text:options.message,
    // html:
  }

  // 3). Actually send the mail
  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;