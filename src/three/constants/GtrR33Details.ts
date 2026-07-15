import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/textures/carbon-fiber-square.png');
texture.colorSpace = THREE.SRGBColorSpace;

export const gtrR33MaterialDetails = {
  // Predefined Realistic Materials
  paintMaterial: new THREE.MeshPhysicalMaterial({
    // color: 0x280137, // Midnight Purple (Skyline aesthetic)
    color: 0x1b4e95, // Midnight Purple (Skyline aesthetic)
    // color: 0xffffff,
    roughness: 0.12,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  }),

  windowGlassMaterial: new THREE.MeshPhysicalMaterial({
    color: 0x1d1d1f,
    transparent: true,
    opacity: 0.9,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.95,
    ior: 1.52,
    thickness: 0.0, // Set to 0 to prevent volume overlap / Z-fighting artifacts on 2-sided models
    depthWrite: false,
    side: THREE.FrontSide, // Crucial: Only render the front faces to stop Z-fighting on Forza double-sided glass
  }),

  hoodMaterial: new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.12,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  }),

  headlightGlassMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    // emissive: 0xffffff,
    // emissiveIntensity: 3.5, // Emissive high enough to trigger the 0.85 bloom threshold
    // transparent: true,
    opacity: 0.1,
    roughness: 0.02,
    metalness: 0.1,
    depthWrite: false,
  }),

  headlightHousingMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveIntensity: 2.0,
    // transmission (0.0 to 1.0): Instead of making the object invisible, this tells the engine to let light actually travel through the solid object. 1.0 means it's fully transmissive glass.
    // ior (Index of Refraction): This controls how much the light bends as it goes through the material. Air is 1.0. Water is 1.33. Real glass is exactly 1.5. Diamond is 2.4. This gives you that realistic, distorted look when you look through curved glass!
    // thickness: Tells the engine how thick the glass volume is (in meters). Thicker glass causes light to bend more and creates more internal reflections (like a thick headlight cover or a crystal ball).
    // transmission: 0.85,
    // ior: 1.5,
    thickness: 0.2,
    depthWrite: false,
  }),

  tailightHousingMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xdb0000,
    roughness: 0.2,
    metalness: 0.1,
  }),

  taillightGlassMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xdb0000,
    transparent: true,
    opacity: 0.01,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xc70000,
    emissiveIntensity: 25.0, // Cranked up past 10.0 so it triggers the new Bloom Threshold
    thickness: 0.2,
    depthWrite: false,
  }),

  taillightMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xc70000,
    // emissive: 0xff0000,
    // emissiveIntensity: 3.0, // Glowing red taillights
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xc70000,
    emissiveIntensity: 25.0, // Cranked up past 10.0 so it triggers the new Bloom Threshold
    // transmission (0.0 to 1.0): Instead of making the object invisible, this tells the engine to let light actually travel through the solid object. 1.0 means it's fully transmissive glass.
    // ior (Index of Refraction): This controls how much the light bends as it goes through the material. Air is 1.0. Water is 1.33. Real glass is exactly 1.5. Diamond is 2.4. This gives you that realistic, distorted look when you look through curved glass!
    // thickness: Tells the engine how thick the glass volume is (in meters). Thicker glass causes light to bend more and creates more internal reflections (like a thick headlight cover or a crystal ball).
    // transmission: 0.85,
    // ior: 1.5,
    thickness: 0.2,
    depthWrite: false,
  }),

  tireMaterial: new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.9,
    metalness: 0.001,
  }),

  rimMaterial: new THREE.MeshStandardMaterial({
    color: 0xe3ecff,
    roughness: 0.2,
    metalness: 0.85,
  }),

  caliperMaterial: new THREE.MeshStandardMaterial({
    color: 0x900c0f, // Sporty dark red
    roughness: 0.3,
    metalness: 0.6,
  }),

  rotorMaterial: new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.45,
    metalness: 0.8,
  }),

  darkPlasticMaterial: new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.65,
    metalness: 0.15,
  }),

  chromeMaterial: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.99,
  }),

  headlightHidMaterial: new THREE.MeshStandardMaterial({
    color: 0x000000,
    // color: 0xe3f5ff,
    roughness: 0.5,
    metalness: 0.4,
    emissive: 0xffffff,
    emissiveIntensity: 25.0, // High intensity to trigger Bloom Threshold
  }),

  headlightChromeMaterial: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
  }),

  gtrMaterial: new THREE.MeshStandardMaterial({
    color: 0xd40404,
    roughness: 0.3,
    metalness: 0.6,
  }),

  interiorMaterial: new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.7,
    metalness: 0.1,
  }),

  turnSignal: new THREE.MeshStandardMaterial({
    color: 0xf26900,
    transparent: true,
    opacity: 0.1,
    roughness: 0.02,
    metalness: 0.1,
    depthWrite: false,
  }),
};
