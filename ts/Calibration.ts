/**
 * Alias type for an array of three numbers.
 */
export type Vector3 = [number, number, number];

/**
 * A led, with its name, its estimated position and the directions of the lights.
 */
export interface Led {
    /** The name of the led. */
    name: string;

    /** The estimated position of the led. */
    position: Vector3;

    /** The estimated directions of the light that allowed the estimation of the position of the led. */
    directions: Vector3[];
}

/**
 * A 3D plane.
 */
export interface Plane {
    /** The normal of the plane. */
    normal: Vector3;

    /** The offset of the plane. */
    alpha: number;
}

/**
 * Type for the calibration data.
 */
export interface Calibration {
    /** Information about the leds. */
    leds: Led[];

    /** Position of the spheres. */
    spheres: Vector3[];

    /** The coordinates of the plane that best fit the spheres. */
    plane: Plane;
}

/**
 * Type for what's returned by the server when you ask the calibration data.
 */
export type CalibrationResult = 'failure' | 'skipped' | Calibration;
