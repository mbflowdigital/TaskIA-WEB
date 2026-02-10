# ⚡ Início Rápido - Migração para Turborepo

## 🎯 Opção 1: Script Automático (RECOMENDADO)

### Executar migração completa em 1 comando:

```powershell
# Executar script de migração
.\migrate-to-monorepo.ps1
```

**Tempo:** ~10-15 minutos (depende da velocidade de download)

### Opções do script:

```powershell
# Modo dry-run (simular sem fazer mudanças)
.\migrate-to-monorepo.ps1 -DryRun

# Pular backup (não recomendado)
.\migrate-to-monorepo.ps1 -SkipBackup

# Modo verbose
.\migrate-to-monorepo.ps1 -Verbose
```

---

## 🎯 Opção 2: Migração Manual Passo a Passo

### Pré-requisitos (5 minutos)

```powershell
# 1. Criar branch
git checkout -b feat/monorepo-turborepo

# 2. Backup
cd ..
Copy-Item -Recurse TaskIA-WEB "TaskIA-WEB-backup-$(Get-Date -Format 'yyyyMMdd')"
cd TaskIA-WEB

# 3. Instalar pnpm
npm install -g pnpm
```

### Setup Inicial (10 minutos)

```powershell
# 1. Criar estrutura
New-Item -ItemType Directory -Force -Path "apps"
New-Item -ItemType Directory -Force -Path "packages\shared\src"

# 2. Baixar configs prontos
# IMPORTANTE: Copiar conteúdos de MIGRATION_PLAN.md (Fase 1)
# - package.json raiz
# - pnpm-workspace.yaml
# - turbo.json

# 3. Mover projetos
Move-Item "Lading-page" "apps\landing"
Move-Item "taskplan-ia-frontend" "apps\dashboard"

# 4. Instalar
pnpm install
```

### Testar (5 minutos)

```powershell
# Rodar tudo
pnpm dev
# Landing: http://localhost:8080
# Dashboard: http://localhost:4200

# Build
pnpm build

# Testar cache (rodar build novamente)
pnpm build  # Deve ser instantâneo!
```

---

## ✅ Checklist Pós-Migração

**Validações obrigatórias:**

- [ ] `pnpm dev` inicia ambos apps sem erros
- [ ] Landing abre em localhost:8080
- [ ] Dashboard abre em localhost:4200
- [ ] `pnpm build` termina com sucesso
- [ ] Build rodado 2x mostra "cache hit" (FULL TURBO)
- [ ] `pnpm lint` executa sem erros críticos
- [ ] Estrutura de pastas correta:
  ```
  apps/landing/
  apps/dashboard/
  packages/shared/
  turbo.json
  pnpm-workspace.yaml
  ```

**Próximos passos:**

1. Commit: `git add . && git commit -m "feat: migrar para monorepo"`
2. Testar CI/CD (se configurado)
3. Atualizar documentação do time
4. Extrair código compartilhado para `packages/shared`

---

## 🐛 Troubleshooting Express

| Problema | Solução Rápida |
|----------|----------------|
| **Port em uso** | `npx kill-port 8080 4200` |
| **pnpm não instalou** | `npm install -g pnpm@latest` |
| **Turbo não funciona** | `pnpm install` (reinstalar) |
| **Imports quebrados** | Verificar `package.json` names: `@taskia/*` |
| **Cache não funciona** | Normal na 1ª vez, teste rodando `pnpm build` 2x |
| **Angular não compila** | Verificar se `angular.json` foi atualizado (nome do projeto) |

---

## 📊 Comandos Essenciais

```powershell
# Desenvolvimento
pnpm dev                    # Tudo
pnpm dev:landing            # Só landing
pnpm dev:dashboard          # Só dashboard

# Build
pnpm build                  # Tudo (com cache!)
pnpm build:landing          # Só landing
pnpm build --force          # Ignorar cache

# Qualidade
pnpm lint                   # Lint
pnpm test                   # Testes

# Ferramentas
pnpm graph                  # Visualizar dependências
pnpm clean                  # Limpar tudo
turbo --help                # Ajuda do Turbo
```

---

## 🎯 Validação de Sucesso

Execute este comando para validar tudo:

```powershell
# Validação completa
pnpm install && 
pnpm build && 
Write-Host "✅ Build OK" &&
pnpm build &&
Write-Host "✅ Cache OK" &&
pnpm lint &&
Write-Host "✅ Lint OK" &&
Write-Host "`n🎉 TUDO FUNCIONANDO!"
```

Se tudo passar = **Migração 100% concluída!**

---

## 📚 Documentação

- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - Plano detalhado completo
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia de desenvolvimento
- **[README.md](./README.md)** - Overview do projeto

---

## 🆘 Suporte

Se encontrar problemas:

1. Consultar seção Troubleshooting em `MIGRATION_PLAN.md`
2. Executar script em modo dry-run: `.\migrate-to-monorepo.ps1 -DryRun`
3. Verificar logs com verbose: `pnpm build --verbosity=2`
4. Restaurar backup se necessário

---

## 🚀 Performance Esperada

| Métrica | Antes | Depois (1ª) | Depois (cache) |
|---------|-------|-------------|----------------|
| **Build** | 165s | 60s | 2-5s ⚡ |
| **Dev start** | 30s cada | 35s ambos | - |
| **Espaço disco** | 430MB | 213MB | - |

---

**Pronto para começar? Execute:**

```powershell
.\migrate-to-monorepo.ps1
```

**Boa migração! 🎉**
