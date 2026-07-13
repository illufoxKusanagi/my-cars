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
import Stats from 'three/addons/libs/stats.module.js';
import { gtrR33MaterialDetails } from './three/constants/GtrR33Details';
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { scene, camera } = setupScene(canvasRef.current);
    const gui = new GUI();

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const { lightHelper } = setupLighting(scene, gui);

    modelLoader(scene);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance' // Tells browser to prioritize dedicated GPU
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Crucial for high-DPI displays (MacBooks, 4K monitors): Cap pixel ratio at 2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 1. Create an HDR Render Target
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { type: THREE.HalfFloatType }
    );

    // 2. Pass it into your composer
    const composer = new EffectComposer(renderer, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      // CRITICAL PERFORMANCE FIX: Run bloom at 1/4 resolution. Bloom is blurry by nature, 
      // so calculating it at full 4K screen resolution tanks FPS for absolutely zero visual benefit.
      new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
      1.2, // Strength
      0.5, // Radius
      2.0 // Threshold: Only things brighter than 0.8 will glow (prevents the whole screen from blurring)
    );
    composer.addPass(bloomPass);
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      stats.begin();
      lightHelper.update();
      animationHandler.update(clock.getDelta());
      composer.render();
      stats.end();
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
      paintColor: gtrR33MaterialDetails.paintMaterial.color.getHex(),
      model: '/models/Skyline-GTR-R33.glb',
    };

    // 2. Add a new folder to the GUI
    const customizerFolder = gui.addFolder('Car Customizer');
    customizerFolder.addColor(carActions, 'paintColor').name('Paint Color').onChange((val: number) => {
      gtrR33MaterialDetails.paintMaterial.color.setHex(val);
    });
    customizerFolder.add(carActions, 'model', {
      'Skyline R32': '/models/Skyline-GTR-R32.glb',
      'Skyline R33': '/models/Skyline-GTR-R33.glb',
      'Skyline R33 LM': '/models/Skyline-GTR-R33-LM.glb',
      'Skyline R34': '/models/Skyline-GTR-R34.glb',
      'Skyline R35': '/models/Skyline-GTR-R35.glb'
    }).name('Car Model').onChange((val: string) => {
      modelLoader(scene, val);
    });

    const animFolder = gui.addFolder('Car Controls');
    // 3. Add the function to the GUI
    animFolder.add(carActions, 'openDoor').name('Open Door');
    animFolder.add(carActions, 'closeDoor').name('Close Door');
    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      // composer.render();
      gui.destroy();
      document.body.removeChild(stats.dom);
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
