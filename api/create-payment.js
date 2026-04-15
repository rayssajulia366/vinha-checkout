/**
 * api/create-payment.js
 * Serverless Function — Vercel / Netlify
 *
 * Recebe os dados do checkout do frontend e encaminha
 * para a API WayMB de forma segura, sem expor as credenciais.
 *
 * Variáveis de Ambiente necessárias:
 *   WAYMB_CLIENT_ID     = z1r0_51c2ac4c
 *   WAYMB_CLIENT_SECRET = 70f86715-22ca-4737-9a49-e3d848df4a4c
 *   WAYMB_ACCOUNT_EMAIL = arilsonsouza2706@gmail.com
 */

const WAYMB_API_URL = 'https://api.waymb.com/transactions/create';

// Handler para Vercel (também compatível com Netlify via adaptador)
module.exports = async function handler(req, res) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Configurar CORS para aceitar chamadas do próprio site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Destruturar os dados recebidos do frontend
  const {
    amount,
    method,       // "mbway" | "multibanco"
    payerName,
    payerEmail,
    payerPhone,
    payerDocument,
    utmDetails,   // Dados de rastreio da UTMfy (Base64)
  } = req.body;

  // Validação básica
  if (!amount || !method || !payerName || !payerEmail || !payerPhone) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  // URL do Webhook no Replit
  const host = req.headers.host || 'vinha-checkout.replit.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const callbackUrl = `${protocol}://${host}/api/payment-webhook${utmDetails ? '?utm_details=' + utmDetails : ''}`;

  // Montar o corpo da requisição para a WayMB
  const waymb_payload = {
    client_id:     process.env.WAYMB_CLIENT_ID,
    client_secret: process.env.WAYMB_CLIENT_SECRET,
    account_email: process.env.WAYMB_ACCOUNT_EMAIL,
    amount:        parseFloat(amount),
    method:        method,
    currency:      'EUR',
    payer: {
      name:     payerName,
      email:    payerEmail,
      phone:    payerPhone,
      document: payerDocument || '999999999', // NIF, fallback genérico
    },
    callbackUrl: callbackUrl,
  };

  try {
    const response = await fetch(WAYMB_API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(waymb_payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WayMB Error]', data);
      return res.status(response.status).json({
        error:   'Erro ao criar transação na WayMB.',
        details: data,
      });
    }

    // Retornar os dados necessários para o frontend
    return res.status(200).json({
      transactionID:  data.transactionID || data.id,
      method:         data.method,
      amount:         data.amount,
      generatedMBWay: data.generatedMBWay || false,
      referenceData:  data.referenceData || null, // Entidade e Referência Multibanco
    });

  } catch (err) {
    console.error('[Server Error]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
