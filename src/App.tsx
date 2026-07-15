import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { setupLighting } from './three/LightningSetup';
import { setupScene } from './three/SceneSetup';
import { modelLoader, carState } from './three/ModelLoader';
import GUI from 'lil-gui';
import { animationHandler } from './three/AnimationHandler';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import Stats from 'three/addons/libs/stats.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { gtrR33MaterialDetails } from './three/constants/GtrR33Details';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { scene, camera } = setupScene(canvasRef.current);
    const gui = new GUI();

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const handleLoadComplete = () => {
      setIsLoading(false);
    };

    modelLoader(scene, '/models/Skyline-GTR-R33.glb', handleLoadComplete);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance', // Tells browser to prioritize dedicated GPU
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Crucial for high-DPI displays (MacBooks, 4K monitors): Cap pixel ratio at 2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Set tone mapping for realistic HDR color conversion
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // 🌟 SETUP DREI-STYLE HDR ENVIRONMENT LIGHTING 🌟
    // Note: PMREMGenerator is deprecated in modern Three.js.
    // We can now just set the mapping directly and assign it to the environment!

    // Mapping of Drei presets to their actual HDR filenames on the pmndrs repo
    const environmentPresets: Record<string, string> = {
      city: 'potsdamer_platz_1k.hdr',
      sunset: 'venice_sunset_1k.hdr',
      dawn: 'kiara_1_dawn_1k.hdr',
      night: 'dikhololo_night_1k.hdr',
      forest: 'forest_slope_1k.hdr',
      park: 'rooitou_park_1k.hdr',
    };

    const rgbeLoader = new HDRLoader();
    const loadEnvironment = (presetName: string) => {
      const fileName = environmentPresets[presetName];
      const url = `https://raw.githubusercontent.com/pmndrs/drei-assets/master/hdri/${fileName}`;
      rgbeLoader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture; // Applies the lighting and reflections to the car
        scene.background = new THREE.Color('#222222'); // Keeps the background a solid color!
        // texture.dispose(); // Don't dispose it immediately since WebGLRenderer needs it now
      });
    };

    // Load default
    loadEnvironment('sunset');

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

    // const { lightHelper } =
    setupLighting(scene, gui, composer);

    // const bloomPass = new UnrealBloomPass(
    //   // CRITICAL PERFORMANCE FIX: Run bloom at 1/4 resolution. Bloom is blurry by nature,
    //   // so calculating it at full 4K screen resolution tanks FPS for absolutely zero visual benefit.
    //   new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
    //   0.1, // Strength
    //   1.0, // Radius
    //   1.0 // Threshold: HIGH THRESHOLD (10.0). Only extreme emissive lights will glow, preventing HDR paint reflections from blooming!
    // );
    // composer.addPass(bloomPass);

    // // CRITICAL: The OutputPass applies Tone Mapping (ACESFilmic) and sRGB color space conversion.
    // // Without this pass, modern Three.js EffectComposers will output raw, blown-out linear colors!
    // const outputPass = new OutputPass();
    // composer.addPass(outputPass);

    const clock = new THREE.Timer();
    renderer.setAnimationLoop(() => {
      stats.begin();
      // lightHelper.update();
      animationHandler.update(clock.getDelta());
      composer.render();
      stats.end();
    });

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
      environment: 'city',
    };

    // 2. Add a new folder to the GUI
    const customizerFolder = gui.addFolder('Car Customizer');
    customizerFolder
      .addColor(carActions, 'paintColor')
      .name('Paint Color')
      .onChange((val: number) => {
        gtrR33MaterialDetails.paintMaterial.color.setHex(val);
      });
    customizerFolder
      .add(carActions, 'model', {
        'Skyline R32': '/models/Skyline-GTR-R32.glb',
        'Skyline R33': '/models/Skyline-GTR-R33.glb',
        'Skyline R33 LM': '/models/Skyline-GTR-R33-LM.glb',
        'Skyline R34': '/models/Skyline-GTR-R34.glb',
        'GT-R R35': '/models/Skyline-GTR-R35.glb',
      })
      .name('Car Model')
      .onChange((val: string) => {
        setIsLoading(true);
        modelLoader(scene, val, handleLoadComplete);
      });
    customizerFolder
      .add(carActions, 'environment', Object.keys(environmentPresets))
      .name('Environment')
      .onChange((val: string) => {
        loadEnvironment(val);
      });

    // const animFolder = gui.addFolder('Car Controls');
    // // 3. Add the function to the GUI
    // animFolder.add(carActions, 'openDoor').name('Open Door');
    // animFolder.add(carActions, 'closeDoor').name('Close Door');
    return () => {
      // renderer.setAnimationLoop(null);
      renderer.dispose();
      // composer.render();
      gui.destroy();
      document.body.removeChild(stats.dom);
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <img
            src="/drifting-car.gif"
            alt="Loading..."
            // style={{ width: '150px', marginBottom: '20px' }}
          />
          <h2 style={{ letterSpacing: '2px', fontWeight: 'bold' }}>
            LOADING MODEL...
          </h2>
        </div>
      )}
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
