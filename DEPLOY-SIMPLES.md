# Deploy Simplificado - tasking.ia.br

## 🎯 Estrutura Final (Mesma Origem)

```
https://tasking.ia.br/
│
├── /               → Landing Page (raiz)
│   ├── Home
│   ├── Solução
│   ├── Benefícios
│   └── Preços
│
└── /dashboard/     → Dashboard (subpasta)
    └── /pages/login
```

---

## 📦 Deploy em 4 Passos

### 1️⃣ Build
```bash
pnpm run build:prod
```
✓ Gera builds otimizados em `dist/`

### 2️⃣ Empacotar
```bash
pnpm run pack:prod
```
✓ Cria `deploy/taskia-full.zip` com estrutura correta

### 3️⃣ Upload
Via painel da LocalWeb:
1. Gerenciador de Arquivos
2. Navegue até `/public_html/`
3. **APAGUE** conteúdo antigo
4. Upload `taskia-full.zip`
5. Clique em "Extrair"

### 4️⃣ SSL
No painel LocalWeb:
1. Domínios → SSL/TLS
2. Ativar Let's Encrypt para `tasking.ia.br`

---

## 📁 Estrutura no Servidor

```
/public_html/
│
├── .htaccess              ← Rotas da landing + proteção /dashboard/
├── index.html             ← Landing page
├── favicon.ico
├── robots.txt
├── assets/
│   ├── ai-logo-abc123.png
│   ├── index-xyz789.js
│   └── index-xyz789.css
│
└── dashboard/             ← Dashboard completo
    ├── .htaccess          ← Rotas do dashboard
    ├── index.html
    ├── favicon.ico
    ├── main.abc123.js
    ├── polyfills.abc123.js
    ├── runtime.abc123.js
    └── assets/
        ├── img/
        │   └── ai-logo.png
        └── css/
```

---

## 🔧 Configuração de .htaccess

### Raiz (.htaccess) - Já incluído!
```apache
# Força HTTPS
# Rotas SPA da landing
# Protege /dashboard/ de interferências
# Compressão e cache
```

### Dashboard (.htaccess) - Já incluído!
```apache
# Rotas SPA do dashboard
# Base URL: /dashboard/
```

---

## ✅ Testes Pós-Deploy

| Teste | URL | Esperado |
|-------|-----|----------|
| Landing | https://tasking.ia.br | Home page carrega |
| Navegação | Menu da landing | Links funcionam |
| Login | Botão "Login" | Abre /dashboard/pages/login |
| Dashboard | https://tasking.ia.br/dashboard | Dashboard carrega |
| Refresh | F5 em qualquer rota | Não dá erro 404 |
| HTTPS | Barra de endereço | Cadeado verde 🔒 |

---

## 💡 Vantagens desta Abordagem

| Aspecto | Benefício |
|---------|-----------|
| **Deploy** | ✅ Simples - um único ZIP |
| **Domínio** | ✅ Sem necessidade de subdomínio |
| **SSL** | ✅ Um único certificado |
| **Sessão** | ✅ Cookies compartilhados |
| **CORS** | ✅ Mesma origem, sem problemas |
| **Custo** | ✅ Menor (não usa recursos extras) |

---

## 🆘 Troubleshooting

### Erro 404 ao acessar /dashboard
**Causa:** Arquivo não extraído corretamente  
**Solução:** Verifique se existe `/public_html/dashboard/index.html`

### Landing funciona, mas dashboard dá erro
**Causa:** .htaccess da raiz bloqueando  
**Solução:** Verifique se `/public_html/dashboard/.htaccess` existe

### Erro ao clicar em "Login"
**Causa:** URL incorreta no .env.production  
**Solução:** Deve ser `https://tasking.ia.br/dashboard` (sem /pages/login)

### Assets não carregam
**Causa:** Paths incorretos  
**Solução:** Verifique se a estrutura de pastas está correta

---

## 📞 Próximos Passos

1. ✅ Arquivos configurados
2. ⏳ Executar build: `pnpm run build:prod`
3. ⏳ Criar pacote: `pnpm run pack:prod`
4. ⏳ Upload na LocalWeb
5. ⏳ Ativar SSL
6. ⏳ Testar aplicação

---

**Última atualização:** 20/02/2026  
**Domínio:** tasking.ia.br  
**Expira:** 09/02/2027
