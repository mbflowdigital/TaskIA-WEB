# ✅ Checklist de Migração Turborepo - TaskIA

**Data:** ___/___/2026  
**Responsável:** _____________________  
**Início:** _____  **Término:** _____

---

## 📋 PRÉ-MIGRAÇÃO

### Preparação
- [ ] ✅ Node.js >= 18 instalado (`node --version`)
- [ ] ✅ npm >= 8 instalado (`npm --version`)
- [ ] ✅ Git instalado e configurado
- [ ] ✅ Código atual commitado (`git status` limpo)
- [ ] ✅ Todos os testes passando
- [ ] ✅ Landing funcionando (localhost:8080)
- [ ] ✅ Dashboard funcionando (localhost:4200)

### Backup
- [ ] ✅ Branch criada: `feat/monorepo-turborepo`
- [ ] ✅ Backup criado (pasta com timestamp)
- [ ] ✅ Snapshot documentado (migration-snapshot.txt)
- [ ] ✅ Time notificado da migração

**⏱️ Tempo:** ~30min | **Checkpoint:** Pode reverter a qualquer momento

---

## 🏗️ SETUP INICIAL

### Instalações Globais
- [ ] ✅ pnpm instalado (`npm install -g pnpm`)
- [ ] ✅ pnpm funcionando (`pnpm --version` >= 8.0)

### Estrutura de Pastas
- [ ] ✅ `apps/` criado
- [ ] ✅ `packages/shared/src/` criado
- [ ] ✅ `packages/config/` criado

### Arquivos de Configuração
- [ ] ✅ `package.json` raiz criado
  - name: "taskia-monorepo"
  - workspaces configurado
  - scripts adicionados
- [ ] ✅ `pnpm-workspace.yaml` criado
- [ ] ✅ `turbo.json` criado
- [ ] ✅ `.npmrc` criado
- [ ] ✅ `.gitignore` atualizado

### Turborepo
- [ ] ✅ Dependências instaladas (`pnpm install`)
- [ ] ✅ Turbo funcionando (`pnpm turbo --version`)

**⏱️ Tempo:** ~2h | **Checkpoint:** Estrutura base pronta

---

## 📦 MIGRAÇÃO DOS APPS

### Landing Page
- [ ] ✅ `Lading-page/` movida para `apps/landing/`
- [ ] ✅ `package.json` atualizado (name: "@taskia/landing")
- [ ] ✅ Script `clean` adicionado
- [ ] ✅ Vite config verificado
- [ ] ✅ Dependências instaladas
- [ ] ✅ Dev funciona (`cd apps/landing && pnpm dev`)
- [ ] ✅ Build funciona (`pnpm build`)
- [ ] ✅ Abre em localhost:8080 sem erros

### Dashboard
- [ ] ✅ `taskplan-ia-frontend/` movido para `apps/dashboard/`
- [ ] ✅ `package.json` atualizado (name: "@taskia/dashboard")
- [ ] ✅ `angular.json` atualizado (matngular → dashboard)
- [ ] ✅ Script `clean` adicionado
- [ ] ✅ Dependências instaladas
- [ ] ✅ Dev funciona (`cd apps/dashboard && pnpm start`)
- [ ] ✅ Build funciona (`pnpm build`)
- [ ] ✅ Abre em localhost:4200 sem erros

**⏱️ Tempo:** ~7h | **Checkpoint:** Ambos apps funcionando isoladamente

---

## 📚 PACKAGES COMPARTILHADOS

### @taskia/shared
- [ ] ✅ `packages/shared/package.json` criado
- [ ] ✅ `packages/shared/tsconfig.json` criado
- [ ] ✅ `packages/shared/src/types.ts` criado
- [ ] ✅ `packages/shared/src/utils.ts` criado
- [ ] ✅ `packages/shared/src/index.ts` criado (barrel)
- [ ] ✅ Adicionado como dep no landing (`pnpm add @taskia/shared@workspace:*`)
- [ ] ✅ Adicionado como dep no dashboard
- [ ] ✅ Import testado no landing: `import { formatDate } from '@taskia/shared'`
- [ ] ✅ Import testado no dashboard

**⏱️ Tempo:** ~6h | **Checkpoint:** Código compartilhado funcionando

---

## ⚙️ CONFIGURAÇÃO DO TURBOREPO

### Pipeline
- [ ] ✅ `turbo.json` configurado corretamente
- [ ] ✅ Task `build` configurada
- [ ] ✅ Task `dev` configurada
- [ ] ✅ Task `lint` configurada
- [ ] ✅ Task `test` configurada
- [ ] ✅ Task `clean` configurada
- [ ] ✅ Outputs definidos
- [ ] ✅ DependsOn configurado

### Workspaces
- [ ] ✅ pnpm workspaces detecta todos os packages
- [ ] ✅ `pnpm list -r --depth 0` mostra:
  - @taskia/landing
  - @taskia/dashboard
  - @taskia/shared
- [ ] ✅ Hoisting funcionando (node_modules otimizado)

**⏱️ Tempo:** ~2h | **Checkpoint:** Pipeline configurado

---

## 🧪 TESTES E VALIDAÇÃO

### Comandos Básicos
- [ ] ✅ `pnpm dev` inicia ambos apps
- [ ] ✅ Landing abre (localhost:8080)
- [ ] ✅ Dashboard abre (localhost:4200)
- [ ] ✅ Hot reload funciona nos 2
- [ ] ✅ `pnpm build` compila tudo sem erros
- [ ] ✅ `pnpm lint` executa
- [ ] ✅ `pnpm test` executa (se tiver testes)

