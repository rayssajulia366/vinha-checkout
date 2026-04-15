require('dotenv').config();
const express = require('express');
const path = require('path');
const handler = require('./api/create-payment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para entender JSON no corpo das requisições
app.use(express.json());

// Servir os arquivos estáticos (index.html, style.css, etc)
app.use(express.static(__dirname));

// Rota da API de Pagamento
app.post('/api/create-payment', (req, res) => {
  handler(req, res);
});

// Rota de Webhook — Chamado pela WayMB quando o status do pagamento muda
app.post('/api/payment-webhook', async (req, res) => {
  console.log('[Webhook] Notificação recebida:', req.body);
  
  const { status, id, amount, payer } = req.body;
  const utmDetails = req.query.utm_details; // Detalhes do rastreio passados no callbackUrl

  if (status === 'COMPLETED') {
    console.log(`[Webhook] Venda confirmada! ID: ${id}, Valor: ${amount}`);
    
    // Disparar para a UTMfy via API Server-to-Server
    const utmfyToken = process.env.UTMFY_TOKEN;
    if (utmfyToken) {
      try {
        // Preparar payload para UTMfy
        const utmfyPayload = {
          event_name: 'Purchase',
          event_data: {
            value: amount,
            currency: 'EUR',
            transaction_id: id,
            email: payer?.email,
            phone: payer?.phone,
            name: payer?.name,
            // Descompactar detalhes de UTM se existirem
            ...(utmDetails ? JSON.parse(Buffer.from(utmDetails, 'base64').toString()) : {})
          }
        };

        const utmfyResponse = await fetch('https://api.utmify.com.br/v1/events', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${utmfyToken}`
          },
          body: JSON.stringify(utmfyPayload)
        });
        
        console.log('[UTMfy] Evento de Purchase enviado. Status:', utmfyResponse.status);
      } catch (err) {
        console.error('[UTMfy] Erro ao disparar evento:', err.message);
      }
    } else {
      console.warn('[UTMfy] Token não configurado. Evento não disparado.');
    }
  }

  // WayMB exige retorno 200 para confirmar recebimento
  res.status(200).json({ received: true });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de teste a correr em: http://localhost:${PORT}`);
  console.log(`Aperte CTRL+C para parar o servidor.\n`);
});
