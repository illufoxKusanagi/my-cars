import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './AppShowroom.css';

interface MaterialData {
  uuid: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  meshesCount: number;
}

interface LogEntry {
  text: string;
  type: 'system' | 'loader' | 'success' | 'action';
  timestamp: string;
}

export default function AppShowroom() {
  // UI & Loading States
  const [selectedModel, setSelectedModel] = useState<
    'skyline_r33' | 'skyline_gtr_nismo'
  >('skyline_r33');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing Engine...');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'inspect' | 'console'>(
    'learn'
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Model Stats
  const [modelStats, setModelStats] = useState({
    meshes: 0,
    materials: 0,
    vertices: 0,
    triangles: 0,
  });

  // Console Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Scene customization controls
  const [rotationSpeed, setRotationSpeed] = useState(0.003);
  const [isRotating, setIsRotating] = useState(true);
  const [showHelpers, setShowHelpers] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);

  // Material inspection states
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [selectedMaterialUuid, setSelectedMaterialUuid] = useState<string>('');

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Three.js object references held in refs to bridge React state -> Three.js loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelWrapperRef = useRef<THREE.Group | null>(null);
  const loadedMaterialsMapRef = useRef<{
    [uuid: string]: THREE.MeshStandardMaterial;
  }>({});

  // Light Refs
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);

  // Helper Refs
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);

  // Settings refs for render loop (prevents closure stale-state bug)
  const settingsRef = useRef({
    isRotating: true,
    rotationSpeed: 0.003,
  });

  useEffect(() => {
    settingsRef.current.isRotating = isRotating;
    settingsRef.current.rotationSpeed = rotationSpeed;
  }, [isRotating, rotationSpeed]);

  // Append a message to our UI log panel
  const addLog = (text: string, type: LogEntry['type'] = 'system') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), { text, type, timestamp }]);
  };

  // Copy code snippet to clipboard helper
  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    addLog(`Copied Step ${index} code snippet to clipboard`, 'action');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // --- THREE.JS INITIALIZATION (Runs once) ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    addLog('Initializing Three.js WebGL Engine...', 'system');

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a0f);
    // Add atmospheric fog
    scene.fog = new THREE.FogExp2(0x090a0f, 0.015);
    sceneRef.current = scene;

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(5.5, 3.2, 5.5);
    cameraRef.current = camera;

    // 3. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    addLog(
      'WebGLRenderer created successfully with shadow mapping enabled',
      'success'
    );

    // 4. Create OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent camera from going below floor
    controls.minDistance = 2.5;
    controls.maxDistance = 15;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    // 5. Add Lights
    // Ambient Light (fills shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Directional Light (creates shadows & sun simulation)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(6, 12, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    const d = 6;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005; // reduce shadow acne
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Spot Light (adds a nice overhead highlight on the car body)
    const spotLight = new THREE.SpotLight(
      0xffffff,
      1.5,
      15,
      Math.PI / 4,
      0.5,
      1
    );
    spotLight.position.set(-4, 6, -4);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);
    spotLightRef.current = spotLight;
    addLog(
      'Showroom lighting configured (Ambient, Directional, and SpotLight)',
      'system'
    );

    // 6. Add Floor Helpers & Shadow Plane
    // Floor Grid
    const gridHelper = new THREE.GridHelper(24, 24, 0xaa3bff, 0x222530);
    gridHelper.position.y = 0.001; // slightly above 0 to avoid shadow overlap
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Axes Helper (X: Red, Y: Green, Z: Blue)
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(-6, 0.05, -6);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Ground Shadow Receiver Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(30, 30);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate model wrapper if auto-rotate is toggled on
      if (modelWrapperRef.current && settingsRef.current.isRotating) {
        modelWrapperRef.current.rotation.y += settingsRef.current.rotationSpeed;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    addLog('Animation render loop started', 'success');

    // Clean up
    return () => {
      addLog('Disposing Three.js resources...', 'system');
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      controls.dispose();

      // Traverse scene and dispose of elements
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

      renderer.dispose();
    };
  }, []);

  // --- MODEL LOADER TRIGGER (Runs when selectedModel changes) ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setErrorMessage(null);

    const modelPath =
      selectedModel === 'skyline_r33'
        ? '/models/New-R33.glb'
        : '/models/1995_nissan_skyline_gtr_r33_nismo_s-tune_bcnr33/scene.gltf';

    setLoadingStage(`Fetching model file...`);
    addLog(`Loading model from: ${modelPath}`, 'loader');

    // 1. Remove previous model if exists
    if (modelWrapperRef.current) {
      scene.remove(modelWrapperRef.current);
      addLog('Cleaned up previous 3D model resources', 'system');
    }

    // Create a new wrapper group for the model
    const modelWrapper = new THREE.Group();
    modelWrapperRef.current = modelWrapper;
    scene.add(modelWrapper);

    // 2. Load Model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf: any) => {
        setLoadingStage('Processing mesh geometry...');
        addLog('Model file downloaded. Parsing scene graph...', 'loader');

        const loadedModel = gltf.scene;

        // Statistics counters
        let meshCount = 0;
        let vertexCount = 0;
        let triangleCount = 0;
        const materialsMap: { [uuid: string]: THREE.MeshStandardMaterial } = {};

        // Configure shadows & materials on model traverse
        loadedModel.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            meshCount++;
            child.castShadow = true;
            child.receiveShadow = true;

            // Extract geometry info
            if (child.geometry) {
              const pos = child.geometry.attributes.position;
              if (pos) vertexCount += pos.count;

              const idx = child.geometry.index;
              if (idx) {
                triangleCount += idx.count / 3;
              } else if (pos) {
                triangleCount += pos.count / 3;
              }
            }

            // Extract material info
            if (child.material) {
              const registerMat = (mat: any) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                  // Ensure standard material compatibility
                  materialsMap[mat.uuid] = mat;
                }
              };

              if (Array.isArray(child.material)) {
                child.material.forEach(registerMat);
              } else {
                registerMat(child.material);
              }
            }
          }
        });

        // Compute Bounding Box to center the model and scale it uniformly
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Shift model internals so center of bounding box is (0, 0, 0)
        // and its bottom-most point rests exactly on Y = 0 floor.
        loadedModel.position.x = -center.x;
        loadedModel.position.y = -center.y + size.y / 2;
        loadedModel.position.z = -center.z;

        // Scale wrapper so model fits perfectly in viewport (size of ~6 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5.2;
        const scaleFactor = targetSize / maxDim;
        modelWrapper.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Add model to the wrapper
        modelWrapper.add(loadedModel);

        // Map material objects to React state list
        const matsList: MaterialData[] = Object.values(materialsMap).map(
          (m) => {
            // Count meshes using this material
            let meshRefs = 0;
            loadedModel.traverse((c: THREE.Object3D) => {
              if (c instanceof THREE.Mesh) {
                if (
                  c.material === m ||
                  (Array.isArray(c.material) && c.material.includes(m))
                ) {
                  meshRefs++;
                }
              }
            });

            return {
              uuid: m.uuid,
              name: m.name || 'Unnamed Material',
              color: '#' + m.color.getHexString(),
              roughness: m.roughness,
              metalness: m.metalness,
              wireframe: m.wireframe || false,
              meshesCount: meshRefs,
            };
          }
        );

        // Save materials map in ref for quick UI edits
        loadedMaterialsMapRef.current = materialsMap;
        setMaterials(matsList.sort((a, b) => b.meshesCount - a.meshesCount)); // sort by most used

        // Set default selected material
        if (matsList.length > 0) {
          // Try to select a material named "paint" or "body" or choose the first one
          const bodyMat = matsList.find(
            (m) =>
              m.name.toLowerCase().includes('paint') ||
              m.name.toLowerCase().includes('body') ||
              m.name.toLowerCase().includes('shell')
          );
          setSelectedMaterialUuid(bodyMat ? bodyMat.uuid : matsList[0].uuid);
        }

        // Update stats
        const stats = {
          meshes: meshCount,
          materials: matsList.length,
          vertices: vertexCount,
          triangles: Math.round(triangleCount),
        };
        setModelStats(stats);

        // Set loading finished
        setIsLoading(false);
        addLog(
          `Successfully loaded ${selectedModel === 'skyline_r33' ? 'Skyline R33' : 'Skyline GT-R Nismo'}`,
          'success'
        );
        addLog(
          `Stats: ${stats.meshes} meshes, ${stats.materials} PBR materials, ${stats.vertices.toLocaleString()} vertices, ${stats.triangles.toLocaleString()} polygons`,
          'success'
        );

        // Reset camera look target
        if (controlsRef.current && cameraRef.current) {
          cameraRef.current.position.set(5.5, 3.2, 5.5);
          controlsRef.current.target.set(0, 0.8, 0);
          controlsRef.current.update();
        }
      },
      (xhr: ProgressEvent) => {
        const percent = xhr.total
          ? Math.round((xhr.loaded / xhr.total) * 100)
          : 0;
        setLoadingProgress(percent);
        if (percent > 0) {
          setLoadingStage(`Downloading model: ${percent}%`);
        }
      },
      (error: any) => {
        console.error('An error happened while loading GLTF:', error);
        setErrorMessage(
          'Failed to load 3D model. Make sure files exist in the public directory.'
        );
        setIsLoading(false);
        addLog(
          `Error loading model: ${error.message || 'Unknown error'}`,
          'system'
        );
      }
    );
  }, [selectedModel]);

  // --- SCENE EFFECTS (Lights, Helpers, Shadows) ---
  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.5 * lightIntensity;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = 1.2 * lightIntensity;
    }
    if (spotLightRef.current) {
      spotLightRef.current.intensity = 1.5 * lightIntensity;
    }
  }, [lightIntensity]);

  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showHelpers;
    if (axesHelperRef.current) axesHelperRef.current.visible = showHelpers;
  }, [showHelpers]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = shadowsEnabled;
      // Force materials compile update
      sceneRef.current?.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = shadowsEnabled;
          child.receiveShadow = shadowsEnabled;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: THREE.Material) => {
                m.needsUpdate = true;
              });
            } else {
              child.material.needsUpdate = true;
            }
          }
        }
      });
      if (shadowPlaneRef.current) {
        shadowPlaneRef.current.visible = shadowsEnabled;
      }
      addLog(`Shadows ${shadowsEnabled ? 'enabled' : 'disabled'}`, 'action');
    }
  }, [shadowsEnabled]);

  // --- MATERIAL CUSTOMIZER UPDATES ---
  const handleMaterialPropChange = (
    uuid: string,
    key: 'color' | 'roughness' | 'metalness' | 'wireframe',
    value: any
  ) => {
    const mat = loadedMaterialsMapRef.current[uuid];
    if (!mat) return;

    if (key === 'color') {
      mat.color.set(value);
      addLog(`Material '${mat.name}' color updated to ${value}`, 'action');
    } else if (key === 'roughness') {
      mat.roughness = parseFloat(value);
      addLog(`Material '${mat.name}' roughness updated to ${value}`, 'action');
    } else if (key === 'metalness') {
      mat.metalness = parseFloat(value);
      addLog(`Material '${mat.name}' metalness updated to ${value}`, 'action');
    } else if (key === 'wireframe') {
      mat.wireframe = value;
      addLog(`Material '${mat.name}' wireframe toggled: ${value}`, 'action');
    }

    // Force render update
    mat.needsUpdate = true;

    // Sync state
    setMaterials((prev) =>
      prev.map((m) =>
        m.uuid === uuid
          ? {
              ...m,
              color: key === 'color' ? value : m.color,
              roughness: key === 'roughness' ? parseFloat(value) : m.roughness,
              metalness: key === 'metalness' ? parseFloat(value) : m.metalness,
              wireframe: key === 'wireframe' ? value : m.wireframe,
            }
          : m
      )
    );
  };

  // Quick Paint Presets
  const applyPresetColor = (hexColor: string, isMetallic: boolean = true) => {
    if (materials.length === 0) return;

    // Detect body material
    const bodyMatData = materials.find(
      (m) =>
        m.name.toLowerCase().includes('paint') ||
        m.name.toLowerCase().includes('body') ||
        m.name.toLowerCase().includes('shell') ||
        m.name.toLowerCase().includes('carpaint') ||
        m.name.toLowerCase().includes('nismo_s') ||
        m.name.toLowerCase().includes('ext_')
    );

    const targetUuid = bodyMatData ? bodyMatData.uuid : selectedMaterialUuid;
    const targetMat = loadedMaterialsMapRef.current[targetUuid];

    if (targetMat) {
      targetMat.color.set(hexColor);
      targetMat.roughness = isMetallic ? 0.25 : 0.4;
      targetMat.metalness = isMetallic ? 0.9 : 0.0;
      targetMat.needsUpdate = true;

      // Sync state
      setMaterials((prev) =>
        prev.map((m) =>
          m.uuid === targetUuid
            ? {
                ...m,
                color: hexColor,
                roughness: isMetallic ? 0.25 : 0.4,
                metalness: isMetallic ? 0.9 : 0.0,
              }
            : m
        )
      );

      addLog(
        `Applied Preset Color to material '${targetMat.name}': ${hexColor}`,
        'action'
      );
    } else {
      addLog('Could not find paint material to apply preset.', 'system');
    }
  };

  // Code snippets for learning panel
  const codeSnippets = [
    {
      title: 'Scene, Camera, and Renderer Setup',
      desc: 'The foundational triad of every Three.js project. The Scene holds objects, the Camera determines the viewport perspective, and the Renderer draws it using WebGL.',
      lang: 'typescript',
      code: `import * as THREE from 'three';

// 1. Create the Scene (the 3D universe)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090a0f);

// 2. Create the Camera (FOV, Aspect Ratio, Near, Far)
const camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  100
);
camera.position.set(5.5, 3.2, 5.5);

// 3. Create the WebGL Renderer (attaches to HTML5 Canvas)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow casting
document.body.appendChild(renderer.domElement);`,
    },
    {
      title: 'The Render Loop',
      desc: 'To animate or interactively orbit elements in Three.js, you must draw the scene repeatedly. Using requestAnimationFrame matches the display refresh rate (e.g. 60Hz or 120Hz) smoothly.',
      lang: 'typescript',
      code: `function animate() {
  // Enqueue next frame redraw
  requestAnimationFrame(animate);

  // 1. Rotate the mesh slowly
  if (myCarModel) {
    myCarModel.rotation.y += 0.003;
  }

  // 2. Update camera OrbitControls
  controls.update();

  // 3. Render the scene from the camera's perspective
  renderer.render(scene, camera);
}

// Start loop
animate();`,
    },
    {
      title: 'Showroom Lighting & Shadows',
      desc: 'Light is crucial for PBR (Physically Based Rendering) materials. Ambient light provides base glow, Directional light casts sharp sun-like shadows, and SpotLight creates glossy specular highlights on metallic paint.',
      lang: 'typescript',
      code: `// 1. Ambient Light (uniform soft light across all objects)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 2. Directional Light (parallel rays, casts shadows)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(6, 12, 6);
dirLight.castShadow = true; 
dirLight.shadow.mapSize.width = 2048; // High-res shadows
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// 3. Shadow plane (receiver on the floor)
const shadowPlaneGeo = new THREE.PlaneGeometry(30, 30);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);`,
    },
    {
      title: 'Loading 3D Models with GLTFLoader',
      desc: 'GLTF (Graphics Language Transmission Format, available as .gltf or .glb) is the JPEG of 3D. We use GLTFLoader to download, parse, and mount these complex assets into the scene tree.',
      lang: 'typescript',
      code: `import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load(
  '/models/skyline_r33.glb',
  (gltf) => {
    const carModel = gltf.scene;

    // Enable shadows on all child meshes
    carModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add model directly to the scene!
    scene.add(carModel);
    console.log('Model loaded successfully!');
  },
  (xhr) => {
    // Optional download progress tracker
    const percent = Math.round((xhr.loaded / xhr.total) * 100);
    console.log(\`Loading: \${percent}%\`);
  },
  (error) => {
    console.error('Error loading GLTF model:', error);
  }
);`,
    },
    {
      title: 'Modifying PBR Materials Dynamically',
      desc: 'In Three.js, you customize textures and paint by traversing the model, searching for MeshStandardMaterial instances, and adjusting colors, metalness, and roughness on the fly.',
      lang: 'typescript',
      code: `// Traverse the model to locate and change the body paint
carModel.traverse((child) => {
  if (child.isMesh && child.material) {
    const mat = child.material;

    // If we identify this as the paint material by its name
    if (mat.name.toLowerCase().includes('paint')) {
      // 1. Change color to deep metallic purple
      mat.color.set('#3a105c');
      
      // 2. Set roughness to make it shiny (0 = mirror, 1 = matte)
      mat.roughness = 0.2;
      
      // 3. Set metalness to make it reflective (1 = metallic paint)
      mat.metalness = 0.95;

      // 4. Signal Three.js that the shader needs compilation update
      mat.needsUpdate = true;
    }
  }
});`,
    },
  ];

  const selectedMaterial = materials.find(
    (m) => m.uuid === selectedMaterialUuid
  );

  return (
    <div className="app-container">
      {/* 3D VIEWPORT CONTAINER */}
      <div className="viewport-container" ref={containerRef}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loader-card">
              <div className="loader-spinner"></div>
              <div className="loader-text">{loadingStage}</div>
              <div className="loader-subtext">
                Loading 3D asset into WebGL buffer...
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <span className="code-lang mt-4 block">
                {loadingProgress}% Complete
              </span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {errorMessage && (
          <div
            className="loading-overlay"
            style={{ background: 'rgba(20, 10, 10, 0.9)' }}
          >
            <div className="loader-card" style={{ maxWidth: '400px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
              <div className="loader-text" style={{ color: '#ef4444' }}>
                Model Load Failure
              </div>
              <p className="step-text" style={{ margin: '12px 0 20px 0' }}>
                {errorMessage}
              </p>
              <div className="flex-center gap-2">
                <button
                  className="glass-pill-btn active"
                  onClick={() =>
                    setSelectedModel(
                      selectedModel === 'skyline_r33'
                        ? 'skyline_gtr_nismo'
                        : 'skyline_r33'
                    )
                  }
                >
                  Switch Model Path
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="viewport-header">
          <h1 className="viewport-title">Three.js Interactive Showroom</h1>
          <p className="viewport-subtitle">
            Model:{' '}
            {selectedModel === 'skyline_r33'
              ? 'Nissan Skyline R33 (GLB)'
              : '1995 Skyline GT-R Nismo S-Tune (GLTF)'}
          </p>
        </div>

        {/* Canvas for WebGL */}
        <canvas className="webgl-canvas" ref={canvasRef}></canvas>

        {/* Float Controls Overlay */}
        <div className="quick-controls">
          <button
            className={`glass-pill-btn ${selectedModel === 'skyline_r33' ? 'active' : ''}`}
            onClick={() => setSelectedModel('skyline_r33')}
          >
            📂 Skyline R33 (GLB)
          </button>
          <button
            className={`glass-pill-btn ${selectedModel === 'skyline_gtr_nismo' ? 'active' : ''}`}
            onClick={() => setSelectedModel('skyline_gtr_nismo')}
          >
            📂 Skyline GT-R Nismo (GLTF)
          </button>

          <div style={{ flexGrow: 1 }}></div>

          <button
            className="glass-pill-btn"
            onClick={() => {
              if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(5.5, 3.2, 5.5);
                controlsRef.current.target.set(0, 0.8, 0);
                controlsRef.current.update();
                addLog('Reset viewport camera position', 'action');
              }
            }}
          >
            🎥 Reset Camera
          </button>
        </div>
      </div>

      {/* DASHBOARD PANEL */}
      <div className="panel-container">
        {/* Panel Tabs */}
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            📖 Learn Three.js
          </button>
          <button
            className={`panel-tab ${activeTab === 'inspect' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspect')}
          >
            🛠️ Material Inspector
          </button>
          <button
            className={`panel-tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            💻 Engine Console
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="panel-content">
          {/* TAB 1: LEARN THREE.JS */}
          {activeTab === 'learn' && (
            <div>
              <h2 className="section-title">
                <span>📚</span> Introduction to Three.js
              </h2>
              <p className="section-desc">
                Three.js is a lightweight cross-browser JavaScript library used
                to create and display animated 3D computer graphics in a web
                browser using WebGL. Follow these steps to understand how this
                scene is rendered:
              </p>

              <div className="tutorial-steps">
                {codeSnippets.map((snippet, idx) => (
                  <div key={idx} className="info-card">
                    <div className="tutorial-step-header">
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-title">{snippet.title}</div>
                    </div>
                    <p className="step-text">{snippet.desc}</p>

                    <div className="code-snippet-container">
                      <div className="code-snippet-header">
                        <span className="code-lang">{snippet.lang}</span>
                        <button
                          className="copy-btn"
                          onClick={() => copyCode(snippet.code, idx + 1)}
                        >
                          {copiedIndex === idx + 1 ? 'Copied! ✓' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-block">
                        <code>{snippet.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MATERIAL INSPECTOR */}
          {activeTab === 'inspect' && (
            <div>
              <h2 className="section-title">
                <span>⚙️</span> Interactive Materials & Scene
              </h2>
              <p className="section-desc">
                Tweak lights, helpers, and materials of the loaded model in
                real-time. This demonstrates how PBR (Physically Based
                Rendering) values alter textures.
              </p>

              {/* Scene Settings Card */}
              <div className="info-card">
                <h3 className="step-title mb-2">🌍 Scene Environment</h3>
                <div className="control-group">
                  <div className="control-row">
                    <div>
                      <span className="control-label">Auto-Rotation</span>
                      <div className="control-label-desc">
                        Rotate car on the Y axis
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isRotating}
                        onChange={(e) => setIsRotating(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {isRotating && (
                    <div className="control-row">
                      <span className="control-label">Rotation Speed</span>
                      <input
                        type="range"
                        min="0.000"
                        max="0.015"
                        step="0.001"
                        className="slider-input"
                        value={rotationSpeed}
                        onChange={(e) =>
                          setRotationSpeed(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  )}

                  <div className="control-row">
                    <div>
                      <span className="control-label">Grid & Axes Helpers</span>
                      <div className="control-label-desc">
                        Toggle floor visual aids
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showHelpers}
                        onChange={(e) => setShowHelpers(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="control-row">
                    <div>
                      <span className="control-label">Cast Shadows</span>
                      <div className="control-label-desc">
                        Enable shadow mapping
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={shadowsEnabled}
                        onChange={(e) => setShadowsEnabled(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="control-row">
                    <span className="control-label">Lighting Intensity</span>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      className="slider-input"
                      value={lightIntensity}
                      onChange={(e) =>
                        setLightIntensity(parseFloat(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Model Statistics Card */}
              <div className="info-card">
                <h3 className="step-title mb-2">📊 Model Geometry Stats</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Meshes:
                    </span>{' '}
                    <span
                      style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}
                    >
                      {modelStats.meshes}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Materials:
                    </span>{' '}
                    <span
                      style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}
                    >
                      {modelStats.materials}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Vertices:
                    </span>{' '}
                    <span
                      style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}
                    >
                      {modelStats.vertices.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Polygons:
                    </span>{' '}
                    <span
                      style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}
                    >
                      {modelStats.triangles.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Material Customizer Card */}
              {materials.length > 0 && (
                <div className="info-card">
                  <h3 className="step-title mb-2">🎨 Material Inspector</h3>
                  <p className="step-text" style={{ marginBottom: '12px' }}>
                    Select any material extracted from the 3D model to edit its
                    properties.
                  </p>

                  <div className="material-selector-container">
                    <select
                      className="select-dropdown"
                      value={selectedMaterialUuid}
                      onChange={(e) => setSelectedMaterialUuid(e.target.value)}
                    >
                      {materials.map((m) => (
                        <option key={m.uuid} value={m.uuid}>
                          {m.name} ({m.meshesCount} mesh references)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMaterial && (
                    <div className="control-group mt-4">
                      {/* Color Picker */}
                      <div className="control-row">
                        <div>
                          <span className="control-label">Base Color</span>
                          <div className="control-label-desc">
                            Albedo base pigment (diffuse)
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {selectedMaterial.color}
                          </span>
                          <input
                            type="color"
                            className="color-picker-input"
                            value={selectedMaterial.color}
                            onChange={(e) =>
                              handleMaterialPropChange(
                                selectedMaterial.uuid,
                                'color',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Roughness Slider */}
                      <div className="control-row">
                        <div>
                          <span className="control-label">Roughness</span>
                          <div className="control-label-desc">
                            0.0 (mirror-like) to 1.0 (rough)
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: '0.75rem',
                              width: '24px',
                            }}
                          >
                            {selectedMaterial.roughness.toFixed(2)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            className="slider-input"
                            value={selectedMaterial.roughness}
                            onChange={(e) =>
                              handleMaterialPropChange(
                                selectedMaterial.uuid,
                                'roughness',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Metalness Slider */}
                      <div className="control-row">
                        <div>
                          <span className="control-label">Metalness</span>
                          <div className="control-label-desc">
                            0.0 (non-metal) to 1.0 (metallic)
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: '0.75rem',
                              width: '24px',
                            }}
                          >
                            {selectedMaterial.metalness.toFixed(2)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            className="slider-input"
                            value={selectedMaterial.metalness}
                            onChange={(e) =>
                              handleMaterialPropChange(
                                selectedMaterial.uuid,
                                'metalness',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Wireframe Mode */}
                      <div className="control-row">
                        <div>
                          <span className="control-label">Wireframe Mode</span>
                          <div className="control-label-desc">
                            Render polygon edges as lines
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={selectedMaterial.wireframe}
                            onChange={(e) =>
                              handleMaterialPropChange(
                                selectedMaterial.uuid,
                                'wireframe',
                                e.target.checked
                              )
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="divider"></div>

                      {/* Preset Colors for Body Paint */}
                      <div>
                        <span className="control-label block mb-2">
                          🚗 Quick Showroom Paint Colors
                        </span>
                        <div className="preset-colors-grid">
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#2d0047' }}
                            title="Midnight Purple III"
                            onClick={() => applyPresetColor('#2d0047', true)}
                          ></button>
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#0033aa' }}
                            title="Bayside Blue"
                            onClick={() => applyPresetColor('#0033aa', true)}
                          ></button>
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#b91c1c' }}
                            title="Nismo Active Red"
                            onClick={() => applyPresetColor('#b91c1c', false)}
                          ></button>
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#4b5563' }}
                            title="Gunmetal Grey"
                            onClick={() => applyPresetColor('#4b5563', true)}
                          ></button>
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#f9fafb' }}
                            title="Championship White"
                            onClick={() => applyPresetColor('#f9fafb', false)}
                          ></button>
                          <button
                            className="preset-color-btn"
                            style={{ backgroundColor: '#111827' }}
                            title="Stealth Black"
                            onClick={() => applyPresetColor('#111827', true)}
                          ></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENGINE CONSOLE LOGS */}
          {activeTab === 'console' && (
            <div>
              <h2 className="section-title">
                <span>💻</span> WebGL Engine Terminal
              </h2>
              <p className="section-desc">
                Inspect raw event logging dispatched directly from the Three.js
                GLTF loaders and rendering pipeline.
              </p>

              <div className="console-logs-container">
                {logs.length === 0 ? (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      marginTop: '100px',
                    }}
                  >
                    No logs recorded yet.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`console-log-line ${log.type}`}>
                      <span style={{ color: '#4b5563', marginRight: '6px' }}>
                        [{log.timestamp}]
                      </span>
                      {log.text}
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '10px',
                }}
              >
                <button
                  className="copy-btn"
                  onClick={() => {
                    setLogs([]);
                    addLog('Logs cleared by user', 'system');
                  }}
                >
                  Clear Console Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
