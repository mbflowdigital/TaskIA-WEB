# 🚀 Plano de Migração para Turborepo - TaskIA Monorepo

**Data de início:** 09/02/2026  
**Tempo estimado:** 3-4 dias  
**Responsável:** Desenvolvimento TaskIA  
**Status:** 🔵 Planejamento

---

## 📊 Visão Geral

### Estrutura Atual
```
TaskIA-WEB/
├── Lading-page/              (React + Vite)
├── taskplan-ia-frontend/     (Angular 17)
└── README.md
```

### Estrutura Final
```
TaskIA-WEB/
├── apps/
│   ├── landing/              (ex: Lading-page)
│   └── dashboard/            (ex: taskplan-ia-frontend)
├── packages/
│   ├── shared/               (tipos, utils compartilhados)
│   ├── ui/                   (componentes UI - futuro)
│   └── config/               (configs ESLint, TS)
├── package.json              (root workspace)
├── turbo.json                (pipeline config)
├── pnpm-workspace.yaml       (workspaces)
└── .gitignore                (atualizado)
```

---

## ⏱️ Timeline

| Fase | Duração | Atividades |
|------|---------|------------|
| **0. Backup** | 30min | Git branch, backup local |
| **1. Setup Inicial** | 2h | Instalar Turborepo, criar estrutura |
| **2. Migração Landing** | 3h | Mover e ajustar Landing Page |
| **3. Migração Dashboard** | 4h | Mover e ajustar Dashboard Angular |
| **4. Workspaces** | 2h | Configurar dependências compartilhadas |
| **5. Packages Comuns** | 6h | Extrair código compartilhado |
| **6. Pipeline** | 2h | Configurar turbo.json |
| **7. Testes** | 3h | Validar builds, testes, dev |
| **8. CI/CD** | 4h | Atualizar GitHub Actions |
| **9. Documentação** | 2h | README, guias |
| **TOTAL** | **28h** | **~3.5 dias** |

---

## 🎯 FASE 0: Backup e Preparação

### ✅ Checklist Pré-Migração

- [ ] Commit de todo código atual
- [ ] Todos os testes passando
- [ ] Criar branch `feat/monorepo-turborepo`
- [ ] Backup local da pasta completa
- [ ] Documentar estado atual (portas, scripts)

### Comandos

```powershell
# 1. Verificar estado limpo
cd "D:\Desenvolvimento\11 - IA Plan\TaskIA-WEB"
git status

# 2. Commit se necessário
git add .
git commit -m "chore: estado antes da migração para monorepo"

# 3. Criar branch de migração
git checkout -b feat/monorepo-turborepo

# 4. Backup local
cd ..
Copy-Item -Path "TaskIA-WEB" -Destination "TaskIA-WEB-backup-$(Get-Date -Format 'yyyyMMdd')" -Recurse

# 5. Voltar para pasta de trabalho
cd TaskIA-WEB

# 6. Documentar estado atual
Write-Output @"
Estado Atual ($(Get-Date)):
- Landing: porta 8080
- Dashboard: porta 4200
- Node: $(node --version)
- npm: $(npm --version)
"@ > migration-snapshot.txt
```

**Tempo:** 30 minutos  
**Checkpoint:** ✅ Branch criada, backup feito

---

## 🎯 FASE 1: Setup Inicial do Turborepo

### Objetivos
- Instalar pnpm globalmente
- Criar estrutura base do monorepo
- Configurar arquivos raiz

### 1.1 Instalar pnpm (gerenciador recomendado)

```powershell
# Instalar pnpm globalmente
npm install -g pnpm@latest

# Verificar instalação
pnpm --version
# Esperado: 8.x ou superior
```

### 1.2 Criar estrutura de pastas

```powershell
# Criar estrutura base
New-Item -ItemType Directory -Force -Path "apps"
New-Item -ItemType Directory -Force -Path "packages\shared\src"
New-Item -ItemType Directory -Force -Path "packages\config\eslint"
New-Item -ItemType Directory -Force -Path "packages\config\typescript"

# Estrutura criada:
# apps/
# packages/
#   ├── shared/src/
#   └── config/
#       ├── eslint/
#       └── typescript/
```

### 1.3 Criar package.json raiz

