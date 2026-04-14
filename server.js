require('dotenv').config();
const express = require('express');
const path = require('path');
const handler = require('./api/create-payment');

const app = express();
const PORT = 3000;

// Middleware para entender JSON no corpo das requisições
app.use(express.json());

// Servir os arquivos estáticos (index.html, style.css, etc)
app.use(express.static(__dirname));

// Rota da API (idêntica à da Vercel)
app.post('/api/create-payment', (req, res) => {
  // Chamamos o handler que criamos para a Vercel
  handler(req, res);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de teste a correr em: http://localhost:${PORT}`);
  console.log(`Aperte CTRL+C para parar o servidor.\n`);
});
