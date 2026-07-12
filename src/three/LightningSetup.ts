import * as THREE from 'three';
import GUI from 'lil-gui';
export function setupLighting(scene: THREE.Scene, gui: GUI) {
  // 1. Create Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  // 2. Create Helper
  const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
  scene.add(lightHelper);

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
  // 4. Return the helper so App.tsx can update it in the animation loop
  return { lightHelper };
}
