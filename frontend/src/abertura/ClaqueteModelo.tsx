import { RoundedBox } from '@react-three/drei'
import { useMemo, type RefObject } from 'react'
import { MeshStandardMaterial, type Group } from 'three'
import { criarTexturaGiz, criarTexturaListras } from './texturas'

// Medidas (unidades de cena): lousa 3,2 × 2,4; bastões 3,2 × 0,42.
const LARGURA = 3.2
const ALTURA = 2.4
const BASTAO = 0.42
const TOPO_LOUSA = ALTURA / 2
const Y_BASTAO_FIXO = TOPO_LOUSA + BASTAO / 2 + 0.01
const Y_DOBRADICA = TOPO_LOUSA + BASTAO + 0.02

export type PecasClaquete = { corpo: Group | null; bastao: Group | null; giz: MeshStandardMaterial | null }

// Só geometria e materiais: quem move as peças é a ClaqueteCena, a cada quadro.
export function ClaqueteModelo({ pecas }: { pecas: RefObject<PecasClaquete> }) {
  const m = useMemo(() => {
    const giz = criarTexturaGiz()
    return {
      listras: new MeshStandardMaterial({ map: criarTexturaListras(), roughness: 0.55, metalness: 0.05 }),
      // emissivo acima de 1 e sem tone mapping: o giz "acende" e o Bloom pega só ele
      giz: new MeshStandardMaterial({
        map: giz,
        emissiveMap: giz,
        emissive: '#ffffff',
        emissiveIntensity: 0.25,
        roughness: 0.95,
        toneMapped: false,
      }),
      preto: new MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.4, metalness: 0.15 }),
      metal: new MeshStandardMaterial({ color: '#b9b9b9', roughness: 0.25, metalness: 1 }),
    }
  }, [])
  pecas.current.giz = m.giz
  // faces da caixa: +x, -x, +y, -y, +z (frente), -z (trás)
  const facesBastao = [m.preto, m.preto, m.preto, m.preto, m.listras, m.listras]

  return (
    <group ref={(g) => { pecas.current.corpo = g }}>
      <RoundedBox args={[LARGURA, ALTURA, 0.12]} radius={0.05} smoothness={4} material={m.preto} />
      <mesh position={[0, 0, 0.061]} material={m.giz}>
        <planeGeometry args={[LARGURA - 0.16, ALTURA - 0.16]} />
      </mesh>

      <mesh position={[0, Y_BASTAO_FIXO, 0]} material={facesBastao}>
        <boxGeometry args={[LARGURA, BASTAO, 0.14]} />
      </mesh>

      {/* bastão móvel: o grupo gira em torno da dobradiça, no canto esquerdo */}
      <group ref={(g) => { pecas.current.bastao = g }} position={[-LARGURA / 2, Y_DOBRADICA, 0]}>
        <mesh position={[LARGURA / 2, BASTAO / 2, 0]} material={facesBastao}>
          <boxGeometry args={[LARGURA, BASTAO, 0.14]} />
        </mesh>
      </group>

      {[0.09, -0.09].map((z) => (
        <mesh key={z} position={[-LARGURA / 2 + 0.05, Y_DOBRADICA, z]} rotation={[Math.PI / 2, 0, 0]} material={m.metal}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 24]} />
        </mesh>
      ))}
    </group>
  )
}
