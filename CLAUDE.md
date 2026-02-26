# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Projeto

**automacao_marketing** — Plataforma SaaS de automação de e-mail marketing com editor visual de fluxos (estilo n8n/Make/RD Station). Foco atual: **frontend**; o backend será desenvolvido por outra pessoa.

Não há autenticação nesta fase inicial.


---

## Stack

| Camada       | Tecnologia                                              |
|--------------|---------------------------------------------------------|
| Framework    | Next.js 15 (App Router) + TypeScript strict             |
| Pacotes      | **pnpm** (nunca npm ou yarn)                            |
| Banco        | SQLite via `@libsql/client` v0.17 (pure JS/WASM — sem compilação nativa) |
| Editor       | `@xyflow/react` v12 (ReactFlow)                        |
| Estilos      | CSS Modules + SCSS (`.module.scss`) — sem Tailwind      |
| Estado       | Zustand v5                                              |
| Testes       | Vitest v2 (environment: `node`, globals habilitados)    |

**Princípio:** usar o mínimo de dependências externas. Sempre avaliar se uma feature pode ser feita nativamente antes de instalar um pacote.

---

## Comandos

```bash
pnpm install             # Instalar dependências
pnpm dev                 # Servidor de desenvolvimento
pnpm build               # Build de produção
pnpm lint                # ESLint
pnpm type-check          # Checagem de tipos TypeScript
pnpm test                # Vitest (watch mode)
pnpm test:run            # Vitest (CI / single run)
pnpm test:coverage       # Vitest com cobertura

# Rodar um único arquivo de teste
pnpm vitest run __tests__/flow/serialization.test.ts
```

---

## Arquitetura

### Páginas

| Rota           | Componente principal               | Descrição                                       |
|----------------|------------------------------------|-------------------------------------------------|
| `/`            | `DashboardClient.tsx`              | Dashboard — lista de fluxos (CRUD)              |
| `/flows/[id]`  | `FlowEditor.tsx`                   | Editor visual (canvas ReactFlow)                |
| `/testes`      | `InboxClient.tsx`                  | Simulador — inbox fake + runs de fluxo          |

### Persistência

- **Server Actions** (`src/app/actions/flows.ts`): CRUD de fluxos — `getFlows`, `getFlow`, `createFlow`, `updateFlow`, `toggleFlowActive`, `deleteFlow`, `duplicateFlow`.
- **API Routes** para operações do simulador (não Server Actions, pois precisam de requisições `fetch` do lado cliente):

| Rota                                    | Método       | Função                                             |
|-----------------------------------------|--------------|----------------------------------------------------|
| `/api/emails`                           | GET/POST/DELETE | Inbox de e-mails de teste                       |
| `/api/flow-run`                         | GET/POST     | Lista runs / inicia novo run (executa o fluxo)     |
| `/api/flow-run/[runId]`                 | GET          | Detalhes de um run                                 |
| `/api/flow-run/[runId]/advance`         | POST         | Avança run após parada (`reply`, `skip_delay`, `timeout`) |
| `/api/flow-analytics`                   | GET          | Agrega contadores por nó de todos os runs          |
- `@libsql/client` é **server-only** — nunca importar em componentes `'use client'`.
- Cliente SQLite em `src/lib/db/client.ts` (singleton, inicializa as tabelas via `initDb()`).

### Esquema do banco (`./data.db`)

```sql
flows        (id TEXT PK, name, active INT, version INT, data TEXT JSON, created_at, updated_at)
test_emails  (id AUTOINCREMENT, thread_id, direction, from_address, to_address, subject, body_html, in_reply_to, sent_at)
flow_runs    (id TEXT PK, flow_id, flow_name, contact TEXT JSON, status, current_node, wait_label, context TEXT JSON, log TEXT JSON, created_at, updated_at)
```

---

## Editor de Fluxos (`/flows/[id]`)

Canvas baseado em `@xyflow/react`. Cada bloco é um **card** (node). A serialização usa **JSON customizado** (não o formato interno do ReactFlow) para compatibilidade futura com o backend.

### Tipos de nós (dot-notation)

| Categoria  | Tipos                                                                                                     |
|------------|-----------------------------------------------------------------------------------------------------------|
| `trigger`  | `trigger.event`, `trigger.schedule`, `trigger.webhook`, `trigger.manual`, `trigger.audience`             |
| `action`   | `action.send_email`, `action.send_whatsapp`, `action.send_chat`, `action.send_sms`                       |
| `crm`      | `action.contact_update`, `action.contact_tag_add/remove`, `action.deal_create`, `action.score_update`, `action.flow_start/stop` |
| `api`      | `action.http_request`, `action.script`, `action.webhook_out`                                             |
| `condition`| `condition.if_else`, `condition.switch`, `condition.wait`                                                 |
| `delay`    | `delay.fixed`, `delay.until_time`, `delay.until_date`, `delay.until_day`, `delay.smart_send`, `delay.business_hours`, `delay.random` |
| `loop`     | `loop.for_each`, `loop.while`, `loop.repeat`, `loop.retry`                                               |
| `control`  | `control.split`, `control.ab_split`, `control.merge`, `control.goto`, `control.exit`                    |

Todos os tipos estão definidos em `src/lib/flow/types.ts` (`NodeType`, `NodeConfigMap`). Metadados de UI (label, icon, sourceHandles, cor por categoria) ficam em `src/components/FlowEditor/nodes/nodeCategories.ts` (`NODE_META`, `SIDEBAR_CATEGORIES`, `CATEGORY_COLOR`).

### Serialização: ReactFlow ↔ JSON customizado

A conversão vive em `src/lib/flow/serialization.ts`. **Regra:** nunca persistir o formato nativo do ReactFlow.

