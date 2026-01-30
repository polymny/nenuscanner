import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Animation from './Animation';
import { Calibration, CalibrationResult } from './Calibration';
import { Led, Leds } from './Led';
import CameraObject from './CameraObject';

/**
 * Retrieves an HTML element from its id, and throw an error if it doens't exist.
 */
function getElementById(id: string): HTMLElement {
    let element = document.getElementById(id);
    if (element === null) {
        throw new Error('No element with id ' + id);
    }
    return element;
}

/**
 * Retrieves an HTML input element from its id, and throw an error if it doens't exist.
 */
function getInputElementById(id: string): HTMLInputElement {
    let element = getElementById(id);
    if (! (element instanceof HTMLInputElement)) {
        throw new Error('Element with id ' + id + ' is not an input element');
    }
    return element;
}

/**
 * Retrieves an HTML image element from its id, and throw an error if it doens't exist.
 */
function getImageElementById(id: string): HTMLImageElement {
    let element = getElementById(id);
    if (! (element instanceof HTMLImageElement)) {
        throw new Error('Element with id ' + id + ' is not an input element');
    }
    return element;
}

declare global {
    interface Window {
        /** This global variable must be set before including this script in the HTML page. */
        CALIBRATION_ID: number;
    }
}

/**
 * The class that manages the interface for the calibration visualisation.
 */
export class Engine {
    /** The id of the object to scan. */
    calibrationId: number;

    /** HTML element that is hidden by default but needs to be made visible if we want to display the visualizer. */
    visualizerElement: HTMLElement;

    /** HTML element that is hidden by default but needs to be made visible if the calibration failed. */
    calibrationFailedElement: HTMLElement;

    /** HTML element that is hidden by default but needs to be made visible if the calibration was skipped. */
    calibrationSkippedElement: HTMLElement;

    /** HTML element on which the renderer will be added. */
    domElement: HTMLElement;

    /** Checkbox indicating whether the user wants to show the lines from the spheres to the lights. */
    showLinesCheckbox: HTMLInputElement;

    /** HTML span where we will show the name of the current selected led. */
    selectedObject: HTMLElement;

    /** HTML element indicating whether the user wants to show the plane containing all spheres. */
    showPlaneCheckbox: HTMLInputElement;

    /** HTML image where we will show the real photo corresponding to the selected led. */
    ledView: HTMLImageElement;

    /** Target point of the camera. */
    center: THREE.Vector3;

    /** Scene containing all the elements to be rendered. */
    scene: THREE.Scene;

    /** Camera from which the scene will be rendered. */
    camera: THREE.PerspectiveCamera;

    /** Object containing the representation of the camera (grey pyramid). */
    cameraObject: CameraObject;

    /** Object containing all the representations of the leds (yellow spheres). */
    leds: Leds;

    /** Object containing all the representations of the spheres (white). */
    spheres: THREE.Object3D;

    /** The plane that approximates the plane containing the spheres. */
    plane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhongMaterial>;

    /** Axes that will be shown to help the visualisation of the scene. */
    axes: THREE.AxesHelper;

    /** Ambient light to be able to see stuff in the scene. */
    ambientLight: THREE.AmbientLight;

    /** Renderer that will be used to render the scene. */
    renderer: THREE.WebGLRenderer;

    /** Controls to let the user move the camera. */
    controls: OrbitControls;

    /** 2D Vector representing the position of the mouse on the renderer. */
    pointer: THREE.Vector2;

    /** Object that will help us when users will point or click 3D objects. */
    raycaster: THREE.Raycaster;

    /** Object to manage the animation when the user clicks on the camera. */
    animation: Animation | null;

    /** Initialises the engine. */
    static async create(domId: string) {
        let calibrationId = window.CALIBRATION_ID;

        let domElement = getElementById(domId);
        let engine = new Engine();
        engine.calibrationId = calibrationId;
        engine.domElement = domElement;
        engine.initHtml();

        let request = await fetch(engine.dataPath('calibration.json'));
        let calibration: CalibrationResult = await request.json();
        if (calibration == 'failure') {
            engine.calibrationFailedElement.style.display = "block";
            return;
        } else if (calibration === "skipped") {
            engine.calibrationSkippedElement.style.display = "block";
            return;
        } else {
            engine.initScene(calibration);
        }
        engine.initListeners();
        return engine;
    }

    /** Returns the available width to perform the redering. */
    get width(): number {
        return this.domElement === document.body ? window.innerWidth : this.domElement.offsetWidth;
    }

    /** Returns the available height to perform the redering. */
    get height(): number {
        return this.domElement === document.body ? window.innerHeight : this.domElement.offsetHeight;
    }

    /** Returns the url of calibration assets. */
    dataPath(path: string): string {
        return '/data/calibrations/' + this.calibrationId + '/' + path;
    }

    /**
     * Initialises the HTML components of the engine.
     */
    initHtml(): void {
        this.visualizerElement = getElementById('visualizer');
        this.calibrationFailedElement = getElementById('calibration-failed');
        this.calibrationSkippedElement = getElementById('calibration-skipped');
        this.showLinesCheckbox = getInputElementById('show-lines');
        this.showPlaneCheckbox = getInputElementById('show-plane');
        this.selectedObject = getElementById('selected-object');
        this.ledView = getImageElementById('led-view');
    }

