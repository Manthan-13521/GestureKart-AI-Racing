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
      mesh: THREE.Mesh;
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
      mesh.position.set(entry.predicted.x * 6 - 3, 0.3, relativeZ);

      // Fade out cars that are more than 150m away (won't be visible anyway)
      const visible = Math.abs(relativeZ) < 150;
      mesh.visible = visible;
    }
  }

  /** Remove a disconnected player. */
  public remove(id: string): void {
    const entry = this.players.get(id);
    if (entry) {
      this.scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
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

  private createMesh(id: string): THREE.Mesh {
    // Colour-code by peer id for quick identification
    const hue = (parseInt(id.slice(0, 4), 36) % 360) / 360;
    const colour = new THREE.Color().setHSL(hue, 0.9, 0.55);

    const geo = new THREE.BoxGeometry(1.6, 0.9, 3.2);
    const mat = new THREE.MeshPhongMaterial({
      color: colour,
      transparent: true,
      opacity: 0.85,
      emissive: colour,
      emissiveIntensity: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.name = `remote-${id}`;
    return mesh;
  }
}
