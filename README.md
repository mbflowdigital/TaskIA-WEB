# TaskIA-WEB - Monorepo

> Plataforma TaskIA com arquitetura monorepo usando Turborepo + pnpm

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0 ([Download aqui](https://nodejs.org/))
- **pnpm** >= 8.0.0 (será instalado no passo a passo abaixo)
- **Git** (para clonar o repositório)

## 🚀 Setup Inicial (Primeira Vez)

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd TaskIA-WEB
```

### 2. Instale o pnpm Globalmente

```bash
# Windows (PowerShell como Administrador)
npm install -g pnpm

# Ou usando o instalador standalone (recomendado)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### 3. Verifique a Instalação do pnpm

```bash
pnpm --version
# Deve exibir: 10.x.x ou superior
```

### 4. Instale as Dependências do Monorepo

```bash
pnpm install
```

Isso irá instalar todas as dependências de todos os workspaces (landing, dashboard, shared).

### 5. Inicie os Servidores de Desenvolvimento

```bash
# Iniciar ambos os apps simultaneamente
pnpm dev

# OU iniciar individualmente:
pnpm dev:landing    # Landing page → http://localhost:8080
pnpm dev:dashboard  # Dashboard → http://localhost:4200
```

## 📦 Estrutura do Projeto

```
TaskIA-WEB/
├── apps/
│   ├── landing/          # Landing page (React + Vite + Tailwind)
│   └── dashboard/        # Dashboard admin (Angular 17)
├── packages/
│   └── shared/           # Código compartilhado (types, utils)
├── package.json          # Configuração root do monorepo
├── pnpm-workspace.yaml   # Configuração de workspaces
└── turbo.json            # Configuração do Turborepo
```

## 🛠️ Comandos Disponíveis

### Desenvolvimento

```bash
pnpm dev              # Inicia todos os apps em modo dev
pnpm dev:landing      # Apenas landing page (porta 8080)
pnpm dev:dashboard    # Apenas dashboard (porta 4200)
```

### Build

```bash
pnpm build            # Build de todos os apps (com Turborepo cache)
pnpm build:landing    # Build apenas landing
pnpm build:dashboard  # Build apenas dashboard
```

### Testes e Qualidade

```bash
pnpm lint             # Lint em todos os projetos
pnpm test             # Executa testes
pnpm clean            # Limpa builds e cache
```

### Ferramentas

```bash
pnpm graph            # Gera grafo visual de dependências
```

## 🌐 URLs dos Ambientes

| App       | Desenvolvimento           | Build                    |
|-----------|---------------------------|--------------------------|
| Landing   | http://localhost:8080     | `apps/landing/dist/`     |
| Dashboard | http://localhost:4200     | `apps/dashboard/dist/`   |

## ⚡ Performance com Turborepo

O Turborepo cacheia os builds automaticamente:

- **Primeira build**: ~8-22 segundos
- **Build com cache**: ~1-2 segundos ⚡ **FULL TURBO**
- Cache compartilhado entre todos os desenvolvedores

## 🔧 Solução de Problemas

### Erro: "pnpm não é reconhecido"

```bash
# Reinstale o pnpm globalmente
npm install -g pnpm
```

### Erro de dependências quebradas

```bash
# Limpe tudo e reinstale
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Portas já em uso

```bash
# Verifique processos nas portas 8080 e 4200
# Windows:
netstat -ano | findstr "8080"
netstat -ano | findstr "4200"

# Finalize processos Node.js
Stop-Process -Name "node" -Force
```

## 📚 Tecnologias Utilizadas

### Landing Page
- React 18
- Vite 5
- Tailwind CSS
- shadcn/ui
- TypeScript

### Dashboard
- Angular 17
- Bootstrap 4
- NgRx (state management)
- TypeScript

### Monorepo
- **Turborepo** - Build orchestration com cache inteligente
- **pnpm** - Gerenciador de pacotes rápido e eficiente
- **TypeScript** - Type safety em todos os projetos

## 🤝 Contribuindo

1. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
2. Faça commit das mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
3. Push para a branch (`git push origin feature/nova-funcionalidade`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.