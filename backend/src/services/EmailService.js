import 'dotenv/config';
import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = "suportefinancemax@gmail.com";
const SENDER_NAME = "FinanceMAX Suporte";

const sendBrevoEmail = async (to, subject, htmlContent) => {
  return await axios.post(
    BREVO_API_URL,
    {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent
    },
    {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
};

export const sendVerificationEmail = async (email, code) => {
  const html = `
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
    `;

  try {
    await sendBrevoEmail(email, 'Seu código de verificação FinanceMAX', html);
  } catch (error) {
    console.error('❌ FALHA NO ENVIO DE VERIFICAÇÃO (API):', error.response?.data || error.message);
    console.error('ESTADO DA AUTH:', { hasApiKey: !!BREVO_API_KEY });
    throw new Error('Não foi possível enviar o e-mail de verificação.');
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const html = `
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
    `;

  try {
    await sendBrevoEmail(email, 'Recuperação de senha FinanceMAX', html);
  } catch (error) {
    console.error('❌ FALHA NA RECUPERAÇÃO DE SENHA (API):', error.response?.data || error.message);
    console.error('ESTADO DA AUTH:', { hasApiKey: !!BREVO_API_KEY });
    throw new Error('Não foi possível enviar o e-mail de recuperação.');
  }
};