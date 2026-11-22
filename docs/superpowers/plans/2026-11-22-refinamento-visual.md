# Refinamento visual (Motion + Three.js) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o site ETEC em Cena a um nível "de cinema": claquete 3D modelada e animada na abertura, cenas 3D leves no `/projeto`, animações com Motion em todas as telas públicas — sem quebrar acessibilidade, celular fraco ou PC sem WebGL da escola.

**Architecture:** Three.js entra só por `@react-three/fiber` em componentes carregados sob demanda (`React.lazy`), fora do bundle inicial. A animação 3D é dirigida por funções puras de linha do tempo (`t` em segundos → pose), testáveis sem navegador. Motion cuida do DOM (entrada de seções, hover, transição de rota). Toda cena tem plano B: CSS (o que existe hoje) quando não houver WebGL e versão estática quando o usuário pedir menos movimento.

**Tech Stack:** React 19.3, Vite 8, Tailwind 4.3, `motion` (14.x), `three` (0.187.x), `@react-three/fiber` (9.8.x), `@react-three/drei` (10.7.x), `@react-three/postprocessing` (3.2.x), `vitest` para as funções puras.

**Spec:** pedido do Pablo em 2026-11-22 ("refine o site, animações, estilização… inclua o motion e o three.js… a animação da claquete absurda, bem animada e bem modelada, animações 3D") + `CONTEXTO.md` (paleta seção 6, regras seção 7).

## Global Constraints

- Versões fixadas (sem `^`) e **publicadas há pelo menos 14 dias** na data da instalação: conferir com `npm view <pacote> time --json`. Se a última não tiver 14 dias, usar a anterior.
- `@react-three/fiber` exige `react` e `react-dom` `>=19 <19.4`: não atualizar o React neste trabalho.
- Antes de escrever código de cada biblioteca, consultar a documentação atual pelo **context7** (`resolve-library-id` → `query-docs`): `motion` (React), `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`. Não confiar na memória (regra 6 do CONTEXTO).
- Paleta do site antigo, já no `styles.css`: fundo `#030303`, amarelo `#FFC700`, texto secundário `#A1A1A1`. Nada de cor nova sem passar pelo design system da Tarefa 1.
- Textos de interface em português correto, com acentos.
- Bundle inicial (rota `/acesso`) não pode crescer mais que **30 KB gzip** em relação a hoje (97 KB gzip). Three.js vive em chunk separado.
- `prefers-reduced-motion: reduce` → nenhuma animação contínua, nenhuma câmera em movimento; só fades curtos (≤ 200 ms).
- Sem WebGL → cai na claquete CSS atual, sem erro no console.
- A abertura nunca segura o visitante mais de **4,5 s**; o botão "Pular transição" funciona desde o primeiro quadro, inclusive enquanto o chunk 3D ainda carrega.
- Painel (`/painel`) é ferramenta de trabalho: só micro-interações (modais, listas), sem 3D.
- Backend não muda.

## Review Focus

1. **PC da escola sem aceleração / WebGL desligado** → abertura mostra a claquete CSS e navega para `/projeto` normalmente. Teste: `escolherModoAbertura` (Tarefa 2) + verificação manual com `--disable-webgl` (Tarefa 8).
2. **Usuário com "reduzir movimento" ligado** → nada gira, nada treme, nada de câmera; site continua bonito. Teste: `escolherModoAbertura` + emulação `prefers-reduced-motion` no navegador (Tarefa 8).
3. **Internet lenta (chunk 3D demorando)** → a claquete CSS aparece na hora e o 3D só entra se carregar antes de 1,2 s; senão segue o CSS. Teste: `escolherModoAbertura({ carregouEm })` (Tarefa 2).
4. **Celular fraco** → `dpr` limitado a `[1, 1.5]`, sem pós-processamento pesado abaixo de 768 px, e cena pausa fora da tela. Teste: verificação de FPS no modo mobile (Tarefa 8).
5. **Clicar em "Pular" no meio da batida / clicar várias vezes na claquete** → navega uma vez só, sem animação presa nem timer vazando. Teste: `IntroScreen` não chama `navigate` duas vezes (Tarefa 3).

---

## Mapa de skills e plugins

