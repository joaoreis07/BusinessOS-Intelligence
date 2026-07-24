# BusinessOS

Sistema operacional SaaS para profissionais e empresas que trabalham com
atendimentos agendados.

## Stack

- Next.js 16, React e TypeScript;
- Tailwind CSS;
- Supabase Auth, PostgreSQL, Row Level Security e Storage;
- Mercado Pago para assinaturas;
- Vitest para testes unitários.

## Arquitetura

O projeto é um monólito modular. Cada domínio vive em `src/features`, enquanto
`src/app` apenas compõe rotas e layouts. Toda autorização privada é validada no
servidor e reforçada por políticas RLS no PostgreSQL.

Principais superfícies:

- `/`: site do BusinessOS;
- `/login` e `/cadastro`: autenticação;
- `/dashboard`: painel da empresa;
- `/[slug]`: landing pública;
- `/[slug]/agendar`: agendamento público;
- `/admin`: painel da plataforma.

## Ambiente local

1. Copie `.env.example` para `.env.local` e preencha as chaves.
2. Instale as dependências:

```bash
npm install
```

3. Inicie e prepare o Supabase local:

```bash
npm run db:start
npm run db:reset
npm run db:types
```

4. Execute a aplicação:

```bash
npm run dev
```

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

As migrations, políticas RLS, funções transacionais e seeds ficam em
`supabase/`. Não use a service role em componentes ou código executado no
navegador.
