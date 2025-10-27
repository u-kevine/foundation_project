const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const emailService = {
  async sendEmail({ to, subject, html, text }) {
    try {
      const info = await transporter.sendMail({
        from: `"MindConnect" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error: error.message };
    }
  },

  async sendAppointmentConfirmation(userEmail, appointmentDetails) {
    const html = `
      <h2>Appointment Confirmation</h2>
      <p>Your appointment has been scheduled successfully.</p>
      <p><strong>Date:</strong> ${new Date(appointmentDetails.appointment_date).toLocaleString()}</p>
      <p><strong>Duration:</strong> ${appointmentDetails.duration} minutes</p>
      <p>We look forward to seeing you!</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Appointment Confirmation - MindConnect',
      html,
    });
  },

  async sendCrisisAlert(userEmail, userName) {
    const html = `
      <h2>Crisis Support Available</h2>
      <p>Dear ${userName},</p>
      <p>We noticed you may be in crisis. Please know that help is available 24/7:</p>
      <ul>
        <li>National Suicide Prevention Lifeline: 988</li>
        <li>Crisis Text Line: Text HOME to 741741</li>
      </ul>
      <p>Our therapists are also available to provide immediate support.</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Immediate Support Available - MindConnect',
      html,
    });
  },
};

module.exports = emailService;