```powershell
# Criar package.json raiz
@"
{
  \"name\": \"taskia-monorepo\",
  \"version\": \"1.0.0\",
  \"private\": true,
  \"description\": \"TaskIA Platform - Monorepo com Turborepo\",
  \"workspaces\": [
    \"apps/*\",
    \"packages/*\"
  ],
  \"scripts\": {
    \"dev\": \"turbo run dev\",
    \"build\": \"turbo run build\",
    \"test\": \"turbo run test\",
    \"lint\": \"turbo run lint\",
    \"clean\": \"turbo run clean && rimraf node_modules\",
    \"format\": \"prettier --write \\\"**/*.{ts,tsx,js,jsx,json,md}\\\"\"
  },
  \"devDependencies\": {
    \"turbo\": \"^2.3.0\",
    \"prettier\": \"^3.4.2\",
    \"rimraf\": \"^6.0.1\"
  },
  \"engines\": {
    \"node\": \">=18.0.0\",
    \"pnpm\": \">=8.0.0\"
  },
  \"packageManager\": \"pnpm@8.15.4\"
}
"@ | Out-File -FilePath "package.json" -Encoding utf8
```

### 1.4 Criar pnpm-workspace.yaml

```powershell
@"
packages:
  - 'apps/*'
  - 'packages/*'
"@ | Out-File -FilePath "pnpm-workspace.yaml" -Encoding utf8
```

### 1.5 Criar turbo.json (configuração do pipeline)

```powershell
@"
{
  \"\$schema\": \"https://turbo.build/schema.json\",
  \"globalDependencies\": [
    \".env\",
    \"tsconfig.json\"
  ],
  \"pipeline\": {
    \"build\": {
      \"dependsOn\": [\"^build\"],
      \"outputs\": [\"dist/**\", \".next/**\", \"build/**\", \".angular/**\"]
    },
    \"dev\": {
      \"cache\": false,
      \"persistent\": true
    },
    \"lint\": {
      \"outputs\": []
    },
    \"test\": {
      \"dependsOn\": [\"^build\"],
      \"outputs\": [\"coverage/**\"],
      \"cache\": true
    },
    \"clean\": {
      \"cache\": false
    }
  }
}
"@ | Out-File -FilePath "turbo.json" -Encoding utf8
```

### 1.6 Atualizar .gitignore

```powershell
# Adicionar entradas do Turborepo ao .gitignore
@"

# Turborepo
.turbo
dist/
build/
*.tsbuildinfo

# pnpm
.pnpm-store/
pnpm-lock.yaml

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/

# Env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
"@ | Add-Content -Path ".gitignore"
```

### 1.7 Instalar dependências raiz

```powershell
# Instalar dependências raiz
pnpm install

# Verificar instalação do Turbo
pnpm turbo --version
```

**Tempo:** 2 horas  
**Checkpoint:** ✅ Estrutura base criada, Turbo instalado

---

## 🎯 FASE 2: Migração da Landing Page

### Objetivos
- Mover Lading-page para apps/landing
- Ajustar configurações
- Validar funcionamento

### 2.1 Mover arquivos

```powershell
# Mover Lading-page para apps/landing
Move-Item -Path "Lading-page" -Destination "apps\landing"
```

### 2.2 Atualizar package.json da landing

Abrir `apps/landing/package.json` e modificar:

```json
{
  "name": "@taskia/landing",
  "private": true,
  "version": "1.0.0",
  // ... resto mantém igual
}
```

### 2.3 Atualizar vite.config.ts

Verificar se o path está correto em `apps/landing/vite.config.ts`:

```typescript
// Já está correto, mas validar:
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### 2.4 Adicionar script de clean

Adicionar ao `apps/landing/package.json`:

```json
{
  "scripts": {
    // ... scripts existentes
    "clean": "rimraf dist node_modules .turbo"
  }
}
```

### 2.5 Testar landing isoladamente

```powershell
# Instalar dependências
pnpm install

# Testar dev
cd apps\landing
pnpm dev
# Abrir http://localhost:8080

# Ctrl+C para parar

# Testar build
pnpm build

