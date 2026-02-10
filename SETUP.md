# 🚀 Guia de Setup Completo - TaskIA-WEB

Este guia é para desenvolvedores que vão rodar o projeto pela **primeira vez**.

---

## ✅ Checklist Antes de Começar

- [ ] Node.js instalado (versão 18 ou superior)
- [ ] Git instalado
- [ ] Editor de código (VS Code recomendado)
- [ ] Terminal/PowerShell disponível

---

## 📖 Passo a Passo Detalhado

### Passo 1: Verificar Node.js

Abra o terminal (PowerShell ou CMD) e execute:

```bash
node --version
```

**Resultado esperado:** `v18.x.x` ou superior

❌ **Se não tiver Node.js instalado:**
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS
3. Instale e reinicie o terminal

---

### Passo 2: Clonar o Repositório

```bash
# Navegue até a pasta onde quer o projeto
cd D:\Desenvolvimento

# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta do projeto
cd TaskIA-WEB
```

---

### Passo 3: Instalar o pnpm

**Por que pnpm?**
- ✅ 3x mais rápido que npm
- ✅ Economiza espaço em disco (hard links)
- ✅ Workspace nativo para monorepos
- ✅ Lock file rígido (mais seguro)

**Instalação no Windows:**

```powershell
# Opção 1: Via npm (mais simples)
npm install -g pnpm

# Opção 2: Via PowerShell (recomendado - mais rápido)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Verificar instalação:**

```bash
pnpm --version
```

**Resultado esperado:** `10.x.x` ou superior

---

### Passo 4: Instalar Dependências do Projeto

```bash
# Certifique-se de estar na pasta raiz do projeto
cd TaskIA-WEB

# Instale TODAS as dependências do monorepo
pnpm install
```

**O que acontece aqui?**
- 📦 Instala dependências do workspace raiz
- 📦 Instala dependências do `apps/landing` (React)
- 📦 Instala dependências do `apps/dashboard` (Angular)
- 📦 Instala dependências do `packages/shared`
- ⚡ Cria links simbólicos entre os workspaces

**Tempo estimado:** 2-5 minutos (dependendo da internet)

---

### Passo 5: Verificar Instalação

```bash
# Liste todos os workspaces instalados
pnpm list -r --depth=0
```

**Resultado esperado:**
```
@taskia/dashboard@1.0.0 D:\...\apps\dashboard (PRIVATE)
@taskia/landing@1.0.0 D:\...\apps\landing (PRIVATE)
@taskia/shared@1.0.0 D:\...\packages\shared (PRIVATE)
```

---

### Passo 6: Rodar o Projeto

#### Opção A: Rodar Ambos os Apps (Recomendado)

```bash
pnpm dev
```

**O que acontece:**
- ✅ Inicia Landing Page em http://localhost:8080
- ✅ Inicia Dashboard em http://localhost:4200
- ⚡ Usa Turborepo para executar em paralelo

#### Opção B: Rodar Apenas a Landing Page

```bash
pnpm dev:landing
```

Abre em: **http://localhost:8080**

#### Opção C: Rodar Apenas o Dashboard

```bash
pnpm dev:dashboard
```

Abre em: **http://localhost:4200**

---

### Passo 7: Verificar se Está Funcionando

**1. Verifique o terminal:**
- Deve mostrar logs de compilação
- Não deve ter erros vermelhos

**2. Abra o navegador:**
- Landing: http://localhost:8080
- Dashboard: http://localhost:4200

**3. Verifique as portas em uso:**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 4200,8080 | Select-Object LocalPort, State
```

**Resultado esperado:**
```
LocalPort       State
---------       -----
     8080      Listen
     4200      Listen
```

---

## 🎯 Comandos Úteis do Dia a Dia

### Desenvolvimento

```bash
# Iniciar todos os apps
pnpm dev

# Apenas landing
pnpm dev:landing

# Apenas dashboard
pnpm dev:dashboard
```

### Build (Testar Produção)

```bash
# Build de tudo (primeira vez ~20s, com cache ~2s)
pnpm build

# Build individual
pnpm build:landing
pnpm build:dashboard
```

### Limpeza

```bash
# Limpar builds e cache do Turborepo
pnpm clean

# Limpar TUDO e reinstalar (último recurso)
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## ❗ Problemas Comuns e Soluções

### ❌ Erro: "pnpm não é reconhecido"

**Causa:** pnpm não está no PATH do sistema

**Solução:**
```bash
# Reinstale o pnpm
npm install -g pnpm

# Feche e reabra o terminal
# Teste novamente
pnpm --version
```

---

### ❌ Erro: "Port 8080 is already in use"

**Causa:** Outro processo está usando a porta

**Solução 1** (Mudar a porta):
```bash
# Landing usa Vite, você pode mudar no vite.config.ts
# Ou rodar com porta customizada
cd apps/landing
vite --port 3000
```

**Solução 2** (Finalizar processo):
```bash
# Windows
netstat -ano | findstr "8080"
# Anote o PID e finalize
taskkill /PID <numero> /F

# Ou finalize todos os processos Node
Stop-Process -Name "node" -Force
```

---

### ❌ Erro: "Cannot find module '@taskia/shared'"

**Causa:** Workspace não foi instalado corretamente

**Solução:**
```bash
# Reinstale as dependências
rm -rf node_modules
pnpm install
```

---

### ❌ Erro de compilação no Angular

**Causa:** Cache corrompido do Angular

**Solução:**
```bash
# Limpe o cache do Angular
cd apps/dashboard
rm -rf .angular node_modules
cd ../..
pnpm install
```

---

## 🔥 Dicas Pro

### 1. Use o Turborepo Cache

Após a primeira build, builds subsequentes serão **muito mais rápidas**:

```bash
# Primeira vez: ~20 segundos
pnpm build

# Segunda vez (sem mudanças): ~1.8 segundos ⚡
pnpm build
```

### 2. Desenvolva em Hot Reload

Ambos os apps têm hot reload ativado:
- Salve um arquivo → Mudanças aparecem automaticamente no navegador

### 3. Compartilhe Código com @taskia/shared

```typescript
// Em qualquer app (landing ou dashboard)
import { User, formatDate } from '@taskia/shared';

const user: User = {
  id: '1',
  name: 'João',
  email: 'joao@taskia.com',
  role: 'admin'
};

console.log(formatDate(new Date())); // 10/02/2026
```

### 4. Visualize o Grafo de Dependências

```bash
pnpm graph
```

Isso gera um arquivo `dependency-graph.html` que você pode abrir no navegador.

---

## 📞 Precisa de Ajuda?

1. Verifique o [README.md](./README.md) principal
2. Consulte o [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) para entender a arquitetura
3. Entre em contato com o time de desenvolvimento

---

## ✨ Pronto!

Agora você está pronto para desenvolver no TaskIA-WEB! 🚀

**Próximos passos:**
1. Abra o projeto no VS Code
2. Explore a estrutura em `apps/` e `packages/`
3. Faça suas alterações
4. Commite usando conventional commits: `feat:`, `fix:`, `chore:`, etc.

Bom código! 💻
