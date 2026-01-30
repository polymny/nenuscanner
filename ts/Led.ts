import * as THREE from 'three';
import * as Calibration from './Calibration';

/**
 * Helper to render leds as spheres.
 */
export class Led extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {

    /** Whether the led is on or off. */
    on: boolean;

    /** Whether the mouse is hovering the led or not. */
    isHovered: boolean;

    /** Lines going from the sphere to the led. */
    lines: THREE.LineSegments;

    /** Point light to produce a nice lighting effect when the light is on. */
    light: THREE.PointLight;

    /**
     * Creates a new led from its information and the spheres.
     */
    constructor(ledInfo: Calibration.Led, spheres: Calibration.Vector3[]) {
        super(
            new THREE.SphereGeometry(0.7, 32, 16),
            new THREE.MeshBasicMaterial({ color: 0x555500 }),
        );

        this.position.set(-ledInfo.position[1], -ledInfo.position[0], ledInfo.position[2]);
        this.name = ledInfo.name;
        this.layers.enable(1);
        this.on = false;
        this.isHovered = false;

        const material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });

        let vertices = new Float32Array(3 * 2 * spheres.length);

        for (let index = 0; index < ledInfo.directions.length; index++) {
            let line = ledInfo.directions[index];
            let sphere = spheres[index];
            vertices[3 * 2 * index    ] = -this.position.x - sphere[1];
            vertices[3 * 2 * index + 1] = -this.position.y - sphere[0];
            vertices[3 * 2 * index + 2] = -this.position.z + sphere[2];
            vertices[3 * 2 * index + 3] = -line[1] * 100;
            vertices[3 * 2 * index + 4] = -line[0] * 100;
            vertices[3 * 2 * index + 5] = line[2] * 100;
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.lines = new THREE.LineSegments(geometry, material);
        this.lines.visible = false;
        this.add(this.lines);

        this.light = new THREE.PointLight(0xffffff, 1000);
        this.light.visible = false;
        this.add(this.light);
    }

    /**
     * Changes the style of the model to a nice hovered style.
     */
    hover() {
        if (this.on) {
            return;
        }

        this.isHovered = true;
        this.refreshColor();
    }

    /**
     * Restores original style.
     */
    unHover() {
        if (this.on) {
            return;
        }

        this.isHovered = false;
        this.refreshColor();
    }

    /**
     * Turn on the led if its off, turn it off if its on.
     */
    toggle() {
        this.on = !this.on;
        this.refreshColor();
    }

    /**
     * Changes the style of the model to make it visible that the led is on.
     */
    turnOn(showLines: boolean) {
        this.on = true;
        this.light.visible = true;
        for (let child of this.children) {
            child.visible = true;
        }
        this.refreshColor();
        this.lines.visible = showLines;
    }

    /**
     * Changes the style of the model to make it visible that the led is off.
     */
    turnOff() {
        this.on = false;
        this.light.visible = false;
        for (let child of this.children) {
            child.visible = false;
        }
        this.refreshColor();
        this.lines.visible = false;
    }

    /**
     * Refreshes the color according to the led state.
     */
    refreshColor() {
        this.material.color.setHex(this.getColor());
    }

    /**
     * Shows or hides the lines from the spheres following the light direction.
     */
    showLines(showLines: boolean) {
        if (this.on) {
            this.lines.visible = showLines;
        }
    }

    /**
     * Returns the hexadecimal value of the color of the led depending on the state.
     */
    getColor() {
        if (this.on) {
            return 0xffff00;
        } else if (this.isHovered) {
            return 0x888800;
        } else {
            return 0x555500;
        }
    }
}

/**
 * Container for all the leds that will help managing which led is on.
 * Only one led can be on at a time.
 */
export class Leds extends THREE.Object3D {

    /** Index of the led that is currently on, null if all leds are off. */
    currentLedIndex: number | null;

    /** Whether we need to show the lines of the leds. */
    showLines: boolean;

    /** A little light to be turned on when all leds are off, to show depth. */
    light: THREE.PointLight;

    /** Array of all the leds of the setup. */
    leds: Array<Led>;

    /**
     * Create a set of leds from their configuration.
     */
    constructor(calibration: Calibration.Calibration, showLines: boolean) {
        super();

        this.showLines = showLines;
        this.currentLedIndex = null;
        this.light = new THREE.PointLight(0xffffff, 1000);
        this.add(this.light);

        this.leds = [];

        for (let ledInfo of calibration.leds) {
            let led = new Led(ledInfo, calibration.spheres);
            this.add(led);
            this.leds.push(led);
        }
    }

    /**
     * Turns of the current led if any, and turns on the led given in argument.
     * If the led given in argument is the one on, it will be turned off.
     */
    toggle(led: Led): void {
        // If the specified led is the one on.
        if (this.currentLedIndex !== null && led === this.leds[this.currentLedIndex]) {
            this.currentLedIndex = null;
            led.turnOff();
            this.light.visible = true;
            return;
        }

        for (let index = 0; index < this.leds.length; index++) {
            let child = this.leds[index];
            if (led === this.leds[index]) {
                child.turnOn(this.showLines);
                this.currentLedIndex = index;
            } else {
                child.turnOff();
            }
        }
        this.light.visible = false;
    }

    /**
     * Changes whether we should show or not show the led lines.
     */
    setShowLines(showLines: boolean): void {
        this.showLines = showLines;
        for (let child of this.leds) {
            if (child instanceof Led && child.on) {
                child.lines.visible = showLines;
            }
        }
    }

    /**
     * Turn off the current led and goes to the next one.
     */
    next(): Led {
        if (this.currentLedIndex === null) {
            this.currentLedIndex = 0;
            let led = this.leds[0];
            led.turnOn(this.showLines);
            return led;
        }

        this.leds[this.currentLedIndex].turnOff();
        this.currentLedIndex = (this.currentLedIndex + 1) % this.leds.length;
        this.leds[this.currentLedIndex].turnOn(this.showLines);
        return <Led> this.leds[this.currentLedIndex];
    }

    /**
     * Turn off the current led and goes to the previous one.
     */
    previous(): Led {
        if (this.currentLedIndex === null) {
            this.currentLedIndex = 0;
            this.leds[0].turnOn(this.showLines);
            return this.leds[0];
        }

        this.leds[this.currentLedIndex].turnOff();
        this.currentLedIndex = (this.currentLedIndex + this.leds.length - 1) % this.leds.length;
        let led = this.leds[this.currentLedIndex];
        led.turnOn(this.showLines);
        return led;
    }


}