# Voltar para raiz
cd ..\..
```

**Tempo:** 3 horas  
**Checkpoint:** ✅ Landing funcionando em apps/landing

---

## 🎯 FASE 3: Migração do Dashboard Angular

### Objetivos
- Mover taskplan-ia-frontend para apps/dashboard
- Ajustar configurações Angular
- Resolver conflitos de dependências

### 3.1 Mover arquivos

```powershell
# Mover taskplan-ia-frontend para apps/dashboard
Move-Item -Path "taskplan-ia-frontend" -Destination "apps\dashboard"
```

### 3.2 Atualizar package.json

Editar `apps/dashboard/package.json`:

```json
{
  "name": "@taskia/dashboard",
  "version": "1.0.0",
  "private": true,
  // ... resto mantém
}
```

### 3.3 Atualizar angular.json

Editar `apps/dashboard/angular.json`:

Trocar todas as ocorrências de `"matngular"` por `"dashboard"`:

```json
{
  "projects": {
    "dashboard": {  // era "matngular"
      // ... resto
    },
    "dashboard-e2e": {  // era "matngular-e2e"
      // ... resto
    }
  }
}
```

### 3.4 Adicionar script clean

Em `apps/dashboard/package.json`:

```json
{
  "scripts": {
    // ... scripts existentes
    "clean": "rimraf dist node_modules .angular .turbo"
  }
}
```

### 3.5 Testar dashboard isoladamente

```powershell
# Instalar dependências do workspace (se ainda não fez)
pnpm install

# Testar dev
cd apps\dashboard
pnpm start
# Abrir http://localhost:4200

# Ctrl+C para parar

# Testar build
pnpm build

# Voltar para raiz
cd ..\..
```

**Tempo:** 4 horas  
**Checkpoint:** ✅ Dashboard funcionando em apps/dashboard

---

## 🎯 FASE 4: Configurar Workspaces e Dependências

### Objetivos
- Otimizar instalação de dependências
- Configurar hoisting correto
- Resolver conflitos

### 4.1 Criar .npmrc para otimizações

```powershell
@"
# Hoist padrão para economizar espaço
shamefully-hoist=true
strict-peer-dependencies=false

# Performance
prefer-frozen-lockfile=false
auto-install-peers=true

# Logging
loglevel=warn
"@ | Out-File -FilePath ".npmrc" -Encoding utf8
```

### 4.2 Reinstalar todas as dependências

```powershell
# Limpar tudo
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\landing\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\dashboard\node_modules -ErrorAction SilentlyContinue
Remove-Item pnpm-lock.yaml -ErrorAction SilentlyContinue

# Reinstalar com pnpm
pnpm install

# Verificar estrutura
tree node_modules -L 2
```

### 4.3 Validar workspaces

```powershell
# Listar workspaces
pnpm list -r --depth 0

# Deve mostrar:
# @taskia/landing
# @taskia/dashboard
# @taskia/shared (vazio por enquanto)
```

**Tempo:** 2 horas  
**Checkpoint:** ✅ Workspaces configurados, dependências otimizadas

---

## 🎯 FASE 5: Criar Packages Compartilhados

### Objetivos
- Extrair código comum
- Criar package de tipos compartilhados
- Configurar imports

### 5.1 Criar @taskia/shared

```powershell
# Criar package.json do shared
@"
{
  \"name\": \"@taskia/shared\",
  \"version\": \"1.0.0\",
  \"private\": true,
  \"main\": \"./src/index.ts\",
  \"types\": \"./src/index.ts\",
  \"scripts\": {
    \"clean\": \"rimraf dist .turbo\"
  },
  \"devDependencies\": {
    \"typescript\": \"^5.4.2\"
  }
}
"@ | Out-File -FilePath "packages\shared\package.json" -Encoding utf8
```

### 5.2 Criar tipos compartilhados

```powershell
# Criar arquivo de tipos base
@"
// Tipos compartilhados entre apps

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: User;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  team: User[];
  createdAt: Date;
  updatedAt: Date;
}

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};
"@ | Out-File -FilePath "packages\shared\src\types.ts" -Encoding utf8
```

### 5.3 Criar utils compartilhados

```powershell
@"
// Funções utilitárias compartilhadas

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
"@ | Out-File -FilePath "packages\shared\src\utils.ts" -Encoding utf8
```

### 5.4 Criar index.ts (barrel export)

```powershell
@"
// Barrel export - ponto de entrada do package

