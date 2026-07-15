import * as THREE from 'three';
import GUI from 'lil-gui';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

export function setupLighting(
  scene: THREE.Scene,
  gui: GUI,
  composer: EffectComposer
) {
  // 1. Create Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  // 2. Create Helper
  // const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
  // scene.add(lightHelper);

  // 3. Setup GUI

  const ambientFolder = gui.addFolder('Ambient Light');
  ambientFolder.add(ambientLight, 'intensity', 0, 10, 0.1).name('Intensity');

  // 2. Directional Light Controls
  const dirFolder = gui.addFolder('Directional Light');
  dirFolder.add(directionalLight, 'intensity', 0, 10, 0.1).name('Intensity');
  dirFolder.add(directionalLight.position, 'x', -20, 20, 0.1).name('Pos X');
  dirFolder.add(directionalLight.position, 'y', -20, 20, 0.1).name('Pos Y');
  dirFolder.add(directionalLight.position, 'z', -20, 20, 0.1).name('Pos Z');

  // 3. Directional Light Target
  const targetFolder = gui.addFolder('Light Target');
  targetFolder
    .add(directionalLight.target.position, 'x', -20, 20, 0.1)
    .name('Target X');
  targetFolder
    .add(directionalLight.target.position, 'y', -20, 20, 0.1)
    .name('Target Y');
  targetFolder
    .add(directionalLight.target.position, 'z', -20, 20, 0.1)
    .name('Target Z');

  const bloomPass = new UnrealBloomPass(
    // CRITICAL PERFORMANCE FIX: Run bloom at 1/4 resolution. Bloom is blurry by nature,
    // so calculating it at full 4K screen resolution tanks FPS for absolutely zero visual benefit.
    new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
    0.1, // Strength
    1.0, // Radius
    1.0 // Threshold: HIGH THRESHOLD (10.0). Only extreme emissive lights will glow, preventing HDR paint reflections from blooming!
  );
  composer.addPass(bloomPass);

  // CRITICAL: The OutputPass applies Tone Mapping (ACESFilmic) and sRGB color space conversion.
  // Without this pass, modern Three.js EffectComposers will output raw, blown-out linear colors!
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // return { lightHelper };
}
