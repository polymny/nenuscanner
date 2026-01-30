import * as THREE from 'three';

/**
 * Small pyramid object to represent the camera.
 */
export default class CameraObject extends THREE.Object3D {

    /** Faces of the pyramid. */
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>;

    /** Wireframe of the pyramid. */
    lines: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;

    /**
    * Builds the full pyramid, with mesh and lines.
    */
    constructor() {
        super();

        let width  = 1;
        let height = 1;
        let length = 2;

        let vertices = [
            new THREE.Vector3(     0,       0,      0),
            new THREE.Vector3( width,  height, length),
            new THREE.Vector3(-width,  height, length),
            new THREE.Vector3(-width, -height, length),
            new THREE.Vector3( width, -height, length),
        ];

        // Faces
        {
            let material = new THREE.MeshPhongMaterial({color: 0x00ff00});
            material.transparent = true;
            material.opacity = 0.8;

            let geometry = new THREE.BufferGeometry();
            let faces = [
                // Sides of the pyramid
                [0, 2, 1],
                [0, 3, 2],
                [0, 4, 3],
                [0, 1, 4],

                // Base of the pyramid
                [1, 2, 3],
                [1, 3, 4],
            ];

            let buffer = new Float32Array(3 * 3 * faces.length);

            for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
                let face = faces[faceIndex];
                buffer[faceIndex * 3 * 3 + 0] = vertices[face[0]].x;
                buffer[faceIndex * 3 * 3 + 1] = vertices[face[0]].y;
                buffer[faceIndex * 3 * 3 + 2] = vertices[face[0]].z;

                buffer[faceIndex * 3 * 3 + 3] = vertices[face[1]].x;
                buffer[faceIndex * 3 * 3 + 4] = vertices[face[1]].y;
                buffer[faceIndex * 3 * 3 + 5] = vertices[face[1]].z;

                buffer[faceIndex * 3 * 3 + 6] = vertices[face[2]].x;
                buffer[faceIndex * 3 * 3 + 7] = vertices[face[2]].y;
                buffer[faceIndex * 3 * 3 + 8] = vertices[face[2]].z;
            }


            geometry.setAttribute('position', new THREE.BufferAttribute(buffer, 3));
            const mesh = new THREE.Mesh(geometry, material);
            mesh.layers.enable(1);
            this.mesh = mesh;
            this.add(mesh);
        }

        // Lines
        {
            let material = new THREE.LineBasicMaterial({color: 0x990000});
            let geometry = new THREE.BufferGeometry();

            let lines = [
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [1, 2],
                [2, 3],
                [3, 4],
                [4, 1],
            ];

            let buffer = new Float32Array(2 * 3 * lines.length);

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex];
                buffer[lineIndex * 2 * 3 + 0] = vertices[line[0]].x;
                buffer[lineIndex * 2 * 3 + 1] = vertices[line[0]].y;
                buffer[lineIndex * 2 * 3 + 2] = vertices[line[0]].z;

                buffer[lineIndex * 2 * 3 + 3] = vertices[line[1]].x;
                buffer[lineIndex * 2 * 3 + 4] = vertices[line[1]].y;
                buffer[lineIndex * 2 * 3 + 5] = vertices[line[1]].z;
            }


            geometry.setAttribute('position', new THREE.BufferAttribute(buffer, 3));
            const mesh = new THREE.Line(geometry, material);
            mesh.layers.enable(1);
            this.lines = mesh;

            this.add(mesh);
        }
    }

    /**
     * Changes the style of the model to a nice hovered style.
     */
    hover(): void {
        this.mesh.material.opacity = 1;
        this.lines.material.color.setHex(0xffffff);
    }

    /**
     * Restores original style.
     */
    unHover(): void {
        this.mesh.material.opacity = 0.8;
        this.lines.material.color.setHex(0x999999);
    }

}