- `serializeFlow(meta, rfNodes, rfEdges) → Flow` — strip de metadados internos do ReactFlow
- `deserializeFlow(flow) → { nodes, edges }` — reconstrói objetos compatíveis com `@xyflow/react`

No formato customizado, os dados do nó ficam em `config` (não em `data.event` etc.):

```json
{
  "id": "flow_abc123",
  "name": "Onboarding",
  "active": true,
  "nodes": [
    { "id": "n1", "type": "trigger.event", "position": { "x": 0, "y": 0 }, "config": { "event": "subscription" } },
    { "id": "n2", "type": "delay.fixed",   "position": { "x": 200, "y": 0 }, "config": { "duration": 1, "unit": "days" } },
    { "id": "n3", "type": "condition.if_else", "position": { "x": 400, "y": 0 }, "config": { "name": "Abriu o e-mail?", "rules": { "logic": "AND", "conditions": [] } } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "sourceHandle": "success" },
    { "id": "e2", "source": "n2", "target": "n3", "sourceHandle": "success" },
    { "id": "e3", "source": "n3", "target": "n4", "sourceHandle": "true" },
    { "id": "e4", "source": "n3", "target": "n5", "sourceHandle": "false" }
  ]
}
```

No ReactFlow, `config` vive dentro de `node.data.config`. O componente `NodeBase.tsx` acessa `props.data.config` e `props.data.label`.

### sourceHandles relevantes

| Tipo de nó          | Handles de saída                         |
|---------------------|------------------------------------------|
| `condition.if_else` | `"true"`, `"false"`                      |
| `condition.wait`    | `"success"`, `"timeout"`                 |
| `condition.switch`  | dinâmico (nome do case ou `"default"`)   |
| `loop.for_each`     | `"body"`, `"on_complete"`                |
| `loop.while`        | `"body"`, `"on_max_reached"`             |
| `loop.retry`        | `"success"`, `"on_max_retries"`          |
| `control.goto/exit` | nenhum (`[]`)                            |
| demais              | `"success"` (+ `"error"` opcional)       |

### Estrutura do FlowEditor

```
src/components/FlowEditor/
  FlowEditor.tsx              # Canvas principal — drag-drop, save, nodes/edges state
  FlowEditor.module.scss
  header/
    FlowHeader.tsx            # Inline name edit, active toggle, botão salvar
  sidebar/
    NodeSidebar.tsx           # Accordion pesquisável com os tipos de nó
    DraggableNodeCard.tsx     # Seta dataTransfer no drag
  panel/
    ConfigPanel.tsx           # Painel deslizante da direita — renderiza NodeConfigForm
    forms/
      NodeConfigForm.tsx      # Dispatcher → form correto por nodeType
      TriggerForms.tsx        # trigger.*
      ActionForms.tsx         # action.send_* + CRM
      ConditionForms.tsx      # condition.* + RuleBuilder
      DelayForms.tsx          # delay.*
      LoopForms.tsx           # loop.*
      ApiForms.tsx            # action.http_request, action.script, action.webhook_out
  nodes/
    NodeBase.tsx              # Único componente de card — lê NODE_META[type]
    nodeCategories.ts         # NODE_META, SIDEBAR_CATEGORIES, CATEGORY_COLOR, CATEGORY_BG
    nodeRegistry.ts           # Mapeia todos os tipos → NodeBase
```

**Padrão importante:** `ReactFlowProvider` fica em `src/app/flows/[id]/page.tsx`; o componente interno `FlowEditor` usa `useReactFlow()`.

### TypeScript gotchas

- `nodeRegistry.ts`: cast necessário `as unknown as ComponentType<NodeProps>` ao registrar `NodeBase`.
- `NodeConfigForm.tsx`: dispatcher precisa de `const on = onChange as (c: any) => void` para evitar erro de tipo no switch.

---

## Flow Runner (`src/lib/flow/runner.ts`)

Módulo **puro** (sem acesso ao banco) que executa um fluxo em memória para o simulador.

- `runFlow(flow, startNodeId, startHandle, ctx, prevLog) → RunResult`
- Para ao encontrar `condition.wait`, `delay.*`, `action.send_chat` ou `control.exit`.
- Retorna `status`: `'completed' | 'waiting_reply' | 'waiting_delay' | 'waiting_chat' | 'error'`
- Suporta template strings `{{contact.email}}`, `{{variables.x}}` nos campos de configuração.
- Limite de 100 passos por execução para evitar loops infinitos.

Para avançar um run parado, POST em `/api/flow-run/[runId]/advance` com `action`:
- `'reply'` → contato respondeu e-mail (`reply_body`, `reply_subject`)
- `'skip_delay'` → simular passagem de tempo
- `'timeout'` → simular timeout do `condition.wait`

---

## Estilos (CSS Modules + SCSS)

- Cada componente tem seu `ComponentName.module.scss`.
- Variáveis globais (cores, espaçamentos, tipografia, cores de nó) em `src/app/globals.scss` via CSS custom properties.
- CSS inline apenas para valores dinâmicos (posição x/y de nós no canvas).

---

## Testes

Testes em `__tests__/` espelham `src/lib/`. Atualmente: `__tests__/flow/serialization.test.ts` (serialização pura, sem DOM).

---

## Convenções

- **Componentes:** PascalCase (`FlowEditor.tsx`, `NodeBase.tsx`)
- **Hooks:** prefixo `use` (`useFlowStore.ts`)
- **Tipos/interfaces:** em `types.ts` na raiz de cada feature
- **NodeType:** sempre usar dot-notation (`trigger.event`, não `trigger` ou `triggerEvent`)
