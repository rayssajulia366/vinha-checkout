const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
  // Apenas aceitar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { amount, method, payerName, payerEmail, payerPhone, payerDocument } = JSON.parse(event.body);

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
        document: payerDocument || '999999999',
      },
    };

    const response = await fetch('https://api.waymb.com/transactions/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(waymb_payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WayMB Error]', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Erro ao criar transação na WayMB.',
          details: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('[Internal Error]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno no servidor', details: error.message }),
    };
  }
};
