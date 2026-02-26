# Configuração de Produção - tasking.ia.br

## ✅ Domínio Configurado

**Domínio:** tasking.ia.br  
**Status:** Ativo  
**Expira:** 09.02.2027  

---

## 🌐 URLs de Produção

- **Landing Page:** https://tasking.ia.br
- **Dashboard:** https://tasking.ia.br/dashboard
- **API (futuro):** https://tasking.ia.br/api (ou subdomínio no futuro)

---

## 📋 Estrutura no Servidor LocalWeb

```
/public_html/
├── index.html              # Landing Page (raiz)
├── favicon.ico
├── robots.txt
├── assets/                 # Assets da Landing
│   ├── ai-logo-[hash].png
│   ├── index-[hash].js
│   └── index-[hash].css
│
└── dashboard/              # Dashboard (subpasta)
    ├── index.html
    ├── favicon.ico
    ├── main.[hash].js
    ├── polyfills.[hash].js
    └── assets/
        ├── img/
        └── css/
```

**Document Root:** `/public_html/` (raiz para ambos)

---

## ⚙️ Configuração Simplificada (Sem Subdomínio)

### Vantagens de usar mesma origem:

✅ **Não precisa criar subdomínio** - Deploy mais simples  
✅ **Mesma sessão/cookies** - Autenticação compartilhada  
✅ **Sem problemas de CORS** - Ambos na mesma origem  
✅ **Um único certificado SSL** - Mais fácil de gerenciar  

### Configurar Domínio Principal

1. Acesse o painel da LocalWeb
2. Vá em **Domínios** → **Gerenciar Domínio**
3. Configure:
   - **Domínio:** `tasking.ia.br`
   - **Document Ro ✓
   - www.tasking.ia.br (opcional)
---

## 🔐 SSL/HTTPS

A LocalWeb oferece SSL gratuito via Let's Encrypt:

1. Acesse **Domínios** → **Gerenciar Domínio**
2. Clique em **SSL/TLS**
3. Ative **Let's Encrypt** para:
   - tasking.ia.br
   - www.tasking.ia.br
   - dashboard.tasking.ia.br

---

## 📧 Emails (opcional)

Você pode criar emails corporativos:
SL/HTTPS ativo em tasking.ia.br
- [ ] `.env.production` configurado com URL correta
- [ ] Build de produção executado (`pnpm run build:prod`)
- [ ] Pacotes criados (`pnpm run pack:prod`)
- [ ] Upload da landing para `/public_html/`
- [ ] Upload do dashboard para `/public_html/dashboard/`
- [ ] Arquivo `.htaccess` configurado na raiz
- [ ] Teste de acesso: https://tasking.ia.br
- [ ] Teste do dashboard: https://tasking.ia.br/dashboard
---

## ✅ Checklist de Deploy

- [ ] Subdomínio "dashboard" criado
- [ ] SSL ativo em todos os domínios
- [ ] `.env.production` configurado com URLs corretas
- [ ] Build de produção executado
- [ ] Pacotes ZIP criados
- [ ] Upload dos arquivos via FTP ou painel
- [ ] Teste de acesso: https://tasking.ia.br
- [ ] Teste de redirecionamento: Login → Dashboard
- [ ] Verificar HTTPS (cadeado verde)
- [ ] Teste em diferentes navegadores

---

Gerado em: 20/02/2026
