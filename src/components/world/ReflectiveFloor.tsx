import { useMemo } from 'react'
import * as THREE from 'three'

export function ReflectiveFloor() {
  const grassMaterial = useMemo(() => {
    const material = new THREE.MeshLambertMaterial({
      color: '#4CAF50',
    })

    // Add custom shader chunks for grass variation
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPosition;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `
        vec2 pos = vWorldPosition.xz * 0.5;
        float n1 = fbm(pos * 2.0);
        float n2 = fbm(pos * 8.0 + 100.0);
        float n3 = noise(pos * 20.0);

        vec3 color1 = vec3(0.298, 0.686, 0.314); // #4CAF50
        vec3 color2 = vec3(0.180, 0.490, 0.196); // #2E7D32
        vec3 color3 = vec3(0.400, 0.733, 0.416); // #66BB6A

        vec3 grassColor = mix(color1, color2, n1);
        grassColor = mix(grassColor, color3, n2 * 0.3);
        float blades = smoothstep(0.4, 0.6, n3);
        grassColor = mix(grassColor, color2 * 0.8, blades * 0.2);

        vec4 diffuseColor = vec4(grassColor, opacity);
        `
      )
    }

    return material
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <primitive object={grassMaterial} attach="material" />
    </mesh>
  )
}
