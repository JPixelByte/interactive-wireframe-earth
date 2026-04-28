import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import getStarfield from "./src/getStarfield.js";
import { drawThreeGeo } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;

const settings = {
  autoRotate: false,
  speed: 0.8,
};

const gui = new GUI({ width: 280 });
gui.add(settings, 'autoRotate').name('Auto Rotate').onChange(enabled => setAutoRotateState(enabled));
gui.add(settings, 'speed', 0.1, 4, 0.05).name('Rotate Speed').onChange(value => {
  controls.autoRotateSpeed = value;
});
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '116px';
gui.domElement.style.right = '24px';
gui.domElement.style.zIndex = '10';

const geometry = new THREE.SphereGeometry(2);
const lineMat = new THREE.LineBasicMaterial({ 
  color: 0xffffff,
  transparent: true,
  opacity: 0.4, 
});
const edges = new THREE.EdgesGeometry(geometry, 1);
const line = new THREE.LineSegments(edges, lineMat);
scene.add(line);

const stars = getStarfield({ numStars: 1000, fog: false });
scene.add(stars);

// check here for more datasets ...
// https://github.com/martynafford/natural-earth-geojson
// non-geojson datasets: https://www.naturalearthdata.com/downloads/
fetch('./geojson/ne_110m_land.json')
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);
    const countries = drawThreeGeo({
      json: data,
      radius: 2,
      materialOptions: {
        color: 0x80FF80,
      },
    });
    scene.add(countries);
  });

function updateHUD() {
  const hudStatus = document.getElementById('hudStatus');
  if (!hudStatus) return;
  hudStatus.textContent = controls.autoRotate ? 'ON' : 'OFF';
  autoRotateButton.classList.toggle('active', controls.autoRotate);
  autoRotateButton.textContent = controls.autoRotate ? 'AUTO-ROTATE ON' : 'AUTO-ROTATE OFF';
}

function setAutoRotateState(enabled) {
  controls.autoRotate = enabled;
  settings.autoRotate = enabled;
  updateHUD();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}

const autoRotateButton = document.getElementById('autoRotateButton');
autoRotateButton.addEventListener('click', () => {
  setAutoRotateState(!controls.autoRotate);
});

const astronautToggleButton = document.getElementById('astronautToggleButton');
const astronautElement = document.getElementById('astronaut_hovering_small');

let astronautActive = false;

function updateAstronautButton() {
  astronautToggleButton.classList.toggle('active', astronautActive);
  astronautToggleButton.textContent = astronautActive ? 'ASTRONAUT ON' : 'ASTRONAUT OFF';
}

astronautToggleButton.addEventListener('click', () => {
  astronautActive = !astronautActive;
  if (astronautActive) {
    astronautElement.classList.add('AstronautHoverSmall');
    astronautElement.classList.remove('hidden');
  } else {
    astronautElement.classList.remove('AstronautHoverSmall');
    astronautElement.classList.add('hidden');
  }
  updateAstronautButton();
});

updateAstronautButton();
setAutoRotateState(false);
animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);