### Cache do Turborepo
- [ ] ✅ 1º build registrado (tempo: ___s)
- [ ] ✅ 2º build usa cache (tempo: ___s)
- [ ] ✅ Mensagens "cache hit" aparecem
- [ ] ✅ Performance melhorou >60%

### Comandos Filtrados
- [ ] ✅ `pnpm dev:landing` funciona
- [ ] ✅ `pnpm dev:dashboard` funciona
- [ ] ✅ `pnpm build:landing` funciona
- [ ] ✅ `pnpm build:dashboard` funciona

### Dependency Graph
- [ ] ✅ `pnpm graph` gera HTML
- [ ] ✅ Graph mostra dependências corretas

### Limpeza
- [ ] ✅ `pnpm clean` remove builds
- [ ] ✅ Reinstalação funciona após clean

**⏱️ Tempo:** ~3h | **Checkpoint:** Tudo validado e funcionando

---

## 🚀 CI/CD

### GitHub Actions
- [ ] ✅ `.github/workflows/ci.yml` criado
- [ ] ✅ Setup pnpm configurado
- [ ] ✅ Cache do Turbo configurado
- [ ] ✅ Jobs de lint, test, build criados
- [ ] ✅ Upload de artifacts configurado
- [ ] ✅ Deploy condicional (opcional)
- [ ] ✅ Workflow testado (push na branch)
- [ ] ✅ Build passa no CI

**⏱️ Tempo:** ~4h | **Checkpoint:** CI/CD automatizado

---

## 📝 DOCUMENTAÇÃO

### Arquivos Criados
- [ ] ✅ `MIGRATION_PLAN.md` (este arquivo)
- [ ] ✅ `QUICKSTART.md` criado
- [ ] ✅ `DEVELOPMENT.md` criado
- [ ] ✅ `README.md` atualizado
- [ ] ✅ `CHECKLIST.md` (este arquivo)

### Conteúdo
- [ ] ✅ Como rodar em dev
- [ ] ✅ Como fazer build
- [ ] ✅ Como adicionar dependências
- [ ] ✅ Como criar novos packages
- [ ] ✅ Troubleshooting documentado
- [ ] ✅ Scripts explicados
- [ ] ✅ Arquitetura explicada

**⏱️ Tempo:** ~2h | **Checkpoint:** Documentação completa

---

## 🎉 FINALIZAÇÃO

### Git
- [ ] ✅ Todos os arquivos tracked
- [ ] ✅ .gitignore correto (não commita node_modules)
- [ ] ✅ Commits organizados
- [ ] ✅ Mensagem de commit descritiva
- [ ] ✅ Push para remoto
- [ ] ✅ PR criado (se workflow exigir)

### Comunicação
- [ ] ✅ Time notificado
- [ ] ✅ Documentação compartilhada
- [ ] ✅ Treinamento agendado (se necessário)
- [ ] ✅ Changelog atualizado

### Métricas
| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Build time (1ª vez) | 165s | ___s | __% |
| Build time (cache) | 165s | ___s | __% |
| Espaço em disco | 430MB | ___MB | __% |
| Node modules | 2x separado | shared | ✅ |

### Validação Final ⭐
- [ ] ✅ Landing: http://localhost:8080 ✅
- [ ] ✅ Dashboard: http://localhost:4200 ✅
- [ ] ✅ Zero erros de build ✅
- [ ] ✅ Zero erros de lint críticos ✅
- [ ] ✅ Cache do Turbo ativo ✅
- [ ] ✅ CI/CD passando ✅
- [ ] ✅ Time alinhado ✅
- [ ] ✅ Docs completas ✅

**⏱️ Tempo Total:** ___h | **Status:** 🎉 CONCLUÍDO

---

## 🔄 ROLLBACK (Se necessário)

- [ ] Checkout branch anterior: `git checkout main`
- [ ] Deletar branch: `git branch -D feat/monorepo-turborepo`
- [ ] Restaurar backup: copiar pasta backup-*
- [ ] Reinstalar deps antigas: `npm install` em cada projeto

**Backup localizado em:** _________________________________

---

## 📊 RELATÓRIO FINAL

**Data de conclusão:** ___/___/2026  
**Tempo total:** _____ horas  
**Problemas encontrados:** _____  
**Soluções aplicadas:** _____  

**Observações:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Assinatura:** _____________________ **Data:** ___/___/2026

---

## ✅ CHECKLIST RESUMIDO (Validação Rápida)

Execute e marque ✅:

```powershell
# 1. Estrutura
pnpm list -r --depth 0  # ✅ Mostra 3 workspaces

# 2. Dev
pnpm dev  # ✅ Ambos apps iniciam

# 3. Build (1ª vez)
pnpm build  # ✅ Sem erros, tempo: ___s

# 4. Cache (2ª vez)
pnpm build  # ✅ Cache hit, tempo: ___s (deve ser <10s)

# 5. Lint
pnpm lint  # ✅ Sem erros críticos

# 6. Graph
pnpm graph  # ✅ HTML gerado

# 7. Clean/Reinstall
pnpm clean && pnpm install  # ✅ Funciona
```

**Todos ✅ = MIGRAÇÃO COMPLETA! 🎉**

---

**Versão do Checklist:** 1.0  
**Última atualização:** 09/02/2026  
**Mantenedor:** TaskIA Engineering Team
