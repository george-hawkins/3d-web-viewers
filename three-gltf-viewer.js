// These are the three.js CDN URLs covered by https://threejs.org/docs/index.html#manual/en/introduction/Installation
import * as THREE from 'https://cdn.skypack.dev/three@0.130.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/RGBELoader.js';
import {RoughnessMipmapper} from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/utils/RoughnessMipmapper.js';

let camera, scene, renderer;

// Javascript adapted from https://raw.githubusercontent.com/mrdoob/three.js/r130/examples/webgl_loader_gltf.html
function gltfViewer(containerId, gltfPath, hdrPath) {
    const gltf = split(gltfPath);
    const hdr = split(hdrPath);
    const container = document.getElementById(containerId);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(-1.8, 0.6, 2.7);

    scene = new THREE.Scene();

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath(hdr.path)
        .load(hdr.filename, function (texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();

            render();

            // model

            // use of RoughnessMipmapper is optional
            const roughnessMipmapper = new RoughnessMipmapper(renderer);

            const loader = new GLTFLoader().setPath(gltf.path);
            loader.load(gltf.filename, function (gltf) {
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        roughnessMipmapper.generateMipmaps(child.material);
                    }
                });

                scene.add(gltf.scene);

                roughnessMipmapper.dispose();

                render();
            });
        });

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, -0.2);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}

function render() {
    renderer.render(scene, camera);
}

function split(path) {
    const parts = path.split('/');
    const filename = parts.pop();
    const dir = parts.length == 0 ? './' : parts.join('/') + '/';
    return {
        'path': dir,
        'filename': filename
    }
}

export { gltfViewer };