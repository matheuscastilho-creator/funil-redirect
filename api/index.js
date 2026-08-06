const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// ============ CONFIGURAÇÃO ============
const LINKS_CONFIG_PATH = path.join(__dirname, '..', 'links.json');

// Middleware pra JSON
app.use(express.json());

// ============ SISTEMA DE CONTROLE ============

// 1. CARREGAR CONFIGURAÇÃO
function carregarConfiguracao() {
    try {
        const data = fs.readFileSync(LINKS_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const configPadrao = {
            links: {},
            estatisticas: {}
        };
        fs.writeFileSync(LINKS_CONFIG_PATH, JSON.stringify(configPadrao, null, 2));
        return configPadrao;
    }
}

// 2. SALVAR CONFIGURAÇÃO
function salvarConfiguracao(config) {
    fs.writeFileSync(LINKS_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// 3. REGISTRAR CLICK
function registrarClick(linkId, req) {
    const config = carregarConfiguracao();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'desconhecido';
    const dataHora = new Date().toISOString();
    
    if (!config.estatisticas[linkId]) {
        config.estatisticas[linkId] = {
            total: 0,
            clicks: []
        };
    }
    
    config.estatisticas[linkId].total++;
    config.estatisticas[linkId].clicks.push({
        dataHora,
        ip,
        userAgent
    });
    
    if (config.estatisticas[linkId].clicks.length > 100) {
        config.estatisticas[linkId].clicks = config.estatisticas[linkId].clicks.slice(-100);
    }
    
    salvarConfiguracao(config);
    console.log(`📊 [CLICK] Link: ${linkId} | Total: ${config.estatisticas[linkId].total}`);
}

// ============ ROTAS DO PAINEL ADMIN ============

// 4. PAINEL ADMIN (HTML)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// 5. API - LISTAR LINKS
app.get('/api/links', (req, res) => {
    const config = carregarConfiguracao();
    const linksComStats = {};
    
    for (const [id, link] of Object.entries(config.links)) {
        const stats = config.estatisticas[id] || { total: 0 };
        linksComStats[id] = {
            ...link,
            totalCliques: stats.total,
            url: `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/${id}`
        };
    }
    
    res.json(linksComStats);
});

// 6. API - CRIAR/ATUALIZAR LINK
app.post('/api/links', (req, res) => {
    const { id, destino, canal, campanha, utm_source } = req.body;
    
    if (!id || !destino) {
        return res.status(400).json({ erro: 'ID e destino são obrigatórios' });
    }
    
    const config = carregarConfiguracao();
    config.links[id] = {
        destino,
        canal: canal || 'padrao',
        campanha: campanha || id,
        utm_source: utm_source || 'whatsapp'
    };
    
    salvarConfiguracao(config);
    res.json({ sucesso: true, link: config.links[id] });
});

// 7. API - DELETAR LINK
app.delete('/api/links/:id', (req, res) => {
    const { id } = req.params;
    const config = carregarConfiguracao();
    
    if (config.links[id]) {
        delete config.links[id];
        salvarConfiguracao(config);
        res.json({ sucesso: true });
    } else {
        res.status(404).json({ erro: 'Link não encontrado' });
    }
});

// 8. API - ESTATÍSTICAS DETALHADAS
app.get('/api/stats/:id', (req, res) => {
    const { id } = req.params;
    const config = carregarConfiguracao();
    
    if (config.estatisticas[id]) {
        res.json(config.estatisticas[id]);
    } else {
        res.json({ total: 0, clicks: [] });
    }
});

// ============ ROTAS DO FUNIL ============

// 9. ROTA DINÂMICA (DICA DE OURO)
app.get('/:origem/:campanha', (req, res) => {
    const { origem, campanha } = req.params;
    const linkId = `${origem}/${campanha}`;
    
    registrarClick(linkId, req);
    
    const config = carregarConfiguracao();
    const configuracaoLink = config.links[linkId];
    
    if (!configuracaoLink) {
        return res.status(404).send(`
            <h1>🔗 Link não encontrado</h1>
            <p>O link que você tentou acessar não existe.</p>
            <a href="/admin">Voltar ao painel</a>
        `);
    }
    
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const { destino, canal, campanha: campanhaNome, utm_source } = configuracaoLink;
    
    res.redirect(302, `${baseUrl}/f9q2pk/?ch=${canal}&campanha=${campanhaNome}&utm_source=${utm_source}`);
});

// 10. HOP 2 - PÁGINA ISCA
app.get('/f9q2pk/', (req, res) => {
    const ch = req.query.ch || 'padrao';
    const campanha = req.query.campanha || 'geral';
    const utm_source = req.query.utm_source || 'whatsapp';
    
    console.log(`📊 [HOP 2] Canal: ${ch}, Campanha: ${campanha}`);
    
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const destinoFinal = `${baseUrl}/cassino-destino?ch=${ch}&campanha=${campanha}&utm_source=${utm_source}`;
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta property="og:site_name" content="PG987.COM">
    <meta property="og:title" content="ENTRA NO PG987 AGORA! 🎉 💰 GANHE ATÉ R$987 💸">
    <meta property="og:description" content="O melhor cassino online! Bônus exclusivo de R$987">
    <meta property="og:image" content="https://upload-us.z-9-a-b.com/s6/1784557/1.png">
    <meta property="og:url" content="${baseUrl}/f9q2pk/?ch=${ch}">
    
    <style>
        body { background: #0a0a1a; color: #fff; font-family: Arial; text-align: center; padding: 50px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 40px; border-radius: 15px; }
        h1 { color: #f5c842; font-size: 42px; margin: 0; }
        .loader { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #f5c842; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 30px auto; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .info { background: #16213e; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎰 PG987.COM</h1>
        <p>🔐 Processando sua entrada...</p>
        <div class="loader"></div>
        <div class="info">
            📌 Canal: ${ch}<br>
            ⏳ Redirecionando...
        </div>
    </div>
    
    <script>
        setTimeout(function() {
            window.location.href = '${destinoFinal}';
        }, 1500);
    </script>
</body>
</html>
    `);
});

// 11. HOP 3 - DESTINO FINAL
app.get('/cassino-destino', (req, res) => {
    const ch = req.query.ch || 'padrao';
    const campanha = req.query.campanha || 'geral';
    const utm_source = req.query.utm_source || 'whatsapp';
    
    console.log(`🎯 [HOP 3] Canal: ${ch}, Campanha: ${campanha}, Fonte: ${utm_source}`);
    
    // BUSCA O DESTINO REAL NA CONFIGURAÇÃO
    const config = carregarConfiguracao();
    let destinoReal = 'https://seudestino.com.br/';
    
    // TENTA ENCONTRAR O LINK QUE GEROU ESSE CLICK
    for (const [id, link] of Object.entries(config.links)) {
        if (link.canal === ch && link.campanha === campanha) {
            destinoReal = link.destino;
            break;
        }
    }
    
    const urlFinal = `${destinoReal}?ch=${ch}&utm_source=${utm_source}&utm_campaign=${campanha}`;
    res.redirect(302, urlFinal);
});

// 12. ROTA RAIZ
app.get('/', (req, res) => {
    res.send(`
        <h1>🎯 Funil de Redirects</h1>
        <p>Sistema funcionando!</p>
        <p><a href="/admin">📊 Acessar Painel Administrativo</a></p>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Painel Admin: http://localhost:${PORT}/admin`);
});
