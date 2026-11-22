import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef, type RefObject } from 'react'
import type { PointLight } from 'three'
import { ClaqueteModelo, type PecasClaquete } from './ClaqueteModelo'
import { DURACAO_ABERTURA, INSTANTE_BATIDA, poseDaClaquete } from './linhaDoTempo'

const INICIO_REPETICAO = 0.9 // clicar na claquete repete o roteiro a partir da abertura do bastão

type Props = { aoTerminar: () => void; gatilho: RefObject<(() => void) | null> }

function Cena({ aoTerminar, gatilho }: Props) {
  const pecas = useRef<PecasClaquete>({ corpo: null, bastao: null, giz: null })
  const clarao = useRef<PointLight>(null)
  const terminou = useRef(false)
  const repetirDesde = useRef<number | null>(null)
  const largura = useThree((s) => s.size.width)
  const altura = useThree((s) => s.size.height)
  const relogio = useThree((s) => s.clock)
  // o botão da IntroScreen (mouse, toque ou teclado) repete a batida por aqui
  gatilho.current = () => {
    repetirDesde.current = relogio.elapsedTime
  }

  useFrame(({ clock, camera, gl }) => {
    const agora = clock.elapsedTime
    const pose = poseDaClaquete(agora)

    // batida repetida pelo clique: só bastão, clarão e tremor; a câmera segue o roteiro
    const r = repetirDesde.current
    const batida = r === null ? pose : poseDaClaquete(Math.min(INICIO_REPETICAO + agora - r, INSTANTE_BATIDA + 0.6))

    const { corpo, bastao, giz } = pecas.current
    const chacoalho = batida.tremor * Math.sin(agora * 70)
    if (corpo) {
      corpo.position.set(chacoalho * 0.015, pose.alturaQueda, 0)
      corpo.rotation.set(0, pose.rotacaoY, chacoalho * 0.006)
    }
    if (bastao) bastao.rotation.z = batida.anguloBastao
    if (giz) giz.emissiveIntensity = 0.08 + 0.12 * pose.giz + 0.15 * batida.flash
    if (clarao.current) clarao.current.intensity = 12 * batida.flash

    // tela estreita (celular em pé): recua a câmera para a lousa caber na largura
    const recuo = Math.max(1, 0.8 / (largura / altura))
    camera.position.set(0, 0.35 + chacoalho * 0.02, pose.cameraZ * recuo)
    camera.lookAt(0, 0.45 + pose.alturaQueda * 0.5, 0)
    gl.toneMappingExposure = 1 - pose.saida // escurece até o preto na saída

    if (!terminou.current && agora >= DURACAO_ABERTURA) {
      terminou.current = true
      aoTerminar()
    }
  })

  return (
    <>
      <color attach="background" args={['#030303']} />
      <ambientLight intensity={0.2} />
      <spotLight position={[2, 6, 6]} angle={0.5} penumbra={0.9} intensity={110} color="#fff1dc" />
      <directionalLight position={[-4, 3, -5]} intensity={0.8} />
      <pointLight ref={clarao} position={[0, 1.8, 2]} intensity={0} color="#ffffff" distance={6} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.5} position={[0, 5, 2]} scale={[8, 2, 1]} />
      </Environment>

      <ClaqueteModelo pecas={pecas} />

      {largura >= 768 && (
        <EffectComposer>
          <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
          <Vignette offset={0.35} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  )
}

export default function ClaqueteCena(props: Props) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 35, position: [0, 0.35, 9] }} className="!absolute inset-0" aria-hidden="true">
      <Cena {...props} />
    </Canvas>
  )
}
