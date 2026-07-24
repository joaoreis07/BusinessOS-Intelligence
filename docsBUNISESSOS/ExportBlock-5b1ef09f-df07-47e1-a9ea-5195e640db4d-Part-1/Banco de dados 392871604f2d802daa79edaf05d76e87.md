# Banco de dados

# 📄 03 — Banco de Dados

## 📌 Informações Gerais

**Nome do Produto:** BusinessOS

**Banco de Dados:** PostgreSQL (Supabase)

**Arquitetura:** Multi-Tenant

**Objetivo:** Criar uma estrutura de dados escalável, segura e preparada para atender centenas ou milhares de empresas utilizando uma única aplicação.

---

# 🎯 Objetivo do Banco de Dados

O banco de dados deve:

- Ser escalável;
- Permitir crescimento do produto;
- Facilitar manutenção;
- Garantir isolamento entre empresas;
- Evitar duplicação de informações;
- Permitir futuras integrações.

---

# 🏢 Conceito Multi-Tenant

Todo dado do sistema pertence a uma empresa.

Exemplo:

```
Empresa
↓
Usuários
Serviços
Clientes
Agenda
Financeiro
Configurações
```

Toda tabela principal deverá possuir:

```
company_id
```

Esse campo é responsável pelo isolamento das informações.

---

# 🗄️ Tabelas Principais

## companies

Representa cada empresa cadastrada.

### Campos

- id
- slug
- name
- description
- logo_url
- photo_url
- whatsapp
- email
- phone
- instagram
- facebook
- address
- primary_color
- secondary_color
- created_at
- updated_at

---

## users

Representa os usuários do sistema.

### Campos

- id
- auth_user_id
- company_id
- name
- email
- role
- created_at
- updated_at

---

## company_settings

Configurações gerais da empresa.

### Campos

- id
- company_id
- timezone
- booking_min_hours
- booking_interval
- booking_enabled
- created_at
- updated_at

---

# 📅 Agendamento

## services

Serviços oferecidos pela empresa.

### Campos

- id
- company_id
- name
- description
- price
- duration_minutes
- image_url
- category
- display_order
- active
- created_at
- updated_at

---

## business_hours

Horários de funcionamento.

### Campos

- id
- company_id
- week_day
- start_time
- end_time
- active
- created_at
- updated_at

---

## blocked_dates

Datas bloqueadas.

### Campos

- id
- company_id
- date
- reason
- created_at

---

## blocked_times

Horários bloqueados.

### Campos

- id
- company_id
- date
- start_time
- end_time
- reason
- created_at

---

## appointments

Agendamentos realizados.

### Campos

- id
- company_id
- service_id
- customer_id
- appointment_date
- start_time
- end_time
- objective
- status
- notes
- created_at
- updated_at

---

# 👥 CRM

## customers

Clientes da empresa.

### Campos

- id
- company_id
- name
- email
- phone
- birth_date
- notes
- created_at
- updated_at

---

## customer_notes

Observações sobre clientes.

### Campos

- id
- company_id
- customer_id
- content
- created_at

---

# 💰 Financeiro

## financial_categories

Categorias financeiras.

### Campos

- id
- company_id
- name
- type
- created_at

---

## financial_transactions

Movimentações financeiras.

### Campos

- id
- company_id
- category_id
- customer_id
- description
- type
- amount
- due_date
- paid_date
- status
- created_at
- updated_at

---

# 💳 Assinaturas

## plans

Planos do BusinessOS.

### Campos

- id
- name
- price
- billing_type
- description
- active
- created_at

---

## subscriptions

Assinaturas dos clientes.

### Campos

- id
- company_id
- plan_id
- status
- trial_ends_at
- starts_at
- ends_at
- next_payment_at
- created_at
- updated_at

---

## payments

Pagamentos das assinaturas.

### Campos

- id
- subscription_id
- amount
- payment_method
- external_payment_id
- status
- paid_at
- created_at

---

# 🔔 Notificações (Futuro)

## notifications

### Campos

- id
- company_id
- title
- message
- type
- read
- created_at

---

# 📊 Logs

## activity_logs

Histórico de ações.

### Campos

- id
- company_id
- user_id
- action
- module
- metadata
- created_at

---

# 🔗 Relacionamentos Principais

```
Company
│
├── Users
├── Settings
├── Services
├── Customers
├── Appointments
├── Financial Transactions
├── Business Hours
├── Blocked Dates
├── Blocked Times
├── Subscriptions
├── Notifications
└── Activity Logs
```

---

# 🔒 Segurança (RLS)

Toda consulta deverá ser filtrada por:

```sql
company_id = empresa_logada
```

Exemplo:

A empresa A nunca poderá acessar:

- clientes da empresa B;
- agendamentos da empresa B;
- financeiro da empresa B.

Mesmo que tente alterar URLs ou requisições.

A proteção acontece no banco.

---

# 📈 Índices Recomendados

Criar índices para:

```
company_id
slug
appointment_date
customer_id
service_id
status
due_date
created_at
```

Objetivo:

- consultas rápidas;
- dashboards rápidos;
- escalabilidade.

---

# 🧠 Campos Estratégicos

## created_at

Permite:

- relatórios;
- auditoria;
- métricas.

---

## updated_at

Permite:

- sincronização;
- histórico;
- rastreamento.

---

## status

Permite:

- filtros;
- automações;
- relatórios.

---

# 🚀 Preparado para Futuras Funcionalidades

Essa estrutura permite adicionar:

- aplicativo mobile;
- WhatsApp automatizado;
- inteligência artificial;
- integrações externas;
- domínio personalizado;
- múltiplos usuários por empresa;
- emissão de documentos;
- CRM avançado;
- automações.

Sem reconstruir o banco.

---

# 📋 Checklist

### Estrutura

- [ ]  Tabelas principais definidas
- [ ]  Relacionamentos definidos
- [ ]  Campos obrigatórios definidos
- [ ]  Índices definidos

### Multi-Tenant

- [ ]  Todas as tabelas possuem company_id
- [ ]  Isolamento de dados definido
- [ ]  RLS planejado

### Escalabilidade

- [ ]  Preparado para crescimento
- [ ]  Preparado para novos módulos
- [ ]  Preparado para integrações futuras

---

# 📝 Decisão Arquitetural Principal

**O banco de dados do BusinessOS será construído em PostgreSQL utilizando arquitetura multi-tenant baseada em company_id e Row Level Security (RLS), garantindo isolamento completo entre empresas, alta escalabilidade e facilidade de evolução do produto ao longo do tempo.**

---

## 💡 Observação importante para o futuro

Eu adicionaria desde já uma tabela:

```
modules
company_modules
```

Hoje ela pode nem ser utilizada.

Mas amanhã, quando você quiser oferecer:

- Módulo Nutricionista;
- Módulo Personal;
- Módulo Psicólogo;
- Módulo Advogado;

você simplesmente ativa ou desativa módulos por empresa, sem precisar alterar toda a arquitetura do sistema. Isso pode economizar muito retrabalho no futuro e deixa o BusinessOS preparado para crescer como uma plataforma realmente modular.