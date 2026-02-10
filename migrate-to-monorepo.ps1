# 🚀 Script de Migração Automática para Turborepo
# TaskIA Platform - Monorepo Migration
# Data: 09/02/2026

param(
    [switch]$SkipBackup,
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

# Cores para output
function Write-Step($message) {
    Write-Host "`n✨ $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error-Custom($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Função para verificar pré-requisitos
function Test-Prerequisites {
    Write-Step "Verificando pré-requisitos..."
    
    # Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error-Custom "Node.js não encontrado. Instale: https://nodejs.org/"
        exit 1
    }
    
    # npm
    try {
        $npmVersion = npm --version
        Write-Success "npm: $npmVersion"
    } catch {
        Write-Error-Custom "npm não encontrado"
        exit 1
    }
    
    # Git
    try {
        $gitVersion = git --version
        Write-Success "Git: $gitVersion"
    } catch {
        Write-Warning-Custom "Git não encontrado (opcional mas recomendado)"
    }
    
    # Verificar se estamos no diretório correto
    if (-not (Test-Path "Lading-page") -or -not (Test-Path "taskplan-ia-frontend")) {
        Write-Error-Custom "Execute este script da raiz do projeto TaskIA-WEB"
        exit 1
    }
    
    Write-Success "Todos os pré-requisitos atendidos!`n"
}

# Fase 0: Backup
function Invoke-Backup {
    if ($SkipBackup) {
        Write-Warning-Custom "Pulando backup (--SkipBackup especificado)"
        return
    }
    
    Write-Step "FASE 0: Criando backup..."
    
    $backupDir = "..\TaskIA-WEB-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    if ($DryRun) {
        Write-Host "DRY RUN: Criaria backup em: $backupDir"
        return
    }
    
    Copy-Item -Path "." -Destination $backupDir -Recurse -Exclude "node_modules",".git"
    Write-Success "Backup criado: $backupDir"
    
    # Criar snapshot
    @"
Snapshot da Migração - $(Get-Date)
===================================
Node: $(node --version)
npm: $(npm --version)
Diretório: $(Get-Location)
Backup: $backupDir
"@ | Out-File -FilePath "migration-snapshot.txt" -Encoding utf8
    
    Write-Success "Snapshot criado: migration-snapshot.txt"
}

