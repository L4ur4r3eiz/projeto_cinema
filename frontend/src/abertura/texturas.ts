import { CanvasTexture, SRGBColorSpace } from 'three'

function tela(largura: number, altura: number) {
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  return { canvas, ctx: canvas.getContext('2d')! }
}

function textura(canvas: HTMLCanvasElement) {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Desgaste: pontinhos claros e escuros espalhados, como tinta e giz gastos.
function desgastar(ctx: CanvasRenderingContext2D, largura: number, altura: number, quantos: number) {
  for (let i = 0; i < quantos; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.18)'
    ctx.fillRect(Math.random() * largura, Math.random() * altura, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
}

// Bastão: listras diagonais pretas e brancas.
export function criarTexturaListras(): CanvasTexture {
  const L = 1024
  const A = 128
  const { canvas, ctx } = tela(L, A)
  ctx.fillStyle = '#0b0b0b'
  ctx.fillRect(0, 0, L, A)
  ctx.fillStyle = '#f2f0e8'
  const passo = 128
  for (let x = -A; x < L + A; x += passo) {
    ctx.beginPath()
    ctx.moveTo(x, A)
    ctx.lineTo(x + passo / 2, A)
    ctx.lineTo(x + passo / 2 + A * 0.8, 0)
    ctx.lineTo(x + A * 0.8, 0)
    ctx.closePath()
    ctx.fill()
  }
  desgastar(ctx, L, A, 2500)
  return textura(canvas)
}

function linhaGiz(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.35 + Math.random() * 0.3
    ctx.beginPath()
    ctx.moveTo(x1 + Math.random() * 2, y1 + Math.random() * 2)
    ctx.lineTo(x2 + Math.random() * 2, y2 + Math.random() * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function textoGiz(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, fonte: string, cor: string) {
  ctx.font = fonte
  ctx.fillStyle = cor
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.45 + Math.random() * 0.3
    ctx.fillText(texto, x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2)
  }
  ctx.globalAlpha = 1
}

// Face da claquete: lousa preta com campos e o nome do projeto escritos a giz.
export function criarTexturaGiz(): CanvasTexture {
  const L = 1280
  const A = 940
  const { canvas, ctx } = tela(L, A)
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, L, A)
  desgastar(ctx, L, A, 9000)

  const branco = '#f4f1e6'
  const familia = "'Manrope', system-ui, sans-serif"
  ctx.strokeStyle = branco
  ctx.lineWidth = 4
  ctx.textBaseline = 'middle'

  // grade de campos
  linhaGiz(ctx, 40, 300, L - 40, 300)
  linhaGiz(ctx, 40, 520, L - 40, 520)
  linhaGiz(ctx, 40, 720, L - 40, 720)
  linhaGiz(ctx, L / 3, 300, L / 3, 520)
  linhaGiz(ctx, (2 * L) / 3, 300, (2 * L) / 3, 520)
  linhaGiz(ctx, L / 2, 520, L / 2, 720)

  textoGiz(ctx, 'PRODUÇÃO', 60, 70, `700 34px ${familia}`, branco)
  textoGiz(ctx, 'ETEC EM CENA', 60, 190, `800 150px ${familia}`, branco)

  const rotulo = `700 30px ${familia}`
  const valor = `800 120px ${familia}`
  const colunas: [string, string][] = [['CENA', '01'], ['TAKE', '01'], ['ROLO', '26']]
  colunas.forEach(([r, v], i) => {
    const x = 60 + (i * L) / 3
    textoGiz(ctx, r, x, 340, rotulo, branco)
    textoGiz(ctx, v, x, 440, valor, branco)
  })

  textoGiz(ctx, 'DIREÇÃO', 60, 560, rotulo, branco)
  textoGiz(ctx, 'Turma da Etec', 60, 640, `700 60px ${familia}`, branco)
  textoGiz(ctx, 'CÂMERA', L / 2 + 20, 560, rotulo, branco)
  textoGiz(ctx, 'A', L / 2 + 20, 640, `700 60px ${familia}`, branco)

  textoGiz(ctx, 'DATA', 60, 770, rotulo, branco)
  textoGiz(ctx, '2026', 60, 850, `700 70px ${familia}`, branco)
  textoGiz(ctx, 'SOM', L / 2 + 20, 770, rotulo, branco)
  textoGiz(ctx, 'MOS', L / 2 + 20, 850, `700 70px ${familia}`, branco)

  return textura(canvas)
}
