import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, body, companyName }: { to: string; subject: string; body: string; companyName: string; }) {
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
    from: `${companyName} <${process.env.EMAIL_USER}>`, // Formato: "Nombre de Empresa <email>"
    to,
    subject,
    html:body
  });
}


