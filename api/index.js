const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============ CONFIGURAÇÃO EM MEMÓRIA ============
let memoriaConfig = {
    links: {},
    estatisticas: {}
};

function carregarConfiguracao() {
    return memoriaConfig;
}

function salvarConfiguracao(config) {
    memoriaConfig = config;
    console.log('💾 Configuração salva em memória. Links:', Object.keys(config.links).length);
}

function registrarClick(linkId, req) {
    try {
        const config = carregarConfiguracao();
        const ip = req.ip || req.connection.remoteAddress || 'desconhecido';
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
        console.log(`📊 [CLICK] ${linkId} | Total: ${config.estatisticas[linkId].total}`);
    } catch (error) {
        console.error('Erro ao registrar click:', error);
    }
}

// ============ ADMIN HTML ============
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Painel de Controle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #0a0a1a; color: #fff; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 30px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .header h1 { color: #f5c842; font-size: 28px; }
        .stats { display: flex; gap: 10px; }
        .stat-box { padding: 8px 20px; border-radius: 8px; font-weight: bold; }
        .stat-links { background: #e94560; }
        .stat-cliques { background: #f5c842; color: #0a0a1a; }
        .card { background: #1a1a2e; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #2a2a4e; }
        .card h2 { color: #f5c842; margin-bottom: 20px; font-size: 22px; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; margin-bottom: 5px; color: #aaa; font-size: 13px; }
        .form-group input { width: 100%; padding: 12px; background: #0a0a1a; border: 1px solid #2a2a4e; border-radius: 8px; color: #fff; font-size: 15px; }
        .form-group input:focus { outline: none; border-color: #f5c842; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .btn { padding: 12px 25px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: #f5c842; color: #0a0a1a; }
        .btn-primary:hover { background: #ffd700; transform: scale(1.02); }
        .btn-danger { background: #e94560; color: #fff; }
        .btn-danger:hover { background: #c62840; }
        .btn-small { padding: 6px 12px; font-size: 13px; margin: 0 3px; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; background: #0a0a1a; color: #f5c842; border-bottom: 2px solid #2a2a4e; }
        td { padding: 12px; border-bottom: 1px solid #2a2a4e; }
        .link-url { color: #64b5f6; text-decoration: none; font-size: 13px; }
        .link-url:hover { text-decoration: underline; }
        .cliques-count { font-size: 20px; font-weight: bold; color: #f5c842; }
        .empty-state { text-align: center; padding: 40px 20px; color: #666; }
        .empty-state .emoji { font-size: 48px; margin-bottom: 15px; display: block; }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } .header { flex-direction: column; text-align: center; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Painel de Controle</h1>
            <div class="stats">
                <span class="stat-box stat-links" id="totalLinks">0 links</span>
                <span class="stat-box stat-cliques" id="totalCliques">0 cliques</span>
            </div>
        </div>

        <div class="card">
            <h2>➕ Criar Novo Link</h2>
            <form id="formLink">
                <div class="form-group">
                    <label>ID do Link (ex: whatsapp/promo ou só teste)</label>
                    <input type="text" id="linkId" placeholder="ex: whatsapp/promo" required>
                </div>
                <div class="form-group">
                    <label>URL de Destino</label>
                    <input type="url" id="linkDestino" placeholder="https://seudestino.com.br/" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Canal (ID do afiliado)</label>
                        <input type="text" id="linkCanal" placeholder="22451">
                    </div>
                    <div class="form-group">
                        <label>Nome da Campanha</label>
                        <input type="text" id="linkCampanha" placeholder="promo_whatsapp">
                    </div>
                </div>
                <div class="form-group">
                    <label>UTM Source (origem do tráfego)</label>
                    <input type="text" id="linkUtm" placeholder="whatsapp">
                </div>
                <button type="submit" class="btn btn-primary">🚀 Criar Link</button>
            </form>
        </div>

        <div class="card">
            <h2>🔗 Links Cadastrados</h2>
            <div id="linksList">
                <div class="empty-state">
                    <span class="emoji">📭</span>
                    <p>Nenhum link cadastrado ainda.<br>Crie seu primeiro link acima!</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        let links = {};

        async function carregarLinks() {
            try {
                const response = await fetch('/api/links');
                links = await response.json();
                renderizarLinks();
                atualizarContadores();
            } catch (error) {
                console.error('Erro ao carregar links:', error);
            }
        }

        function renderizarLinks() {
            const container = document.getElementById('linksList');
            const ids = Object.keys(links);
            
            if (ids.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <span class="emoji">📭</span>
                        <p>Nenhum link cadastrado ainda.<br>Crie seu primeiro link acima!</p>
                    </div>
                \`;
                return;
            }

            let html = \`<div class="table-wrap"><table><thead><tr>
                <th>Link</th><th>Destino</th><th>Cliques</th><th>Ações</th>
            </tr></thead><tbody>\`;

            for (const id of ids) {
                const link = links[id];
                const cliques = link.totalCliques || 0;
                const urlCompleta = \`\${API_BASE}/\${id}\`;
                
                html += \`
                    <tr>
                        <td>
                            <strong>\${id}</strong><br>
                            <a href="\${urlCompleta}" target="_blank" class="link-url">\${urlCompleta}</a>
                        </td>
                        <td style="font-size: 14px; color: #aaa;">\${link.destino}</td>
                        <td><span class="cliques-count">\${cliques}</span></td>
                        <td>
                            <button onclick="copiarLink('\${urlCompleta}')" class="btn btn-primary btn-small">📋</button>
                            <button onclick="deletarLink('\${id}')" class="btn btn-danger btn-small">🗑️</button>
                        </td>
                    </tr>
                \`;
            }

            html += \`</tbody></table></div>\`;
            container.innerHTML = html;
        }

        function atualizarContadores() {
            const totalLinks = Object.keys(links).length;
            let totalCliques = 0;
            for (const link of Object.values(links)) {
                totalCliques += link.totalCliques || 0;
            }
            document.getElementById('totalLinks').textContent = \`\${totalLinks} links\`;
            document.getElementById('totalCliques').textContent = \`\${totalCliques} cliques\`;
        }

        document.getElementById('formLink').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('linkId').value.trim();
            const destino = document.getElementById('linkDestino').value.trim();
            const canal = document.getElementById('linkCanal').value.trim() || 'padrao';
            const campanha = document.getElementById('linkCampanha').value.trim() || id;
            const utm_source = document.getElementById('linkUtm').value.trim() || 'whatsapp';
            
            try {
                const response = await fetch('/api/links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, destino, canal, campanha, utm_source })
                });
                
                if (response.ok) {
                    alert('✅ Link criado com sucesso!');
                    document.getElementById('formLink').reset();
                    carregarLinks();
                } else {
                    alert('❌ Erro ao criar link');
                }
            } catch (error) {
                alert('❌ Erro ao criar link');
                console.error(error);
            }
        });

        async function deletarLink(id) {
            if (!confirm(\`Tem certeza que quer deletar o link "\${id}"?\`)) return;
            
            try {
                const response = await fetch(\`/api/links/\${id}\`, { method: 'DELETE' });
                if (response.ok) {
                    alert('✅ Link deletado!');
                    carregarLinks();
                } else {
                    alert('❌ Erro ao deletar link');
                }
            } catch (error) {
                alert('❌ Erro ao deletar link');
            }
        }

        function copiarLink(url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('📋 Link copiado!');
            }).catch(() => {
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                alert('📋 Link copiado!');
            });
        }

        carregarLinks();
        setInterval(carregarLinks, 30000);
    </script>
</body>
</html>`;

// ============ ROTAS ============

app.get('/admin', (req, res) => {
    res.send(ADMIN_HTML);
});

app.get('/api/links', (req, res) => {
    try {
        const config = carregarConfiguracao();
        const linksComStats = {};
        
        for (const [id, link] of Object.entries(config.links)) {
            const stats = config.estatisticas[id] || { total: 0 };
            linksComStats[id] = {
                ...link,
                totalCliques: stats.total
            };
        }
        
        res.json(linksComStats);
    } catch (error) {
        console.error('Erro em /api/links:', error);
        res.status(500).json({ erro: 'Erro interno' });
    }
});

app.post('/api/links', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Erro em /api/links POST:', error);
        res.status(500).json({ erro: 'Erro interno' });
    }
});

app.delete('/api/links/:id', (req, res) => {
    try {
        const { id } = req.params;
        const config = carregarConfiguracao();
        
        if (config.links[id]) {
            delete config.links[id];
            salvarConfiguracao(config);
            res.json({ sucesso: true });
        } else {
            res.status(404).json({ erro: 'Link não encontrado' });
        }
    } catch (error) {
        console.error('Erro em /api/links DELETE:', error);
        res.status(500).json({ erro: 'Erro interno' });
    }
});

// ============ ROTAS DO FUNIL ============

// LINKS SIMPLES (ex: /teste)
app.get('/:id', (req, res, next) => {
    const linkId = req.params.id;
    
    // Ignora rotas especiais
    if (['admin', 'api', 'f9q2pk', 'cassino-destino'].includes(linkId)) {
        return next();
    }
    
    try {
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
        const { canal, campanha, utm_source } = configuracaoLink;
        
        res.redirect(302, `${baseUrl}/f9q2pk/?ch=${canal}&campanha=${campanha}&utm_source=${utm_source}`);
    } catch (error) {
        console.error('Erro no link simples:', error);
        res.status(500).send('Erro interno no servidor');
    }
});

// LINKS COM BARRA (ex: /whatsapp/promo)
app.get('/:origem/:campanha', (req, res) => {
    try {
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
        const { canal, campanha: campanhaNome, utm_source } = configuracaoLink;
        
        res.redirect(302, `${baseUrl}/f9q2pk/?ch=${canal}&campanha=${campanhaNome}&utm_source=${utm_source}`);
    } catch (error) {
        console.error('Erro no link com barra:', error);
        res.status(500).send('Erro interno no servidor');
    }
});

// HOP 2 - Página isca
app.get('/f9q2pk/', (req, res) => {
    try {
        const ch = req.query.ch || 'padrao';
        const campanha = req.query.campanha || 'geral';
        const utm_source = req.query.utm_source || 'whatsapp';
        
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
    } catch (error) {
        console.error('Erro no /f9q2pk:', error);
        res.status(500).send('Erro interno no servidor');
    }
});

// HOP 3 - Destino final
app.get('/cassino-destino', (req, res) => {
    try {
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
        
        const urlFinal = `${destinoReal}?ch=${ch}&utm_source=${utm_source}&utm_campaign=${campanha}`;
        res.redirect(302, urlFinal);
    } catch (error) {
        console.error('Erro no /cassino-destino:', error);
        res.status(500).send('Erro interno no servidor');
    }
});

app.get('/', (req, res) => {
    res.send(`
        <h1>🎯 Funil de Redirects</h1>
        <p>Sistema funcionando!</p>
        <p><a href="/admin">📊 Acessar Painel Administrativo</a></p>
        <p>Links cadastrados: ${Object.keys(memoriaConfig.links).length}</p>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Painel Admin: http://localhost:${PORT}/admin`);
});
