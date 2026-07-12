import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupScene(canvasRef: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  const camera = new THREE.PerspectiveCamera(
    //   1,
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvasRef);
  controls.target.set(0, 0, 0);
  controls.update();

  const gridHelper = new THREE.GridHelper(24, 24, 0x555555, 0x444444);
  gridHelper.position.y = 0.001;
  scene.add(gridHelper);
  return { scene, camera };
}
