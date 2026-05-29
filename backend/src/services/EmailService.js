import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para SSL na porta 465
  family: 4, // Força o uso de IPv4 para evitar erro ENETUNREACH (IPv6) no Render
  pool: true, // Mantém a conexão aberta para múltiplos envios
  auth: {
    user: process.env.EMAIL_USER, // Seu e-mail Gmail
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/[\s"']/g, '') : '', // Remove espaços e aspas
  },
  tls: {
    rejectUnauthorized: false // Evita falhas de handshake em redes de proxy do Render
  },
  // Aumentando os tempos de espera para evitar timeouts em ambiente cloud
  connectionTimeout: 20000, 
  greetingTimeout: 20000,   // Tempo máximo para esperar a saudação do servidor SMTP
  socketTimeout: 30000      // Tempo máximo de inatividade do socket
});

// Verifica a conexão SMTP no início para logar erros no Render
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ERRO DE CONEXÃO SMTP NO RENDER:', error.message);
  } else {
    console.log('📧 Servidor de e-mail pronto para enviar mensagens');
  }
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
    console.error('ERRO NODEMAILER (VERIFICAÇÃO):', error.message);
    console.error('DEBUG AUTH:', { user: process.env.EMAIL_USER, hasPass: !!process.env.EMAIL_PASS });
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
    console.error('ERRO NODEMAILER (RECUPERAÇÃO DE SENHA):', error.message);
    console.error('SMTP RESPONSE:', error.response);
    console.error('DEBUG AUTH:', { user: process.env.EMAIL_USER, hasPass: !!process.env.EMAIL_PASS });
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};