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

// Audio setup
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
let audioLoaded = false;
audioLoader.load('./src/cosmicsuite.mp3', function(buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.4);
  audioLoaded = true;
  const audioButton = document.getElementById('audioButton');
  if (audioButton) {
    audioButton.disabled = false;
  }
});

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

const audioButton = document.getElementById('audioButton');
if (audioButton) {
  audioButton.disabled = true;
  audioButton.addEventListener('click', () => {
    if (!audioLoaded) return;
    if (sound.isPlaying) {
      sound.pause();
      audioButton.classList.remove('active');
    } else {
      sound.play();
      audioButton.classList.add('active');
    }
  });

  // GSAP particle effect on hover
  audioButton.addEventListener('mouseenter', () => {
    const buttonRect = audioButton.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;

    const particles = ['🦋', '🦋', '⭐',  '🌸', '🦋', '✨', '🌟', '💫'];
    const numParticles = 12;

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.textContent = particles[Math.floor(Math.random() * particles.length)];
      particle.style.position = 'fixed';
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.fontSize = `${1 + Math.random() * 2}rem`;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '11';
      particle.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
      document.body.appendChild(particle);

      // Random radial pattern for more varied directions
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 150;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      gsap.to(particle, {
        x: endX - centerX,
        y: endY - centerY,
        rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
        scale: 0,
        opacity: 0,
        duration: 3 + Math.random() * 1,
        ease: 'power2.out',
        onComplete: () => {
          if (document.body.contains(particle)) {
            document.body.removeChild(particle);
          }
        }
      });
    }
  });
}

updateAstronautButton();
setAutoRotateState(false);
animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);