| Etapa | Skill / plugin | Para quê |
|---|---|---|
| Antes de tudo | `superpowers:using-git-worktrees` | branch `refinamento-visual` isolada |
| Diagnóstico | `improve` + `ui-ux-pro-max:ui-ux-pro-max` | auditoria do visual atual e lista de problemas |
| Direção de arte | `ui-ux-pro-max:design-system`, `frontend-design:frontend-design`, `ecc:frontend-design-direction` | tokens de movimento, tipografia e ritmo cinematográfico |
| Documentação | `context7` (MCP) | APIs atuais de motion, R3F, drei, postprocessing |
| Animação DOM | `ecc:motion-foundations`, `ecc:motion-patterns`, `ecc:motion-advanced` | padrões de Motion (variants, scroll, layout) |
| Testes | `superpowers:test-driven-development`, `ecc:react-testing` | funções de linha do tempo com vitest |
| Execução | `superpowers:subagent-driven-development` ou `superpowers:executing-plans` | uma tarefa por vez com revisão |
| Qualidade | `ecc:react-performance`, `ecc:accessibility`, `design-qa:design-qa`, `ecc:browser-qa` | FPS, bundle, contraste, foco, reduced motion |
| Revisão | `code-review` (high), `ecc:react-reviewer` | revisão do branch antes do merge |
| Fechamento | `superpowers:verification-before-completion`, `superpowers:finishing-a-development-branch` | provas antes de dizer "pronto", merge e deploy |

---

## Estrutura de arquivos

```
frontend/src/
  motion/
    tokens.ts              # durações, curvas e variants compartilhados (Tarefa 1)
  abertura/
    modo.ts                # escolherModoAbertura(): '3d' | 'css' | 'estatico' (Tarefa 2)
    modo.test.ts
    linhaDoTempo.ts        # poseDaClaquete(t): pose pura da animação (Tarefa 2)
    linhaDoTempo.test.ts
    ClaqueteCena.tsx       # Canvas R3F: luz, câmera, pós-processamento (Tarefa 3)
    ClaqueteModelo.tsx     # malhas da claquete, dobradiça, giz (Tarefa 3)
    texturas.ts            # CanvasTexture: listras, giz (Tarefa 3)
  three/
    RoloDeFilme.tsx        # cena leve do hero do /projeto (Tarefa 5)
    useCenaVisivel.ts      # pausa o frameloop fora da tela (Tarefa 5)
  components/intro-screen.tsx   # passa a escolher 3D/CSS/estático (Tarefa 3)
  pages/ProjectExperience.tsx   # Motion nas seções, hero 3D (Tarefas 4 e 5)
  pages/Acesso.tsx              # entrada e micro-interações (Tarefa 6)
  App.tsx                       # transição entre rotas (Tarefa 4)
  styles.css                    # remove keyframes que o Motion substituir
```

---

### Tarefa 0: Branch, retrato do estado atual e auditoria

**Files:**
- Create: `docs/superpowers/plans/refinamento-auditoria.md`

- [ ] **Step 1:** Criar a worktree/branch `refinamento-visual` com `superpowers:using-git-worktrees`.
- [ ] **Step 2:** Subir `npm run dev` + API local (`.claude/launch.json`) e tirar capturas de `/transicao`, `/acesso`, `/projeto` (topo, equipe, curtas, inscrição) em 1440 px e 390 px. Salvar em `docs/superpowers/plans/antes/`.
- [ ] **Step 3:** Rodar `improve` e `ui-ux-pro-max:ui-ux-pro-max` sobre essas telas; registrar no `refinamento-auditoria.md` os problemas por tela (hierarquia, espaçamento, contraste, ritmo).
- [ ] **Step 4:** Medir a linha de base: `npm run build` (anotar KB gzip de JS/CSS) e Lighthouse mobile de `/projeto` (anotar Performance e Accessibility).
- [ ] **Step 5:** Commit `docs: auditoria visual e linha de base`.

