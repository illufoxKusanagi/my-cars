import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { gtrR33MaterialDetails } from './constants/GtrR33Details';
import { animationHandler } from './AnimationHandler';

export const carState = {
  leftDoor: null as THREE.Object3D | null,
  currentModel: null as THREE.Group | null,
};

export function modelLoader(
  scene: THREE.Scene,
  modelPath: string = '/models/Skyline-GTR-R33.glb',
  onLoadComplete?: () => void
) {
  const loader = new GLTFLoader();
  const modelMaterial = gtrR33MaterialDetails;

  if (carState.currentModel) {
    // CRITICAL MEMORY LEAK FIX: In ThreeJS, removing an object from the scene
    // DOES NOT remove its geometry/textures from your graphics card memory!
    // We must manually dispose them before deleting the car.
    carState.currentModel.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        // Note: We are reusing the exact same materials from gtrR33MaterialDetails,
        // so we DO NOT dispose materials here, or the next car will be invisible!
      }
    });

    scene.remove(carState.currentModel);
    carState.currentModel = null;
  }

  loader.load(
    modelPath,
    function (gltf) {
      carState.currentModel = gltf.scene;
      gltf.scene.traverse((child: any) => {
        const name = child.name.toLowerCase();
        //
        if (child instanceof THREE.Mesh) {
          // Prevent glass from casting/receiving shadows (fixes self-shadowing artifacts)
          const isGlass =
            name.includes('glass') ||
            name.includes('window') ||
            name.includes('windshield');
          child.castShadow = !isGlass;
          child.receiveShadow = !isGlass;

          if (child.geometry.attributes.color) {
            child.geometry.deleteAttribute('color');
          }

          // const matName = (child.material?.name || '').toLowerCase();

          // 1. Tires
          if (name.includes('tire')) {
            child.material = modelMaterial.tireMaterial;
          }
          // 16. Hood texture
          else if (name.includes('hood') && name.includes('carpaint')) {
            // else if (name.includes('hood') && name.includes('carbonfiber')) {
            child.material = modelMaterial.hoodMaterial;
          }
          // 2. Windows / Windshield
          else if (
            name.includes('glassf') ||
            name.includes('glassr') ||
            name.includes('glassl') ||
            name.includes('glassint') ||
            name.includes('windshield')
          ) {
            child.material = modelMaterial.windowGlassMaterial;
          }
          // 3. Headlights / Light lenses
          else if (
            name.includes('glasslhl') ||
            name.includes('glassrhl') ||
            name.includes('lenslhl') ||
            name.includes('lensrhl')
          ) {
            child.material = modelMaterial.headlightGlassMaterial;
          }
          // 3. Headlight Housing
          else if (
            (name.includes('headlight') && name.includes('chrome')) ||
            (name.includes('headlight') && name.includes('satin')) ||
            (name.includes('headlight') &&
              name.includes('lights') &&
              name.includes('smooth'))
          ) {
            child.material = modelMaterial.headlightHousingMaterial;
          }
          // 4. Taillights
          else if (
            name.includes('taillight') &&
            name.includes('light') &&
            name.includes('smooth')
            // ||
            // (name.includes('taillight') && name.includes('ch'))
          ) {
            // else if (name.includes('glassltl') || name.includes('glassrtl') || name.includes('taillight') || name.includes('lensltl') || name.includes('lensrtl')) {
            child.material = modelMaterial.taillightMaterial;
          }
          // 4. Taillight glass
          else if (
            (name.includes('gls') && name.includes('tl')) ||
            (name.includes('glass') && name.includes('chmsl'))
          ) {
            // else if (name.includes('glassltl') || name.includes('glassrtl') || name.includes('taillight') || name.includes('lensltl') || name.includes('lensrtl')) {
            child.material = modelMaterial.taillightGlassMaterial;
          }
          // 4. Taillight Housing
          else if (name.includes('taillight') && name.includes('chrome')) {
            child.material = modelMaterial.tailightHousingMaterial;
          }
          // 5. Wheels / Rims
          else if (
            name.includes('wheel')
            // ||
            // name.includes('rim') ||
            // name.includes('outer_rim') ||
            // name.includes('inner_rim') ||
            // name.includes('hub')
          ) {
            child.material = modelMaterial.rimMaterial;
          }
          // 6. Calipers
          else if (name.includes('caliper')) {
            child.material = modelMaterial.caliperMaterial;
          }
          // 7. Brake Rotors
          else if (name.includes('rotor')) {
            child.material = modelMaterial.rotorMaterial;
          }
          // 8. Badges / Emblems / Exhaust / Chrome Trim
          else if (
            name.includes('emblem') ||
            name.includes('badge') ||
            // name.includes('chrome') ||
            name.includes('exhaust') ||
            name.includes('logo')
          ) {
            child.material = modelMaterial.chromeMaterial;
          }
          // 9. Black plastics, wipers, grilles, underbody
          else if (
            name.includes('grille') ||
            name.includes('wiper') ||
            name.includes('plastic') ||
            name.includes('undercarriage') ||
            name.includes('radiator') ||
            name.includes('rubber') ||
            (name.includes('bumper') && name.includes('frame'))
            // name.includes('carbon')
          ) {
            child.material = modelMaterial.darkPlasticMaterial;
          }
          // 10. Interior components
          else if (
            name.includes('seat') ||
            name.includes('steering') ||
            name.includes('dash') ||
            name.includes('pedal') ||
            name.includes('interior') ||
            name.includes('console') ||
            name.includes('cluster')
          ) {
            child.material = modelMaterial.interiorMaterial;
          }
          // 11. Car Paint (default for body parts)
          else if (
            // name.includes('body') ||
            // name.includes('bumper') ||
            // name.includes('wing') ||
            // name.includes('hood') ||
            // name.includes('skirt') ||
            // name.includes('fender') ||
            // name.includes('door') ||
            // name.includes('mirror') ||
            // name.includes('trunk') ||
            name.includes('carpaint')
            // ||
            // matName.includes('paint')
          ) {
            child.material = modelMaterial.paintMaterial;
          }
          // 12. GT-R Red emblem
          else if (
            name.includes('metalpainted') ||
            (name.includes('trunk') && name.includes('color'))
          ) {
            child.material = modelMaterial.gtrMaterial;
          }
          // 13. Turn signal
          else if (
            name.includes('marker') ||
            name.includes('foglight') ||
            name.includes('turn')
          ) {
            child.material = modelMaterial.turnSignal;
          }
          // 14. Front housing light
          else if (name.includes('headlight')) {
            child.material = modelMaterial.headlightChromeMaterial;
          }
          // 15. HID housing and glass
          else if (
            name.includes('lens') ||
            name.includes('lhl') ||
            name.includes('rhl')
          ) {
            child.material = modelMaterial.headlightHidMaterial;
          }
          // 14. Fallback
          // else {
          //   // if (matName.includes('paint') || matName.includes('body')) {
          //   child.material = modelMaterial.paintMaterial;
          //   // } else {
          //   //   child.material = darkPlasticMaterial;
          //   // }
          // }
        }
      });

      const loadedModel = gltf.scene;

      // Find the parent group we created in Blender!
      loadedModel.traverse((child) => {
        if (child.name === 'DoorLeft') {
          carState.leftDoor = child;
        }
      });

      const modelBox = new THREE.Box3().setFromObject(loadedModel);
      const modelCenter = modelBox.getCenter(new THREE.Vector3());
      const modelSize = modelBox.getSize(new THREE.Vector3());
      loadedModel.position.x = -modelCenter.x;
      loadedModel.position.y = -modelCenter.y + modelSize.y / 2;
      loadedModel.position.z = -modelCenter.z;

      const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
      const scaleFactor = 5.2 / maxDimension; // 5.2 is the target size
      loadedModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      scene.add(loadedModel);

      // Initialize animations!
      animationHandler.init(loadedModel, gltf.animations);

      onLoadComplete?.();
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  return {};
}
