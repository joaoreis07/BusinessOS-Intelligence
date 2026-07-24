# Gestão de Empresas (Multi-Tenant)

# 📄 05 — Gestão de Empresas (Multi-Tenant)

## 📌 Informações Gerais

**Nome do Produto:** BusinessOS

**Módulo:** Gestão de Empresas (Multi-Tenant)

**Objetivo:** Permitir que múltiplas empresas utilizem a mesma plataforma de forma totalmente isolada, segura e escalável.

---

# 🎯 Objetivo

O BusinessOS será uma única aplicação capaz de atender centenas ou milhares de empresas simultaneamente.

Cada empresa terá:

- Conta própria;
- Página pública própria;
- Agenda própria;
- Clientes próprios;
- Financeiro próprio;
- Serviços próprios;
- Configurações próprias.

Nenhuma empresa poderá visualizar ou modificar dados de outra empresa.

---

# 🏢 O que é Multi-Tenant?

Multi-Tenant significa:

**Uma aplicação.**

**Múltiplas empresas.**

**Dados totalmente isolados.**

Exemplo:

```
BusinessOS
│
├── Empresa A
│   ├── Agenda
│   ├── Clientes
│   ├── Financeiro
│   └── Serviços
│
├── Empresa B
│   ├── Agenda
│   ├── Clientes
│   ├── Financeiro
│   └── Serviços
│
└── Empresa C
    ├── Agenda
    ├── Clientes
    ├── Financeiro
    └── Serviços
```

Todos utilizam o mesmo sistema.

Mas cada empresa enxerga apenas seus próprios dados.

---

# 🧠 Conceito Principal

A empresa (tenant) é o núcleo do sistema.

Tudo gira em torno dela.

Exemplo:

```
Empresa
↓

Usuários

Serviços

Clientes

Agendamentos

Financeiro

Configurações

Assinatura
```

---

# 🗄️ Estrutura da Empresa

## Tabela: companies

Representa cada empresa cadastrada.

### Campos

- id
- slug
- name
- description
- logo_url
- photo_url
- whatsapp
- phone
- email
- instagram
- facebook
- address
- primary_color
- secondary_color
- active
- created_at
- updated_at

---

# 🔗 Slug da Empresa

Cada empresa possuirá um endereço exclusivo.

Exemplos:

```
businessos.com/nutriluciana

businessos.com/personaljoao

businessos.com/clinicaabc
```

---

# ⚙️ Geração do Slug

Fluxo:

Usuário cria empresa.

↓

Sistema gera slug automaticamente.

↓

Verifica se já existe.

↓

Se existir:

```
nutriluciana

nutriluciana1

nutriluciana2
```

↓

Salva no banco.

---

# 👤 Usuários da Empresa

Inicialmente:

Cada empresa possuirá apenas um usuário proprietário.

No futuro:

A empresa poderá ter vários usuários.

Exemplo:

- Proprietário
- Secretária
- Colaborador
- Administrador interno

---

# 🔄 Fluxo de Criação da Empresa

Cadastro.

↓

Criar empresa.

↓

Salvar empresa.

↓

Gerar slug.

↓

Criar configurações iniciais.

↓

Criar assinatura.

↓

Criar ambiente da empresa.

↓

Liberar dashboard.

---

# 🏢 Configurações da Empresa

Cada empresa poderá personalizar:

### Informações

- Nome
- Descrição
- Logo
- Foto
- Telefone
- WhatsApp
- E-mail
- Endereço

---

### Redes Sociais

- Instagram
- Facebook
- Site próprio (futuro)

---

### Identidade Visual

- Cor principal
- Cor secundária

---

# 🌐 Página Pública

Cada empresa possuirá:

```
businessos.com/slug
```

Essa página será gerada automaticamente.

Todas as informações exibidas virão do banco de dados.

Nada será fixo no código.

---

# 📅 Recursos Próprios por Empresa

Cada empresa terá:

## Agenda

- Dias de atendimento
- Horários
- Bloqueios
- Férias

---