### Tarefa 1: Dependências, vitest e tokens de movimento

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts` (bloco `test` do vitest)
- Create: `frontend/src/motion/tokens.ts`

**Interfaces:**
- Produces: `DURACAO = { rapida: 0.2, media: 0.45, lenta: 0.9 }` (segundos); `CURVA = { cinema: [0.22, 1, 0.36, 1], impacto: [0.7, 0, 0.84, 0] }`; `revelar: Variants` (opacity 0→1, y 24→0, `DURACAO.media`, `CURVA.cinema`); `escalonar(passo = 0.08): Variants`.

- [ ] **Step 1:** Rodar `ui-ux-pro-max:design-system` com a paleta e as fontes atuais para fechar os tokens acima (pode ajustar os números; os nomes ficam).
- [ ] **Step 2:** Conferir datas com `npm view <pacote> time --json` e instalar fixado: `motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`; dev: `@types/three`, `vitest`. Script `"test": "vitest run"`.
- [ ] **Step 3:** Criar `tokens.ts` consultando antes o context7 para o tipo `Variants` do `motion/react`.
- [ ] **Step 4:** `npm run build` e `npm test` (zero testes, sem erro). Bundle inicial igual ao de antes (nada importado ainda).
- [ ] **Step 5:** Commit `chore: motion, three.js e tokens de movimento`.

### Tarefa 2: Lógica pura da abertura (TDD)

**Files:**
- Create: `frontend/src/abertura/modo.ts`, `modo.test.ts`
- Create: `frontend/src/abertura/linhaDoTempo.ts`, `linhaDoTempo.test.ts`

**Interfaces:**
- Produces: `escolherModoAbertura(c: { webgl: boolean; reduzirMovimento: boolean; carregouEm: number | null }): '3d' | 'css' | 'estatico'`
- Produces: `DURACAO_ABERTURA = 4.2` (s) e `poseDaClaquete(t: number): { alturaQueda: number; anguloBastao: number; rotacaoY: number; cameraZ: number; tremor: number; flash: number; saida: number }`

Roteiro da animação (o `poseDaClaquete` codifica isto):

| t (s) | Momento |
|---|---|
| 0,0–0,9 | claquete cai do alto girando (`alturaQueda` 6→0, `rotacaoY` −0,6→0) com assentamento de mola |
| 0,9–1,6 | bastão abre devagar (`anguloBastao` 0→0,55 rad), câmera aproxima (`cameraZ` 9→6) |
| 1,6–1,75 | **batida**: bastão fecha (0,55→0) em 150 ms, `flash` 1, `tremor` 1 decaindo em 400 ms |
| 1,75–3,4 | respiro: giz do texto "acende", poeira assenta, câmera faz leve órbita |
| 3,4–4,2 | saída: câmera atravessa a claquete (`saida` 0→1) e o site aparece |

- [ ] **Step 1: testes de `escolherModoAbertura`**
```ts
expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: 400 })).toBe('3d')
expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: 1500 })).toBe('css')
expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: null })).toBe('css')
expect(escolherModoAbertura({ webgl: false, reduzirMovimento: false, carregouEm: 400 })).toBe('css')
expect(escolherModoAbertura({ webgl: true, reduzirMovimento: true, carregouEm: 400 })).toBe('estatico')
```
- [ ] **Step 2: testes de `poseDaClaquete`**
```ts
expect(poseDaClaquete(0).alturaQueda).toBeCloseTo(6)
expect(poseDaClaquete(1.0).alturaQueda).toBeCloseTo(0, 1)
expect(poseDaClaquete(1.6).anguloBastao).toBeCloseTo(0.55, 2)
expect(poseDaClaquete(1.76).anguloBastao).toBeCloseTo(0, 2)
expect(poseDaClaquete(1.76).flash).toBeGreaterThan(0.8)
expect(poseDaClaquete(2.4).tremor).toBeCloseTo(0, 2)
expect(poseDaClaquete(4.2).saida).toBeCloseTo(1)
expect(poseDaClaquete(-1)).toEqual(poseDaClaquete(0))      // limita t
expect(poseDaClaquete(99)).toEqual(poseDaClaquete(4.2))
```
- [ ] **Step 3:** `npm test` → FAIL (funções não existem).
- [ ] **Step 4:** Implementar as duas funções (limite 1,2 s em `carregouEm`; interpolação por trechos com as curvas de `tokens.ts`).
- [ ] **Step 5:** `npm test` → PASS. Commit `feat: linha do tempo e modo da abertura`.

### Tarefa 3: Claquete 3D modelada e cena de abertura

**Files:**
- Create: `frontend/src/abertura/texturas.ts`, `ClaqueteModelo.tsx`, `ClaqueteCena.tsx`
- Modify: `frontend/src/components/intro-screen.tsx`

**Interfaces:**
- Consumes: `poseDaClaquete`, `DURACAO_ABERTURA`, `escolherModoAbertura` (Tarefa 2)
- Produces: `ClaqueteCena({ aoTerminar }: { aoTerminar: () => void })` como `export default` (para `React.lazy`)

Modelagem (procedural, sem arquivo .glb):
- **Corpo:** `RoundedBox` (drei) 3,2 × 2,4 × 0,12, material preto fosco com leve `clearcoat`; moldura em giz.
- **Bastão:** duas peças (fixa e móvel) 3,2 × 0,45 × 0,14 com **listras diagonais pretas/brancas** em `CanvasTexture`; dobradiça metálica (cilindro) no canto esquerdo; o pivô do bastão móvel fica no eixo da dobradiça.
- **Giz:** `Text` (drei) com "ETEC EM CENA", "CENA 01 · TAKE 01 · ROLO 2026", campos DIREÇÃO / CÂMERA / DATA; textura de giz com ruído no `texturas.ts`.
- **Luz:** spot amarelo-quente (`#FFC700` fraco) de cima + luz de recorte; `Environment` simples (preset de estúdio).
- **Pós:** `Bloom` (só nas partes claras), `Vignette`, `Noise` (grão de filme), `ChromaticAberration` só no instante da batida (`flash`); desligado abaixo de 768 px.
- **Partículas:** `Sparkles` como poeira que sobe na batida.

