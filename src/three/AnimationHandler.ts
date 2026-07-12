import * as THREE from 'three';

class AnimationHandler {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();

  // Call this when the model finishes loading
  init(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model);

    animations.forEach((clip) => {
      const action = this.mixer!.clipAction(clip);
      this.actions.set(clip.name, action);
    });

    const availableAnimations = Array.from(this.actions.keys());
    console.log(`Loaded ${animations.length} animations! Available animations:`, availableAnimations);
  }

  // Play an animation by name
  play(name: string, loop: boolean = false) {
    const action = this.actions.get(name);
    if (action) {
      action.reset();
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 1);
      action.clampWhenFinished = !loop;
      action.play();
    } else {
      console.warn(`Animation ${name} not found!`);
    }
  }

  // Update this inside your render loop!
  update(deltaTime: number) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}

export const animationHandler = new AnimationHandler();
