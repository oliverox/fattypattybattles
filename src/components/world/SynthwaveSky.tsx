import { useMemo } from 'react'
import { BackSide, Color, ShaderMaterial } from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const SynthwaveSkyMaterial = shaderMaterial(
  {
    topColor: new Color('#1a0a2e'),
    middleColor: new Color('#ff1493'),
    bottomColor: new Color('#ff4500'),
    sunColor: new Color('#ffd700'),
    sunPosition: 0.15,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 topColor;
    uniform vec3 middleColor;
    uniform vec3 bottomColor;
    uniform vec3 sunColor;
    uniform float sunPosition;
    varying vec2 vUv;

    void main() {
      float y = vUv.y;
      vec3 color;

      if (y < 0.3) {
        color = mix(bottomColor, middleColor, y / 0.3);
      } else if (y < 0.6) {
        color = mix(middleColor, topColor, (y - 0.3) / 0.3);
      } else {
        color = topColor;
      }

      // Add sun glow
      float sunDist = distance(vUv, vec2(0.5, sunPosition));
      float sunGlow = smoothstep(0.15, 0.0, sunDist);
      color = mix(color, sunColor, sunGlow * 0.8);

      // Add horizontal bands (scanlines effect)
      float bands = sin(y * 100.0) * 0.02;
      color += bands;

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ SynthwaveSkyMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    synthwaveSkyMaterial: any
  }
}

export function SynthwaveSky() {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 32, 32]} />
      <synthwaveSkyMaterial side={BackSide} />
    </mesh>
  )
}
