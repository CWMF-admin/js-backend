import express from 'express';
import nodemailer from 'nodemailer';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

router.post('/sendEmail', authMiddleware, async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html',
      });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'Email sent successfully',
      messageId: info.messageId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;