import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // TLS na 587
  pool: true, // Mantém a conexão aberta para múltiplos envios
  auth: {
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '', 
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '', // Sua SMTP Key (xsmtpsib...)
  },
  debug: false, // Desativado pois o teste foi bem sucedido
  logger: false,
  tls: {
    rejectUnauthorized: false // Evita falhas de handshake em redes de proxy do Render
  },
  // E-mail que aparecerá como remetente para o usuário final
  from: '"FinanceMAX Suporte" <suportefinancemax@gmail.com>',
  // Aumentando os tempos de espera para evitar timeouts em ambiente cloud
  connectionTimeout: 30000,
  greetingTimeout: 30000,   // Tempo máximo para esperar a saudação do servidor SMTP
  socketTimeout: 60000      // Tempo máximo de inatividade do socket
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: transporter.options.from,
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
    console.error('❌ FALHA CRÍTICA NO ENVIO DE VERIFICAÇÃO:', error);
    console.error('ESTADO DA AUTH:', { user: process.env.EMAIL_USER, hasPass: !!process.env.EMAIL_PASS });
    throw new Error('Não foi possível enviar o e-mail de verificação.');
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const mailOptions = {
    from: transporter.options.from,
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
    const passValue = process.env.EMAIL_PASS || '';
    const isBrevoKey = passValue.startsWith('xsmtpsib-');
    
    console.error('❌ FALHA CRÍTICA NA RECUPERAÇÃO DE SENHA:', error);
    console.error('RESPOSTA TÉCNICA SMTP:', error.response);
    console.error('ESTADO DA AUTH:', { 
      user: process.env.EMAIL_USER, 
      isValidFormat: isBrevoKey,
      keyPrefix: passValue.substring(0, 9) 
    });
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};