# Fase 1: Setup Inicial
function Invoke-SetupInitial {
    Write-Step "FASE 1: Setup Inicial do Turborepo..."
    
    # Instalar pnpm
    Write-Host "Instalando pnpm globalmente..."
    if (-not $DryRun) {
        npm install -g pnpm@latest
        $pnpmVersion = pnpm --version
        Write-Success "pnpm instalado: $pnpmVersion"
    } else {
        Write-Host "DRY RUN: npm install -g pnpm@latest"
    }
    
    # Criar estrutura
    Write-Host "Criando estrutura de pastas..."
    $folders = @(
        "apps",
        "packages\shared\src",
        "packages\config\eslint",
        "packages\config\typescript"
    )
    
    foreach ($folder in $folders) {
        if ($DryRun) {
            Write-Host "DRY RUN: Criaria pasta: $folder"
        } else {
            New-Item -ItemType Directory -Force -Path $folder | Out-Null
            Write-Success "Criada: $folder"
        }
    }
    
    # Criar package.json raiz
    Write-Host "Criando package.json raiz..."
    $rootPackageJson = @"
{
  "name": "taskia-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "TaskIA Platform - Monorepo com Turborepo",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rimraf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "dev:landing": "turbo run dev --filter=@taskia/landing",
    "dev:dashboard": "turbo run dev --filter=@taskia/dashboard",
    "build:landing": "turbo run build --filter=@taskia/landing",
    "build:dashboard": "turbo run build --filter=@taskia/dashboard",
    "graph": "turbo run build --graph=dependency-graph.html"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "prettier": "^3.4.2",
    "rimraf": "^6.0.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.4"
}
"@
    
    if (-not $DryRun) {
        $rootPackageJson | Out-File -FilePath "package.json" -Encoding utf8
        Write-Success "package.json criado"
    }
    
    # Criar pnpm-workspace.yaml
    Write-Host "Criando pnpm-workspace.yaml..."
    $workspaceYaml = @"
packages:
  - 'apps/*'
  - 'packages/*'
"@
    
    if (-not $DryRun) {
        $workspaceYaml | Out-File -FilePath "pnpm-workspace.yaml" -Encoding utf8
        Write-Success "pnpm-workspace.yaml criado"
    }
    
    # Criar turbo.json
    Write-Host "Criando turbo.json..."
    $turboJson = @"
{
  "`$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "tsconfig.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**", ".angular/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
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
"@
    
    if (-not $DryRun) {
        $turboJson | Out-File -FilePath "turbo.json" -Encoding utf8
        Write-Success "turbo.json criado"
    }
    
    # Atualizar .gitignore
    Write-Host "Atualizando .gitignore..."
    $gitignoreAdditions = @"

# Turborepo
.turbo
*.tsbuildinfo

# pnpm
.pnpm-store/

# Builds
dist/
build/
"@
    
    if (-not $DryRun) {
        Add-Content -Path ".gitignore" -Value $gitignoreAdditions
        Write-Success ".gitignore atualizado"
    }
    
    Write-Success "Setup inicial concluído!"
}

# Fase 2: Migrar Landing
function Invoke-MigrateLanding {
    Write-Step "FASE 2: Migrando Landing Page..."
    
    if ($DryRun) {
        Write-Host "DRY RUN: Moveria Lading-page -> apps\landing"
        return
    }
    
    if (Test-Path "apps\landing") {
        Write-Warning-Custom "apps\landing já existe, pulando..."
        return
    }
    
    Move-Item -Path "Lading-page" -Destination "apps\landing"
    Write-Success "Landing movida para apps\landing"
    
    # Atualizar package.json
    $landingPkgPath = "apps\landing\package.json"
    $landingPkg = Get-Content $landingPkgPath -Raw | ConvertFrom-Json
    $landingPkg.name = "@taskia/landing"
    
    # Adicionar script clean
    if (-not $landingPkg.scripts.clean) {
        $landingPkg.scripts | Add-Member -MemberType NoteProperty -Name "clean" -Value "rimraf dist node_modules .turbo" -Force
    }
    
    $landingPkg | ConvertTo-Json -Depth 10 | Out-File $landingPkgPath -Encoding utf8
    Write-Success "package.json da landing atualizado"
}

# Fase 3: Migrar Dashboard
function Invoke-MigrateDashboard {
    Write-Step "FASE 3: Migrando Dashboard..."
    
    if ($DryRun) {
        Write-Host "DRY RUN: Moveria taskplan-ia-frontend -> apps\dashboard"
        return
    }
    
    if (Test-Path "apps\dashboard") {
        Write-Warning-Custom "apps\dashboard já existe, pulando..."
        return
    }
    
    Move-Item -Path "taskplan-ia-frontend" -Destination "apps\dashboard"
    Write-Success "Dashboard movido para apps\dashboard"
    
    # Atualizar package.json
    $dashboardPkgPath = "apps\dashboard\package.json"
    $dashboardPkg = Get-Content $dashboardPkgPath -Raw | ConvertFrom-Json
    $dashboardPkg.name = "@taskia/dashboard"
    
    # Adicionar script clean
    if (-not $dashboardPkg.scripts.clean) {
        $dashboardPkg.scripts | Add-Member -MemberType NoteProperty -Name "clean" -Value "rimraf dist node_modules .angular .turbo" -Force
    }
    
    $dashboardPkg | ConvertTo-Json -Depth 10 | Out-File $dashboardPkgPath -Encoding utf8
    Write-Success "package.json do dashboard atualizado"
    
    # Atualizar angular.json (nome do projeto)
    Write-Host "Atualizando angular.json..."
    $angularJsonPath = "apps\dashboard\angular.json"
    $angularJson = Get-Content $angularJsonPath -Raw
    $angularJson = $angularJson -replace '"matngular"', '"dashboard"'
    $angularJson = $angularJson -replace '"matngular-e2e"', '"dashboard-e2e"'
    $angularJson | Out-File $angularJsonPath -Encoding utf8
    Write-Success "angular.json atualizado"
}

# Fase 4: Criar Package Shared
function Invoke-CreateSharedPackage {
    Write-Step "FASE 4: Criando package @taskia/shared..."
    
    if ($DryRun) {
        Write-Host "DRY RUN: Criaria package shared"
        return
    }
    
    # package.json
    $sharedPkgJson = @"
{
  "name": "@taskia/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "clean": "rimraf dist .turbo"
  },
  "devDependencies": {
    "typescript": "^5.4.2"
  }
}
"@
    $sharedPkgJson | Out-File -FilePath "packages\shared\package.json" -Encoding utf8
    
    # types.ts
    $typesTs = @"
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
"@
    $typesTs | Out-File -FilePath "packages\shared\src\types.ts" -Encoding utf8
    
    # utils.ts
    $utilsTs = @"
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
"@
    $utilsTs | Out-File -FilePath "packages\shared\src\utils.ts" -Encoding utf8
    
    # index.ts
    $indexTs = @"
// Barrel export - ponto de entrada do package

export * from './types';
export * from './utils';
"@
    $indexTs | Out-File -FilePath "packages\shared\src\index.ts" -Encoding utf8
    
    # tsconfig.json
    $sharedTsConfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
"@
    $sharedTsConfig | Out-File -FilePath "packages\shared\tsconfig.json" -Encoding utf8
    
    Write-Success "Package @taskia/shared criado!"
}