- [ ] **Step 1:** Consultar o context7: `useFrame`, `Canvas` (`dpr`, `frameloop`), `RoundedBox`, `Text`, `Sparkles`, `Environment`, `EffectComposer`.
- [ ] **Step 2:** `texturas.ts`: `criarTexturaListras(): CanvasTexture`, `criarTexturaGiz(): CanvasTexture`.
- [ ] **Step 3:** `ClaqueteModelo.tsx` recebe `pose` e só aplica posições/rotações (sem lógica de tempo).
- [ ] **Step 4:** `ClaqueteCena.tsx`: `Canvas` com `dpr={[1, 1.5]}`; em `useFrame` lê o relógio, calcula `poseDaClaquete(t)` e passa ao modelo; quando `t >= DURACAO_ABERTURA` chama `aoTerminar` **uma vez**.
- [ ] **Step 5:** `intro-screen.tsx`: detecta WebGL e `useReducedMotion()` (motion), mede o tempo do `import()` do chunk, decide com `escolherModoAbertura`; renderiza a claquete CSS atual enquanto decide; "Pular transição" e o fim da animação passam por uma função `sair()` que navega uma só vez (guarda em `useRef`). Clicar na claquete 3D repete só a batida.
- [ ] **Step 6:** Verificar no navegador (`/transicao`): 3D roda, batida sincronizada, flash e tremor, saída atravessando; console sem erro; `npm run build` mostra o three num chunk separado e o inicial ≤ +30 KB gzip.
- [ ] **Step 7:** Commit `feat: claquete 3D na abertura`.

### Tarefa 4: Motion nas páginas públicas e transição de rota

**Files:**
- Modify: `frontend/src/App.tsx`, `frontend/src/pages/ProjectExperience.tsx`, `frontend/src/styles.css`

**Interfaces:**
- Consumes: `revelar`, `escalonar`, `DURACAO`, `CURVA` (Tarefa 1)

- [ ] **Step 1:** Consultar o context7 (`motion/react`: `AnimatePresence`, `whileInView`, `useScroll`, `useTransform`, `useSpring`, `MotionConfig reducedMotion="user"`). Seguir `ecc:motion-patterns`.
- [ ] **Step 2:** `App.tsx`: `MotionConfig reducedMotion="user"` na raiz e fade/slide entre rotas com `AnimatePresence` + `useLocation`.
- [ ] **Step 3:** Seções `#sobre`, `#equipe`, `#curtas`, `#inscricao`: títulos com `revelar`; cartões de integrantes e curtas com `escalonar`; cartão de integrante com inclinação 3D no hover (`useMotionValue` + `useSpring`, máx. 8°) e brilho seguindo o mouse.
- [ ] **Step 4:** Hero: texto em parallax com `useScroll` (camadas a velocidades diferentes) e barra de progresso de rolagem amarela no topo.
- [ ] **Step 5:** Remover do `styles.css` as keyframes substituídas (manter as da claquete CSS, que é o plano B).
- [ ] **Step 6:** Verificar no navegador nas duas larguras e com reduced motion emulado. Commit `feat: animações com motion no site`.