    /**
     * Initialises the 3D components of the engine.
     */
    initScene(calibration: Calibration): void {
        this.visualizerElement.style.display = "block";
        this.center = new THREE.Vector3(0, 0, 10);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0, 0, 0);

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.001, 1000);
        this.camera.position.set(0, 0, -30);

        this.cameraObject = new CameraObject();
        this.scene.add(this.cameraObject);

        this.leds = new Leds(calibration, this.showLinesCheckbox.checked);
        this.scene.add(this.leds);

        this.spheres = new THREE.Object3D();
        for (let row of calibration.spheres) {
            let sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshPhongMaterial({ color: 0xffffff }));
            sphere.position.set(-row[1], -row[0], row[2]);
            sphere.layers.enable(1);
            this.spheres.add(sphere);
        }
        this.scene.add(this.spheres);

        let normal = new THREE.Vector3(-calibration.plane.normal[1], -calibration.plane.normal[0], calibration.plane.normal[2]);
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshPhongMaterial({ color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
        this.plane.lookAt(normal);
        this.plane.position.set(0, 0, -calibration.plane.alpha / calibration.plane.normal[2]);
        this.plane.visible = this.showPlaneCheckbox.checked;
        this.scene.add(this.plane);

        this.axes = new THREE.AxesHelper(10);
        this.scene.add(this.axes);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(this.ambientLight);

        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        this.renderer.setSize(this.width, this.height);
        this.renderer.setAnimationLoop(() => this.animate());

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.zoomSpeed = 5;
        this.controls.target.copy(this.center);
        this.controls.update();

        this.pointer = new THREE.Vector2();

        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(1);

        this.animation = null;

        this.onWindowResize();
        this.domElement.appendChild(this.renderer.domElement);
    }

    /**
     * Initialises the event listeners of the engine.
     */
    initListeners(): void {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
        this.showLinesCheckbox.addEventListener('change', () => this.leds.setShowLines(this.showLinesCheckbox.checked));
        this.showPlaneCheckbox.addEventListener('change', () => this.plane.visible = this.showPlaneCheckbox.checked);
        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case "ArrowDown":
                case "ArrowRight":
                    this.showImage(this.leds.next());
                    break;

                case "ArrowUp":
                case "ArrowLeft":
                    this.showImage(this.leds.previous());
                    break;
            }
        });
    }

    /** Triggers the animation. */
    startAnimation(): void {
        this.animation = new Animation({
            position: this.camera.position,
            target: this.controls.target,
        }, {
            position: new THREE.Vector3(),
            target: this.center,
        })
    }

    /**
     * Content of the render loop.
     */
    animate(): void {
        // Update user controls
        this.controls.update();

        // Manage animation
        if (this.animation !== null) {
            if (this.animation.t > 1) {
                this.animation = null;
                this.camera.position.set(0, 0, 0);
                this.controls.target.copy(this.center);
            } else {
                let current = this.animation.update(0.01);
                this.camera.position.copy(current.position);
                this.controls.target.copy(current.target);
            }

            this.controls.update();
        }

        // Manage mouse interaction
        this.raycaster.setFromCamera(this.pointer, this.camera);
        let intersects = this.raycaster.intersectObjects(this.scene.children);
        let firstIntersection = intersects[0];

        // If the pointer points at the camera, make it hover
        if (firstIntersection && firstIntersection.object.parent instanceof CameraObject && firstIntersection.distance > 1) {
            this.cameraObject.hover();
        } else {
            this.cameraObject.unHover();
        }

        // If the pointer points at a led, make it hover, but unhover other leds first
        for (let led of this.leds.children) {
            if (led instanceof Led) {
                led.unHover();
            }
        }
        if (firstIntersection && firstIntersection.object instanceof Led) {
            firstIntersection.object.hover();
        }

        // Perform the rendering
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * When the pointer moves on the screen.
     */
    onPointerMove(e: PointerEvent): void {
        // Normalize pointer position in [-1, 1]²
        this.pointer.x = (e.offsetX / this.width) * 2 - 1;
        this.pointer.y = - (e.offsetY / this.height) * 2 + 1;
    }

    /**
     * Shows the photo associated to a led.
     */
    showImage(led: Led): void {
        if (led.on) {
            this.selectedObject.innerText = led.name.split('.')[0] + ' (' + (<number> this.leds.currentLedIndex + 1) + '/' + this.leds.leds.length + ')';
            this.ledView.src = this.dataPath(led.name);
            this.ledView.style.display = 'block';
        } else {
            this.selectedObject.innerText = 'aucune';
            this.ledView.style.display = 'none';
        }
    }

    /**
     * When the pointer moves is released (i.e. click).
     */
    onPointerUp(): void {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        let intersects = this.raycaster.intersectObjects(this.scene.children);
        let firstIntersection = intersects[0];

        if (firstIntersection && firstIntersection.object instanceof Led) {
            this.leds.toggle(firstIntersection.object);
            this.showImage(firstIntersection.object);
        }

        if (firstIntersection && firstIntersection.object.parent instanceof CameraObject && firstIntersection.distance > 1) {
            this.startAnimation();
            return;
        }
    }

    /**
     * When the pointer window is resized.
     */
    onWindowResize(): void {
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }
}

