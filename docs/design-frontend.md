# Design Frontend — Editor de Fluxos de Automação

## 1. Layout Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER (64px)                                                          │
│  [Logo] [Nome do Fluxo] [Status: Active]    [Builder|Live] [▶ Run] [⚙] │
├──────────────┬──────────────────────────────────────────┬───────────────┤
│              │                                          │               │
│   SIDEBAR    │            CANVAS                        │  PANEL        │
│   (288px)    │         (flex 1 — infinito)              │  (320px)      │
│              │                                          │               │
│  [Busca]     │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │  (Abre ao     │
│              │  ·  ┌────────┐     ┌────────┐  ·  ·  · │   selecionar  │
│  ▸ Triggers  │  ·  │ Trigger│────▶│ Delay  │  ·  ·  · │   um nó)      │
│  ▸ Mensagens │  ·  └────────┘     └────────┘  ·  ·  · │               │
│  ▸ Lógica    │  ·                      │      ·  ·  · │  [Tipo do Nó] │
│  ▸ Esperas   │  ·              ┌───────┴──────┐ ·  ·  │  [ID: node_x] │
│  ▸ Loops     │  ·              │  Condição    │ ·  ·  │               │
│  ▸ Controle  │  ·       ┌─────┤  IF/ELSE     ├──┐ ·  │  [Campos de   │
│  ▸ CRM       │  ·       │     └──────────────┘  │ ·  │   config]     │
│  ▸ APIs      │  ·  ┌────▼──┐              ┌─────▼─┐  │               │
│  ▸ Externas  │  ·  │Email  │              │Wait   │  │  [Salvar]     │
│              │  ·  └───────┘              └───────┘  │  [Deletar]    │
│  [⚙ Config] │  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │               │
│              ├──────────────────────────────────────────┤               │
│              │  [−] [+] [Fit] [Mini-mapa]    [Undo][Redo]│               │
└──────────────┴──────────────────────────────────────────┴───────────────┘
```

---

## 2. Tokens de Design

### Cores (CSS Custom Properties em `globals.scss`)

```scss
:root {
  // Superfícies
  --bg-app:          #F8F9FA;
  --bg-canvas:       #F3F4F6;
  --bg-surface:      #FFFFFF;
  --bg-sidebar:      #FFFFFF;
  --bg-panel:        #FFFFFF;

  // Grid do canvas
  --canvas-dot:      #CBD5E1;

  // Texto
  --text-primary:    #111827;
  --text-secondary:  #6B7280;
  --text-muted:      #9CA3AF;

  // Bordas
  --border:          #E5E7EB;
  --border-hover:    #D1D5DB;

  // Primária
  --primary:         #2563EB;
  --primary-hover:   #1D4ED8;
  --primary-light:   #EFF6FF;

  // Handle / Conexão
  --handle-default:  #9CA3AF;
  --handle-hover:    #2563EB;
  --handle-active:   #16A34A;
  --edge-default:    #94A3B8;
  --edge-active:     #2563EB;
  --edge-animated:   #10B981;

  // Categorias de nós
  --node-trigger:    #16A34A;   // Verde
  --node-action:     #2563EB;   // Azul
  --node-condition:  #D97706;   // Âmbar
  --node-delay:      #7C3AED;   // Violeta
  --node-loop:       #DB2777;   // Rosa
  --node-control:    #475569;   // Slate
  --node-crm:        #0891B2;   // Ciano
  --node-api:        #EA580C;   // Laranja
  --node-integration:#059669;   // Esmeralda
}
```

### Tipografia

- **Família:** Inter (400, 500, 600, 700)
- **Mono:** Fira Code (400) — para IDs de nó, JSON inline, código
- **Tamanhos:** 10px (label mínimo), 12px (meta), 13px (corpo), 14px (heading card), 16px (nome do fluxo)

### Espaçamento

- Grid base: 4px
- Gaps: 4, 8, 12, 16, 24, 32px
- Padding interno de card: 12px
- Padding do painel: 24px

### Bordas / Raio

- Cards: `border-radius: 12px`
- Handles: `border-radius: 50%`
- Inputs: `border-radius: 8px`
- Badges: `border-radius: 9999px`

---

## 3. Canvas

### Comportamento

| Ação                  | Comportamento                                    |
|-----------------------|--------------------------------------------------|
| Drag no fundo         | Pan (arrastar o viewport)                        |
| Scroll                | Zoom (in/out centrado no cursor)                 |
| Ctrl + Scroll         | Zoom preciso                                     |
| Click em nó           | Seleciona + abre painel direito                  |
| Drag em nó            | Move o nó no canvas                              |
| Drag de handle        | Inicia conexão (linha de preview)                |
| Drop em handle        | Finaliza conexão (cria edge)                     |
| Click em edge         | Seleciona edge (mostra botão de deletar)         |
| Esc                   | Deseleciona tudo                                 |
| Delete / Backspace    | Remove nó ou edge selecionado                    |
| Ctrl+Z / Ctrl+Y       | Undo / Redo                                      |
| Ctrl+A                | Seleciona todos os nós                           |
| Drag de sidebar → canvas | Cria nó no ponto de drop                    |

### Grid

- Pontos de 1px a cada 20px
- Cor: `var(--canvas-dot)`
- Fundo: `var(--bg-canvas)`

### Controles (toolbar inferior)

```
[−]  [+]  [⊡ Fit]  [⊞ Grid on/off]  [⬕ Minimap]     [↩ Undo]  [↪ Redo]
```

---

## 4. Nós (Cards)

### Anatomia de um Card

```
┌──────────────────────────────┐
│ ○ INPUT                      │  ← Handle de entrada (esquerda)
│                              │
│  ┌──┐                        │
│  │  │  Tipo do Nó            │  ← Ícone + Label do tipo
│  └──┘  Subtítulo / config    │
│                              │
│  [badge de status]           │
│                              │
│                        ○ ──▶ │  ← Handle(s) de saída (direita)
└──────────────────────────────┘
```

### Tamanho padrão: 200px × 80px
### Tamanho expandido (condição/loop): 200px × 120px

### Variantes visuais por categoria

| Categoria   | Borda esquerda | Ícone bg         | Label cor         |
|-------------|----------------|------------------|-------------------|
| trigger     | 3px verde      | verde claro      | `--node-trigger`  |
| action      | 3px azul       | azul claro       | `--node-action`   |
| condition   | 3px âmbar      | âmbar claro      | `--node-condition`|
| delay       | 3px violeta    | violeta claro    | `--node-delay`    |
| loop        | 3px rosa       | rosa claro       | `--node-loop`     |
| control     | 3px slate      | slate claro      | `--node-control`  |
| crm         | 3px ciano      | ciano claro      | `--node-crm`      |
| api         | 3px laranja    | laranja claro    | `--node-api`      |

### Estado de seleção

```scss
.node--selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary), 0 4px 12px rgba(37, 99, 235, 0.15);
}
```

### Card — JSON Inline (modo expandido)

Quando o nó tem configuração relevante, exibe um snippet do JSON em `font-mono` com fundo escuro:

```
┌──────────────────────────────┐
│  ⚡ Event Trigger             │
│  ─────────────────────────── │
│  ┌────────────────────────┐  │
│  │ "event": "msg.received"│  │  ← Fira Code 10px, bg #1E293B, text #94A3B8
│  │ "channel": "whatsapp"  │  │
│  └────────────────────────┘  │
│                        ○ ──▶ │
└──────────────────────────────┘
```

---

## 5. Handles (Pontos Magnéticos)

### Tipos de handle por nó

| Tipo de nó         | Entradas      | Saídas                          |
|--------------------|---------------|---------------------------------|
| trigger.*          | 0             | 1 (success)                     |
| action.*           | 1             | 1 (success) + 1 opcional (error)|
| condition.if_else  | 1             | 2 (true / false)                |
| condition.switch   | 1             | N (um por case + default)       |
| condition.wait     | 1             | 2 (success / timeout)           |
| delay.*            | 1             | 1 (success)                     |
| loop.for_each      | 1             | 2 (body / on_complete)          |
| loop.while         | 1             | 2 (body / on_max_reached)       |
| control.split      | 1             | N (branches)                    |
| control.merge      | N             | 1                               |
| control.exit       | 1             | 0                               |

### Visual dos handles

```scss
.handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--handle-default);
  border: 2px solid var(--bg-surface);

  &:hover {
    background: var(--handle-hover);
    transform: scale(1.3);
    cursor: crosshair;
  }

  &--output-true  { background: #16A34A; }  // Verde
  &--output-false { background: #DC2626; }  // Vermelho
  &--output-timeout { background: #D97706; } // Âmbar
  &--output-error { background: #DC2626; }
}
```

### Rótulos de handle

Para `condition.if_else`, `condition.wait`, `loop.*`:
```
              ○ true  ─────▶ [próximo nó]
[condição] ─▶
              ○ false ─────▶ [outro nó]
```

Os handles de saída condicionais exibem um micro-label (`true`, `false`, `timeout`, `body`, `done`).

---

## 6. Conexões (Edges)

### Estilo padrão (Bezier)

```scss
.edge-default {
  stroke: var(--edge-default);
  stroke-width: 2;
  fill: none;
}

.edge-active {
  stroke: var(--edge-active);
  stroke-width: 2.5;
}

// Edge animado (quando fluxo está rodando / Live View)
.edge-animated {
  stroke-dasharray: 8 4;
  animation: flow-dash 0.8s linear infinite;
}

@keyframes flow-dash {
  to { stroke-dashoffset: -12; }
}
```

### Tipo de curva: `SmoothStepEdge` (ReactFlow) ou Bezier cúbico

Bezier recomendado para visual limpo:
```
C1 = source_x + gap, source_y
C2 = target_x - gap, target_y
gap = max(40, abs(target_x - source_x) * 0.4)
```

### Badge de contagem no meio da edge

```
─────── [7 itens] ────────
```

Exibido quando o edge representa múltiplos dados (ex: loop).

---

## 7. Sidebar Esquerda

### Seções com accordion

```
▸ Triggers       [5]
▾ Mensagens      [4]
  ┌──────┐  ┌──────┐
  │ 📧   │  │ 💬   │
  │Email │  │WhatsApp│
  └──────┘  └──────┘
  ┌──────┐  ┌──────┐
  │ 💬   │  │ 📱   │
  │ Chat │  │ SMS  │
  └──────┘  └──────┘
▸ Lógica / Cond. [3]
▸ Esperas        [7]
▸ Loops          [4]
▸ Controle       [5]
▸ CRM / Dados    [10]
▸ APIs / Webhooks[3]
▸ Integrações    [10]
```

### Card de node na sidebar (draggable)

```
┌────────────────┐
│   [ícone]      │  48px × 64px
│   Label        │  10px, font-medium
└────────────────┘
cursor: grab
hover: border azul
```

---

## 8. Painel Direito (Configuração)

### Estrutura

```
┌────────────────────────────────────┐
│  [ícone tipo]  Nome do Nó    [×]   │  ← Header com botão fechar
│  ID: node_abc123 (mono)            │
├────────────────────────────────────┤
│                                    │
│  [Campos específicos do tipo]      │  ← Formulário dinâmico por tipo
│                                    │
│  ─── JSON Preview ───              │  ← Toggle opcional
│  { "type": "...", "config": {} }  │  ← Fira Code, fundo escuro
│                                    │
├────────────────────────────────────┤
│  [Deletar]          [Salvar]       │  ← Ações no rodapé
└────────────────────────────────────┘
```

### Campos por tipo de nó

**condition.if_else:**
- Condition Name (text input)
- Logic Type: AND / OR (toggle)
- Rules (lista com + Add Rule):
  - Field | Operator | Value
- Output Paths (read-only): True Path, False Path

**delay.fixed:**
- Duration (number input)
- Unit (select: minutos, horas, dias, semanas)
- Respeitar horário comercial (checkbox)
- Quiet hours (checkbox + horários)

**action.send_email:**
- To (template input: `{{contact.email}}`)
- Subject (template input)
- Body HTML (textarea)
- Track opens / Track clicks (checkboxes)

**trigger.event:**
- Event Type (select com todos os eventos)
- Channel (select: whatsapp, email, chat, etc.)
- Filters (lista)
- Deduplicate (checkbox + janela em segundos)

---

## 9. Header

```
┌─────────────────────────────────────────────────────────────────┐
│ [W] Nome do Fluxo  ● Active                Last run: 2 min ago  │
│                        [Builder | Live View]  [▶ Run]  [☀/☾]   │
└─────────────────────────────────────────────────────────────────┘
```

- **Nome do Fluxo:** clicável para editar inline
- **Status badge:** `Active` (verde pulsante) / `Inactive` (cinza)
- **Builder / Live View:** toggle que troca para view de monitoramento em tempo real
- **Run:** executa o fluxo manualmente

---

## 10. Nós — Referência Completa

### Triggers

| ID visual    | Tipo              | Ícone | Cor    |
|--------------|-------------------|-------|--------|
| Event        | trigger.event     | ⚡    | verde  |
| Schedule     | trigger.schedule  | 🕐    | verde  |
| Webhook      | trigger.webhook   | 🔗    | verde  |
| Manual       | trigger.manual    | 👆    | verde  |
| Audience     | trigger.audience  | 👥    | verde  |

### Mensagens / Actions

| ID visual    | Tipo                    | Ícone | Cor  |
|--------------|-------------------------|-------|------|
| Email        | action.send_email       | 📧    | azul |
| WhatsApp     | action.send_whatsapp    | 💬    | azul |
| Chat         | action.send_chat        | 💭    | azul |
| SMS          | action.send_sms         | 📱    | azul |

### Lógica

| ID visual    | Tipo                    | Ícone | Cor    |
|--------------|-------------------------|-------|--------|
| IF / ELSE    | condition.if_else       | ⑂     | âmbar  |
| Switch       | condition.switch        | ⊞     | âmbar  |
| Wait + Cond  | condition.wait          | ⏳    | âmbar  |

### Esperas

| ID visual       | Tipo                    | Ícone | Cor      |
|-----------------|-------------------------|-------|----------|
| Delay           | delay.fixed             | ⏱     | violeta  |
| Até horário     | delay.until_time        | 🕐    | violeta  |
| Até data        | delay.until_date        | 📅    | violeta  |
| Smart Send      | delay.smart_send        | 🎯    | violeta  |
| Horário comercial| delay.business_hours   | 🏢    | violeta  |
| Aleatório       | delay.random            | 🎲    | violeta  |

### Loops

| ID visual    | Tipo            | Ícone | Cor   |
|--------------|-----------------|-------|-------|
| For Each     | loop.for_each   | 🔁    | rosa  |
| While        | loop.while      | ↺     | rosa  |
| Repeat N     | loop.repeat     | 🔂    | rosa  |
| Retry        | loop.retry      | ↩     | rosa  |

### Controle de Fluxo

| ID visual    | Tipo              | Ícone | Cor   |
|--------------|-------------------|-------|-------|
| Split        | control.split     | ⑃     | slate |
| A/B Split    | control.ab_split  | ∥     | slate |
| Merge        | control.merge     | ⑂↑    | slate |
| Go To        | control.goto      | →↓    | slate |
| Exit         | control.exit      | ⏹     | slate |

### CRM / Dados

| ID visual       | Tipo                     | Cor   |
|-----------------|--------------------------|-------|
| Update Contact  | action.contact_update    | ciano |
| Add Tag         | action.contact_tag_add   | ciano |
| Remove Tag      | action.contact_tag_remove| ciano |
| Create Deal     | action.deal_create       | ciano |
| Update Deal     | action.deal_update       | ciano |
| Add to List     | action.list_add          | ciano |
| Score Update    | action.score_update      | ciano |
| Start Flow      | action.flow_start        | ciano |
| Stop Flow       | action.flow_stop         | ciano |

### APIs / Integrações

| ID visual    | Tipo                 | Ícone | Cor      |
|--------------|----------------------|-------|----------|
| HTTP Request | action.http_request  | 🌐    | laranja  |
| Script (JS)  | action.script        | </> | laranja  |
| Webhook Out  | action.webhook_out   | 📡    | laranja  |

---

## 11. Fluxo de Interação — Criar e Conectar Nós

```
1. Usuário arrasta card da sidebar → canvas
   → Nó criado na posição de drop com ID único (node_[nanoid])
   → Painel direito abre com configuração do nó

2. Usuário passa mouse no handle de saída de um nó
   → Handle aumenta (scale 1.3), cursor vira crosshair

3. Usuário arrasta do handle de saída
   → Linha de preview segue o cursor

4. Usuário solta sobre handle de entrada de outro nó
   → Edge criado com sourceHandle e targetHandle corretos
   → Animação de "conexão estabelecida" (pulse verde breve)

5. Usuário solta em área vazia do canvas
   → Popup "Adicionar próximo nó" com categorias
   → Seleção cria o nó e conecta automaticamente

6. Usuário clica em nó
   → Nó recebe borda de seleção azul
   → Painel direito desliza (slide-in, 200ms ease-out)

7. Usuário clica em edge
   → Edge fica azul com botão [×] no centro
   → Clique em [×] remove o edge

8. Usuário clica em fundo do canvas
   → Tudo deselecionado, painel direito fecha
```

---

## 12. Responsividade

O editor é **desktop-only**. Não adaptar para mobile.

- Largura mínima suportada: 1280px
- Sidebar: fixo 288px (não colapsa)
- Painel direito: fixo 320px (fecha com ×, reabre ao clicar nó)
- Canvas: `flex: 1` (ocupa o espaço restante)

---

## 13. Animações e Transições

| Elemento               | Animação                                     | Duração  |
|------------------------|----------------------------------------------|----------|
| Painel direito abre    | `translateX(320px → 0)`                      | 200ms    |
| Nó criado              | `scale(0.8 → 1) + opacity(0 → 1)`           | 150ms    |
| Nó selecionado         | `box-shadow` fade in                         | 100ms    |
| Handle hover           | `transform: scale(1.3)`                      | 100ms    |
| Edge em live view      | `stroke-dashoffset` animado                  | 800ms/∞  |
| Status badge (active)  | `opacity` pulsante (1 → 0.5 → 1)           | 2s/∞     |
| Sidebar accordion      | `max-height` expand                          | 200ms    |

Regra geral: `transition: 100–200ms ease-out`. Sem animações longas ou complexas.