### Tarefa 5: Cena 3D leve no hero do /projeto

**Files:**
- Create: `frontend/src/three/RoloDeFilme.tsx`, `frontend/src/three/useCenaVisivel.ts`
- Modify: `frontend/src/pages/ProjectExperience.tsx` (só a seção `#inicio`)

**Interfaces:**
- Produces: `useCenaVisivel(ref: RefObject<HTMLElement>): boolean` (IntersectionObserver); `RoloDeFilme({ progresso }: { progresso: MotionValue<number> })` default export

- [ ] **Step 1:** Cena: rolo de filme + fita de película em curva (`TubeGeometry` com textura de fotogramas) girando devagar; a rolagem (`progresso` do `useScroll`) gira o rolo e desenrola a fita.
- [ ] **Step 2:** `frameloop="demand"` + `invalidate()` só quando visível (`useCenaVisivel`); `React.lazy` com fallback = hero atual.
- [ ] **Step 3:** Sem 3D em reduced motion ou sem WebGL (reaproveita `escolherModoAbertura` com `carregouEm` medido do chunk).
- [ ] **Step 4:** Verificar FPS no DevTools (desktop ≥ 55, mobile emulado ≥ 30) e que a cena para fora da tela. Commit `feat: rolo de filme 3D no hero`.

### Tarefa 6: Tela de acesso

**Files:**
- Modify: `frontend/src/pages/Acesso.tsx`

- [ ] **Step 1:** Fundo com grão de filme animado (CSS/canvas 2D, sem three) e entrada do cartão com `revelar`.
- [ ] **Step 2:** Troca de aba Entrar/Criar conta com `layoutId` no indicador; campos com foco animado; erro com tremor curto (desligado em reduced motion).
- [ ] **Step 3:** Verificar login e cadastro continuam funcionando (fluxo local). Commit `feat: animações na tela de acesso`.

### Tarefa 7: Painel — só micro-interações

**Files:**
- Modify: `frontend/src/pages/DashboardExperience.tsx`

- [ ] **Step 1:** Modais com `AnimatePresence` (escala 0,96→1, `DURACAO.rapida`); linhas de lista entrando com `escalonar(0.03)`; nada de 3D.
- [ ] **Step 2:** Verificar cadastro de curta/integrante com upload no painel local. Commit `feat: micro-interações no painel`.

### Tarefa 8: Qualidade, revisão e publicação

- [ ] **Step 1:** `design-qa:design-qa` e `ecc:accessibility`: contraste, foco visível, botões com nome, alvo ≥ 44 px, nada só por cor.
- [ ] **Step 2:** `ecc:browser-qa`: as 5 linhas da Review Focus — Chrome com `--disable-webgl`, emulação de reduced motion, rede "Slow 3G", mobile 390 px, cliques repetidos em "Pular".
- [ ] **Step 3:** Lighthouse mobile de `/projeto`: Accessibility ≥ linha de base; Performance não cai mais de 5 pontos. Bundle inicial ≤ linha de base + 30 KB gzip.
- [ ] **Step 4:** `npm test`, `npm run build`, `uv run pytest` (backend intocado).
- [ ] **Step 5:** `code-review` (high) e `ecc:react-reviewer` no branch; corrigir o que for confirmado.
- [ ] **Step 6:** Capturas "depois" em `docs/superpowers/plans/depois/` para comparar com a Tarefa 0.
- [ ] **Step 7:** `superpowers:finishing-a-development-branch`: merge na `main` (com OK do Pablo), `npm run build`, enviar `frontend/dist` para `/opt/etec-em-cena/frontend/dist` na VPS e conferir `https://etec-em-cena.taberna3d.com.br`.

---

## Fora deste plano (pedir antes, se quiser)

- Som da batida da claquete (exige arquivo de áudio e botão de som; navegadores bloqueiam autoplay).
- Rolagem suavizada (Lenis): dependência a mais; o Motion já cobre scroll.
- Modelo .glb feito no Blender: a claquete procedural já fica leve e editável; trocar só se o grupo quiser um modelo artístico específico.
