# Guia de Deploy - TaskIA Platform

## 📦 Geração de Pacotes para Produção

### Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado
- Projeto configurado e testado localmente

---

## 🚀 Build de Produção

### 1. Configurar Variáveis de Ambiente

#### Landing Page
Crie o arquivo `apps/landing/.env.production`:

```env
VITE_DASHBOARD_URL=https://dashboard.tasking.ia.br
```

#### Dashboard
Edite `apps/dashboard/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tasking.ia.br',
  // outras configurações
};
```

### 2. Executar Build de Produção

```bash
# Build de todos os apps otimizados para produção
pnpm run build:prod

# OU individualmente:
pnpm run build:landing:prod
pnpm run build:dashboard:prod
```

### 3. Arquivos Gerados

Após o build, você terá:

```
📁 dist/
  📁 landing/          # Landing page (React + Vite)
     index.html
     assets/
       *.js (minificado)
       *.css (minificado)
       
  📁 dashboard/        # Dashboard (Angular)
     index.html
     *.js (minificado)
     *.css (minificado)
     assets/
```

---

## 🌐 Deploy na LocalWeb

### Opção 1: Upload via FTP/SFTP

#### A. Usando FileZilla ou WinSCP

1. **Conecte ao servidor LocalWeb**
   - Host: `ftp.tasking.ia.br`
   - Usuário: seu usuário da LocalWeb
   - Senha: sua senha
   - Porta: 21 (FTP) ou 22 (SFTP)

2. **Estrutura de diretórios sugerida:**

```
/public_html/
  📁 www/               # Landing page
     (conteúdo de dist/landing/)
     
  📁 dashboard/         # Dashboard
     (conteúdo de dist/dashboard/)
```

3. **Upload dos arquivos:**
   - Navegue até `dist/landing/`
   - Selecione TODOS os arquivos
   - Arraste para `/public_html/www/`
   - Repita para `dist/dashboard/` → `/public_html/dashboard/`

#### B. Usando script PowerShell (Windows)

```powershell
# Ver script deploy-ftp.ps1
.\scripts\deploy-ftp.ps1
```

### Opção 2: Gerador de Pacote ZIP

Para facilitar o upload via painel da LocalWeb:

```bash
# Gerar pacotes ZIP prontos para upload
pnpm run pack:prod
```

Isso cria:
- `deploy/taskia-landing.zip` - Landing page
- `deploy/taskia-dashboard.zip` - Dashboard
- `deploy/taskia-full.zip` - Ambos juntos

**No painel da LocalWeb:**
1. Acesse o Gerenciador de Arquivos
2. Navegue até a pasta desejada
3. Clique em "Upload" ou "Enviar Arquivo"
4. Selecione o arquivo ZIP
5. Após o upload, clique em "Extrair"

---

## ⚙️ Configuração de Domínios

### Landing Page (www)

**URL:** `https://tasking.ia.br` ou `https://www.tasking.ia.br`

**Configuração no painel LocalWeb:**
1. Vá em **Domínios** → **Gerenciar Domínio**
2. Configure o **Document Root** para: `/public_html/www`
3. Ative SSL/HTTPS (Let's Encrypt gratuito)

### Dashboard (Subdomínio)

**URL:** `https://dashboard.tasking.ia.br`

**Configuração no painel LocalWeb:**
1. Vá em **Domínios** → **Criar Subdomínio**
2. Nome: `dashboard`
3. **Document Root**: `/public_html/dashboard`
4. Ative SSL/HTTPS

---

## 🔧 Configuração de .htaccess

### Landing Page (React SPA)

Crie `.htaccess` em `/public_html/www/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redireciona tudo para HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA - Redireciona todas as rotas para index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compressão Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache de assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Dashboard (Angular SPA)

Crie `.htaccess` em `/public_html/dashboard/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redireciona tudo para HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA - Redireciona todas as rotas para index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compressão e Cache (igual ao da landing)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

---

## 🧪 Testes Pós-Deploy

### 1. Verificar URLs

- [ ] Landing: `https://seudominio.com.br`
- [ ] Dashboard: `https://dashboard.seudominio.com.br`
- [ ] Botão "Login" redireciona corretamente
- [ ] Assets (imagens, CSS, JS) carregando

### 2. Testar Rotas

- [ ] Navegação no menu da landing
- [ ] Acesso à rota `/pages/login` no dashboard
- [ ] Refresh de página (F5) não dá erro 404

### 3. Performance

- [ ] HTTPS ativo (cadeado verde)
- [ ] Tempo de carregamento < 3s
- [ ] Imagens otimizadas
- [ ] Sem erros no Console (F12)

---

## 📊 Estrutura Final no Servidor

```
/home/seuusuario/public_html/
│
├── www/                          # Landing Page
│   ├── .htaccess
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── ai-logo-[hash].png
│       ├── index-[hash].js
│       └── index-[hash].css
│
└── dashboard/                    # Dashboard
    ├── .htaccess
    ├── index.html
    ├── favicon.ico
    ├── main.[hash].js
    ├── polyfills.[hash].js
    ├── runtime.[hash].js
    └── assets/
        ├── img/
        │   └── ai-logo.png
        ├── css/
        └── vendor/
```

---

## ⚡ Scripts Úteis

```bash
# Build de produção
pnpm run build:prod

# Gerar pacotes ZIP
pnpm run pack:prod

# Deploy via FTP (requer configuração)
pnpm run deploy

# Limpar builds antigos
pnpm run clean

# Preview local do build de produção
pnpm run preview:landing
pnpm run preview:dashboard
```

---

## 🔒 Checklist de Segurança

- [ ] Variáveis de ambiente de produção configuradas
- [ ] SSL/HTTPS ativo
- [ ] `.env.local` e `.env.production` no `.gitignore`
- [ ] Credenciais de API em variáveis de ambiente
- [ ] CORS configurado no backend
- [ ] Headers de segurança configurados

---

## 📞 Suporte LocalWeb

- **Site:** https://www.locaweb.com.br
- **Suporte:** https://ajuda.locaweb.com.br
- **Telefone:** 3544-0050

---

## 🚨 Troubleshooting

### Erro 404 ao recarregar página
**Solução:** Verifique o `.htaccess` e mod_rewrite ativo

### Assets não carregam
**Solução:** Verifique paths no `vite.config.ts` e `angular.json`

### URL do dashboard incorreta
**Solução:** Atualize `.env.production` da landing com URL correta

### Build muito grande
**Solução:** 
- Execute `pnpm run build:prod` ao invés de `pnpm run build`
- Verifique otimizações no `angular.json`
- Use lazy loading no Angular

---

**Documentação atualizada em:** Fevereiro 2026
