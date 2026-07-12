import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './AppAdvanced.css';

export default function AppAdvanced() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Scene - The 3D container where everything exists
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#12161a');

    // 2. Camera - Determines what is seen (FOV, aspect, near, far)
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(5.5, 3.2, 5.5);

    // 3. Renderer - Draws the 3D graphics on the screen using WebGL
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // 4. OrbitControls - Allows the mouse/touch interaction to rotate, pan, and zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.8, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from going under grid

    // --- POST-PROCESSING (BLOOM) ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // intensity (how bright the glow is)
      0.4, // radius (how far it spreads)
      0.85 // threshold (what gets bloom - 0.85 means only very bright/emissive things)
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Rim/Top Light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
    topLight.position.set(0, 10, -3);
    scene.add(topLight);

    // 6. Helpers - Visual grid on the ground
    const gridHelper = new THREE.GridHelper(20, 20, 0x4f4f4f, 0x222530);
    scene.add(gridHelper);

    // 7. GLTFLoader - Loads the 3D model file (.glb / .gltf)
    const loader = new GLTFLoader();
    let loadedModel: THREE.Group | null = null;

    // Predefined Realistic Materials
    const paintMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a3c75, // Deep Metallic Blue (Skyline aesthetic)
      roughness: 0.12,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
    });

    const windowGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0c100e,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.95,
      ior: 1.52,
      thickness: 0.5,
      depthWrite: false,
    });

    const headlightGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 3.5, // Emissive high enough to trigger the 0.85 bloom threshold
      transparent: true,
      opacity: 0.25,
      roughness: 0.02,
      metalness: 0.1,
      transmission: 0.98,
      ior: 1.5,
      thickness: 0.2,
      depthWrite: false,
    });

    const taillightGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc70000,
      emissive: 0xff0000,
      emissiveIntensity: 3.0, // Glowing red taillights
      transparent: true,
      opacity: 0.8,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      thickness: 0.2,
      depthWrite: false,
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.85,
      metalness: 0.05,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.85,
    });

    const caliperMaterial = new THREE.MeshStandardMaterial({
      color: 0x900c0f, // Sporty dark red
      roughness: 0.3,
      metalness: 0.6,
    });

    const rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.45,
      metalness: 0.8,
    });

    const darkPlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      roughness: 0.65,
      metalness: 0.15,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 1.0,
    });

    const interiorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.1,
    });

    loader.load(
      '/models/New-R33.glb',
      (gltf: any) => {
        loadedModel = gltf.scene;
        if (!loadedModel) return;

        // Traverse model to apply materials and shadows
        loadedModel.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Strip raw vertex color channels that override diffuse mapping
            if (child.geometry.attributes.color) {
              child.geometry.deleteAttribute('color');
            }

            const name = child.name.toLowerCase();
            const matName = (child.material?.name || '').toLowerCase();

            // 1. Tires
            if (name.includes('tire')) {
              child.material = tireMaterial;
            }
            // 2. Windows / Windshield
            else if (
              name.includes('glassf') ||
              name.includes('glassr') ||
              name.includes('glassl') ||
              name.includes('glassint') ||
              name.includes('windshield')
            ) {
              child.material = windowGlassMaterial;
            }
            // 3. Headlights / Light lenses
            else if (
              name.includes('glasslhl') ||
              name.includes('glassrhl') ||
              name.includes('lenslhl') ||
              name.includes('lensrhl')
            ) {
              child.material = headlightGlassMaterial;
            }
            // 4. Taillights
            else if (
              name.includes('taillight') &&
              name.includes('chrome') &&
              name.includes('ridges')
            ) {
              // else if (name.includes('glassltl') || name.includes('glassrtl') || name.includes('taillight') || name.includes('lensltl') || name.includes('lensrtl')) {
              child.material = taillightGlassMaterial;
            }
            // 5. Wheels / Rims
            else if (
              name.includes('wheel') ||
              name.includes('rim') ||
              name.includes('outer_rim') ||
              name.includes('inner_rim') ||
              name.includes('hub')
            ) {
              child.material = rimMaterial;
            }
            // 6. Calipers
            else if (name.includes('caliper')) {
              child.material = caliperMaterial;
            }
            // 7. Brake Rotors
            else if (name.includes('rotor')) {
              child.material = rotorMaterial;
            }
            // 8. Badges / Emblems / Exhaust / Chrome Trim
            else if (
              name.includes('emblem') ||
              name.includes('badge') ||
              name.includes('chrome') ||
              name.includes('exhaust') ||
              name.includes('logo')
            ) {
              child.material = chromeMaterial;
            }
            // 9. Black plastics, wipers, grilles, underbody
            else if (
              name.includes('grille') ||
              name.includes('wiper') ||
              name.includes('plastic') ||
              name.includes('undercarriage') ||
              name.includes('radiator') ||
              name.includes('rubber') ||
              name.includes('carbon')
            ) {
              child.material = darkPlasticMaterial;
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
              child.material = interiorMaterial;
            }
            // 11. Car Paint (default for body parts)
            else if (
              // name.includes('body') ||
              // name.includes('bumper') ||
              // name.includes('wing') ||
              // name.includes('hood') ||
              // name.includes('skirt') ||
              // name.includes('fender') ||
              name.includes('door') ||
              // name.includes('mirror') ||
              // name.includes('trunk') ||
              name.includes('carpaint') ||
              matName.includes('paint')
            ) {
              child.material = paintMaterial;
            }
            // 12. Fallback
            else {
              if (matName.includes('paint') || matName.includes('body')) {
                child.material = paintMaterial;
              } else {
                child.material = darkPlasticMaterial;
              }
            }
          }
        });

        // Center the model's geometry and rest it on the grid (Y = 0)
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        loadedModel.position.x = -center.x;
        loadedModel.position.y = -center.y + size.y / 2;
        loadedModel.position.z = -center.z;

        // Scale the model uniformly to fit the scene size
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5.2;
        const scaleFactor = targetSize / maxDim;
        loadedModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        scene.add(loadedModel);
      },
      undefined,
      (error: any) => {
        console.error('Error loading 3D model:', error);
      }
    );

    // 8. Animation loop - Re-renders the scene at screen refresh rate
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      composer.render(); // Replaced renderer.render(scene, camera) with composer
    };
    animate();

    // 9. Handle browser window resizing
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight); // Update composer size
    };
    window.addEventListener('resize', handleResize);

    // 10. Clean up - Free up GPU memory when component is unmounted
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();

      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      composer.dispose(); // Important: Dispose composer to prevent memory leaks!
      renderer.dispose();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
