# ✅ Checklist de Setup Rápido

## Para Desenvolvedores Novos no Projeto

### 📋 Pré-requisitos
```bash
- [ ] Node.js >= 18.0.0 instalado
- [ ] Git instalado
- [ ] Terminal disponível
```

### 🚀 Setup em 5 Passos

#### 1️⃣ Clone o Projeto
```bash
git clone <url-do-repositorio>
cd TaskIA-WEB
```

#### 2️⃣ Instale o pnpm (se ainda não tiver)
```bash
npm install -g pnpm
```

Verifique:
```bash
pnpm --version  # Deve mostrar 10.x.x ou superior
```

#### 3️⃣ Instale as Dependências
```bash
pnpm install
```
⏱️ Tempo: ~2-5 minutos

#### 4️⃣ Inicie os Servidores
```bash
pnpm dev
```

#### 5️⃣ Acesse no Navegador
- 🌐 Landing: http://localhost:8080
- 🎛️ Dashboard: http://localhost:4200

---

## 🎯 Comandos Diários

```bash
# Desenvolvimento
pnpm dev              # Ambos os apps
pnpm dev:landing      # Só landing (porta 8080)
pnpm dev:dashboard    # Só dashboard (porta 4200)

# Build
pnpm build            # Todos (cache ⚡)
pnpm build:landing    # Só landing
pnpm build:dashboard  # Só dashboard

# Manutenção
pnpm clean            # Limpar builds
pnpm lint             # Verificar código
```

---

## 🆘 Problemas Comuns

### "pnpm não é reconhecido"
```bash
npm install -g pnpm
# Feche e reabra o terminal
```

### "Port already in use"
```bash
# Finalizar processos Node
Stop-Process -Name "node" -Force
```

### "Cannot find module"
```bash
# Reinstalar tudo
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📁 Estrutura do Projeto

```
TaskIA-WEB/
├── apps/
│   ├── landing/       → React + Vite + Tailwind
│   └── dashboard/     → Angular 17
├── packages/
│   └── shared/        → Código compartilhado
└── turbo.json         → Config Turborepo
```

---

**🎉 Pronto! Você está no ar!**

Para detalhes completos, veja:
- [SETUP.md](./SETUP.md) - Guia completo passo a passo
- [README.md](./README.md) - Documentação geral do projeto
