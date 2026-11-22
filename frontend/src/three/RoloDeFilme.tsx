import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useMemo, useRef } from 'react'
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Texture,
} from 'three'

// Película: fundo preto, furos em cima e embaixo, fotogramas com brilho quente.
function texturaPelicula(): CanvasTexture {
  const L = 1024
  const A = 256
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = A
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#070707'
  ctx.fillRect(0, 0, L, A)
  for (let x = 8; x < L; x += 32) {
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(x, 12, 16, 22)
    ctx.fillRect(x, A - 34, 16, 22)
  }
  const quadros = 4
  for (let i = 0; i < quadros; i++) {
    const x = i * (L / quadros) + 14
    const w = L / quadros - 28
    const g = ctx.createLinearGradient(x, 50, x + w, A - 50)
    g.addColorStop(0, i % 2 ? '#3d2c05' : '#5a4208')
    g.addColorStop(1, '#0d0a03')
    ctx.fillStyle = g
    ctx.fillRect(x, 50, w, A - 100)
    ctx.fillStyle = 'rgba(255,199,0,0.55)'
    ctx.font = "700 28px 'Manrope', system-ui, sans-serif"
    ctx.fillText(`0${i + 1}`, x + 14, 84)
  }
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  t.repeat.set(5, 1)
  return t
}

// Disco do rolo com os furos vazados (alphaMap: branco = sólido, preto = furo).
function texturaDisco(): CanvasTexture {
  const T = 512
  const canvas = document.createElement('canvas')
  canvas.width = T
  canvas.height = T
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, T, T)
  ctx.fillStyle = '#000000'
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(T / 2 + Math.cos(a) * T * 0.27, T / 2 + Math.sin(a) * T * 0.27, T * 0.11, 0, Math.PI * 2)
    ctx.fill()
  }
  return new CanvasTexture(canvas)
}

// Fita: uma faixa plana que acompanha a curva (normal fixa em z, largura no eixo perpendicular).
function geometriaFita(curva: CatmullRomCurve3, largura: number, segmentos: number): BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const lado = new Vector3()
  for (let i = 0; i <= segmentos; i++) {
    const u = i / segmentos
    const p = curva.getPointAt(u)
    const tg = curva.getTangentAt(u)
    lado.set(-tg.y, tg.x, 0).normalize().multiplyScalar(largura / 2)
    pos.push(p.x + lado.x, p.y + lado.y, p.z, p.x - lado.x, p.y - lado.y, p.z)
    uv.push(u, 1, u, 0)
    if (i < segmentos) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function Cena({ progresso }: { progresso: MotionValue<number> }) {
  const rolo = useRef<Group>(null)
  const { pelicula, disco, fita } = useMemo(() => {
    const curva = new CatmullRomCurve3([
      new Vector3(2.6, 0.9, 0),
      new Vector3(1.2, -0.6, 0.6),
      new Vector3(-0.8, -1.4, 0.2),
      new Vector3(-3, -0.6, -0.6),
      new Vector3(-5.2, -1.6, -1),
    ])
    return { pelicula: texturaPelicula() as Texture, disco: texturaDisco(), fita: geometriaFita(curva, 0.7, 160) }
  }, [])

  useFrame((_, delta) => {
    const p = progresso.get()
    if (rolo.current) rolo.current.rotation.z -= delta * (0.25 + p * 3)
    pelicula.offset.x -= delta * (0.04 + p * 0.6)
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <spotLight position={[4, 5, 6]} angle={0.5} penumbra={1} intensity={90} color="#ffd56a" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1} color="#FFC700" position={[5, 0, 2]} scale={[2, 5, 1]} />
      </Environment>

      <group position={[2.6, 1.25, -0.6]} rotation={[0.25, -0.5, 0]}>
        <group ref={rolo}>
          {[0.13, -0.13].map((z) => (
            <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.6, 1.6, 0.04, 64]} />
              <meshStandardMaterial color="#9a9a9a" metalness={1} roughness={0.3} alphaMap={disco} alphaTest={0.5} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.24, 48]} />
            <meshStandardMaterial color="#111" roughness={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.34, 24]} />
            <meshStandardMaterial color="#c9c9c9" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      </group>

      <mesh geometry={fita}>
        <meshStandardMaterial map={pelicula} side={DoubleSide} roughness={0.5} metalness={0.1} />
      </mesh>
    </>
  )
}

export default function RoloDeFilme({ progresso, ativo }: { progresso: MotionValue<number>; ativo: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={ativo ? 'always' : 'never'}
      camera={{ fov: 40, position: [0, 0, 7] }}
      gl={{ alpha: true }}
      className="!absolute inset-0"
      aria-hidden="true"
    >
      <Cena progresso={progresso} />
    </Canvas>
  )
}
