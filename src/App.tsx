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
  const [isRevealing, setIsRevealing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { scene, camera } = setupScene(canvasRef.current);
    const gui = new GUI();

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const handleLoadComplete = () => {
      setIsLoading(false);
      setIsRevealing(true);
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

    // 1. Create an HDR Render Target with Anti-Aliasing
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        type: THREE.HalfFloatType,
        samples: 4, // CRITICAL: This enables MSAA (Multi-Sample Anti-Aliasing) inside the EffectComposer!
      }
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

    // Historic Nissan Factory Colors
    const factoryColors = {
      'KH2: Gun Grey Metallic': '#4a4d4f',
      '326: Crystal White': '#f8f9fa',
      '732: Black Pearl Metallic': '#1a1a1c',
      'KL0: Spark Silver Metallic': '#b0b3b5',
      'AH3: Red Pearl Metallic': '#8b1c24',
      'TH1: Dark Blue Pearl': '#18223c',
      'KG1: Jet Silver Metallic': '#9ea1a3',
      'BL0: Greyish Blue Pearl': '#3a4a58',
      'LP2: Midnight Purple': '#3a1f4a',
      'BN6: Deep Marine Blue': '#1b4e95',
      'BT2: Champion Blue / Le Mans': '#254b87',
      'QM1: White': '#fdfdfd',
      'KH3: Black': '#0a0a0c',
      'KR4: Sonic Silver': '#898c8f',
      'KN6: Dark Grey Pearl': '#3b3c3e',
      'AR2: Active Red': '#ba1f24',
      'TV2: Bayside Blue': '#14428b',
      'JW0: Millennium Jade': '#5c6356',
      'LV4: Midnight Purple II': '#3a2a4b',
      'LX0: Midnight Purple III': '#3d214f',
      'EY0: Silica Brass': '#7c7760',
      'EV1: Lightning Yellow': '#e8b717',
      'GV1: Black Pearl': '#111112',
      'KV2: Athlete Silver': '#a8a9ad',
    };

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
      paintColor: '#280137',
      model: '/models/Skyline-GTR-R33.glb',
      environment: 'city',
    };

    // 2. Add a new folder to the GUI
    const customizerFolder = gui.addFolder('Car Customizer');
    customizerFolder
      .add(carActions, 'paintColor', factoryColors)
      .name('Factory Paint')
      .onChange((val: string) => {
        gtrR33MaterialDetails.paintMaterial.color.set(val);
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
        setShowOverlay(true);
        setIsLoading(true);
        setIsRevealing(false);
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
      {/* Black background layer - visible through non-masked areas during reveal */}
      {showOverlay && (
        <div
          style={{
            position: 'fixed',
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
          {isLoading && (
            <>
              <img
                src="/toyota-yaris-bouncing-car.gif"
                alt="Loading..."
                style={{ width: '200px', marginBottom: '20px' }}
              />
              <h2 style={{ letterSpacing: '2px', fontWeight: 'bold' }}>
                LOADING MODEL...
              </h2>
            </>
          )}
        </div>
      )}
      {/* Canvas: during reveal, gets the GIF mask that grows to unveil the 3D scene */}
      <div
        className={`canvas-container${isRevealing ? ' canvas-revealing' : ''}`}
        onAnimationEnd={() => {
          setIsRevealing(false);
          setShowOverlay(false);
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
