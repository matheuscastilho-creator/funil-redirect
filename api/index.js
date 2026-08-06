const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// ============ CONFIGURAÇÃO ============
const LINKS_CONFIG_PATH = path.join(__dirname, '..', 'links.json');

app.use(express.json());

// ============ CARREGAR CONFIGURAÇÃO ============
function carregarConfiguracao() {
    try {
        const data = fs.readFileSync(LINKS_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const configPadrao = { links: {}, estatisticas: {} };
        fs.writeFileSync(LINKS_CONFIG_PATH, JSON.stringify(configPadrao, null, 2));
        return configPadrao;
    }
}

function salvarConfiguracao(config) {
    fs.writeFileSync(LINKS_CONFIG_PATH, JSON.stringify(config, null, 2));
}

function registrarClick(linkId, req) {
    const config = carregarConfiguracao();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'desconhecido';
    const dataHora = new Date().toISOString();
    
    if (!config.estatisticas[linkId]) {
        config.estatisticas[linkId] = { total: 0, clicks: [] };
    }
    
    config.estatisticas[linkId].total++;
    config.estatisticas[linkId].clicks.push({ dataHora, ip, userAgent });
    
    if (config.estatisticas[linkId].clicks.length > 100) {
        config.estatisticas[linkId].clicks = config.estatisticas[linkId].clicks.slice(-100);
    }
    
    salvarConfiguracao(config);
    console.log(`📊 [CLICK] Link: ${linkId} | Total: ${config.estatisticas[linkId].total}`);
}

// ============ ROTA ADMIN (COM HTML DIRETO) ============
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📊 Painel de Controle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial; background: #0a0a1a; color: #fff; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1a1a2e; padding: 20px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { color: #f5c842; }
        .card { background: #1a1a2e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .card h2 { color: #f5c842; margin-bottom: 15px; }
        input, button { padding: 10px; margin: 5px 0; border-radius: 5px; border: none; }
        input { width: 100%; background: #0a0a1a; color: #fff; border: 1px solid #333; }
        .btn { background: #f5c842; color: #000; font-weight: bold; cursor: pointer; padding: 10px 20px; }
        .btn-danger { background: #e94560; color: #fff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #333; }
        .link-url { color: #64b5f6; text-decoration: none; }
        .cliques-count { color: #f5c842; font-weight: bold; font-size: 18px; }
        .empty { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Painel de Controle</h1>
            <div>
                <span id="totalLinks" style="background:#e94560;padding:5px 15px;border-radius:5px;">0 links</span>
                <span id="totalCliques" style="background:#f5c842;color:#000;padding:5px 15px;border-radius:5px;margin-left:10px;">0 cliques</span>
            </div>
        </div>

        <div class="card">
            <h2>➕ Criar Link</h2>
            <form id="formLink">
                <input type="text" id="linkId" placeholder="ID (ex: whatsapp/promo)" required>
                <input type="url" id="linkDestino" placeholder="URL de Destino" required>
                <input type="text" id="linkCanal" placeholder="Canal (ex: 22451)">
                <input type="text" id="linkCampanha" placeholder="Campanha (ex: promo_whatsapp)">
                <input type="text" id="linkUtm" placeholder="UTM Source (ex: whatsapp)">
                <button type="submit" class="btn">🚀 Criar Link</button>
            </form>
        </div>

        <div class="card">
            <h2>🔗 Links</h2>
            <div id="linksList"><div class="empty">Nenhum link cadastrado</div></div>
        </div>
    </div>

    <script>
        async function carregarLinks() {
            const res = await fetch('/api/links');
            const links = await res.json();
            const container = document.getElementById('linksList');
            
            if (Object.keys(links).length === 0) {
                container.innerHTML = '<div class="empty">Nenhum link cadastrado</div>';
                return;
            }
            
            let html = '<table><tr><th>Link</th><th>Destino</th><th>Cliques</th><th>Ações</th></tr>';
            for (const [id, link] of Object.entries(links)) {
                const url = window.location.origin + '/' + id;
                html += \`
                    <tr>
                        <td><strong>\${id}</strong><br><a href="\${url}" target="_blank" class="link-url">\${url}</a></td>
                        <td>\${link.destino}</td>
                        <td class="cliques-count">\${link.totalCliques || 0}</td>
                        <td>
                            <button onclick="copiar('\${url}')" class="btn" style="padding:5px 10px;">📋</button>
                            <button onclick="deletar('\${id}')" class="btn btn-danger" style="padding:5px 10px;">🗑️</button>
                        </td>
                    </tr>
                \`;
            }
            html += '</table>';
            container.innerHTML = html;
            
            const total = Object.keys(links).length;
            let cliques = 0;
            for (const link of Object.values(links)) cliques += link.totalCliques || 0;
            document.getElementById('totalLinks').textContent = total + ' links';
            document.getElementById('totalCliques').textContent = cliques + ' cliques';
        }

        document.getElementById('formLink').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                id: document.getElementById('linkId').value,
                destino: document.getElementById('linkDestino').value,
                canal: document.getElementById('linkCanal').value || 'padrao',
                campanha: document.getElementById('linkCampanha').value || 'geral',
                utm_source: document.getElementById('linkUtm').value || 'whatsapp'
            };
            await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('✅ Link criado!');
            document.getElementById('formLink').reset();
            carregarLinks();
        });

        async function deletar(id) {
            if (!confirm('Deletar "' + id + '"?')) return;
            await fetch('/api/links/' + id, { method: 'DELETE' });
            alert('✅ Deletado!');
            carregarLinks();
        }

        function copiar(url) {
            navigator.clipboard.writeText(url);
            alert('📋 Copiado!');
        }

        carregarLinks();
        setInterval(carregarLinks, 10000);
    </script>
</body>
</html>
    `);
});

// ============ API ============
app.get('/api/links', (req, res) => {
    const config = carregarConfiguracao();
    const linksComStats = {};
    for (const [id, link] of Object.entries(config.links)) {
        const stats = config.estatisticas[id] || { total: 0 };
        linksComStats[id] = { ...link, totalCliques: stats.total };
    }
    res.json(linksComStats);
});

app.post('/api/links', (req, res) => {
    const { id, destino, canal, campanha, utm_source } = req.body;
    if (!id || !destino) return res.status(400).json({ erro: 'ID e destino obrigatórios' });
    const config = carregarConfiguracao();
    config.links[id] = { destino, canal: canal || 'padrao', campanha: campanha || id, utm_source: utm_source || 'whatsapp' };
    salvarConfiguracao(config);
    res.json({ sucesso: true });
});

app.delete('/api/links/:id', (req, res) => {
    const config = carregarConfiguracao();
    delete config.links[req.params.id];
    salvarConfiguracao(config);
    res.json({ sucesso: true });
});

// ============ ROTAS DO FUNIL ============
app.get('/:origem/:campanha', (req, res) => {
    const linkId = req.params.origem + '/' + req.params.campanha;
    registrarClick(linkId, req);
    const config = carregarConfiguracao();
    const link = config.links[linkId];
    if (!link) return res.status(404).send('Link não encontrado');
    const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000';
    res.redirect(302, baseUrl + '/f9q2pk/?ch=' + link.canal + '&campanha=' + link.campanha + '&utm_source=' + link.utm_source);
});

app.get('/f9q2pk/', (req, res) => {
    const ch = req.query.ch || 'padrao';
    const campanha = req.query.campanha || 'geral';
    const utm_source = req.query.utm_source || 'whatsapp';
    const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000';
    const destinoFinal = baseUrl + '/cassino-destino?ch=' + ch + '&campanha=' + campanha + '&utm_source=' + utm_source;
    
    res.send(\`
<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="ENTRA NO PG987 AGORA! 🎉">
    <meta property="og:description" content="Bônus de R$987">
    <meta property="og:image" content="https://upload-us.z-9-a-b.com/s6/1784557/1.png">
    <style>
        body { background:#0a0a1a;color:#fff;text-align:center;padding:50px;font-family:Arial; }
        .loader { border:4px solid #f3f3f3;border-top:4px solid #f5c842;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:30px auto; }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
    </style>
</head>
<body>
    <h1>🎰 PG987.COM</h1>
    <p>Processando...</p>
    <div class="loader"></div>
    <script>setTimeout(function(){ window.location.href='\${destinoFinal}'; },1500);</script>
</body>
</html>
    \`);
});

app.get('/cassino-destino', (req, res) => {
    const ch = req.query.ch || 'padrao';
    const campanha = req.query.campanha || 'geral';
    const utm_source = req.query.utm_source || 'whatsapp';
    const config = carregarConfiguracao();
    let destinoReal = 'https://seudestino.com.br/';
    for (const [id, link] of Object.entries(config.links)) {
        if (link.canal === ch && link.campanha === campanha) {
            destinoReal = link.destino;
            break;
        }
    }
    res.redirect(302, destinoReal + '?ch=' + ch + '&utm_source=' + utm_source + '&utm_campaign=' + campanha);
});

app.get('/', (req, res) => {
    res.send('<h1>🎯 Funil de Redirects</h1><p><a href="/admin">📊 Painel</a></p>');
});

app.listen(PORT, () => {
    console.log('🚀 Rodando na porta ' + PORT);
    console.log('📊 Painel: http://localhost:' + PORT + '/admin');
});
