import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Sun,
  Wind,
  BatteryCharging,
  Lightbulb,
  Usb,
  Armchair,
  Play,
  Pause,
  RotateCcw,
  Tag,
  Zap,
  UserPlus,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Menu,
  X,
  Copy,
  Check,
  Download,
  RefreshCw,
  Clock,
  Info,
  Sparkles,
  Smartphone,
} from 'lucide-react';

// ============================================================================
// 1. DEMONSTRATION DATA & COMPONENT DEFINITIONS
// ============================================================================
const SYSTEM_COMPONENTS = {
  turbine: {
    id: 'turbine',
    name: 'Wind Turbine',
    shortLabel: 'Wind turbine',
    dotColor: '#38bdf8',
    stage: 'Collect',
    functionText:
      'Converts wind energy into electricity, providing a complementary energy source when sunlight is limited and wind conditions are suitable.',
    roleText:
      'Mounted atop the main structural pole to capture elevated mountain breezes in Macopoy, Mascap. Feeds into the wind power conversion and charge controller stage.',
    benefitText:
      'Supports continuous battery charging during cloudy weather, late afternoons, and nighttime mountain wind conditions.',
    demoStatus: 'Spinning in simulated mountain breeze (Concept Mode)',
  },
  solar: {
    id: 'solar',
    name: 'Solar Panel + Tracker',
    shortLabel: 'Solar panel + tracker',
    dotColor: '#f59e0b',
    stage: 'Collect',
    functionText:
      'Converts sunlight into electrical energy. The tracker is intended to orient the panel toward the sun to improve solar collection.',
    roleText:
      'Forms the primary daytime harvesting array and overhead canopy above the roadside bench, connected to the solar MPPT charge controller.',
    benefitText:
      'Maximizes daytime energy harvesting while providing physical shade and weather shelter for commuters sitting on the bench below.',
    demoStatus: 'Tracking sun angle based on selected time of day',
  },
  lamp: {
    id: 'lamp',
    name: 'LED Streetlight',
    shortLabel: 'LED lamp',
    dotColor: '#fde047',
    stage: 'Use',
    functionText:
      'Provides nighttime road illumination. The photocell is intended to switch the lamp on at low ambient light levels and off when daylight returns.',
    roleText:
      'Overhangs the rough roadside lane from the top of the green structural pole. Operates automatically via hardware photocell sensor independently of website connectivity.',
    benefitText:
      'Improves nighttime visibility along unlit rough road segments in Macopoy for students, workers, and residents walking early in the morning or late at night.',
    demoStatus: 'Photocell-controlled (Automatic ON from 6:00 PM to 5:45 AM)',
  },
  battery: {
    id: 'battery',
    name: 'Battery + USB Charging Station',
    shortLabel: 'Battery + USB ports',
    dotColor: '#34d399',
    stage: 'Store & Use',
    functionText:
      'Stores energy in a LiFePO₄ battery enclosure for later use and supplies the public USB charging station through appropriate power-conversion and protection circuitry.',
    roleText:
      'Weatherproof yellow pole-mounted enclosure housing the LiFePO₄ battery, solar/wind charge controllers, DC breaker, inverter/buck conversion stage, and public USB ports.',
    benefitText:
      'Allows residents, students, and travelers to charge mobile phones outdoors at any time of day or night.',
    demoStatus: 'Simulated Demo Mode — Hardware telemetry integration pending',
  },
  bench: {
    id: 'bench',
    name: 'Public Roadside Bench',
    shortLabel: 'Bench',
    dotColor: '#fb923c',
    stage: 'Use',
    functionText:
      'Provides a dedicated, shaded place for residents, students, workers, and passersby to sit and rest beside the road.',
    roleText:
      'Positioned beneath the protective solar canopy structure immediately adjacent to the pole-mounted USB charging ports.',
    benefitText:
      'Offers a safe stopping point along long walking routes in Macopoy where transportation is limited and no public seating currently exists.',
    demoStatus: 'Publicly accessible 24/7 (Use "Add person" button to preview usage)',
  },
};

const DEMO_SCENARIOS = {
  night_normal: {
    id: 'night_normal',
    label: 'Demo: Nighttime Operational',
    isSimulated: true,
    lastUpdated: 'Simulated Prototype Preview (No Live ESP32 Telemetry)',
    streetlight: {
      status: 'Operational',
      badgeTone: 'success',
      summary: 'Photocell nighttime state (Simulated demonstration)',
      note: 'Actual operational verification requires current/light feedback hardware from the luminaire circuit.',
    },
    charging: {
      status: 'Available',
      badgeTone: 'success',
      summary: 'USB charging enclosure active (Simulated demonstration)',
      note: 'Port availability and in-use detection depend on USB current-sensing hardware in the final ESP32 integration.',
    },
  },
  in_use: {
    id: 'in_use',
    label: 'Demo: Commuter Charging Phone',
    isSimulated: true,
    lastUpdated: 'Simulated Prototype Preview (Port Load Detected)',
    streetlight: {
      status: 'Operational',
      badgeTone: 'success',
      summary: 'Illuminating rough road segment (Simulated)',
      note: 'Controlled locally by the physical photocell sensor independently of the web dashboard.',
    },
    charging: {
      status: 'In use',
      badgeTone: 'info',
      summary: 'Active 5V USB draw detected on Port 1 (Simulated)',
      note: 'Demonstrates how the public status card responds when a commuter plugs a phone into the pole enclosure.',
    },
  },
  day_standby: {
    id: 'day_standby',
    label: 'Demo: Daytime Solar Charging',
    isSimulated: true,
    lastUpdated: 'Simulated Prototype Preview (Daylight Mode)',
    streetlight: {
      status: 'Not operating',
      badgeTone: 'neutral',
      summary: 'Daytime standby — Photocell keeps lamp off in daylight',
      note: 'Lamp automatically remains off during daytime while solar and wind controllers charge the LiFePO₄ battery.',
    },
    charging: {
      status: 'Available',
      badgeTone: 'success',
      summary: 'Public USB ports ready for daytime travelers',
      note: 'Supplied by stored battery energy and regulated DC conversion.',
    },
  },
  unverified: {
    id: 'unverified',
    label: 'Demo: Hardware Sensor Unverified',
    isSimulated: true,
    lastUpdated: 'Awaiting sensor confirmation from ESP32 node',
    streetlight: {
      status: 'Unknown',
      badgeTone: 'warning',
      summary: 'Luminaire feedback sensor not yet verified',
      note: 'The website does not claim the lamp is operational solely from a software schedule without physical feedback.',
    },
    charging: {
      status: 'Unknown',
      badgeTone: 'warning',
      summary: 'USB port current sensor not yet verified',
      note: 'Physical USB ports may still operate via local hardware protection even when telemetry is unverified.',
    },
  },
  offline: {
    id: 'offline',
    label: 'Demo: ESP32 Telemetry Offline',
    isSimulated: true,
    lastUpdated: 'Last packet > 15 mins ago (Stale / Offline state)',
    streetlight: {
      status: 'Offline',
      badgeTone: 'danger',
      summary: 'Status unavailable — No recent data from ESP32',
      note: 'Automatic streetlight switching via the physical photocell continues to operate independently of website connectivity.',
    },
    charging: {
      status: 'Offline',
      badgeTone: 'danger',
      summary: 'Status unavailable — Telemetry link offline',
      note: 'Local overcurrent protection and DC regulation operate independently of remote monitoring.',
    },
  },
};

const CAMERA_PRESETS = [
  { id: 'whole', label: 'Whole view', pos: [0.8, 3.8, 12.2], target: [0.3, 2.7, 0.7] },
  { id: 'solar', label: 'Solar panel', pos: [1.5, 4.9, 6.4], target: [0.8, 3.3, -0.4] },
  { id: 'turbine', label: 'Wind turbine', pos: [-2.8, 6.2, 5.2], target: [-1.6, 5.2, -0.4] },
  { id: 'lamp', label: 'LED light', pos: [-3.4, 5.4, 5.8], target: [-1.6, 4.2, 2.2] },
  { id: 'battery', label: 'Battery and charging', pos: [-0.7, 2.4, 3.3], target: [-1.5, 1.85, -0.35] },
  { id: 'bench', label: 'Bench', pos: [1.2, 2.1, 4.2], target: [0.65, 1.2, -0.45] },
];

const RESEARCHERS = [
  'Banania, Franzine Jade A.',
  'Cagalitan, John Paul B.',
  'Cornilla, Jamile',
  'Lao, Pauleen Racy Y.',
  'Maghanoy, John Bryan Lei T.',
  'Teoxon, Joshua N.',
];

// ============================================================================
// 2. HELPER UTILITIES (TIME FORMATTING & PROCEDURAL TEXTURES)
// ============================================================================
function formatClock(hoursFloat) {
  const normalized = ((hoursFloat % 24) + 24) % 24;
  let totalMinutes = Math.round(normalized * 60);
  if (totalMinutes >= 1440) totalMinutes = 0;
  const h24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getTimePeriodInfo(hoursFloat) {
  const h = ((hoursFloat % 24) + 24) % 24;
  if (h >= 5.5 && h < 12) return { label: 'Morning', isNight: false, isDusk: h < 6.3 };
  if (h >= 12 && h < 17.2) return { label: 'Afternoon', isNight: false, isDusk: false };
  if (h >= 17.2 && h < 18.6) return { label: 'Sunset', isNight: h >= 18.0, isDusk: true };
  return { label: 'Night', isNight: true, isDusk: false };
}

function createRoughRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Earthy gravel base
  ctx.fillStyle = '#7c6855';
  ctx.fillRect(0, 0, 512, 256);

  // Soft soil patches
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 18;
    const tones = ['#6e5a47', '#89735e', '#614e3d', '#947e69'];
    ctx.fillStyle = tones[i % tones.length];
    ctx.globalAlpha = 0.24;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Worn compacted tire tracks / ruts along the rough road
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#574536';
  ctx.fillRect(0, 68, 512, 32);
  ctx.fillRect(0, 156, 512, 32);

  // Pebbles & crushed stones
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const w = 1 + Math.random() * 3.8;
    const h = 1 + Math.random() * 2.8;
    const pebbles = ['#4a3c30', '#a3917e', '#5d4c3c', '#8c7a67', '#3d3126'];
    ctx.fillStyle = pebbles[i % pebbles.length];
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 1.4);
  return texture;
}

function createSolarGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#102a4c';
  ctx.fillRect(0, 0, 512, 256);

  // Deep photovoltaic cells
  const cols = 12;
  const rows = 6;
  const pad = 4;
  const cellW = (512 - pad * (cols + 1)) / cols;
  const cellH = (256 - pad * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (cellW + pad);
      const y = pad + r * (cellH + pad);
      ctx.fillStyle = '#173763';
      ctx.fillRect(x, y, cellW, cellH);

      // Fine silver busbar lines
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.38)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + cellW * 0.33, y);
      ctx.lineTo(x + cellW * 0.33, y + cellH);
      ctx.moveTo(x + cellW * 0.66, y);
      ctx.lineTo(x + cellW * 0.66, y + cellH);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ============================================================================
// 3. THREE.JS INTERACTIVE 3D INSTALLATION SCENE
// ============================================================================
function StreetlightThreeScene({
  timeOfDay,
  isPlaying,
  setIsPlaying,
  speedMultiplier,
  setSpeedMultiplier,
  setTimeOfDay,
  activePreset,
  onSelectPreset,
  showLabels,
  setShowLabels,
  showEnergyFlow,
  setShowEnergyFlow,
  showPerson,
  setShowPerson,
  selectedComponent,
  onSelectComponent,
  onResetScene,
}) {
  const mountRef = useRef(null);
  const [webglError, setWebglError] = useState(false);
  const [labelPositions, setLabelPositions] = useState({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Refs synced into the requestAnimationFrame loop without re-creating the scene
  const stateRef = useRef({
    timeOfDay,
    showLabels,
    showEnergyFlow,
    showPerson,
    selectedComponent,
    isMobile: false,
  });

  useEffect(() => {
    stateRef.current.timeOfDay = timeOfDay;
    stateRef.current.showLabels = showLabels;
    stateRef.current.showEnergyFlow = showEnergyFlow;
    stateRef.current.showPerson = showPerson;
    stateRef.current.selectedComponent = selectedComponent;
  }, [timeOfDay, showLabels, showEnergyFlow, showPerson, selectedComponent]);

  const cameraRigRef = useRef({
    spherical: new THREE.Spherical(12.2, 1.32, 0.04),
    target: new THREE.Vector3(0.3, 2.7, 0.7),
    desiredSpherical: new THREE.Spherical(12.2, 1.32, 0.04),
    desiredTarget: new THREE.Vector3(0.3, 2.7, 0.7),
    isDragging: false,
    prevPointer: { x: 0, y: 0 },
    pointerDownPos: { x: 0, y: 0 },
    pinchStartDist: 0,
    pinchStartRadius: 12.2,
  });

  // Update camera target smoothly when preset or mobile portrait ratio changes
  useEffect(() => {
    const found = CAMERA_PRESETS.find((p) => p.id === activePreset) || CAMERA_PRESETS[0];
    const offset = new THREE.Vector3(...found.pos).sub(new THREE.Vector3(...found.target));
    const sph = new THREE.Spherical().setFromVector3(offset);
    const mobileScale = isMobileViewport ? 1.28 : 1.0;
    sph.radius *= mobileScale;

    cameraRigRef.current.desiredSpherical.copy(sph);
    cameraRigRef.current.desiredTarget.set(...found.target);
  }, [activePreset, isMobileViewport]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (err) {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#cfe4db');
    scene.fog = new THREE.FogExp2('#cfe4db', 0.016);

    const isNarrow = container.clientWidth < 640;
    setIsMobileViewport(isNarrow);
    stateRef.current.isMobile = isNarrow;

    const camera = new THREE.PerspectiveCamera(
      isNarrow ? 52 : 43,
      container.clientWidth / container.clientHeight,
      0.1,
      160
    );

    // ------------------------------------------------------------------------
    // LIGHTING
    // ------------------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight('#e2f1ec', '#4a6b49', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fff8e7', 1.45);
    sunLight.position.set(16, 24, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 65;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // ------------------------------------------------------------------------
    // ENVIRONMENT: RURAL BARANGAY MACOPOY, MASCAP ROADSIDE & ROUGH ROAD
    // ------------------------------------------------------------------------
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const grassMat = new THREE.MeshStandardMaterial({ color: '#6ea158', roughness: 0.94 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    envGroup.add(ground);

    // Distant rolling hills of Rodriguez, Rizal
    const hillMat = new THREE.MeshStandardMaterial({ color: '#568547', roughness: 0.95 });
    const hillsData = [
      { x: -24, z: -26, r: 18, sy: 0.42 },
      { x: 14, z: -32, r: 24, sy: 0.48 },
      { x: 38, z: -22, r: 16, sy: 0.38 },
      { x: -42, z: -18, r: 15, sy: 0.35 },
    ];
    hillsData.forEach((h) => {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(h.r, 24, 16), hillMat);
      hill.scale.set(1.3, h.sy, 0.9);
      hill.position.set(h.x, -1.2, h.z);
      envGroup.add(hill);
    });

    // Rural rough dirt & gravel road running along X-axis in FRONT of the installation (Z = 4.6)
    const roadTex = createRoughRoadTexture();
    const roughRoadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.96,
      metalness: 0.02,
    });

    const roadGeo = new THREE.PlaneGeometry(90, 5.4, 70, 10);
    const posAttr = roadGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const bump = Math.sin(vx * 0.75) * Math.cos(vy * 1.4) * 0.032;
      posAttr.setZ(i, bump);
    }
    roadGeo.computeVertexNormals();

    const roughRoad = new THREE.Mesh(roadGeo, roughRoadMat);
    roughRoad.rotation.x = -Math.PI / 2;
    roughRoad.position.set(0, 0.02, 4.6);
    roughRoad.receiveShadow = true;
    envGroup.add(roughRoad);

    // Soft dirt/gravel transition shoulders along the rough road
    const shoulderMat = new THREE.MeshStandardMaterial({ color: '#8a755d', roughness: 0.98 });
    const northShoulder = new THREE.Mesh(new THREE.PlaneGeometry(90, 1.3), shoulderMat);
    northShoulder.rotation.x = -Math.PI / 2;
    northShoulder.position.set(0, 0.012, 1.75);
    northShoulder.receiveShadow = true;
    envGroup.add(northShoulder);

    const southShoulder = new THREE.Mesh(new THREE.PlaneGeometry(90, 1.3), shoulderMat);
    southShoulder.rotation.x = -Math.PI / 2;
    southShoulder.position.set(0, 0.012, 7.45);
    southShoulder.receiveShadow = true;
    envGroup.add(southShoulder);

    // Compacted gravel/concrete foundation pad under the installation (off the road!)
    const padMat = new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: 0.9 });
    const basePad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 2.7), padMat);
    basePad.position.set(0.35, 0.04, -0.45);
    basePad.receiveShadow = true;
    envGroup.add(basePad);

    // Scattered roadside stones for rural realism
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.92 });
    const stoneCoords = [
      [-3.4, 1.6],
      [-2.8, 1.9],
      [3.5, 1.65],
      [4.2, 1.85],
      [-5.2, 7.4],
      [2.6, 7.5],
      [6.4, 1.7],
      [-6.8, 1.75],
    ];
    stoneCoords.forEach(([sx, sz], idx) => {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 + (idx % 3) * 0.04, 0), stoneMat);
      stone.scale.set(1.2, 0.55, 0.95);
      stone.position.set(sx, 0.05, sz);
      stone.castShadow = true;
      envGroup.add(stone);
    });

    // Modest barangay houses in the background with warm nighttime windows
    const houseWindows = [];
    const buildHouse = (hx, hz, rotY) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(hx, 0, hz);
      hGroup.rotation.y = rotY;

      const walls = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.1, 2.6),
        new THREE.MeshStandardMaterial({ color: '#d6d0c4', roughness: 0.88 })
      );
      walls.position.y = 1.05;
      walls.castShadow = true;
      walls.receiveShadow = true;
      hGroup.add(walls);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.55, 1.25, 4),
        new THREE.MeshStandardMaterial({ color: '#8f4733', roughness: 0.82 })
      );
      roof.position.y = 2.72;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      hGroup.add(roof);

      const winMat = new THREE.MeshBasicMaterial({ color: '#475569' });
      const win1 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), winMat);
      win1.position.set(-0.65, 1.15, 1.31);
      const win2 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), winMat);
      win2.position.set(0.65, 1.15, 1.31);
      hGroup.add(win1, win2);
      houseWindows.push(win1, win2);

      envGroup.add(hGroup);
    };

    buildHouse(-12.5, -6.5, 0.28);
    buildHouse(-17.5, -2.2, 0.52);
    buildHouse(14.5, -8.2, -0.35);

    // Rural trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: '#2e5a36', roughness: 0.85 });
    const treePositions = [
      [-8.5, -4.2, 1.1],
      [-14.2, -10.5, 1.35],
      [-6.2, -9.0, 0.95],
      [9.4, -4.8, 1.15],
      [12.8, -11.0, 1.3],
      [6.8, -8.5, 0.9],
    ];
    treePositions.forEach(([tx, tz, sc]) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(tx, 0, tz);
      tGroup.scale.setScalar(sc);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.5, 8), trunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      tGroup.add(trunk);

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.2, 8), foliageMat);
      cone1.position.y = 2.2;
      cone1.castShadow = true;
      tGroup.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.8, 8), foliageMat);
      cone2.position.y = 3.2;
      cone2.castShadow = true;
      tGroup.add(cone2);

      envGroup.add(tGroup);
    });

    // ------------------------------------------------------------------------
    // HYBRID SOLAR-WIND STREETLIGHT INSTALLATION (MATCHING IMAGE 3)
    // Placed on the roadside foundation pad at Z = -0.45 facing the rough road (+Z)
    // ------------------------------------------------------------------------
    const hubGroup = new THREE.Group();
    scene.add(hubGroup);

    const selectableMeshes = [];
    const registerSelectable = (mesh, componentId) => {
      mesh.userData.componentId = componentId;
      selectableMeshes.push(mesh);
    };

    const greenMetalMat = new THREE.MeshStandardMaterial({
      color: '#2e8540',
      roughness: 0.42,
      metalness: 0.28,
    });
    const darkFrameMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.5,
      metalness: 0.4,
    });

    // 1. Tall Green Main Pole on the left side (X = -1.65, Z = -0.45)
    const mainPole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 5.5, 20), greenMetalMat);
    mainPole.position.set(-1.65, 2.75, -0.45);
    mainPole.castShadow = true;
    mainPole.receiveShadow = true;
    hubGroup.add(mainPole);

    const poleBaseFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.14, 20), darkFrameMat);
    poleBaseFlange.position.set(-1.65, 0.08, -0.45);
    hubGroup.add(poleBaseFlange);

    // 2. Green Canopy Support Frame (Left post beside pole, Right post, Horizontal Crossbar, Arched Roof Rib)
    const leftCanopyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.95, 12), greenMetalMat);
    leftCanopyPost.position.set(-1.25, 1.48, -0.45);
    leftCanopyPost.castShadow = true;
    hubGroup.add(leftCanopyPost);

    const rightCanopyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.95, 12), greenMetalMat);
    rightCanopyPost.position.set(2.55, 1.48, -0.45);
    rightCanopyPost.castShadow = true;
    hubGroup.add(rightCanopyPost);

    // Horizontal green support beam spanning from main pole across canopy posts
    const topCrossbar = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.08, 0.12), greenMetalMat);
    topCrossbar.position.set(0.52, 2.95, -0.45);
    topCrossbar.castShadow = true;
    hubGroup.add(topCrossbar);

    // Shallow green triangular/arched truss above the crossbar (from Image 3)
    const trussLeft = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 0.1), greenMetalMat);
    trussLeft.position.set(-0.4, 3.04, -0.45);
    trussLeft.rotation.z = 0.06;
    hubGroup.add(trussLeft);

    const trussRight = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 0.1), greenMetalMat);
    trussRight.position.set(1.65, 3.04, -0.45);
    trussRight.rotation.z = -0.06;
    hubGroup.add(trussRight);

    // 3. Solar Panel Roof Canopy + Dual-Axis / Tilt Tracker Mechanism
    const solarPivotGroup = new THREE.Group();
    solarPivotGroup.position.set(0.65, 3.22, -0.45);
    hubGroup.add(solarPivotGroup);

    const trackerActuator = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.28, 14), darkFrameMat);
    trackerActuator.position.set(0, -0.1, 0);
    solarPivotGroup.add(trackerActuator);

    const whiteFrameMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.35, metalness: 0.2 });
    const solarPanelFrame = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.09, 1.85), whiteFrameMat);
    solarPanelFrame.castShadow = true;
    solarPanelFrame.receiveShadow = true;
    registerSelectable(solarPanelFrame, 'solar');
    solarPivotGroup.add(solarPanelFrame);

    const solarTex = createSolarGridTexture();
    const solarCellsMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.25,
      metalness: 0.45,
    });
    const solarCellsTop = new THREE.Mesh(new THREE.PlaneGeometry(4.28, 1.68), solarCellsMat);
    solarCellsTop.rotation.x = -Math.PI / 2;
    solarCellsTop.position.y = 0.048;
    registerSelectable(solarCellsTop, 'solar');
    solarPivotGroup.add(solarCellsTop);

    // 4. Wind Turbine Mounted at Top of Main Pole (X = -1.65, Y = 5.38, Z = -0.45)
    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(-1.65, 5.38, -0.45);
    hubGroup.add(turbineGroup);

    const turbineMast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.55, 14), whiteFrameMat);
    turbineMast.position.y = -0.12;
    registerSelectable(turbineMast, 'turbine');
    turbineGroup.add(turbineMast);

    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.58, 16), whiteFrameMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.castShadow = true;
    registerSelectable(nacelle, 'turbine');
    turbineGroup.add(nacelle);

    const tailVane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.45), whiteFrameMat);
    tailVane.position.set(0, 0.08, -0.42);
    registerSelectable(tailVane, 'turbine');
    turbineGroup.add(tailVane);

    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 0, 0.32);
    turbineGroup.add(rotorGroup);

    const hubNose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 16), whiteFrameMat);
    hubNose.rotation.x = Math.PI / 2;
    hubNose.position.z = 0.08;
    registerSelectable(hubNose, 'turbine');
    rotorGroup.add(hubNose);

    const bladeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.2 });
    for (let i = 0; i < 3; i++) {
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = (i * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.28, 0.03), bladeMat);
      blade.position.y = 0.66;
      blade.rotation.y = 0.22;
      blade.castShadow = true;
      registerSelectable(blade, 'turbine');
      bladeHolder.add(blade);
      rotorGroup.add(bladeHolder);
    }

    // 5. Overhanging Green LED Streetlight Housing Aimed Strictly at the Rough Road (+Z)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.65, 5.48, 0.25);
    hubGroup.add(lampGroup);

    // Green rectangular overhang hood extending toward the rough road (matching Image 3)
    const lampHood = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 1.65), greenMetalMat);
    lampHood.position.set(0, 0.05, 0.35);
    lampHood.rotation.x = 0.14; // pitched slightly toward the rough road
    lampHood.castShadow = true;
    registerSelectable(lampHood, 'lamp');
    lampGroup.add(lampHood);

    const lampLensMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      emissive: '#fef08a',
      emissiveIntensity: 0,
      roughness: 0.2,
    });
    const lampLens = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 1.32), lampLensMat);
    lampLens.position.set(0, -0.04, 0.38);
    lampLens.rotation.x = 0.14;
    registerSelectable(lampLens, 'lamp');
    lampGroup.add(lampLens);

    // Nighttime LED SpotLight aimed directly onto the rough road (Z = 4.6), NOT on the bench
    const streetSpotLight = new THREE.SpotLight('#fff3b0', 0, 22, Math.PI / 3.4, 0.55, 1.4);
    streetSpotLight.position.set(-1.65, 5.38, 0.95);
    streetSpotLight.target.position.set(-1.1, 0.02, 4.75);
    scene.add(streetSpotLight);
    scene.add(streetSpotLight.target);

    // Volumetric light cone aimed strictly forward onto the rough road
    const lightConeMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const lightCone = new THREE.Mesh(new THREE.ConeGeometry(2.65, 5.9, 28, 1, true), lightConeMat);
    lightCone.position.set(-1.38, 2.55, 2.85);
    lightCone.rotation.x = -0.62;
    lightCone.rotation.z = -0.08;
    scene.add(lightCone);

    // Warm light pool on the rough road surface at night
    const roadGlowMat = new THREE.MeshBasicMaterial({
      color: '#fde047',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const roadGlowPool = new THREE.Mesh(new THREE.CircleGeometry(3.1, 32), roadGlowMat);
    roadGlowPool.rotation.x = -Math.PI / 2;
    roadGlowPool.position.set(-1.15, 0.04, 4.65);
    scene.add(roadGlowPool);

    // 6. Yellow LiFePO₄ Battery & Public USB Charging Enclosure on the Main Pole
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-1.42, 1.82, -0.45);
    hubGroup.add(batteryGroup);

    // Blue/grey mounting brackets behind the yellow box
    const bracketMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.4 });
    const mountPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.44), bracketMat);
    mountPlate.position.set(-0.22, 0, 0);
    batteryGroup.add(mountPlate);

    const yellowBoxMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.35,
      metalness: 0.18,
    });
    const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.18, 0.52), yellowBoxMat);
    batteryBox.castShadow = true;
    batteryBox.receiveShadow = true;
    registerSelectable(batteryBox, 'battery');
    batteryGroup.add(batteryBox);

    // Dark recessed USB interface panel on the front (+Z) and right side (+X)
    const usbPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.34, 0.04),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 })
    );
    usbPanel.position.set(0.02, 0.22, 0.25);
    registerSelectable(usbPanel, 'battery');
    batteryGroup.add(usbPanel);

    // Glowing green LED USB port indicators
    const usbLedMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    for (let u = 0; u < 2; u++) {
      const portLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.02), usbLedMat);
      portLed.position.set(-0.04 + u * 0.1, 0.26, 0.27);
      batteryGroup.add(portLed);
    }

    // Miniature Public QR Code Signage Plaque on the front door of the yellow box
    const qrPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.26),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    qrPlaque.position.set(0.02, -0.18, 0.265);
    registerSelectable(qrPlaque, 'battery');
    batteryGroup.add(qrPlaque);

    const qrInner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.15),
      new THREE.MeshBasicMaterial({ color: '#0f172a' })
    );
    qrInner.position.set(0.02, -0.16, 0.268);
    batteryGroup.add(qrInner);

    // 7. Orange Slatted Public Bench Underneath the Solar Canopy (Matching Image 3)
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0.68, 0, -0.45);
    hubGroup.add(benchGroup);

    const orangeWoodMat = new THREE.MeshStandardMaterial({
      color: '#ea580c',
      roughness: 0.48,
      metalness: 0.08,
    });

    // 4 vertical cylindrical legs + 2 tall backrest posts
    const legOffsets = [
      [-1.35, 0.32],
      [1.35, 0.32],
      [-1.35, -0.32],
      [1.35, -0.32],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const isBack = lz < 0;
      const h = isBack ? 1.52 : 0.78;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, h, 14), orangeWoodMat);
      post.position.set(lx, h / 2, lz);
      post.castShadow = true;
      registerSelectable(post, 'bench');
      benchGroup.add(post);
    });

    // Bench seat plank
    const seatPlank = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.09, 0.74), orangeWoodMat);
    seatPlank.position.set(0, 0.56, 0.02);
    seatPlank.castShadow = true;
    seatPlank.receiveShadow = true;
    registerSelectable(seatPlank, 'bench');
    benchGroup.add(seatPlank);

    // Armrest bars on left and right sides
    [-1.35, 1.35].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.68, 12), orangeWoodMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(ax, 0.82, 0.0);
      arm.castShadow = true;
      registerSelectable(arm, 'bench');
      benchGroup.add(arm);
    });

    // 4 horizontal backrest rails (matching Image 3)
    [0.84, 1.03, 1.22, 1.41].forEach((by) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.7, 12), orangeWoodMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, by, -0.32);
      rail.castShadow = true;
      registerSelectable(rail, 'bench');
      benchGroup.add(rail);
    });

    // ------------------------------------------------------------------------
    // 8. INTERACTIVE PERSON SEATED ON BENCH USING CHARGING STATION
    // ------------------------------------------------------------------------
    const personGroup = new THREE.Group();
    // Seated on the left side of the bench, close to the yellow USB charging station
    personGroup.position.set(-0.22, 0, -0.42);
    personGroup.visible = stateRef.current.showPerson;
    hubGroup.add(personGroup);

    const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b78', roughness: 0.65 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.75 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.24), shirtMat);
    torso.position.set(0, 0.9, -0.04);
    torso.rotation.x = 0.08;
    torso.castShadow = true;
    registerSelectable(torso, 'bench');
    personGroup.add(torso);

    // Head + Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 16), skinMat);
    head.position.set(0, 1.31, 0.01);
    head.castShadow = true;
    registerSelectable(head, 'bench');
    personGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.152, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hair.position.set(0, 1.33, -0.01);
    hair.rotation.x = -0.2;
    personGroup.add(hair);

    // Seated Thighs & Lower Legs
    [-0.1, 0.1].forEach((lx) => {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.42), pantsMat);
      thigh.position.set(lx, 0.64, 0.14);
      thigh.castShadow = true;
      registerSelectable(thigh, 'bench');
      personGroup.add(thigh);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.48, 10), pantsMat);
      calf.position.set(lx, 0.34, 0.31);
      calf.castShadow = true;
      personGroup.add(calf);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), shoeMat);
      shoe.position.set(lx, 0.08, 0.36);
      personGroup.add(shoe);
    });

    // Arms angled forward holding the smartphone
    [-0.22, 0.22].forEach((ax, idx) => {
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.34, 10), shirtMat);
      upperArm.position.set(ax, 0.96, 0.05);
      upperArm.rotation.x = 0.55;
      upperArm.rotation.z = idx === 0 ? -0.18 : 0.18;
      personGroup.add(upperArm);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.3, 10), skinMat);
      forearm.position.set(ax * 0.62, 0.83, 0.24);
      forearm.rotation.x = 1.25;
      forearm.rotation.z = idx === 0 ? -0.42 : 0.42;
      personGroup.add(forearm);
    });

    // Glowing Smartphone in commuter's hands
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.2),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3 })
    );
    phoneBody.position.set(0, 0.83, 0.36);
    phoneBody.rotation.x = -0.45;
    registerSelectable(phoneBody, 'battery');
    personGroup.add(phoneBody);

    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.17),
      new THREE.MeshBasicMaterial({ color: '#38bdf8' })
    );
    phoneScreen.rotation.x = -Math.PI / 2 - 0.45;
    phoneScreen.position.set(0, 0.842, 0.36);
    personGroup.add(phoneScreen);

    // Commuter's backpack resting beside them on the bench
    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.36, 0.22),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.75 })
    );
    backpack.position.set(0.42, 0.78, -0.05);
    backpack.rotation.y = -0.25;
    backpack.castShadow = true;
    personGroup.add(backpack);

    // Visible White USB Charging Cord connecting Yellow USB Enclosure -> Commuter's Phone
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.38, 2.04, -0.18), // USB port on yellow box
      new THREE.Vector3(-1.12, 1.48, 0.06),
      new THREE.Vector3(-0.68, 0.92, 0.26),
      new THREE.Vector3(-0.22, 0.83, -0.06), // Smartphone in commuter's hands
    ]);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 28, 0.016, 8, false);
    const cordMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const chargingCordMesh = new THREE.Mesh(cordGeo, cordMat);
    chargingCordMesh.visible = stateRef.current.showPerson;
    registerSelectable(chargingCordMesh, 'battery');
    hubGroup.add(chargingCordMesh);

    // Animated green charging pulses traveling along the USB cord when person is active
    const cordPulses = [];
    const cordPulseMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), cordPulseMat);
      p.visible = stateRef.current.showPerson;
      hubGroup.add(p);
      cordPulses.push({ mesh: p, offset: i / 4 });
    }

    // ------------------------------------------------------------------------
    // 9. CONCEPTUAL ENERGY FLOW ANIMATION PARTICLES
    // ------------------------------------------------------------------------
    const energyFlowGroup = new THREE.Group();
    energyFlowGroup.visible = stateRef.current.showEnergyFlow;
    hubGroup.add(energyFlowGroup);

    const flowPaths = {
      solarToBattery: new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.4, 3.22, -0.45),
        new THREE.Vector3(-0.7, 3.0, -0.45),
        new THREE.Vector3(-1.62, 2.85, -0.45),
        new THREE.Vector3(-1.45, 2.15, -0.45),
      ]),
      windToBattery: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.65, 5.25, -0.45),
        new THREE.Vector3(-1.65, 3.9, -0.45),
        new THREE.Vector3(-1.65, 2.8, -0.45),
        new THREE.Vector3(-1.45, 2.2, -0.45),
      ]),
      batteryToLamp: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.45, 2.1, -0.45),
        new THREE.Vector3(-1.65, 3.3, -0.45),
        new THREE.Vector3(-1.65, 5.42, -0.2),
        new THREE.Vector3(-1.65, 5.45, 0.45),
      ]),
      batteryToUsb: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.45, 1.55, -0.45),
        new THREE.Vector3(-1.42, 1.82, -0.3),
        new THREE.Vector3(-1.4, 2.04, -0.18),
      ]),
    };

    const flowParticles = [];
    const createParticlesForCurve = (curve, colorHex, count, flowType) => {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      for (let i = 0; i < count; i++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), mat);
        energyFlowGroup.add(dot);
        flowParticles.push({
          mesh: dot,
          curve,
          offset: i / count,
          flowType,
        });
      }
    };

    createParticlesForCurve(flowPaths.solarToBattery, '#f59e0b', 6, 'solar');
    createParticlesForCurve(flowPaths.windToBattery, '#38bdf8', 7, 'wind');
    createParticlesForCurve(flowPaths.batteryToLamp, '#fde047', 6, 'lamp');
    createParticlesForCurve(flowPaths.batteryToUsb, '#34d399', 4, 'usb');

    // 3D anchor points for floating HTML labels
    const labelAnchors = {
      turbine: new THREE.Vector3(-1.65, 6.15, -0.45),
      solar: new THREE.Vector3(0.75, 3.68, -0.45),
      lamp: new THREE.Vector3(-1.65, 5.75, 0.85),
      battery: new THREE.Vector3(-1.38, 2.38, -0.15),
      bench: new THREE.Vector3(0.75, 1.65, -0.1),
    };

    // ------------------------------------------------------------------------
    // 10. POINTER & TOUCH CONTROLS (MOUSE ORBIT + MOBILE PINCH-TO-ZOOM)
    // ------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const domElem = renderer.domElement;

    const handlePointerDown = (e) => {
      cameraRigRef.current.isDragging = true;
      cameraRigRef.current.prevPointer = { x: e.clientX, y: e.clientY };
      cameraRigRef.current.pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (!cameraRigRef.current.isDragging) return;
      const dx = e.clientX - cameraRigRef.current.prevPointer.x;
      const dy = e.clientY - cameraRigRef.current.prevPointer.y;
      cameraRigRef.current.prevPointer = { x: e.clientX, y: e.clientY };

      cameraRigRef.current.desiredSpherical.theta -= dx * 0.0065;
      cameraRigRef.current.desiredSpherical.phi = Math.max(
        0.35,
        Math.min(1.48, cameraRigRef.current.desiredSpherical.phi - dy * 0.0055)
      );
    };

    const handlePointerUp = (e) => {
      if (!cameraRigRef.current.isDragging) return;
      cameraRigRef.current.isDragging = false;

      const moveDist = Math.hypot(
        e.clientX - cameraRigRef.current.pointerDownPos.x,
        e.clientY - cameraRigRef.current.pointerDownPos.y
      );
      if (moveDist < 6) {
        const rect = domElem.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(selectableMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.componentId) {
          onSelectComponent(hits[0].object.userData.componentId);
        }
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      cameraRigRef.current.desiredSpherical.radius = Math.max(
        3.2,
        Math.min(24, cameraRigRef.current.desiredSpherical.radius + e.deltaY * 0.008)
      );
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        cameraRigRef.current.pinchStartDist = Math.hypot(dx, dy);
        cameraRigRef.current.pinchStartRadius = cameraRigRef.current.desiredSpherical.radius;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && cameraRigRef.current.pinchStartDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = cameraRigRef.current.pinchStartDist / Math.max(dist, 10);
        cameraRigRef.current.desiredSpherical.radius = Math.max(
          3.4,
          Math.min(24, cameraRigRef.current.pinchStartRadius * scale)
        );
      }
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    domElem.addEventListener('touchstart', handleTouchStart, { passive: true });
    domElem.addEventListener('touchmove', handleTouchMove, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const mobileNow = w < 640;
      setIsMobileViewport(mobileNow);
      stateRef.current.isMobile = mobileNow;

      camera.fov = mobileNow ? 52 : 43;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ------------------------------------------------------------------------
    // 11. ANIMATION LOOP (DAY/NIGHT LIGHTING, TRACKER, TURBINE & ENERGY FLOW)
    // ------------------------------------------------------------------------
    let animFrameId;
    const clock = new THREE.Clock();
    let frameCounter = 0;

    const skyDay = new THREE.Color('#cbe3da');
    const skySunset = new THREE.Color('#d98a6c');
    const skyNight = new THREE.Color('#071318');

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const currentHour = stateRef.current.timeOfDay;

      // 1. Day/Night celestial & lighting interpolation
      const dayFactor = Math.max(0, Math.sin(((currentHour - 6) / 12) * Math.PI)); // 0 at night, 1 at 12 PM
      const isSunsetWindow =
        (currentHour >= 5.2 && currentHour <= 6.8) || (currentHour >= 17.0 && currentHour <= 18.8);
      const sunsetFactor = isSunsetWindow
        ? Math.sin(
            ((currentHour - (currentHour < 12 ? 5.2 : 17.0)) / 1.6) * Math.PI
          )
        : 0;

      const currentSky = skyNight.clone().lerp(skyDay, Math.pow(dayFactor, 0.75));
      if (sunsetFactor > 0) {
        currentSky.lerp(skySunset, sunsetFactor * 0.48);
      }
      scene.background.copy(currentSky);
      scene.fog.color.copy(currentSky);

      // Sun arc across the sky
      const sunAngle = ((currentHour - 6) / 12) * Math.PI;
      const sunX = -Math.cos(sunAngle) * 24;
      const sunY = Math.max(1.5, Math.sin(sunAngle) * 26);
      sunLight.position.set(sunX, sunY, 10);
      sunLight.intensity = 0.08 + dayFactor * 1.45;
      hemiLight.intensity = 0.18 + dayFactor * 0.72;

      // Solar tracker smoothly tilts panel slightly toward sun during daytime
      const targetTiltZ = dayFactor > 0.05 ? Math.cos(sunAngle) * 0.14 : 0;
      solarPivotGroup.rotation.z = THREE.MathUtils.lerp(solarPivotGroup.rotation.z, targetTiltZ, 0.08);
      solarPivotGroup.rotation.x = THREE.MathUtils.lerp(solarPivotGroup.rotation.x, 0.1, 0.08);

      // Photocell automatic LED nighttime switching (ON when dayFactor < 0.18)
      const nightLampIntensity = THREE.MathUtils.clamp((0.22 - dayFactor) * 5.0, 0, 1);
      streetSpotLight.intensity = nightLampIntensity * 5.2;
      lampLensMat.emissiveIntensity = nightLampIntensity * 1.4;
      lightConeMat.opacity = nightLampIntensity * 0.19;
      roadGlowMat.opacity = nightLampIntensity * 0.36;

      // Distant barangay house windows glow warmly at night
      houseWindows.forEach((win) => {
        win.material.color.setHex(nightLampIntensity > 0.4 ? 0xfde047 : 0x475569);
      });

      // 2. Continuous wind turbine rotation
      rotorGroup.rotation.z -= delta * 3.2;

      // 3. Toggle visibility of seated person & charging cord
      const personActive = stateRef.current.showPerson;
      personGroup.visible = personActive;
      chargingCordMesh.visible = personActive;
      cordPulses.forEach((cp, idx) => {
        cp.mesh.visible = personActive;
        if (personActive) {
          const t = (elapsed * 0.65 + cp.offset) % 1;
          cp.mesh.position.copy(cordCurve.getPointAt(t));
        }
      });

      // 4. Conceptual Energy Flow particles
      energyFlowGroup.visible = stateRef.current.showEnergyFlow;
      if (stateRef.current.showEnergyFlow) {
        flowParticles.forEach((fp) => {
          // Solar particles only flow during daylight; lamp particles only flow at night
          let active = true;
          if (fp.flowType === 'solar' && dayFactor < 0.08) active = false;
          if (fp.flowType === 'lamp' && nightLampIntensity < 0.1) active = false;

          fp.mesh.visible = active;
          if (active) {
            const t = (elapsed * 0.42 + fp.offset) % 1;
            fp.mesh.position.copy(fp.curve.getPointAt(t));
          }
        });
      }

      // 5. Smooth camera preset & orbit damping
      const rig = cameraRigRef.current;
      rig.spherical.radius = THREE.MathUtils.lerp(rig.spherical.radius, rig.desiredSpherical.radius, 0.1);
      rig.spherical.phi = THREE.MathUtils.lerp(rig.spherical.phi, rig.desiredSpherical.phi, 0.1);
      rig.spherical.theta = THREE.MathUtils.lerp(rig.spherical.theta, rig.desiredSpherical.theta, 0.1);
      rig.target.lerp(rig.desiredTarget, 0.1);

      const camOffset = new THREE.Vector3().setFromSpherical(rig.spherical);
      camera.position.copy(rig.target).add(camOffset);
      camera.lookAt(rig.target);

      renderer.render(scene, camera);

      // 6. Project 3D label anchors to 2D screen coordinates every 2 frames
      frameCounter++;
      if (frameCounter % 2 === 0 && stateRef.current.showLabels && container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const nextPositions = {};
        Object.entries(labelAnchors).forEach(([key, vec]) => {
          const projected = vec.clone().project(camera);
          nextPositions[key] = {
            x: (projected.x * 0.5 + 0.5) * w,
            y: (-(projected.y * 0.5) + 0.5) * h,
            visible: projected.z < 1,
          };
        });
        setLabelPositions(nextPositions);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      domElem.removeEventListener('touchstart', handleTouchStart);
      domElem.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const periodInfo = getTimePeriodInfo(timeOfDay);
  const sunArcProgress = ((timeOfDay % 24) / 24) * Math.PI;
  const arcDotX = 50 - Math.cos(sunArcProgress) * 38;
  const arcDotY = 42 - Math.sin((timeOfDay >= 6 && timeOfDay <= 18 ? (timeOfDay - 6) / 12 : 0) * Math.PI) * 30;

  return (
    <div className="w-full">
      {/* 3D Canvas Container */}
      <div className="relative w-full h-[460px] sm:h-[550px] lg:h-[620px] rounded-2xl overflow-hidden border border-stone-300/90 shadow-lg bg-[#cfe4db] select-none">
        {webglError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-stone-100 text-stone-800">
            <AlertTriangle className="w-10 h-10 text-amber-600 mb-3" />
            <h3 className="text-lg font-bold">Interactive 3D Preview Unavailable</h3>
            <p className="text-sm text-stone-600 max-w-md mt-1">
              WebGL hardware acceleration could not be initialized on this browser. All system component details and
              public facility statuses remain accessible below.
            </p>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />
        )}

        {/* TOP-LEFT DIGITAL CLOCK & CELESTIAL HORIZON HUD (Matching Reference Images 1 & 2) */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 pointer-events-none flex items-center gap-3.5 sm:gap-5 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl bg-[#182c25]/85 backdrop-blur-md text-white border border-white/10 shadow-md">
          <div>
            <div className="text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums leading-none">
              {formatClock(timeOfDay)}
            </div>
            <div className="text-xs sm:text-sm font-medium text-emerald-100/90 mt-1 flex items-center gap-1.5">
              <span>{periodInfo.label}</span>
              <span className="text-[11px] opacity-75">
                • {periodInfo.isNight ? 'Photocell LED ON' : 'Solar Harvesting'}
              </span>
            </div>
          </div>

          {/* Horizon Arc SVG */}
          <svg width="78" height="46" viewBox="0 0 100 50" className="hidden xs:block overflow-visible">
            <line x1="8" y1="42" x2="92" y2="42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <path
              d="M 12 42 A 38 32 0 0 1 88 42"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle
              cx={arcDotX}
              cy={periodInfo.isNight ? 18 : arcDotY}
              r="4.8"
              fill={periodInfo.isNight ? '#e2e8f0' : '#fbbf24'}
            />
          </svg>
        </div>

        {/* FLOATING 3D COMPONENT PILL LABELS (Matching Reference Images 1 & 2) */}
        {showLabels &&
          Object.entries(SYSTEM_COMPONENTS).map(([key, comp]) => {
            const pos = labelPositions[key];
            if (!pos || !pos.visible) return null;
            const isSelected = selectedComponent === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectComponent(key)}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                className={`absolute z-10 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-transform duration-150 shadow-md border ${
                  isSelected
                    ? 'bg-emerald-950 text-white border-emerald-400 scale-105 ring-2 ring-emerald-400/40'
                    : 'bg-[#1b2623]/90 hover:bg-[#111917] text-stone-100 border-white/20 hover:scale-105'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: comp.dotColor }}
                />
                <span className="whitespace-nowrap">{comp.shortLabel}</span>
              </button>
            );
          })}

        {/* BOTTOM-RIGHT OVERLAY ACTION PILLS (Labels, Energy Flow, Add Person, Reset View) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 max-w-[95%]">
          <button
            type="button"
            onClick={() => setShowPerson((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-colors border ${
              showPerson
                ? 'bg-amber-500 text-stone-950 border-amber-300'
                : 'bg-white/95 hover:bg-white text-stone-900 border-stone-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showPerson ? 'Person charging: ON' : 'Add person'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-colors border ${
              showLabels
                ? 'bg-white text-stone-900 border-stone-300'
                : 'bg-stone-900/80 text-stone-200 border-white/15'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Labels</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEnergyFlow((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-colors border ${
              showEnergyFlow
                ? 'bg-emerald-700 text-white border-emerald-500'
                : 'bg-white/95 hover:bg-white text-stone-900 border-stone-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Energy flow</span>
          </button>

          <button
            type="button"
            onClick={onResetScene}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#20332b]/95 hover:bg-[#16241e] text-white border border-white/15 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset view</span>
          </button>
        </div>
      </div>

      {/* TIME SLIDER BAR + PLAY/PAUSE + SPEED SELECTOR (Matching Reference Images 1 & 2) */}
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-sm">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1f4437] hover:bg-[#17352b] text-white font-semibold text-sm sm:text-base transition-colors shrink-0 shadow-xs"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="flex-1 flex flex-col justify-center px-1">
          <input
            type="range"
            min="0"
            max="24"
            step="0.05"
            value={timeOfDay}
            onChange={(e) => {
              setIsPlaying(false);
              setTimeOfDay(parseFloat(e.target.value));
            }}
            aria-label="Time of day simulation slider"
            className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#1f4437]"
          />
          <div className="flex justify-between text-[11px] sm:text-xs font-medium text-stone-500 mt-1.5 select-none">
            <button type="button" onClick={() => setTimeOfDay(0)} className="hover:text-stone-900">
              12 AM
            </button>
            <button type="button" onClick={() => setTimeOfDay(6)} className="hover:text-stone-900">
              6 AM
            </button>
            <button type="button" onClick={() => setTimeOfDay(12)} className="hover:text-stone-900">
              12 PM
            </button>
            <button type="button" onClick={() => setTimeOfDay(18)} className="hover:text-stone-900">
              6 PM
            </button>
            <button type="button" onClick={() => setTimeOfDay(23.98)} className="hover:text-stone-900">
              12 AM
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          <label htmlFor="sim-speed" className="text-xs font-medium text-stone-500 md:sr-only">
            Simulation Speed:
          </label>
          <select
            id="sim-speed"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1f4437]"
          >
            <option value={0.5}>Slow</option>
            <option value={1}>Normal</option>
            <option value={2.5}>Fast</option>
          </select>
        </div>
      </div>

      {/* CAMERA PRESET PILLS (Swipeable on mobile phones, wrapped on desktop) */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
        {CAMERA_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-[#1f4437] text-white border-[#1f4437] shadow-xs'
                  : 'bg-[#f8f6f0] hover:bg-stone-200/75 text-stone-800 border-stone-300'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. PUBLIC QR CODE & PRINTABLE POLE SIGNAGE MODAL
// ============================================================================
function PublicQrModal({ isOpen, onClose }) {
  const [publicUrl, setPublicUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : 'https://macopoy-energy-hub.vercel.app'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(
    publicUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSticker = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // Background card
    ctx.fillStyle = '#18392b';
    ctx.fillRect(0, 0, 900, 1200);

    ctx.fillStyle = '#f8f6f1';
    ctx.fillRect(45, 45, 810, 1110);

    // Header banner
    ctx.fillStyle = '#1f4437';
    ctx.fillRect(45, 45, 810, 210);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUBLIC RENEWABLE ENERGY FACILITY', 450, 115);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('MACOPOY ENERGY HUB', 450, 175);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '24px sans-serif';
    ctx.fillText('Macopoy, Mascap • Rodriguez, Rizal', 450, 220);

    // Instructions
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Scan to Check Facility & Explore in 3D', 450, 335);

    ctx.fillStyle = '#57534e';
    ctx.font = '24px sans-serif';
    ctx.fillText('Open your phone camera and point it at the QR code below:', 450, 380);

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 4;
      ctx.strokeRect(225, 430, 450, 450);
      ctx.drawImage(qrImg, 245, 450, 410, 410);

      ctx.fillStyle = '#1f4437';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Hybrid Solar–Wind Streetlight & USB Charging Station', 450, 955);

      ctx.fillStyle = '#44403c';
      ctx.font = '21px monospace';
      ctx.fillText(publicUrl.slice(0, 56), 450, 1015);

      ctx.fillStyle = '#78716c';
      ctx.font = '19px sans-serif';
      ctx.fillText('Undergraduate Thesis Project • Public Information Dashboard', 450, 1095);

      const link = document.createElement('a');
      link.download = 'Macopoy-Energy-Hub-Pole-QR-Sticker.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrImageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-[#f8f6f1] border border-stone-300 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700"
          aria-label="Close QR Code modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/10 text-[#1f4437] text-xs font-semibold">
          <QrCode className="w-3.5 h-3.5" />
          <span>Public Roadside Access Sign</span>
        </div>

        <h3 className="text-2xl font-bold text-stone-900 mt-2">Scan to Open on Any Phone</h3>
        <p className="text-sm text-stone-600 mt-1">
          Residents, students, and defense panelists can scan this QR code to open the interactive 3D streetlight
          dashboard directly on their smartphone.
        </p>

        {/* QR Code Preview Card */}
        <div className="mt-5 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col items-center text-center shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1f4437] mb-2">
            Macopoy, Mascap • Public Energy Hub
          </div>
          <img
            src={qrImageUrl}
            alt="Public Dashboard QR Code"
            className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl border border-stone-200 p-2 bg-white"
          />
          <p className="text-xs text-stone-500 mt-2.5 max-w-xs">
            Optimized for Android (Infinix, Samsung, Xiaomi) and Apple iPhone mobile screens.
          </p>
        </div>

        {/* Customizable Live URL Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Public Website Link (Vercel / GitHub Pages URL)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://macopoy-energy-hub.vercel.app"
              className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1f4437]"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Download Printable Sticker */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleDownloadSticker}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1f4437] hover:bg-[#17352b] text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable Pole Sticker (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MAIN APPLICATION
// ============================================================================
export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(10.97); // Starts at 10:58 AM like Reference Image 1
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activePreset, setActivePreset] = useState('whole');
  const [showLabels, setShowLabels] = useState(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState(true);
  const [showPerson, setShowPerson] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState('solar');
  const [telemetryMode, setTelemetryMode] = useState('night_normal');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Continuous time simulation when Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 0.06 * speedMultiplier) % 24);
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Automatically switch facility status demo to "in_use" when user adds the charging person
  const handleTogglePerson = (nextStateOrFn) => {
    setShowPerson((prev) => {
      const next = typeof nextStateOrFn === 'function' ? nextStateOrFn(prev) : nextStateOrFn;
      if (next) {
        setTelemetryMode('in_use');
      } else if (telemetryMode === 'in_use') {
        setTelemetryMode('night_normal');
      }
      return next;
    });
  };

  const handleSelectComponent = (compId) => {
    setSelectedComponent(compId);
    const presetMap = {
      solar: 'solar',
      turbine: 'turbine',
      lamp: 'lamp',
      battery: 'battery',
      bench: 'bench',
    };
    if (presetMap[compId]) {
      setActivePreset(presetMap[compId]);
    }
  };

  const handleResetScene = () => {
    setIsPlaying(false);
    setTimeOfDay(10.97);
    setActivePreset('whole');
    setShowLabels(true);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentComponentInfo = SYSTEM_COMPONENTS[selectedComponent] || SYSTEM_COMPONENTS.solar;
  const currentDemoStatus = DEMO_SCENARIOS[telemetryMode] || DEMO_SCENARIOS.night_normal;

  const badgeStyles = {
    success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    info: 'bg-sky-100 text-sky-900 border-sky-300',
    neutral: 'bg-stone-200 text-stone-800 border-stone-300',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    danger: 'bg-rose-100 text-rose-900 border-rose-300',
  };

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-stone-800 font-sans selection:bg-emerald-900 selection:text-white">
      {/* ====================================================================
          SECTION 1: NAVIGATION BAR
      ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#f6f4ee]/95 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1f4437] flex items-center justify-center text-amber-300 shadow-xs">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-stone-900 tracking-tight leading-none text-base">
                Macopoy Energy Hub
              </span>
              <span className="block text-[11px] text-stone-500 font-medium mt-0.5">
                Mascap, Rodriguez, Rizal
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button type="button" onClick={() => scrollToSection('home')} className="hover:text-[#1f4437]">
              Home
            </button>
            <button type="button" onClick={() => scrollToSection('explore-system')} className="hover:text-[#1f4437]">
              Explore System
            </button>
            <button type="button" onClick={() => scrollToSection('energy-flow')} className="hover:text-[#1f4437]">
              Energy Flow
            </button>
            <button type="button" onClick={() => scrollToSection('facility-status')} className="hover:text-[#1f4437]">
              Check Facility
            </button>
            <button type="button" onClick={() => scrollToSection('community')} className="hover:text-[#1f4437]">
              Community
            </button>
            <button type="button" onClick={() => scrollToSection('about-project')} className="hover:text-[#1f4437]">
              About the Project
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold shadow-2xs transition-colors"
            >
              <QrCode className="w-4 h-4 text-[#1f4437]" />
              <span>Public QR Code</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl border border-stone-300 bg-white text-stone-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f6f4ee] border-b border-stone-300 px-4 pt-2 pb-4 space-y-1.5">
            {[
              ['Home', 'home'],
              ['Explore 3D System', 'explore-system'],
              ['Where the Energy Goes', 'energy-flow'],
              ['Check the Facility', 'facility-status'],
              ['Why Macopoy Needs It', 'community'],
              ['About the Project', 'about-project'],
            ].map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-200/70"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setQrModalOpen(true);
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f4437] text-white text-sm font-semibold"
            >
              <QrCode className="w-4 h-4" />
              <span>Open Public QR Code</span>
            </button>
          </div>
        )}
      </header>

      {/* ====================================================================
          SECTION 2: HERO INTRODUCTION
      ==================================================================== */}
      <section id="home" className="pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/8 border border-emerald-900/15 text-[#1f4437] text-xs sm:text-sm font-semibold">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Macopoy, Mascap, Rodriguez, Rizal</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.1]">
              Clean Energy. A Brighter Community.
            </h1>

            <p className="mt-4 text-base sm:text-xl text-stone-600 leading-relaxed">
              Discover how solar and wind energy can power safer streets, public phone charging, and a place to rest in
              Macopoy, Mascap.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('explore-system')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1f4437] hover:bg-[#163329] text-white font-semibold text-sm sm:text-base shadow-sm transition-colors"
              >
                <span>Explore the Installation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('energy-flow')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-semibold text-sm sm:text-base transition-colors"
              >
                <span>How It Works</span>
              </button>

              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 font-semibold text-sm transition-colors"
              >
                <QrCode className="w-4 h-4 text-amber-800" />
                <span>Get Roadside QR Sticker</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: INTERACTIVE 3D INSTALLATION
      ==================================================================== */}
      <section id="explore-system" className="pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick interactive bar above the 3D scene */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                <strong>Interactive 3D Model:</strong> Drag to rotate, scroll or pinch to zoom, or tap any component.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTogglePerson((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs border transition-colors ${
                  showPerson
                    ? 'bg-amber-500 text-stone-950 border-amber-600'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showPerson ? 'Remove Seated Person' : 'Simulate Person Charging on Bench'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeOfDay(23.5)}
                className="px-2.5 py-1 rounded-lg bg-stone-800 text-amber-300 font-medium text-xs hover:bg-stone-900"
              >
                Preview Night LED Beam
              </button>
            </div>
          </div>

          {/* Real-time Three.js 3D Scene */}
          <StreetlightThreeScene
            timeOfDay={timeOfDay}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
            setTimeOfDay={setTimeOfDay}
            activePreset={activePreset}
            onSelectPreset={setActivePreset}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
            showEnergyFlow={showEnergyFlow}
            setShowEnergyFlow={setShowEnergyFlow}
            showPerson={showPerson}
            setShowPerson={handleTogglePerson}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            onResetScene={handleResetScene}
          />

          {/* CLICKABLE 3D COMPONENT INSPECTOR PANEL */}
          <div className="mt-6 bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: currentComponentInfo.dotColor }}
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Selected 3D Component • {currentComponentInfo.stage} Stage
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{currentComponentInfo.name}</h2>
                </div>
              </div>

              {/* Component selector pills */}
              <div className="flex flex-wrap gap-1.5">
                {Object.values(SYSTEM_COMPONENTS)
                  .filter((comp) => comp.id !== 'solar')
                  .map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectComponent(comp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                        selectedComponent === comp.id
                          ? 'bg-[#1f4437] text-white border-[#1f4437]'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      {comp.shortLabel}
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-sm">
              <div className="bg-[#f8f6f1] p-4 rounded-xl border border-stone-200/80">
                <div className="font-bold text-stone-900 mb-1">Component Function</div>
                <p className="text-stone-600 leading-relaxed">{currentComponentInfo.functionText}</p>
              </div>
              <div className="bg-[#f8f6f1] p-4 rounded-xl border border-stone-200/80">
                <div className="font-bold text-stone-900 mb-1">Role in Hybrid System</div>
                <p className="text-stone-600 leading-relaxed">{currentComponentInfo.roleText}</p>
              </div>
              <div className="bg-[#f8f6f1] p-4 rounded-xl border border-stone-200/80">
                <div className="font-bold text-stone-900 mb-1">Community Benefit & Demo State</div>
                <p className="text-stone-600 leading-relaxed">{currentComponentInfo.benefitText}</p>
                <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-xs font-medium text-[#1f4437]">
                  Status: {currentComponentInfo.demoStatus}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-stone-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              <span>
                Note: The 3D visualization illustrates the architectural arrangement and conceptual operation of the
                proposed system. Final physical dimensions and sensor telemetry depend on hardware verification.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: BELOW-THE-FOLD — WHERE THE ENERGY GOES
      ==================================================================== */}
      <section id="energy-flow" className="py-16 sm:py-20 bg-white border-y border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#1f4437]">
              System Architecture & Power Conversion
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Where the Energy Goes
            </h2>
            <p className="mt-3 text-base sm:text-lg text-stone-600 leading-relaxed">
              Power from the sun and wind is collected, converted, stored in a battery, and then shared between the
              streetlight and public phone chargers.
            </p>
          </div>

          {/* Four Connected Stages: Collect, Prepare, Store, Use */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* STAGE 1: COLLECT */}
            <div className="rounded-2xl bg-[#f8f6f1] border border-stone-200/90 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1f4437] text-white font-bold text-sm">
                    1
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    Stage 1 • Collect
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-stone-900">Renewable Harvesting</h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Solar Panel + Tracker</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Turns sunlight into electricity. A tracker keeps the panel facing the sun.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Wind className="w-4 h-4 text-sky-500" />
                      <span>Wind Turbine</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Turns moving air into electricity, providing another renewable source when wind conditions are
                      suitable.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectComponent('solar');
                  scrollToSection('explore-system');
                }}
                className="mt-5 text-xs font-semibold text-[#1f4437] hover:underline inline-flex items-center gap-1"
              >
                <span>Locate collectors in 3D scene</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* STAGE 2: PREPARE */}
            <div className="rounded-2xl bg-[#f8f6f1] border border-stone-200/90 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1f4437] text-white font-bold text-sm">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full">
                    Stage 2 • Prepare
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-stone-900">Regulation & Conditioning</h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Solar Charge Controller</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Regulates the solar panel&apos;s electrical output to charge the battery within its operating
                      limits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <RefreshCw className="w-4 h-4 text-sky-600" />
                      <span>Wind Power Conversion</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Converts the turbine&apos;s electrical output into a form suitable for the wind charging system.
                      If the turbine produces AC, an appropriate rectifier or integrated conversion stage may be
                      required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-[11px] text-stone-500">
                Housed inside the weatherproof pole enclosure.
              </div>
            </div>

            {/* STAGE 3: STORE */}
            <div className="rounded-2xl bg-[#f8f6f1] border border-stone-200/90 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1f4437] text-white font-bold text-sm">
                    3
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Stage 3 • Store
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-stone-900">Protected Energy Storage</h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Charge Controllers & Protection</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Manage charging from the renewable sources and help protect the battery from unsafe operating
                      conditions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <BatteryCharging className="w-4 h-4 text-emerald-600" />
                      <span>LiFePO₄ Battery</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Stores the energy collected during the day and during suitable wind conditions for use when
                      renewable generation is insufficient.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectComponent('battery');
                  scrollToSection('explore-system');
                }}
                className="mt-5 text-xs font-semibold text-[#1f4437] hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect battery enclosure in 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* STAGE 4: USE */}
            <div className="rounded-2xl bg-[#f8f6f1] border border-stone-200/90 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1f4437] text-white font-bold text-sm">
                    4
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full">
                    Stage 4 • Use
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-stone-900">Public Community Services</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>LED Streetlight</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Provides nighttime illumination. A photocell controls automatic switching based on ambient light,
                      independently of the public website.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Usb className="w-4 h-4 text-emerald-600" />
                      <span>USB Charging Station</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Provides a convenient public phone-charging facility powered by the system through suitable power
                      conversion and electrical protection.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Armchair className="w-4 h-4 text-orange-600" />
                      <span>Public Bench</span>
                    </div>
                    <p className="mt-1 text-stone-600 leading-relaxed">
                      Provides a place for residents and travelers to rest beside the installation.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectComponent('lamp');
                  scrollToSection('explore-system');
                }}
                className="mt-5 text-xs font-semibold text-[#1f4437] hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect lamp & bench in 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Electrical Safety & Engineering Note */}
          <div className="mt-8 rounded-2xl bg-stone-100 border border-stone-300/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#1f4437]/10 text-[#1f4437] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <strong className="text-stone-900">Electrical Safety & Protection Note:</strong> Appropriate overcurrent
              protection (DC breakers/fuses), proper grounding, weatherproof enclosure wiring, and regulated power
              conversion equipment are essential to safe public operation. Automatic photocell lighting and hardware
              protection operate independently of internet or website connectivity.
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: PUBLIC SERVICE STATUS — CHECK THE FACILITY
      ==================================================================== */}
      <section id="facility-status" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demonstration Data Layer (Hardware Telemetry Ready)</span>
              </div>
              <h2 className="mt-2.5 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Check the Facility
              </h2>
              <p className="mt-2 text-base text-stone-600 max-w-2xl">
                Check the public availability of the roadside streetlight and USB phone-charging station before
                traveling along Macopoy Road.
              </p>
            </div>

            {/* Demo State Switcher for Defense / Testing */}
            <div className="bg-white p-3 rounded-2xl border border-stone-300 shadow-2xs">
              <label htmlFor="telemetry-scenario" className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                Simulate Public Telemetry State:
              </label>
              <select
                id="telemetry-scenario"
                value={telemetryMode}
                onChange={(e) => setTelemetryMode(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-stone-300 bg-[#f8f6f1] text-stone-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1f4437]"
              >
                {Object.values(DEMO_SCENARIOS).map((scen) => (
                  <option key={scen.id} value={scen.id}>
                    {scen.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two Prominent Public Status Panels */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PANEL 1: STREETLIGHT STATUS */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1f4437]/10 text-[#1f4437] flex items-center justify-center shrink-0">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Roadside Illumination
                      </span>
                      <h3 className="text-xl font-bold text-stone-900">Streetlight Status</h3>
                    </div>
                  </div>

                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                      badgeStyles[currentDemoStatus.streetlight.badgeTone]
                    }`}
                  >
                    {currentDemoStatus.streetlight.status}
                  </span>
                </div>

                <div className="mt-5 p-4 rounded-xl bg-[#f8f6f1] border border-stone-200/80">
                  <div className="text-sm font-bold text-stone-900">{currentDemoStatus.streetlight.summary}</div>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {currentDemoStatus.streetlight.note}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentDemoStatus.lastUpdated}</span>
                </span>
                <span className="font-semibold text-stone-700">States: Operational / Not operating / Unknown / Offline</span>
              </div>
            </div>

            {/* PANEL 2: PUBLIC CHARGING STATUS */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1f4437]/10 text-[#1f4437] flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        5V Outdoor USB Station
                      </span>
                      <h3 className="text-xl font-bold text-stone-900">Public Charging Status</h3>
                    </div>
                  </div>

                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                      badgeStyles[currentDemoStatus.charging.badgeTone]
                    }`}
                  >
                    {currentDemoStatus.charging.status}
                  </span>
                </div>

                <div className="mt-5 p-4 rounded-xl bg-[#f8f6f1] border border-stone-200/80">
                  <div className="text-sm font-bold text-stone-900">{currentDemoStatus.charging.summary}</div>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {currentDemoStatus.charging.note}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentDemoStatus.lastUpdated}</span>
                </span>
                <span className="font-semibold text-stone-700">States: Available / In use / Unavailable / Offline</span>
              </div>
            </div>
          </div>

          {/* Transparent Hardware Verification & QR Callout Banner */}
          <div className="mt-6 bg-white rounded-2xl border border-stone-200/90 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
              <strong className="text-stone-900">Hardware Telemetry Verification Note:</strong> The status cards above
              currently use clearly labeled demonstration data. Actual operational verification requires physical
              feedback sensors connected to the ESP32 microcontroller. If the ESP32 has not sent recent telemetry data,
              the interface transitions to <em>Offline / Status unavailable</em> rather than displaying a misleading
              operational badge.
            </div>
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f4437] hover:bg-[#17352b] text-white text-xs sm:text-sm font-semibold shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>View & Download QR Sticker</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: COMMUNITY RATIONALE — WHY MACOPOY NEEDS IT
      ==================================================================== */}
      <section id="community" className="py-16 sm:py-20 bg-white border-t border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Editorial Text Column */}
            <div className="lg:col-span-6">
              <div className="text-xs font-bold uppercase tracking-widest text-[#1f4437]">
                Local Context • Sitio Macopoy, Brgy. Mascap
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Why Macopoy Needs It
              </h2>

              <div className="mt-5 space-y-4 text-base sm:text-lg text-stone-700 leading-relaxed">
                <p>
                  Parts of the road in Macopoy, Mascap have no streetlights, especially in the middle and far-end
                  sections. Students and workers still travel early in the morning and late at night, and many walk
                  because transportation is limited.
                </p>
                <p>
                  There are no benches along the way either. The area gets plenty of sunshine in the day and, because
                  it sits high in the mountains, steady wind. That makes sun and wind a good pair for a light that does
                  not depend on the power grid.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#f8f6f1] border border-stone-200 text-xs sm:text-sm text-stone-600">
                <strong className="text-stone-900">Design Rationale Note:</strong> Local solar and mountain wind
                availability serve as the engineering rationale for selecting a hybrid off-grid configuration. Actual
                energy harvesting performance is subject to on-site prototype testing and measurement.
              </div>
            </div>

            {/* Complementary Rural Roadside & Bench Visual Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-[#183329] text-white p-6 sm:p-8">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 mb-4">
                  <span>MOUNTAIN ROADSIDE CONCEPT • MACOPOY, MASCAP</span>
                  <span>OFF-GRID HYBRID SYSTEM</span>
                </div>

                {/* Stylized Architectural Illustration of the Rough Roadside & Shaded Bench */}
                <svg viewBox="0 0 600 300" className="w-full h-auto rounded-2xl bg-[#0f241c] border border-white/10">
                  {/* Mountain silhouettes */}
                  <path d="M0 210 L110 115 L230 195 L380 95 L510 185 L600 135 L600 300 L0 300 Z" fill="#16382c" />
                  <path d="M0 235 L160 155 L310 220 L460 140 L600 215 L600 300 L0 300 Z" fill="#1e4637" />

                  {/* Rough dirt & gravel road in foreground */}
                  <rect x="0" y="235" width="600" height="65" fill="#6e5a47" />
                  <circle cx="95" cy="260" r="3" fill="#4a3c30" />
                  <circle cx="240" cy="275" r="4" fill="#8c7a67" />
                  <circle cx="420" cy="255" r="3.5" fill="#4a3c30" />
                  <circle cx="515" cy="272" r="4" fill="#8c7a67" />

                  {/* Warm LED light cone directed onto the rough road */}
                  <polygon points="185,78 75,275 315,275" fill="rgba(253, 224, 71, 0.22)" />

                  {/* Green pole & lamp */}
                  <rect x="175" y="65" width="12" height="170" fill="#2e8540" />
                  <rect x="165" y="60" width="52" height="12" rx="3" fill="#2e8540" />
                  <rect x="178" y="71" width="34" height="4" fill="#fde047" />

                  {/* Wind turbine blades */}
                  <circle cx="181" cy="60" r="5" fill="#f8fafc" />
                  <line x1="181" y1="60" x2="181" y2="20" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                  <line x1="181" y1="60" x2="215" y2="82" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                  <line x1="181" y1="60" x2="147" y2="82" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

                  {/* Solar canopy & bench */}
                  <rect x="187" y="132" width="215" height="10" rx="2" fill="#1d4ed8" stroke="#f8fafc" strokeWidth="2" />
                  <rect x="200" y="142" width="6" height="93" fill="#2e8540" />
                  <rect x="385" y="142" width="6" height="93" fill="#2e8540" />

                  {/* Yellow Battery + USB box */}
                  <rect x="186" y="162" width="18" height="36" rx="2" fill="#eab308" />

                  {/* Orange Bench */}
                  <rect x="225" y="185" width="140" height="24" rx="3" fill="#ea580c" />
                  <rect x="218" y="209" width="154" height="8" rx="2" fill="#c2410c" />
                  <rect x="228" y="217" width="8" height="18" fill="#ea580c" />
                  <rect x="354" y="217" width="8" height="18" fill="#ea580c" />
                </svg>

                {/* Three Concise Benefit Points */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/8 border border-white/10">
                    <div className="font-bold text-amber-300 text-sm">Safer nighttime travel</div>
                    <p className="mt-1 text-xs text-stone-200 leading-relaxed">
                      Streetlighting is intended to improve visibility along an otherwise poorly illuminated rough road.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/8 border border-white/10">
                    <div className="font-bold text-emerald-300 text-sm">Convenient public charging</div>
                    <p className="mt-1 text-xs text-stone-200 leading-relaxed">
                      A shared USB charging facility can help travelers and residents charge their mobile devices.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/8 border border-white/10">
                    <div className="font-bold text-orange-300 text-sm">A place to rest</div>
                    <p className="mt-1 text-xs text-stone-200 leading-relaxed">
                      A public bench provides a convenient stopping point for students, workers, and other passersby.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 7: PROJECT INFORMATION & RESEARCH TEAM
      ==================================================================== */}
      <section id="about-project" className="py-16 sm:py-20 bg-[#f6f4ee] border-t border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs">
            <div className="max-w-4xl">
              <div className="text-xs font-bold uppercase tracking-widest text-[#1f4437]">
                About the Project • Undergraduate Thesis
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 leading-tight">
                “Design and Development of a Hybrid Solar–Wind Powered Streetlight with Public Charging Station and
                Bench in Macopoy, Mascap”
              </h2>
              <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed">
                This public information website presents the proposed hybrid renewable-energy streetlight installation,
                its interactive 3D architectural model, energy conversion stages, and its intended community benefits
                for Sitio Macopoy, Barangay Mascap, Rodriguez, Rizal.
              </p>
            </div>

            {/* Researchers Grid */}
            <div className="mt-8 pt-8 border-t border-stone-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Project Researchers</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {RESEARCHERS.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8f6f1] border border-stone-200/90"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#1f4437] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-sm sm:text-base">{name}</div>
                      <div className="text-xs text-stone-500">Undergraduate Thesis Researcher</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 8: FOOTER
      ==================================================================== */}
      <footer className="bg-[#162922] text-stone-300 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/10">
            <div className="md:col-span-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-amber-300">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-lg">Macopoy Energy Hub</span>
              </div>
              <p className="mt-3 text-sm text-stone-400 max-w-md leading-relaxed">
                Public visualization and community information dashboard for a proposed hybrid solar–wind powered
                streetlight with a public USB charging station and roadside bench.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>Macopoy, Mascap, Rodriguez, Rizal, Philippines</span>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Navigation</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <button type="button" onClick={() => scrollToSection('home')} className="hover:text-white">
                    Home
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('explore-system')} className="hover:text-white">
                    Interactive 3D System
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('energy-flow')} className="hover:text-white">
                    Where the Energy Goes
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('facility-status')} className="hover:text-white">
                    Check the Facility
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('community')} className="hover:text-white">
                    Why Macopoy Needs It
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('about-project')} className="hover:text-white">
                    About the Project
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">On-Site Access</div>
              <p className="text-xs text-stone-400 leading-relaxed mb-3">
                Generate or download the printable QR code sticker for the physical streetlight pole enclosure.
              </p>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Public QR Code</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
            <div>
              Undergraduate Thesis Project • Design and Development of a Hybrid Solar–Wind Powered Streetlight in
              Macopoy, Mascap
            </div>
            <div>Public Community Interface • Demonstration Mode</div>
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <PublicQrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
}