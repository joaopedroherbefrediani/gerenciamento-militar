### Gerenciamento Militar (FiveM / GTA RP)

Aplicação web para **gestão administrativa/militar** voltada a servidores **GTA RP (FiveM)**, centralizando cadastros, registros e relatórios em um painel responsivo.

### O que o projeto faz

- **Militares**: cadastro, edição, visualização de perfil e histórico (eventos/alterações).
- **Cargos**: gerenciamento de cargos/patentes.
- **Ações / Infrações / Punições**: registro e controle de ocorrências, infrações e punições com pontuação.
- **Webhooks e Templates**: integração com Discord para envio de notificações padronizadas.
- **Logs de atividades**: auditoria de ações realizadas no sistema.
- **Kanban**: quadro de tarefas com drag-and-drop (Fazer/Fazendo/Feito) e efeitos visuais.
- **Recrutamento / Provas**: fluxo de recrutamento e registro de provas.
- **Convidados (RBAC)**: controle de acesso por permissões (visualizar/editar por módulo).

### Tecnologias utilizadas

- **Next.js 14 (App Router)** + **React 18**
- **TypeScript**
- **Tailwind CSS**
- **API Routes (Next.js)** para CRUD e autenticação
- **JWT** para autenticação (**armazenado em cookie HttpOnly**)
- **Redis** (opcional) com fallback para **arquivos JSON locais** em `./data`
- **Zod** para validação de entrada nas rotas de API
- **Rate limit** no login com **Upstash Ratelimit**
- **canvas-confetti** (efeitos)
- **@hello-pangea/dnd** (drag-and-drop)
- **Prisma** (presente no projeto para uso futuro/infra; não é obrigatório para o fluxo padrão)

### Arquitetura (resumo)

- O frontend consome endpoints em `app/api/...`.
- Persistência de dados via `lib/data-store.ts`:
  - **Com Redis**: grava/lê em chaves prefixadas `data:*` (quando `REDIS_URL` está definido).
  - **Sem Redis**: usa arquivos locais em `./data/*.json`.
- Autenticação:
  - Login em `app/api/auth/login` gera JWT e seta cookie **HttpOnly**.
  - Sessão/usuário atual via `app/api/auth/me`.
  - Logout em `app/api/auth/logout`.

### Segurança (principais medidas)

- **Validação de entrada** com **Zod** nas rotas que recebem dados do usuário.
- **Rate limiting** no endpoint de login (proteção contra brute force).
- **Cookie HttpOnly** para token (evita exposição do JWT ao JavaScript do navegador).
- **Security headers** via `middleware.ts` (CSP, X-Frame-Options, etc.).

### Como rodar localmente

Pré-requisitos:
- **Node.js** (recomendado 18+)
- **npm**

Instalação:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Acesse:
- `http://localhost:3000`

### Variáveis de ambiente

Crie um arquivo `.env` (ou configure no provedor de deploy) com o que fizer sentido para seu ambiente:

- **Obrigatória (recomendado)**:
  - `JWT_SECRET`: segredo para assinar/verificar JWT.

- **Redis (opcional)**:
  - `REDIS_URL`: URL de conexão do Redis (se definido, usa Redis; se não, usa `./data`).

- **Rate limit (opcional, recomendado em produção)**:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### Scripts úteis

- **Build**:

```bash
npm run build
```

- **Limpeza de campo legado (segurança)**:

```bash
npm run security:purge-passwordplain
```

### Observações

- Este repositório **não documenta credenciais** de acesso por segurança. Use seus próprios usuários/senhas no ambiente de execução.
- Em produção, recomenda-se configurar **Redis** e **rate limit** (Upstash) para maior robustez.

