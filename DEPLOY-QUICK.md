# Deploy Quick Reference

## 🚀 Build & Deploy Rápido

### 1. Build de Produção
```bash
pnpm run build:prod
```
Gera builds otimizados em `dist/landing/` e `dist/dashboard/`

### 2. Criar Pacotes ZIP
```bash
pnpm run pack:prod
```
Cria arquivos ZIP prontos para upload em `deploy/`

### 3. Upload na LocalWeb
- **Via Painel**: Gerenciador de Arquivos → Upload taskia-full.zip em `/public_html/` → Extrair
- **Via FTP**: FileZilla/WinSCP → Upload e extração manual

**⚠️ IMPORTANTE:** Use `taskia-full.zip` - já vem com a estrutura correta!

---

## 📦 Pacotes Gerados

| Arquivo | Conteúdo | Destino no Servidor |
|---------|----------|---------------------|
| `taskia-landing.zip` | Landing Page | `/public_html/` (raiz) |
| `taskia-dashboard.zip` | Dashboard | `/public_html/dashboard/` |
| `taskia-full.zip` | ⭐ **RECOMENDADO** | `/public_html/` (estrutura completa) |

--- (Simplificada)

### Domínio Principal
- **URL Landing**: `https://tasking.ia.br`
- **URL Dashboard**: `https://tasking.ia.br/dashboard`
- **Document Root**: `/public_html/`
- **SSL**: Ativar (Let's Encrypt - gratuito)

### ✅ Vantagens de usar mesma origem:
- Não precisa criar subdomínio
- Deploy mais simples
- Cookies/sessão compartilhados
- Sem problemas de CORS
- Um único certificado SSLking.ia.br`
- **Document Root**: `/public_html/dashboard`
- **SSL**: Ativar (Let's Encrypt)
`https://tasking.ia.br/dashboard`
- [ ] Executar `pnpm run build:prod`
- [ ] Executar `pnpm run pack:prod`
- [ ] Upload do `taskia-full.zip` via painel da LocalWeb em `/public_html/`
- [ ] Extrair arquivos
- [ ] Configurar domínio e SSL no painel LocalWeb
- [ ] Testar: https://tasking.ia.br
- [ ] Testar: https://tasking.ia.br/dashboardd:prod`
- [ ] Executar `pnpm run pack:prod`
- [ ] Upload dos ZIPs via painel da LocalWeb
- [ ] Extrair arquivos nos diretórios corretos
- [ ] Configurar domínios e SSL
- [ ] Testar URLs e navegação
- [ ] Verificar botão "Login" da landing → dashboard

---

## 🔧 Scripts Disponíveis

```bash
# Build otimizado de produção
pnpm run build:prod          # Ambos
pnpm run build:prod:landing  # Apenas landing
pnpm run build:prod:dashboard # Apenas dashboard

# Criar pacotes ZIP
pnpm run pack:prod

# Preview local do build de produção
pnpm run preview:landing
pnpm run preview:dashboard
```

---

## 📚 Documentação Completa

Ver [DEPLOY.md](DEPLOY.md) para guia detalhado com:
- Configuração de variáveis de ambiente
- Estrutura de diretórios completa
- Configuração de .htaccess
- Troubleshooting
- Testes pós-deploy
