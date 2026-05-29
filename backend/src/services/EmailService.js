import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // false para porta 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER, // Seu e-mail de login no Brevo
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '', // Sua SMTP Key
  },
  tls: {
    // Ajuda a evitar erros de conexão em ambientes de hospedagem
    rejectUnauthorized: false
  },
  // Adiciona tempo de espera para evitar timeouts em conexões lentas do servidor
  connectionTimeout: 10000, 
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"FinanceMAX Suporte" <${process.env.EMAIL_USER}>`, // Agora usa o e-mail configurado
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
    // Log detalhado para você ver no painel do Render
    console.error('ERRO NODEMAILER (VERIFICAÇÃO):', error.message, error.code);
    throw new Error('Não foi possível enviar o e-mail de verificação.');
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const mailOptions = {
    from: `"FinanceMAX Suporte" <${process.env.EMAIL_USER}>`,
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
    // Log detalhado para você ver no painel do Render
    console.error('ERRO NODEMAILER (RECUPERAÇÃO):', error.message, error.code);
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};