export * from './types';
export * from './utils';
"@ | Out-File -FilePath "packages\shared\src\index.ts" -Encoding utf8
```

### 5.5 Criar tsconfig.json do shared

```powershell
@"
{
  \"compilerOptions\": {
    \"target\": \"ES2020\",
    \"module\": \"ESNext\",
    \"lib\": [\"ES2020\", \"DOM\"],
    \"declaration\": true,
    \"outDir\": \"./dist\",
    \"rootDir\": \"./src\",
    \"strict\": true,
    \"esModuleInterop\": true,
    \"skipLibCheck\": true,
    \"forceConsistentCasingInFileNames\": true,
    \"moduleResolution\": \"node\",
    \"resolveJsonModule\": true
  },
  \"include\": [\"src/**/*\"],
  \"exclude\": [\"node_modules\", \"dist\"]
}
"@ | Out-File -FilePath "packages\shared\tsconfig.json" -Encoding utf8
```

### 5.6 Adicionar @taskia/shared como dependência

```powershell
# Adicionar ao landing
cd apps\landing
pnpm add @taskia/shared@workspace:*
cd ..\..

# Adicionar ao dashboard
cd apps\dashboard
pnpm add @taskia/shared@workspace:*
cd ..\..

# Reinstalar para linkar
pnpm install
```

### 5.7 Testar import no landing

Editar `apps/landing/src/pages/Index.tsx` e adicionar no topo:

```typescript
import { formatDate } from '@taskia/shared';

// Testar no console ou em algum componente
console.log('Data formatada:', formatDate(new Date()));
```

**Tempo:** 6 horas  
**Checkpoint:** ✅ Package shared criado e funcionando

---

## 🎯 FASE 6: Configurar Pipeline do Turborepo

### Objetivos
- Otimizar ordem de builds
- Configurar cache
- Paralelização

### 6.1 Refinar turbo.json

Já criamos antes, mas validar/ajustar:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "tsconfig.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "build/**",
        ".angular/**"
      ],
      "env": [
        "NODE_ENV",
        "NEXT_PUBLIC_*",
        "VITE_*"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 6.2 Testar comandos do Turbo

```powershell
# Testar dev (ambos os apps em paralelo)
pnpm dev
# Deve iniciar landing:8080 e dashboard:4200 simultaneamente

# Ctrl+C para parar

# Testar build
pnpm build

# Testar lint
pnpm lint

# Testar cache (rodar build novamente)
pnpm build
# Deve mostrar "cache hit" e ser instantâneo
```

### 6.3 Criar scripts úteis no root

Adicionar ao `package.json` raiz:

```json
{
  "scripts": {
    // ... existentes
    "dev:landing": "turbo run dev --filter=@taskia/landing",
    "dev:dashboard": "turbo run dev --filter=@taskia/dashboard",
    "build:landing": "turbo run build --filter=@taskia/landing",
    "build:dashboard": "turbo run build --filter=@taskia/dashboard",
    "test:all": "turbo run test",
    "lint:fix": "turbo run lint -- --fix",
    "graph": "turbo run build --graph=dependency-graph.html"
  }
}
```

**Tempo:** 2 horas  
**Checkpoint:** ✅ Pipeline configurado e testado

---

## 🎯 FASE 7: Testes Completos

### Checklist de Validação

```powershell
# 1. Limpar tudo
pnpm clean

# 2. Reinstalar
pnpm install

# 3. Testar dev de cada app
pnpm dev:landing
# Testar no navegador http://localhost:8080
# Ctrl+C

pnpm dev:dashboard
# Testar no navegador http://localhost:4200
# Ctrl+C

# 4. Testar dev simultâneo
pnpm dev
# Testar ambos navegadores
# Ctrl+C

# 5. Testar builds
pnpm build
# Verificar pastas dist criadas

# 6. Testar cache
pnpm build
# Deve ser instantâneo (FULL TURBO)

# 7. Testar lint
pnpm lint

