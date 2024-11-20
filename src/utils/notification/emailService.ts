import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string; }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465, 
    secure: true, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html:body
  });
}


