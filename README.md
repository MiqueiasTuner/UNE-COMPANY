# FIKTA - Plataforma B2B2C de Livros Digitais

Este é o repositório principal da **FIKTA**, uma editora digital que opera uma plataforma B2B2C multi-tenant de livros digitais (e-books).

---

## 1. Objetivo do Projeto

O objetivo do **FIKTA** é fornecer uma solução completa de leitura digital que possa ser comercializada e distribuída por Provedores de Internet (ISPs) parceiros da FIKTA para seus respectivos clientes finais.

---

## 2. Arquitetura B2B2C e Atores da Plataforma

A plataforma opera em três níveis estruturais:

1. **FIKTA (Platform Owner / Administradora Master)**:
   - Administra o catálogo global de livros, as editoras, autores, fornecedores e contratos de licenciamento.
   - Onboarda e gerencia os provedores parceiros.
   - Possui visão analítica global do sistema.

2. **Provedores de Internet (B2B Tenants)**:
   - Cada provedor é um tenant isolado que pode personalizar a interface de seus clientes (White Label).
   - Gerencia sua própria base de clientes.
   - Determina quais livros do catálogo global estão disponíveis para seus usuários.

3. **Clientes Finais (B2C Users)**:
   - Usuários finais que utilizam a interface do portal para buscar, favoritar e ler os livros disponibilizados por seu provedor.

---

## 3. Estrutura de Diretórios

A organização física do projeto é dividida da seguinte forma:

```
UNE-LIVROS/
├── docs/                    # Documentação técnica e conceitual do projeto
│   ├── architecture/        # Especificações de arquitetura, multi-tenancy e permissões
│   ├── business-rules/      # Regras de negócios e restrições lógicas
│   ├── database/            # Modelo de dados e especificação das tabelas
│   └── ROADMAP.md           # Planejamento das fases de desenvolvimento
│
├── templates/               # Templates originais importados (REFERÊNCIA DE DESIGN)
│   ├── tailwind-admin/      # Dashboard administrativo original
│   └── bookly/              # Portal de livros B2C original
│
├── frontend/                # Interfaces reais da plataforma (CÓDIGO DO SISTEMA)
│   ├── admin/               # Painel administrativo (FIKTA + Provedores)
│   └── portal/              # Portal do cliente final (B2C)
│
├── backend/                 # API Server e lógica de negócio centralizada
│
├── .gitignore               # Configurações de arquivos ignorados no controle de versão
└── README.md                # Visão geral do projeto (este arquivo)
```

> [!IMPORTANT]
> **Regra Crucial sobre Templates**:
> Os diretórios localizados em `templates/` contêm os templates originais sem modificações. Eles servem **estritamente como referência visual**. Não devem receber códigos de funcionalidade ou alterações do sistema. O desenvolvimento real ocorrerá exclusivamente dentro de `frontend/` e `backend/`.

---

## 4. Templates Utilizados

1. **Tailwind Admin** (`templates/tailwind-admin/`):
   - **Origem**: [Tailwind-Admin/free-tailwind-admin-dashboard-template](https://github.com/Tailwind-Admin/free-tailwind-admin-dashboard-template)
   - **Uso**: Referência visual para o frontend administrativo (`frontend/admin`).
   - **Stack**: Multi-framework (React, Next.js, Angular, Vue, Tanstack Start, HTML). A versão principal homologada é a versão **ReactJS**.

2. **Bookly** (`templates/bookly/`):
   - **Origem**: [templatesJungle/bookly-bookstore-free-website-template](https://github.com/templatesJungle/bookly-bookstore-free-website-template)
   - **Uso**: Referência visual e de layout para o catálogo de e-commerce e biblioteca do portal do cliente (`frontend/portal`).
   - **Stack**: Estático (HTML5, CSS3, JS, Bootstrap 5).

---

## 5. Como Iniciar (Ambiente de Referência)

Para executar o ambiente de referência do painel administrativo (ReactJS):

```bash
cd templates/tailwind-admin/tailwind-admin-reactjs-free/package
npm install
npm run dev
```

O servidor local de desenvolvimento iniciará em `http://localhost:5173`.