# 8. Gerar graph de dependências
pnpm graph
# Abre dependency-graph.html no navegador
```

### Problemas Comuns e Soluções

| Problema | Solução |
|----------|---------|
| Port já em uso | `npx kill-port 8080 4200` |
| Cache inválido | `pnpm turbo clean && pnpm build` |
| Imports não resolvem | `pnpm install` + verificar tsconfig paths |
| Angular não compila | Verificar `angular.json` project name |
| Shared não importa | `pnpm install` no root |

**Tempo:** 3 horas  
**Checkpoint:** ✅ Tudo funcionando perfeitamente

---

## 🎯 FASE 8: CI/CD (GitHub Actions)

### Objetivos
- Configurar pipeline otimizado
- Cache do Turborepo
- Deploy condicional

### 8.1 Criar .github/workflows/ci.yml

```powershell
New-Item -ItemType Directory -Force -Path ".github\workflows"

@"
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, feat/*]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '8'

jobs:
  # Job 1: Lint e Test
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: \${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

  # Job 2: Build com cache do Turbo
  build:
    name: Build Apps
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: \${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Cache do Turborepo
      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: \${{ runner.os }}-turbo-\${{ github.sha }}
          restore-keys: |
            \${{ runner.os }}-turbo-

      - name: Build
        run: pnpm build

      # Upload artifacts
      - name: Upload Landing Build
        uses: actions/upload-artifact@v4
        with:
          name: landing-build
          path: apps/landing/dist

      - name: Upload Dashboard Build
        uses: actions/upload-artifact@v4
        with:
          name: dashboard-build
          path: apps/dashboard/dist

  # Job 3: Deploy (condicional)
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Deploy Landing
        run: |
          echo \"Deploy landing to production\"
          # Adicionar comando de deploy (Vercel, Netlify, etc)

      - name: Deploy Dashboard
        run: |
          echo \"Deploy dashboard to production\"
          # Adicionar comando de deploy
"@ | Out-File -FilePath ".github\workflows\ci.yml" -Encoding utf8
```

### 8.2 Criar workflow de release

```powershell
@"
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          release_name: Release \${{ github.ref }}
          draft: false
          prerelease: false
"@ | Out-File -FilePath ".github\workflows\release.yml" -Encoding utf8
```

**Tempo:** 4 horas  
**Checkpoint:** ✅ CI/CD configurado

---

## 🎯 FASE 9: Documentação

### 9.1 Atualizar README.md principal

```powershell
@"
# 🚀 TaskIA Platform - Monorepo

Plataforma TaskIA com gestão inteligente de tarefas baseada em IA.

## 📦 Estrutura do Monorepo

\`\`\`
taskia-monorepo/
├── apps/
│   ├── landing/          # Landing Page (React + Vite)
│   └── dashboard/        # Dashboard Admin (Angular 17)
├── packages/
│   └── shared/           # Código compartilhado
├── turbo.json            # Pipeline Turborepo
└── package.json          # Workspace raiz
\`\`\`

## 🛠️ Stack Tecnológica

### Landing Page
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- TanStack Query

### Dashboard
- Angular 17 + TypeScript
- RxJS + NgRx
- Bootstrap 4 + ng-bootstrap
- i18n (ngx-translate)

### Shared
- TypeScript 5
- Tipos e utils compartilhados

## 🚀 Getting Started

### Pré-requisitos
- Node.js >= 18
- pnpm >= 8

\`\`\`bash
# Instalar pnpm globalmente
npm install -g pnpm
\`\`\`

### Instalação

\`\`\`bash
# Clonar repositório
git clone <repo-url>
cd TaskIA-WEB

# Instalar dependências
pnpm install
\`\`\`

### Desenvolvimento

\`\`\`bash
# Rodar todos os apps
pnpm dev

# Rodar apenas landing
pnpm dev:landing

# Rodar apenas dashboard
pnpm dev:dashboard
\`\`\`

Acessos:
- Landing: http://localhost:8080
- Dashboard: http://localhost:4200

### Build

\`\`\`bash
# Build de tudo
pnpm build

# Build específico
pnpm build:landing
pnpm build:dashboard
\`\`\`

### Testes

\`\`\`bash
# Rodar todos os testes
pnpm test

# Lint
pnpm lint
pnpm lint:fix
\`\`\`

### Limpar

\`\`\`bash
# Limpar builds e caches
pnpm clean
\`\`\`

## 📊 Scripts Úteis

| Comando | Descrição |
|---------|-----------|
| \`pnpm dev\` | Dev mode todos os apps |
| \`pnpm build\` | Build produção |
| \`pnpm test\` | Rodar testes |
| \`pnpm lint\` | Lint código |
| \`pnpm clean\` | Limpar tudo |
| \`pnpm graph\` | Gerar grafo de dependências |

## 🏗️ Turborepo

Este projeto usa [Turborepo](https://turbo.build/repo) para:

✅ **Cache inteligente** - Builds até 95% mais rápidos  
✅ **Paralelização** - Execução simultânea de tarefas  
✅ **Pipeline otimizado** - Ordem correta de builds  
✅ **Incremental** - Build só o que mudou  

## 📝 Convenções

### Commits
\`\`\`
feat: nova funcionalidade
fix: correção de bug
chore: manutenção
docs: documentação
style: formatação
refactor: refatoração
test: testes
\`\`\`

### Branches
- \`main\` - Produção
- \`develop\` - Desenvolvimento
- \`feat/*\` - Features
- \`fix/*\` - Bugfixes

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (\`git checkout -b feat/amazing\`)
3. Commit suas mudanças (\`git commit -m 'feat: add amazing'\`)
4. Push para branch (\`git push origin feat/amazing\`)
5. Abra um Pull Request

## 📄 Licença

Proprietary - TaskIA © 2026

## 👥 Time

- Desenvolvimento: TaskIA Team
- Arquitetura: TaskIA Engineering

---

**Feito com ❤️ pela equipe TaskIA**
"@ | Out-File -FilePath "README.md" -Encoding utf8
```

### 9.2 Criar guia de desenvolvimento

```powershell
@"
# 📚 Guia de Desenvolvimento - TaskIA Monorepo

## Estrutura de Workspaces

### Apps
- **landing** - Landing page pública
- **dashboard** - Aplicação administrativa

### Packages
- **shared** - Código compartilhado (tipos, utils)

## Adicionando Dependências

### Dependência em app específico
\`\`\`bash
# No landing
pnpm add axios --filter=@taskia/landing

# No dashboard
pnpm add lodash --filter=@taskia/dashboard
\`\`\`

### Dependência global (dev)
\`\`\`bash
pnpm add -D prettier -w
\`\`\`

### Dependência de workspace
\`\`\`bash
# Adicionar shared no landing
pnpm add @taskia/shared@workspace:* --filter=@taskia/landing
\`\`\`

## Criando Novo Package

\`\`\`bash
# Criar estrutura
mkdir -p packages/meu-package/src

# Criar package.json
cd packages/meu-package
pnpm init

# Editar name para @taskia/meu-package
# Adicionar main: ./src/index.ts

# Instalar no workspace
cd ../..
pnpm install
\`\`\`

## Importando do Shared

\`\`\`typescript
// No landing ou dashboard
import { User, Task, formatDate } from '@taskia/shared';

const user: User = {
  id: '1',
  name: 'João',
  email: 'joao@taskia.com',
  role: 'admin'
};

console.log(formatDate(new Date()));
\`\`\`

## Comandos Turborepo

### Executar em workspace específico
\`\`\`bash
turbo run build --filter=@taskia/landing
turbo run dev --filter=@taskia/dashboard
\`\`\`

### Executar em múltiplos
\`\`\`bash
turbo run build --filter=@taskia/landing --filter=@taskia/dashboard
\`\`\`

### Ver o que será executado
\`\`\`bash
turbo run build --dry-run
\`\`\`

### Limpar cache
\`\`\`bash
turbo clean
\`\`\`

### Force (ignorar cache)
\`\`\`bash
turbo run build --force
\`\`\`

## Debugging

### Ver logs completos
\`\`\`bash
turbo run build --verbosity=2
\`\`\`

### Ver dependency graph
\`\`\`bash
pnpm graph
# Abre HTML com visualização
\`\`\`

## Troubleshooting

### Port em uso
\`\`\`bash
npx kill-port 8080
npx kill-port 4200
\`\`\`

### TypeScript não reconhece shared
\`\`\`bash
# Reinstalar
pnpm install
# OU
pnpm install --force
\`\`\`

### Cache corrompido
\`\`\`bash
rm -rf .turbo
pnpm turbo clean
pnpm build
\`\`\`

### Node modules inconsistentes
\`\`\`bash
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
\`\`\`

## Performance Tips

1. **Use cache** - Rode \`pnpm build\` duas vezes para ver diferença
2. **Filters** - Use \`--filter\` para rodar só o necessário
3. **Parallel** - Turborepo já paraleliza, não precisa fazer nada
4. **Incremental** - Só builds afetados serão executados

## Boas Práticas

### Commits
- Use conventional commits
- Seja específico sobre o escopo

### PRs
- Mantenha PRs pequenos
- Um PR = uma feature/fix
- Documente mudanças complexas

### Código
- Extraia código duplicado para \`@taskia/shared\`
- Mantenha apps independentes
- Use TypeScript strict quando possível

## Links Úteis

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Conventional Commits](https://www.conventionalcommits.org/)
"@ | Out-File -FilePath "DEVELOPMENT.md" -Encoding utf8
```

**Tempo:** 2 horas  
**Checkpoint:** ✅ Documentação completa

---

## ✅ Checklist Final de Validação

### Estrutura
- [ ] Pasta `apps/` com landing e dashboard
- [ ] Pasta `packages/` com shared
- [ ] `turbo.json` configurado
- [ ] `pnpm-workspace.yaml` presente
- [ ] `.gitignore` atualizado

### Funcionalidade
- [ ] `pnpm install` funciona sem erros
- [ ] `pnpm dev` inicia ambos apps
- [ ] `pnpm build` builda tudo com sucesso
- [ ] Landing acessível em localhost:8080
- [ ] Dashboard acessível em localhost:4200
- [ ] Imports de `@taskia/shared` funcionam
- [ ] Cache do Turbo ativo (build 2x rápido)

### Qualidade
- [ ] `pnpm lint` sem erros críticos
- [ ] `pnpm test` passando (se tiver testes)
- [ ] READMEs atualizados
- [ ] Sem warnings importantes no console

### Git
- [ ] Branch `feat/monorepo-turborepo` criada
- [ ] Commits organizados
- [ ] `.gitignore` não commita node_modules
- [ ] Histórico limpo

### CI/CD
- [ ] `.github/workflows/ci.yml` criado
- [ ] Pipeline funciona no GitHub Actions
- [ ] Artifacts gerados corretamente

---

## 🔄 Plano de Rollback

Se algo der errado e precisar reverter:

\`\`\`powershell
# 1. Voltar para main/develop
git checkout main

# 2. Deletar branch de migração
git branch -D feat/monorepo-turborepo

# 3. Restaurar backup
cd "D:\Desenvolvimento\11 - IA Plan"
Remove-Item -Recurse -Force TaskIA-WEB
Copy-Item -Recurse "TaskIA-WEB-backup-YYYYMMDD" TaskIA-WEB

# 4. Reinstalar dependências
cd TaskIA-WEB
cd Lading-page && npm install
cd ../taskplan-ia-frontend && npm install
\`\`\`

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Meta Depois |
|---------|-------|-------------|
| **Tempo de build** | 165s | 60s (1ª) / 5s (cache) |
| **Espaço em disco** | 430MB | 213MB (-50%) |
| **Tempo de CI** | 8min | 3min (-63%) |
| **Código duplicado** | ~40% | <10% |
| **DX Score** | 6/10 | 9/10 |

---

## 🎯 Próximos Passos Após Migração

1. **Extrair mais código compartilhado**
   - API clients
   - Hooks/Services comuns
   - Validators

2. **Criar package UI**
   - Design system unificado
   - Componentes reutilizáveis

3. **Otimizar CI/CD**
   - Remote cache (Vercel/Turborepo)
   - Deploy automático

4. **Monitoramento**
   - Bundle size tracking
   - Performance metrics

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Consultar seção de Troubleshooting
2. Verificar logs do Turbo (\`--verbosity=2\`)
3. Checar docs oficiais do Turborepo
4. Revisar este guia passo a passo

---

**Boa migração! 🚀**

*Documento criado em 09/02/2026 - TaskIA Engineering Team*
