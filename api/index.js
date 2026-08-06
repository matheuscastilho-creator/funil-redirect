const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// ============ HOP 1: Encurtador (302 Redirect) ============
app.get('/t2m/04-08', (req, res) => {
    console.log(`[HOP 1] Redirect acessado`);
    
    // PEGUE A URL DO SEU DEPLOY DEPOIS DE SUBIR
    // VAI SER ALGO COMO: https://seu-projeto.vercel.app
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
    
    res.status(302);
    res.setHeader('Location', `${baseUrl}/f9q2pk/?ch=22451`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send();
});

// ============ HOP 2: Página Isca ============
app.get('/f9q2pk/', (req, res) => {
    const ch = req.query.ch || '22451';
    console.log(`[HOP 2] Página isca - canal: ${ch}`);
    
    // PEGUE A URL DO SEU DEPLOY DEPOIS DE SUBIR
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
    
    // PÁGINA HTML COM OG TAGS E JS
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- OPEN GRAPH TAGS (PARA CRAWLERS) -->
    <meta property="og:site_name" content="PG987.COM">
    <meta property="og:title" content="ENTRA NO PG987 AGORA! 🎉 💰 GANHE ATÉ R$987 💸">
    <meta property="og:description" content="O melhor cassino online do Brasil! Bônus exclusivo de R$987 para novos jogadores.">
    <meta property="og:image" content="https://upload-us.z-9-a-b.com/s6/1784557/1.png">
    <meta property="og:url" content="${baseUrl}/f9q2pk/?ch=${ch}">
    <meta property="og:type" content="website">
    
    <title>PG987.COM - Cassino Online</title>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #0a0a1a;
            color: #fff;
            text-align: center;
            padding: 50px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #1a1a2e;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 0 50px rgba(245, 200, 66, 0.1);
        }
        h1 { color: #f5c842; font-size: 42px; }
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #f5c842;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 30px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .badge {
            display: inline-block;
            background: #e94560;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .info {
            background: #16213e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">🎯 HOP 2 - PÁGINA ISCA</span>
        <h1>🎰 PG987.COM</h1>
        <p>🔐 Processando sua entrada no cassino...</p>
        <div class="loader"></div>
        
        <div class="info">
            <strong>📌 Canal:</strong> ${ch}<br>
            <strong>⏳ Redirecionando via JavaScript em 1.5s...</strong>
        </div>
        <p style="color: #666; font-size: 12px;">
            ⚠️ Esta página contém OG tags para crawlers e JS para redirecionar humanos.
        </p>
    </div>

    <!-- JAVASCRIPT DE REDIRECIONAMENTO -->
    <script>
        console.log('[HOP 2] JavaScript executado...');
        
        setTimeout(function() {
            window.location.href = '${baseUrl}/cassino-destino';
        }, 1500);
    </script>
</body>
</html>
    `);
});

// ============ HOP 3: Destino Final ============
app.get('/cassino-destino', (req, res) => {
    console.log('[HOP 3] Usuário chegou ao destino final!');
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎰 Cassino PG987 - Destino Final</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: #fff; }
        .casino-box { background: #16213e; padding: 40px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
        h1 { color: #f5c842; font-size: 48px; }
        .bonus { background: #e94560; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { background: #f5c842; color: #1a1a2e; padding: 15px 30px; border: none; border-radius: 5px; font-size: 20px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="casino-box">
        <h1>🎰 PG987.COM</h1>
        <div class="bonus">
            <h2>🎉 BÔNUS DE R$987!</h2>
            <p>Parabéns! Você chegou ao cassino real.</p>
        </div>
        <p>✅ O redirecionamento via JavaScript funcionou!</p>
        <p><small>Demonstração técnica - ambiente online.</small></p>
        <button class="btn" onclick="alert('Demonstração concluída!')">JOGAR AGORA</button>
    </div>
</body>
</html>
    `);
});

// Rota raiz pra não ficar vazio
app.get('/', (req, res) => {
    res.send(`
        <h1>🎯 Funil de Redirects</h1>
        <p>Teste a cadeia completa:</p>
        <a href="/t2m/04-08">➡️ Iniciar funil (Hop 1)</a>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Teste local: http://localhost:${PORT}/t2m/04-08`);
});