"use client";

import * as THREE from "three";
import React, { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { GLTFLoader } from "three-stdlib";

const baseUrl = "/3d/";

function WireframeModel({ name }: { name: string }) {
  console.log("<WireframeModel />");
  const obj = useLoader(GLTFLoader, baseUrl + name + ".glb");
  const ref = useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.z += 0.01;
    }
  });

  obj.scene.traverse((child: any) => {
    if (child.isMesh) {
      if (child.name === "nosecone") {
        console.log(child.material);
      }
      //  || child.name === "nosecone"
      if (child.name === "airframe") {
        // child.material.wireframe = true;
        // child.visible = false;

        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,

          metalness: 0.5,
          roughness: 0.2,
        });
      }
    }
  });
  return (
    <primitive
      ref={ref}
      object={obj.scene}
      scale={0.004}
      rotation={[Math.PI / 2, Math.PI, 0]}
    />
  );
}

export default function V1VehicleRender({
  debug = false,
  controllable = false,
}: {
  debug?: boolean;
  controllable?: boolean;
}) {
  console.log("<V1VehicleRender />");
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        background: debug ? "tomato" : undefined,
        width: "100%",
        height: "100%",
      }}
    >
      {/* <spotLight
        position={[0, 10, 0]}
        target-position={[-1, -1, -1]}
        angle={0.25} // controls beam width
        penumbra={0.4} // softens edges
        intensity={10} // increase for visibility
        decay={2} // how fast it fades
        distance={15} // max reach
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      /> */}

      <ambientLight intensity={0.8} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
      >
        <planeGeometry args={[100, 100]} />

        {debug ? (
          <meshStandardMaterial color="green" />
        ) : (
          //   <shadowMaterial transparent opacity={0.2} />
          <meshStandardMaterial color="black" />
        )}
      </mesh>
      {debug && <axesHelper args={[5]} />}
      <WireframeModel name="v1" />
      {controllable && <OrbitControls />}
    </Canvas>
  );
}