## Serviços

- Nome
- Preço
- Duração
- Descrição
- Categoria

---

## Clientes

- Cadastro
- Histórico
- Observações

---

## Financeiro

- Receitas
- Despesas
- Relatórios

---

# 🔒 Isolamento de Dados

Regra obrigatória:

Toda tabela deverá possuir:

```
company_id
```

Exemplo:

```
customers
company_id

services
company_id

appointments
company_id

financial_transactions
company_id
```

---

# 🛡️ Segurança

Toda consulta deverá validar:

```
user_id
company_id
role
```

Se qualquer informação for inválida:

↓

Negar acesso.

---

# 🔐 Row Level Security (RLS)

Exemplo:

Empresa:

```
company_id = 1
```

Consulta:

```
SELECT *
FROM customers
WHERE company_id = 1
```

Mesmo que o usuário tente:

```
company_id = 2
```

↓

O banco deverá negar acesso.

---

# 🏗️ Estrutura Inicial de Criação

Quando uma nova empresa for criada:

Criar:

### Empresa

↓

### Configurações

↓

### Usuário proprietário

↓

### Assinatura

↓

### Categorias padrão

↓

### Dashboard inicial

---

# 📊 Status da Empresa

Cada empresa poderá possuir:

```
trial
active
inactive
blocked
cancelled
```

---

# 🚫 Empresa Bloqueada

Se assinatura expirar:

A empresa poderá:

- fazer login;
- visualizar informações.

Mas não poderá:

- criar novos agendamentos;
- criar novos clientes;
- utilizar recursos bloqueados.

---

# 📈 Escalabilidade

A estrutura deverá permitir:

- milhares de empresas;
- milhões de registros;
- múltiplos usuários por empresa;
- múltiplos módulos;
- múltiplos planos.

Sem reconstrução da arquitetura.

---

# 🔌 Preparado para Futuras Funcionalidades

A arquitetura deverá permitir:

### White Label

Exemplo:

```
agenda.minhamarca.com
```

---

### Domínio Próprio

Exemplo:

```
www.nutriluciana.com.br
```

---

### Múltiplas Unidades

Exemplo:

```
Clínica Centro

Clínica Norte

Clínica Sul
```

---

### Equipes

- Secretária
- Recepcionista
- Colaboradores
- Gestores

---

# 🚀 Fluxo Completo

Criar conta

↓

Criar empresa

↓

Gerar slug

↓

Criar configurações

↓

Criar assinatura

↓

Liberar dashboard

↓

Personalizar empresa

↓

Compartilhar link

↓

Receber clientes

↓

Gerenciar negócio

---

# 📋 Checklist

### Empresas

- [ ]  Cadastro de empresas
- [ ]  Edição de informações
- [ ]  Slug automático
- [ ]  Configurações

### Multi-Tenant

- [ ]  company_id em todas as tabelas
- [ ]  Isolamento de dados
- [ ]  RLS
- [ ]  Permissões

### Escalabilidade

- [ ]  Preparado para múltiplos usuários
- [ ]  Preparado para White Label
- [ ]  Preparado para múltiplos módulos
- [ ]  Preparado para domínio próprio

---

# 📝 Decisão Arquitetural Principal

**O BusinessOS utilizará uma arquitetura multi-tenant baseada em empresas (tenants), onde cada empresa possuirá um ambiente lógico isolado dentro da mesma aplicação, utilizando company_id como identificador principal e Row Level Security (RLS) para garantir segurança, privacidade e escalabilidade.**

---

# 💡 Decisão Estratégica Importante

Eu criaria desde o início uma tabela:

```
company_features
```

Exemplo:

```
landing_page = true
financial = true
crm = true
ai = false
whatsapp_automation = false
```

Isso permite ativar ou desativar funcionalidades por empresa ou por plano sem alterar o código principal.

No futuro, você poderá vender recursos extras (add-ons) e criar planos mais avançados com muito menos trabalho, deixando o BusinessOS preparado para crescer como uma plataforma SaaS profissional.