# Fase 5: Instalar Dependências
function Invoke-Install {
    Write-Step "FASE 5: Instalando dependências..."
    
    if ($DryRun) {
        Write-Host "DRY RUN: pnpm install"
        return
    }
    
    Write-Host "Instalando com pnpm (pode levar alguns minutos)..."
    pnpm install
    
    Write-Success "Dependências instaladas!"
    
    # Adicionar shared como dependência dos apps
    Write-Host "Adicionando @taskia/shared aos apps..."
    pnpm add @taskia/shared@workspace:* --filter=@taskia/landing
    pnpm add @taskia/shared@workspace:* --filter=@taskia/dashboard
    
    Write-Success "Workspace configurado!"
}

# Fase 6: Validação
function Invoke-Validation {
    Write-Step "FASE 6: Validando migração..."
    
    if ($DryRun) {
        Write-Host "DRY RUN: Validação seria executada"
        return
    }
    
    # Listar workspaces
    Write-Host "`nWorkspaces detectados:"
    pnpm list -r --depth 0
    
    # Testar turbo
    Write-Host "`nTestando Turborepo..."
    pnpm turbo --version
    
    Write-Success "Validação concluída!"
    
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ✅ MIGRAÇÃO PARA MONOREPO CONCLUÍDA COM SUCESSO!           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

📊 Próximos passos:

1. Testar desenvolvimento:
   > pnpm dev

2. Testar build:
   > pnpm build

3. Ver dependency graph:
   > pnpm graph

4. Consultar documentação:
   - MIGRATION_PLAN.md (plano completo)
   - DEVELOPMENT.md (guia de uso)
   - README.md (overview)

5. Commit das mudanças:
   > git add .
   > git commit -m "feat: migrar para monorepo com Turborepo"

🎯 Estrutura final:
   apps/
     ├── landing/     → http://localhost:8080
     └── dashboard/   → http://localhost:4200
   packages/
     └── shared/      → Código compartilhado

💡 Comandos úteis:
   pnpm dev:landing    → Rodar só landing
   pnpm dev:dashboard  → Rodar só dashboard
   pnpm build          → Build completo
   pnpm lint           → Lint tudo
   pnpm clean          → Limpar tudo

"@
}

# Função principal
function Start-Migration {
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🚀 MIGRAÇÃO PARA TURBOREPO - TaskIA Platform            ║
║                                                              ║
║     Este script irá transformar o projeto em um monorepo    ║
║     usando Turborepo + pnpm workspaces                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Warning-Custom "MODO DRY RUN - Nenhuma mudança será feita`n"
    }
    
    # Confirmação
    if (-not $DryRun) {
        $confirm = Read-Host "`nDeseja continuar com a migração? (S/N)"
        if ($confirm -ne "S" -and $confirm -ne "s") {
            Write-Host "Migração cancelada pelo usuário."
            exit 0
        }
    }
    
    try {
        Test-Prerequisites
        Invoke-Backup
        Invoke-SetupInitial
        Invoke-MigrateLanding
        Invoke-MigrateDashboard
        Invoke-CreateSharedPackage
        Invoke-Install
        Invoke-Validation
        
        Write-Success "`n🎉 Migração concluída com sucesso!"
        
    } catch {
        Write-Error-Custom "`n❌ Erro durante a migração: $_"
        Write-Host "`nPara restaurar o backup:"
        Write-Host "1. Localizar pasta de backup criada"
        Write-Host "2. Copiar conteúdo de volta para TaskIA-WEB"
        exit 1
    }
}

# Executar
Start-Migration
