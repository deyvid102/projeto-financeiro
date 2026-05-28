import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para porta 465
  auth: {
    user: 'suportefinancemax@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD, // Use uma "Senha de App" do Google
  },
  // Adiciona tempo de espera para evitar timeouts em conexões lentas do servidor
  connectionTimeout: 10000, 
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: '"FinanceMAX Suporte" <suportefinancemax@gmail.com>',
    to: email,
    subject: 'Seu código de verificação FinanceMAX',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #3b82f6;">Bem-vindo ao FinanceMAX!</h2>
        <p>Use o código abaixo para confirmar a criação da sua conta:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px; color: #1e293b;">
          ${code}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
          Este código expira em 10 minutos. Se você não solicitou este código, ignore este e-mail.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error('Não foi possível enviar o e-mail de verificação.');
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const mailOptions = {
    from: '"FinanceMAX Suporte" <suportefinancemax@gmail.com>',
    to: email,
    subject: 'Recuperação de senha FinanceMAX',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #3b82f6;">Recuperação de Senha</h2>
        <p>Você solicitou a alteração da sua senha no FinanceMAX. Use o código abaixo para prosseguir:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px; color: #1e293b;">
          ${code}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
          Este código expira em 10 minutos. Se você não solicitou a alteração, ignore este e-mail.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar e-mail de reset:', error);
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};