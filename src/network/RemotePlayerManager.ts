import * as THREE from 'three';

export interface RemotePlayerState {
  id: string;
  distance: number;
  speed: number;
  lap: number;
  x: number;
  timestamp: number;
}

/**
 * RemotePlayerManager — renders ghost cars for each connected peer.
 * Uses dead-reckoning (constant-velocity extrapolation) to smooth
 * gaps between network packets, then snaps towards received truth
 * with a configurable lerp factor.
 */
export class RemotePlayerManager {
  private scene: THREE.Scene;
  private players: Map<
    string,
    {
      state: RemotePlayerState;
      predicted: RemotePlayerState;
      mesh: THREE.Group | THREE.Mesh;
      lastUpdate: number;
    }
  > = new Map();

  // How quickly to lerp towards authoritative position (0=no correction, 1=snap)
  private lerpFactor = 0.12;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Called when a network packet arrives with a peer's state. */
  public receiveUpdate(state: RemotePlayerState): void {
    const existing = this.players.get(state.id);
    if (!existing) {
      const mesh = this.createMesh(state.id);
      this.scene.add(mesh);
      this.players.set(state.id, {
        state,
        predicted: { ...state },
        mesh,
        lastUpdate: performance.now(),
      });
    } else {
      existing.state = state;
      existing.lastUpdate = performance.now();
    }
  }

  /**
   * Called every frame. Extrapolates remote positions and lerps towards truth.
   * @param playerDistance Local player's current distance — world is player-centric.
   * @param dt Frame delta in seconds.
   */
  public update(playerDistance: number, dt: number): void {
    for (const [, entry] of this.players) {
      const { state, mesh } = entry;

      // Dead-reckoning: advance predicted position by velocity * dt
      entry.predicted.distance += state.speed * dt * 100; // speed is 0–3, distance in metres
      entry.predicted.x += 0; // no lateral prediction

      // Lerp predicted position towards authoritative state
      entry.predicted.distance += (state.distance - entry.predicted.distance) * this.lerpFactor;
      entry.predicted.x += (state.x - entry.predicted.x) * this.lerpFactor;

      // World space: this game uses a player-centric world where Z moves.
      // Remote car is positioned relative to local player in Z.
      const relativeZ = -(entry.predicted.distance - playerDistance);
      mesh.position.set(entry.predicted.x, 0, relativeZ);

      // Fade out cars that are more than 160m away (won't be visible anyway)
      const visible = relativeZ > -160 && relativeZ < 40;
      mesh.visible = visible;
    }
  }

  /** Remove a disconnected player. */
  public remove(id: string): void {
    const entry = this.players.get(id);
    if (entry) {
      this.scene.remove(entry.mesh);
      this.players.delete(id);
    }
  }

  /** Get all remote states for RaceDirector standings. */
  public getStates(): RemotePlayerState[] {
    return Array.from(this.players.values()).map((e) => e.state);
  }

  public dispose(): void {
    for (const [id] of this.players) {
      this.remove(id);
    }
  }

  private createMesh(id: string): THREE.Group {
    const g = new THREE.Group();
    // Colour-code by peer id for quick identification
    const hue = (parseInt(id.slice(0, 4), 36) % 360) / 360;
    const colour = new THREE.Color().setHSL(hue, 0.95, 0.55);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.3,
      metalness: 0.7,
      emissive: colour,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.78, 3.6), bodyMat);
    body.position.y = 0.5;
    g.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x060810,
      roughness: 0.2,
      metalness: 0.8,
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.4), cabinMat);
    cabin.position.set(0, 1.18, 0.3);
    g.add(cabin);

    // Spoiler
    const spoilerMat = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.2, metalness: 0.9 });
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), spoilerMat);
    spoilerWing.position.set(0, 1.15, 1.7);
    g.add(spoilerWing);
    const spoilerPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), spoilerMat);
    spoilerPost.position.set(0, 0.97, 1.7);
    g.add(spoilerPost);

    // Tail lights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    for (const side of [-0.7, 0.7]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.06), tailMat);
      tl.position.set(side, 0.56, 1.82);
      g.add(tl);
    }

    // Headlights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xeeffff });
    for (const side of [-0.6, 0.6]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), headMat);
      hl.position.set(side, 0.48, -1.84);
      g.add(hl);
    }

    g.name = `remote-${id}`;
    return g;
  }
}
