import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction, type ChromaticAberrationEffect } from 'postprocessing'
import { useRef } from 'react'
import { Vector2, type Group, type PointLight } from 'three'
import { ClaqueteModelo, type PecasClaquete } from './ClaqueteModelo'
import { DURACAO_ABERTURA, INSTANTE_BATIDA, poseDaClaquete } from './linhaDoTempo'

const INICIO_REPETICAO = 0.9 // clicar na claquete repete o roteiro a partir da abertura do bastão

function Cena({ aoTerminar }: { aoTerminar: () => void }) {
  const pecas = useRef<PecasClaquete>({ corpo: null, bastao: null, giz: null })
  const poeira = useRef<Group>(null)
  const clarao = useRef<PointLight>(null)
  const aberracao = useRef<ChromaticAberrationEffect>(null)
  const terminou = useRef(false)
  const repetirDesde = useRef<number | null>(null)
  const largura = useThree((s) => s.size.width)
  const relogio = useThree((s) => s.clock)

  useFrame(({ clock, camera }) => {
    const agora = clock.elapsedTime
    const pose = poseDaClaquete(agora)

    // batida repetida pelo clique: só bastão, clarão e tremor; a câmera segue o roteiro
    const r = repetirDesde.current
    const batida = r === null ? pose : poseDaClaquete(Math.min(INICIO_REPETICAO + agora - r, INSTANTE_BATIDA + 0.6))

    const { corpo, bastao, giz } = pecas.current
    const chacoalho = batida.tremor * Math.sin(agora * 85)
    if (corpo) {
      corpo.position.set(chacoalho * 0.04, pose.alturaQueda, 0)
      corpo.rotation.set(chacoalho * 0.01, pose.rotacaoY, chacoalho * 0.015)
    }
    if (bastao) bastao.rotation.z = batida.anguloBastao
    if (giz) giz.emissiveIntensity = 0.25 + 1.6 * pose.giz + 1.2 * batida.flash
    if (clarao.current) clarao.current.intensity = 60 * batida.flash
    if (poeira.current) poeira.current.visible = agora >= INSTANTE_BATIDA
    aberracao.current?.offset.set(0.004 * batida.flash, 0.002 * batida.flash)

    camera.position.set(chacoalho * 0.08, 0.35 + chacoalho * 0.05, pose.cameraZ)
    // a câmera acompanha a queda pela metade: a claquete entra em quadro desde o primeiro instante
    camera.lookAt(0, 0.45 + pose.alturaQueda * 0.5, 0)

    if (!terminou.current && agora >= DURACAO_ABERTURA) {
      terminou.current = true
      aoTerminar()
    }
  })

  return (
    <>
      <color attach="background" args={['#030303']} />
      <fog attach="fog" args={['#030303', 8, 16]} />
      <ambientLight intensity={0.15} />
      <spotLight position={[2.5, 6, 6]} angle={0.45} penumbra={0.8} intensity={140} color="#ffd56a" />
      <directionalLight position={[-4, 3, -5]} intensity={1.6} />
      <pointLight ref={clarao} position={[0, 1.8, 2]} intensity={0} color="#fff4d0" distance={8} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#FFC700" position={[-5, 1, 1]} scale={[2, 6, 1]} />
      </Environment>

      <group onPointerDown={() => { repetirDesde.current = relogio.elapsedTime }}>
        <ClaqueteModelo pecas={pecas} />
      </group>

      <group ref={poeira} visible={false}>
        <Sparkles count={70} scale={[6, 3.5, 2]} position={[0, 0.6, 0.6]} size={3} speed={0.35} opacity={0.7} color="#FFC700" />
      </group>

      {largura >= 768 && (
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.7} />
          <ChromaticAberration ref={aberracao} offset={new Vector2(0, 0)} />
          <Noise opacity={0.08} blendFunction={BlendFunction.OVERLAY} />
          <Vignette offset={0.3} darkness={0.85} />
        </EffectComposer>
      )}
    </>
  )
}

export default function ClaqueteCena({ aoTerminar }: { aoTerminar: () => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 35, position: [0, 0.35, 9] }} className="!absolute inset-0">
      <Cena aoTerminar={aoTerminar} />
    </Canvas>
  )
}
