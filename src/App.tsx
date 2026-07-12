import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setupLighting } from './three/LightningSetup';
import { setupScene } from './three/SceneSetup';
import { modelLoader, carState } from './three/ModelLoader';
import GUI from 'lil-gui';
import { animationHandler } from './three/AnimationHandler';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { scene, camera } = setupScene(canvasRef.current);
    const gui = new GUI();

    const { lightHelper } = setupLighting(scene, gui);

    modelLoader(scene);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 1. Create an HDR Render Target (Allows colors to be brighter than 1.0)
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { type: THREE.HalfFloatType }
    );

    // 2. Pass it into your composer
    const composer = new EffectComposer(renderer, renderTarget);
    // const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2, // Strength: How bright the glow is (tweak this!)
      0.5, // Radius: How far the glow spreads
      2.0 // Threshold: Only things brighter than 0.8 will glow (prevents the whole screen from blurring)
    );
    composer.addPass(bloomPass);
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      lightHelper.update();
      animationHandler.update(clock.getDelta());
      composer.render();
      // renderer.render(scene, camera);
    });

    const bloomFolder = gui.addFolder('Bloom Settings');
    bloomFolder.add(bloomPass, 'strength', 0, 3, 0.1).name('Strength');
    bloomFolder.add(bloomPass, 'radius', 0, 1, 0.01).name('Radius');
    bloomFolder.add(bloomPass, 'threshold', 0, 1, 0.01).name('Threshold');
    // 1. Create an object holding the functions you want to trigger
    const carActions = {
      openDoor: () => {
        if (carState.leftDoor) {
          carState.leftDoor.rotation.y = Math.PI / 4; // Rotates the door 45 degrees!
        }
      },
      closeDoor: () => {
        if (carState.leftDoor) {
          carState.leftDoor.rotation.y = 0; // Rotates the door back to closed!
        }
      },
    };
    // 2. Add a new folder to the GUI
    const animFolder = gui.addFolder('Car Controls');
    // 3. Add the function to the GUI
    animFolder.add(carActions, 'openDoor').name('Open Door');
    animFolder.add(carActions, 'closeDoor').name('Close Door');
    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      // composer.render();
      gui.destroy();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
