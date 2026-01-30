import * as THREE from 'three';

/**
 * A camera pose.
 */
export interface Pose {
    /** The position of the camera. */
    position: THREE.Vector3;

    /** The point where the camera is looking. */
    target: THREE.Vector3;
}

/**
 * A class to easily manage a camera animation.
 */
export default class Animation {

    /** The beginning of the animation. */
    start: Pose;

    /** The end of the animation. */
    end: Pose;

    /** Moment in the animation, between 0 and 1. */
    t: number;

    /** Initialises a new animation. */
    constructor(start: Pose, end: Pose) {
        this.start = { position: start.position, target: start.target };
        this.end = { position: end.position, target: end.target };
        this.t = 0;
    }

    /** Updates the animation. */
    update(delay: number): Pose {
        this.t += delay;
        return {
            position: new THREE.Vector3()
                .addScaledVector(this.start.position, 1 - this.t)
                .addScaledVector(this.end.position, this.t),
            target: new THREE.Vector3()
                .addScaledVector(this.start.target, 1 - this.t)
                .addScaledVector(this.end.target, this.t),
        };

    }
}
