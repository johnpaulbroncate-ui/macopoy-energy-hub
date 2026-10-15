import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  MapPin,
  ArrowDown,
  ShieldAlert,
  Clock,
  WifiOff,
  Info,
  Menu,
  X,
  ChevronRight,
  Compass,
  Users,
  BookOpen,
  Sliders,
  Activity,
  UserPlus,
  UserCheck,
  QrCode,
  Download,
  Copy,
  Check,
  Smartphone,
  SlidersHorizontal,
  Sparkles,
  Moon,
  Eye
} from 'lucide-react';

// ============================================================================
// 1. DATA LAYER: DEMONSTRATION TELEMETRY & COMPONENT SPECIFICATIONS
// ============================================================================

const DEFAULT_KEY_LABEL_IDS = ['turbine', 'solar', 'battery'];

const THESIS_METADATA = {
  shortName: 'Macopoy Energy Hub',
  fullTitle:
    'Design and Development of a Hybrid Solar–Wind Powered Streetlight with Public Charging Station and Bench in Macopoy, Mascap',
  location: 'Macopoy, Mascap, Rodriguez, Rizal',
  researchers: [
    'Banania, Franzine Jade A.',
    'Cagalitan, John Paul B.',
    'Cornilla, Jamile',
    'Lao, Pauleen Racy Y.',
    'Maghanoy, John Bryan Lei T.',
    'Teoxon, Joshua N.'
  ]
};

const SYSTEM_COMPONENTS = {
  turbine: {
    id: 'turbine',
    label: 'Wind turbine',
    fullTitle: 'Wind Turbine',
    dotColor: '#38bdf8',
    badgeText: 'Generation • Wind',
    functionText:
      'Converts wind energy into electricity, providing a complementary energy source when sunlight is limited and wind conditions are suitable.',
    roleInSystem:
      'Mounted near the top of the main green structural pole facing opposite the LED streetlight arm for unobstructed blade clearance, feeding generated power down into the wind conversion stage.',
    publicBenefit:
      'Helps sustain energy collection during cloudy periods, late afternoons, or breezy evenings in the elevated terrain of Macopoy.',
    anchor3D: [-1.85, 6.65, -0.65],
    cameraPos: [-5.2, 6.8, -5.2],
    cameraTarget: [-1.85, 5.9, -0.35]
  },
  lamp: {
    id: 'lamp',
    label: 'LED lamp',
    fullTitle: 'LED Streetlight',
    dotColor: '#facc15',
    badgeText: 'Load • Illumination',
    functionText:
      'Provides nighttime road illumination. The top-mounted photocell switches the lamp on at low ambient light levels and off when daylight returns.',
    roleInSystem:
      'Draws stored DC electrical energy from the LiFePO₄ battery bank during nighttime hours, operating automatically via ambient light sensing independent of website connectivity.',
    publicBenefit:
      'Improves nighttime visibility for students, workers, and residents walking along unlit rough road sections in Macopoy, Mascap.',
    anchor3D: [-1.85, 6.28, 1.85],
    cameraPos: [2.2, 6.5, 8.2],
    cameraTarget: [-1.85, 4.2, 3.2]
  },
  photocell: {
    id: 'photocell',
    label: 'Photocell sensor',
    fullTitle: 'Photocell (Ambient Light Sensor)',
    dotColor: '#e879f9',
    badgeText: 'Control • Automatic Switching',
    functionText:
      'Detects ambient daylight levels to automatically switch the LED streetlight on at dusk and off at dawn without manual intervention.',
    roleInSystem:
      'Mounted directly on top of the overhanging green LED streetlight housing where it has an unobstructed view of the sky without triggering false turn-offs from the lamp beam below.',
    publicBenefit:
      'Guarantees reliable dusk-to-dawn road lighting for the community even if wireless telemetry or internet connectivity is unavailable.',
    anchor3D: [-1.85, 6.62, 1.55],
    cameraPos: [-0.35, 7.1, 3.6],
    cameraTarget: [-1.85, 6.38, 1.55]
  },
  solar: {
    id: 'solar',
    label: 'Solar panel',
    fullTitle: 'Fixed-Tilt Solar Panel Canopy',
    dotColor: '#f59e0b',
    badgeText: 'Generation • Solar',
    functionText:
      'Converts sunlight into electrical energy at a fixed optimal tilt angle without requiring moving tracking motors.',
    roleInSystem:
      'Positioned atop the protective canopy frame over the roadside bench, the fixed photovoltaic array captures daytime solar irradiance and channels power to the solar charge controller.',
    publicBenefit:
      'Harvests abundant daytime sunshine reliably with zero moving solar-mount parts while serving as a shaded overhead canopy above the public seating area.',
    anchor3D: [0.85, 4.35, 0.0],
    cameraPos: [4.2, 6.2, 6.8],
    cameraTarget: [0.7, 3.8, 0.2]
  },
  battery: {
    id: 'battery',
    label: 'Battery + USB ports',
    fullTitle: 'Battery + USB Charging',
    dotColor: '#34d399',
    badgeText: 'Storage & Public Utility',
    functionText:
      'Stores energy for later use and supplies the public charging station through the appropriate power-conversion and protection circuitry.',
    roleInSystem:
      'Housed in the weatherproof yellow enclosure mounted on the main green pole, containing the LiFePO₄ battery, charge controllers, protection breakers, and regulated USB charging ports.',
    publicBenefit:
      'Allows commuters, students, and residents to charge mobile phones at a convenient roadside point without relying on grid power.',
    anchor3D: [-1.52, 2.35, 0.45],
    cameraPos: [-0.2, 2.7, 4.4],
    cameraTarget: [-1.65, 2.25, 0.1]
  },
  bench: {
    id: 'bench',
    label: 'Bench',
    fullTitle: 'Public Bench',
    dotColor: '#fb923c',
    badgeText: 'Community Infrastructure',
    functionText:
      'Provides a place for residents, students, workers, and other passersby to sit and rest.',
    roleInSystem:
      'Situated safely on the roadside bay beneath the solar canopy structure while the overhead LED streetlight illuminates the rough road in front.',
    publicBenefit:
      'Offers a comfortable roadside stopping point along long walking routes where no public seating currently exists.',
    anchor3D: [0.85, 1.35, 0.3],
    cameraPos: [0.85, 2.3, 5.5],
    cameraTarget: [0.85, 1.3, 0.1]
  }
};

const CAMERA_PRESETS = [
  {
    id: 'whole',
    label: 'Whole view',
    position: [0.5, 4.9, 11.8],
    target: [0.2, 2.8, 1.2],
    componentId: null
  },
  {
    id: 'solar',
    label: 'Solar panel',
    position: SYSTEM_COMPONENTS.solar.cameraPos,
    target: SYSTEM_COMPONENTS.solar.cameraTarget,
    componentId: 'solar'
  },
  {
    id: 'turbine',
    label: 'Wind turbine',
    position: SYSTEM_COMPONENTS.turbine.cameraPos,
    target: SYSTEM_COMPONENTS.turbine.cameraTarget,
    componentId: 'turbine'
  },
  {
    id: 'lamp',
    label: 'LED light',
    position: SYSTEM_COMPONENTS.lamp.cameraPos,
    target: SYSTEM_COMPONENTS.lamp.cameraTarget,
    componentId: 'lamp'
  },
  {
    id: 'photocell',
    label: 'Photocell',
    position: SYSTEM_COMPONENTS.photocell.cameraPos,
    target: SYSTEM_COMPONENTS.photocell.cameraTarget,
    componentId: 'photocell'
  },
  {
    id: 'battery',
    label: 'Battery and charging',
    position: SYSTEM_COMPONENTS.battery.cameraPos,
    target: SYSTEM_COMPONENTS.battery.cameraTarget,
    componentId: 'battery'
  },
  {
    id: 'bench',
    label: 'Bench',
    position: SYSTEM_COMPONENTS.bench.cameraPos,
    target: SYSTEM_COMPONENTS.bench.cameraTarget,
    componentId: 'bench'
  }
];

const DEMO_TELEMETRY_SCENARIOS = {
  night_operational: {
    id: 'night_operational',
    scenarioLabel: 'Demo Scenario: Nighttime Active',
    isSimulated: true,
    lastUpdatedText: 'Demonstration preset (Simulated feedback within 2 mins)',
    isStale: false,
    streetlight: {
      state: 'Operational',
      statusKey: 'operational',
      summary: 'Nighttime illumination active (Simulated verification)',
      detail:
        'In the physical system, an "Operational" state requires hardware feedback (such as current or light sensing) confirming the lamp is drawing power when commanded on by the photocell.'
    },
    charging: {
      state: 'Available',
      statusKey: 'available',
      summary: 'USB charging ports ready for public use (Simulated)',
      detail:
        'Indicates that the regulated DC charging output is energized and no fault or overload condition is triggered.'
    }
  },
  day_standby: {
    id: 'day_standby',
    scenarioLabel: 'Demo Scenario: Daytime Standby & Charging In Use',
    isSimulated: true,
    lastUpdatedText: 'Demonstration preset (Simulated feedback within 1 min)',
    isStale: false,
    streetlight: {
      state: 'Not operating',
      statusKey: 'not_operating',
      summary: 'Daytime standby — Photocell keeps lamp off during daylight',
      detail:
        'During daytime hours, ambient sunlight causes the photocell to keep the LED luminaire switched off while the solar panel and wind turbine charge the battery.'
    },
    charging: {
      state: 'In use',
      statusKey: 'in_use',
      summary: 'Active device draw detected on USB station (Simulated)',
      detail:
        'Reporting "In use" requires port current detection hardware. Without per-port current sensing, the system can only report overall supply availability.'
    }
  },
  unverified_hardware: {
    id: 'unverified_hardware',
    scenarioLabel: 'Demo Scenario: Sensor Feedback Unconfirmed',
    isSimulated: true,
    lastUpdatedText: 'Demonstration preset (Awaiting feedback sensor integration)',
    isStale: false,
    streetlight: {
      state: 'Unknown',
      statusKey: 'unknown',
      summary: 'Lamp feedback sensor not yet verified',
      detail:
        'A software schedule or photocell trigger alone does not prove the lamp is illuminated. Until load-current or optical verification is connected to the ESP32, true status remains Unknown.'
    },
    charging: {
      state: 'Unknown',
      statusKey: 'unknown',
      summary: 'USB port sensing not yet verified',
      detail:
        'Unless voltage/current monitoring is wired to the USB output stage, the microcontroller cannot verify whether individual ports are available or in use.'
    }
  },
  esp32_offline: {
    id: 'esp32_offline',
    scenarioLabel: 'Demo Scenario: Stale Data / ESP32 Offline',
    isSimulated: true,
    lastUpdatedText: 'Last updated: Over 45 minutes ago (Telemetry timeout)',
    isStale: true,
    streetlight: {
      state: 'Offline',
      statusKey: 'offline',
      summary: 'Status unavailable — No recent telemetry from ESP32',
      detail:
        'Important: Even when website telemetry is offline, the physical streetlight continues to operate automatically via its local photocell and battery protection circuitry.'
    },
    charging: {
      state: 'Offline',
      statusKey: 'offline',
      summary: 'Status unavailable — No recent telemetry from ESP32',
      detail:
        'Public USB charging remains governed by local onboard voltage conversion and overcurrent protection even when wireless reporting is unavailable.'
    }
  }
};

const ENERGY_FLOW_STAGES = [
  {
    stageNumber: '01',
    stageName: 'Collect',
    subtitle: 'Renewable Harvesting',
    accentColor: '#d97706',
    bgTint: 'bg-[#FEF9EC]',
    borderTint: 'border-[#F3DFB4]',
    items: [
      {
        title: 'Solar Panel',
        icon: Sun,
        componentRef: 'solar',
        description:
          'Turns sunlight into electricity using a fixed-tilt photovoltaic array mounted atop the bench canopy.'
      },
      {
        title: 'Wind Turbine',
        icon: Wind,
        componentRef: 'turbine',
        description:
          'Turns moving air into electricity, providing another renewable source when wind conditions are suitable.'
      }
    ]
  },
  {
    stageNumber: '02',
    stageName: 'Prepare',
    subtitle: 'Power Conditioning & Regulation',
    accentColor: '#0f766e',
    bgTint: 'bg-[#EFF8F7]',
    borderTint: 'border-[#BFE3DF]',
    items: [
      {
        title: 'Solar Charge Controller',
        icon: Sliders,
        componentRef: 'battery',
        description:
          "Regulates the solar panel's electrical output to charge the battery within its operating limits."
      },
      {
        title: 'Wind Power Conversion',
        icon: Zap,
        componentRef: 'battery',
        description:
          "Converts the turbine's electrical output into a form suitable for the wind charging system. If the turbine produces AC, an appropriate rectifier or integrated conversion stage may be required."
      }
    ]
  },
  {
    stageNumber: '03',
    stageName: 'Store',
    subtitle: 'Protected Energy Reserve',
    accentColor: '#1b4332',
    bgTint: 'bg-[#EFF6F2]',
    borderTint: 'border-[#C2DEC9]',
    items: [
      {
        title: 'Charge Controllers and Battery Protection',
        icon: ShieldAlert,
        componentRef: 'battery',
        description:
          'Manage charging from the renewable sources and help protect the battery from unsafe operating conditions.'
      },
      {
        title: 'LiFePO₄ Battery',
        icon: BatteryCharging,
        componentRef: 'battery',
        description:
          'Stores the energy collected during the day and during suitable wind conditions for use when renewable generation is insufficient.'
      }
    ]
  },
  {
    stageNumber: '04',
    stageName: 'Use',
    subtitle: 'Public Lighting, Charging & Rest',
    accentColor: '#2563eb',
    bgTint: 'bg-[#F0F6FE]',
    borderTint: 'border-[#C7DDFB]',
    items: [
      {
        title: 'LED Streetlight + Photocell',
        icon: Lightbulb,
        componentRef: 'lamp',
        description:
          'Provides nighttime illumination. A top-mounted photocell controls automatic switching based on ambient light, independently of the public website.'
      },
      {
        title: 'USB Charging Station',
        icon: Usb,
        componentRef: 'battery',
        description:
          'Provides a convenient public phone-charging facility powered by the system through suitable power conversion and electrical protection.'
      },
      {
        title: 'Public Bench',
        icon: Armchair,
        componentRef: 'bench',
        description:
          'Provides a place for residents and travelers to rest beside the installation.'
      }
    ]
  }
];

// ============================================================================
// 2. TIME & LIGHTING INTERPOLATION UTILITIES
// ============================================================================

function formatMinutesToClock(totalMinutes) {
  const clamped = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minStr} ${period}`;
}

function getTimePeriodInfo(totalMinutes) {
  const h = (totalMinutes % 1440) / 60;
  if (h >= 5.5 && h < 12) {
    return { label: 'Morning', isDay: true, isNight: false };
  }
  if (h >= 12 && h < 17.25) {
    return { label: 'Afternoon', isDay: true, isNight: false };
  }
  if (h >= 17.25 && h < 18.75) {
    return { label: 'Sunset', isDay: false, isNight: false };
  }
  if (h >= 4.75 && h < 5.5) {
    return { label: 'Dawn', isDay: false, isNight: false };
  }
  return { label: 'Night', isDay: false, isNight: true };
}

function computeEnvironmentState(totalMinutes) {
  const hours = (((totalMinutes % 1440) + 1440) % 1440) / 60;

  // Deep blue-green night sky rather than pure black for readable, realistic nighttime contrast
  const nightSky = new THREE.Color('#0c212c');
  const dawnSky = new THREE.Color('#4d737a');
  const morningSky = new THREE.Color('#c8e3ec');
  const noonSky = new THREE.Color('#d8eef5');
  const sunsetSky = new THREE.Color('#d68456');
  const duskSky = new THREE.Color('#16323f');

  let skyColor = new THREE.Color();
  let fogColor = new THREE.Color();
  let sunIntensity = 0;
  let ambientIntensity = 0.25;
  let moonIntensity = 0;
  let lampIntensity = 0;

  if (hours < 4.75) {
    skyColor.copy(nightSky);
    sunIntensity = 0.02;
    ambientIntensity = 0.34;
    moonIntensity = 0.52;
    lampIntensity = 1.0;
  } else if (hours >= 4.75 && hours < 6.25) {
    const t = (hours - 4.75) / 1.5;
    if (t < 0.5) {
      skyColor.lerpColors(nightSky, dawnSky, t * 2);
    } else {
      skyColor.lerpColors(dawnSky, morningSky, (t - 0.5) * 2);
    }
    sunIntensity = THREE.MathUtils.lerp(0.02, 0.95, t);
    ambientIntensity = THREE.MathUtils.lerp(0.34, 0.74, t);
    moonIntensity = THREE.MathUtils.lerp(0.52, 0.0, t);
    lampIntensity = THREE.MathUtils.clamp(1.0 - t * 1.45, 0, 1);
  } else if (hours >= 6.25 && hours < 12) {
    const t = (hours - 6.25) / 5.75;
    skyColor.lerpColors(morningSky, noonSky, t);
    sunIntensity = THREE.MathUtils.lerp(0.95, 1.35, t);
    ambientIntensity = THREE.MathUtils.lerp(0.74, 0.88, t);
    moonIntensity = 0.0;
    lampIntensity = 0.0;
  } else if (hours >= 12 && hours < 16.75) {
    const t = (hours - 12) / 4.75;
    skyColor.lerpColors(noonSky, morningSky, t);
    sunIntensity = THREE.MathUtils.lerp(1.35, 1.0, t);
    ambientIntensity = THREE.MathUtils.lerp(0.88, 0.75, t);
    moonIntensity = 0.0;
    lampIntensity = 0.0;
  } else if (hours >= 16.75 && hours < 19.0) {
    const t = (hours - 16.75) / 2.25;
    if (t < 0.42) {
      skyColor.lerpColors(morningSky, sunsetSky, t / 0.42);
    } else if (t < 0.76) {
      skyColor.lerpColors(sunsetSky, duskSky, (t - 0.42) / 0.34);
    } else {
      skyColor.lerpColors(duskSky, nightSky, (t - 0.76) / 0.24);
    }
    sunIntensity = THREE.MathUtils.lerp(1.0, 0.02, t);
    ambientIntensity = THREE.MathUtils.lerp(0.75, 0.34, t);
    moonIntensity = THREE.MathUtils.lerp(0.0, 0.52, THREE.MathUtils.clamp((t - 0.4) / 0.6, 0, 1));
    lampIntensity = THREE.MathUtils.smoothstep(t, 0.32, 0.82);
  } else {
    skyColor.copy(nightSky);
    sunIntensity = 0.02;
    ambientIntensity = 0.34;
    moonIntensity = 0.52;
    lampIntensity = 1.0;
  }

  fogColor.copy(skyColor);

  const dayFraction = (hours - 6) / 12;
  const sunAngle = THREE.MathUtils.clamp(dayFraction, -0.15, 1.15) * Math.PI;
  const sunX = Math.cos(sunAngle) * 28;
  const sunY = Math.max(2.5, Math.sin(sunAngle) * 26);
  const sunZ = 10;

  return {
    hours,
    skyColor,
    fogColor,
    sunIntensity,
    ambientIntensity,
    moonIntensity,
    lampIntensity,
    sunPosition: [sunX, sunY, sunZ]
  };
}

// ============================================================================
// 3. CUSTOM TEXTURE GENERATORS FOR PROCEDURAL 3D MATERIALS
// ============================================================================

function createSolarGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#142f54';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1a3c6b');
  grad.addColorStop(0.5, '#122b4d');
  grad.addColorStop(1, '#1d4477');
  ctx.fillStyle = grad;
  ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

  const cols = 12;
  const rows = 6;
  ctx.strokeStyle = 'rgba(215, 230, 248, 0.65)';
  ctx.lineWidth = 2;

  for (let c = 1; c < cols; c++) {
    const x = (canvas.width / cols) * c;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const y = (canvas.height / rows) * r;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#826d55';
  ctx.fillRect(0, 0, 512, 512);

  const leftEdgeGrad = ctx.createLinearGradient(0, 0, 75, 0);
  leftEdgeGrad.addColorStop(0, '#628a48');
  leftEdgeGrad.addColorStop(0.55, '#70634d');
  leftEdgeGrad.addColorStop(1, 'rgba(130, 109, 85, 0)');
  ctx.fillStyle = leftEdgeGrad;
  ctx.fillRect(0, 0, 75, 512);

  const rightEdgeGrad = ctx.createLinearGradient(512, 0, 437, 0);
  rightEdgeGrad.addColorStop(0, '#628a48');
  rightEdgeGrad.addColorStop(0.55, '#70634d');
  rightEdgeGrad.addColorStop(1, 'rgba(130, 109, 85, 0)');
  ctx.fillStyle = rightEdgeGrad;
  ctx.fillRect(437, 0, 75, 512);

  const drawTireTrack = (centerX) => {
    const rutGrad = ctx.createLinearGradient(centerX - 42, 0, centerX + 42, 0);
    rutGrad.addColorStop(0, 'rgba(92, 74, 56, 0)');
    rutGrad.addColorStop(0.3, 'rgba(84, 67, 50, 0.55)');
    rutGrad.addColorStop(0.5, 'rgba(72, 57, 42, 0.72)');
    rutGrad.addColorStop(0.7, 'rgba(84, 67, 50, 0.55)');
    rutGrad.addColorStop(1, 'rgba(92, 74, 56, 0)');
    ctx.fillStyle = rutGrad;
    ctx.fillRect(centerX - 42, 0, 84, 512);
  };
  drawTireTrack(175);
  drawTireTrack(337);

  let seed = 104729;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 95; i++) {
    const x = 35 + nextRand() * 442;
    const y = nextRand() * 512;
    const rx = 8 + nextRand() * 22;
    const ry = 12 + nextRand() * 34;
    ctx.fillStyle =
      nextRand() > 0.48
        ? 'rgba(104, 85, 64, 0.34)'
        : 'rgba(156, 134, 106, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, nextRand() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const stonePalette = [
    '#5c4d3c',
    '#9c8b75',
    '#6e6254',
    '#b09f88',
    '#4f4336',
    '#7d7061'
  ];
  for (let i = 0; i < 1100; i++) {
    const x = 22 + nextRand() * 468;
    const y = nextRand() * 512;
    const r = 1.0 + nextRand() * 3.8;
    ctx.fillStyle =
      stonePalette[Math.floor(nextRand() * stonePalette.length)];
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r,
      r * (0.65 + nextRand() * 0.7),
      nextRand() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(68, 53, 39, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 45; i++) {
    const y = nextRand() * 512;
    const xStart = 70 + nextRand() * 140;
    const len = 40 + nextRand() * 160;
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xStart + len, y + (nextRand() - 0.5) * 6);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 18);
  return texture;
}

function createSoftGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(255, 247, 194, 0.95)');
  grad.addColorStop(0.35, 'rgba(254, 240, 138, 0.55)');
  grad.addColorStop(0.7, 'rgba(253, 224, 71, 0.18)');
  grad.addColorStop(1, 'rgba(253, 224, 71, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

// ============================================================================
// 3B. LIGHTWEIGHT HERO ARCHITECTURAL VISUAL PREVIEW (SVG + SUBTLE CSS MOTION)
// ============================================================================

function HeroInstallationPreview({
  onSelectComponentAndScroll,
  onPreviewNightMode,
  prefersReducedMotion
}) {
  const [heroNightPreview, setHeroNightPreview] = useState(false);

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      <div
        className={`relative rounded-3xl overflow-hidden border transition-colors duration-700 shadow-md ${
          heroNightPreview
            ? 'bg-gradient-to-b from-[#0b1f2a] via-[#13313e] to-[#172e26] border-[#2b4c59]'
            : 'bg-gradient-to-b from-[#cde6ef] via-[#dfeff4] to-[#d9ead3] border-[#D5D2C9]'
        } p-4 sm:p-5`}
      >
        {/* Top bar inside Hero Visual Card */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xs border ${
              heroNightPreview
                ? 'bg-[#0f2936]/80 text-[#a7f3d0] border-white/15'
                : 'bg-white/85 text-[#1B3B2B] border-[#1B3B2B]/15'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                heroNightPreview
                  ? 'bg-[#facc15] shadow-[0_0_6px_#facc15]'
                  : 'bg-[#2D6A4F]'
              }`}
            />
            <span>
              {heroNightPreview
                ? 'Night Preview: Photocell LED Active'
                : 'Day Preview: Solar & Wind Harvesting'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setHeroNightPreview((prev) => !prev)}
            aria-label={
              heroNightPreview
                ? 'Switch hero preview to daytime mode'
                : 'Switch hero preview to nighttime mode'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
              heroNightPreview
                ? 'bg-[#E5A93B] text-[#1A241E] border-[#facc15]'
                : 'bg-[#1B3B2B] text-white border-[#1B3B2B] hover:bg-[#143022]'
            }`}
          >
            {heroNightPreview ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span>Day View</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#E5A93B]" />
                <span>Night View</span>
              </>
            )}
          </button>
        </div>

        {/* Lightweight Vector Scene Matching the 3D Installation */}
        <div className="relative rounded-2xl overflow-hidden border border-black/5">
          <svg
            viewBox="0 0 560 360"
            className="w-full h-auto block select-none"
            role="img"
            aria-label="Architectural preview of the Macopoy Hybrid Solar-Wind Streetlight with fixed solar canopy, rear-facing wind turbine, top photocell sensor, USB charging box, and public bench"
          >
            <defs>
              <linearGradient id="heroDaySky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bfe0ec" />
                <stop offset="65%" stopColor="#dff0f5" />
                <stop offset="100%" stopColor="#e9f3e4" />
              </linearGradient>
              <linearGradient id="heroNightSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a1c26" />
                <stop offset="60%" stopColor="#122e3c" />
                <stop offset="100%" stopColor="#193833" />
              </linearGradient>
              <linearGradient id="heroLampBeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.52" />
                <stop offset="65%" stopColor="#fde047" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.0" />
              </linearGradient>
              <radialGradient id="heroRoadPool" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sky Background */}
            <rect
              x="0"
              y="0"
              width="560"
              height="360"
              fill={heroNightPreview ? 'url(#heroNightSky)' : 'url(#heroDaySky)'}
            />

            {/* Subtle Sun or Moon & Stars */}
            {heroNightPreview ? (
              <g>
                <circle cx="465" cy="64" r="18" fill="#dbeafe" opacity="0.9" />
                <circle cx="472" cy="59" r="15" fill="#0d222e" />
                <circle cx="90" cy="48" r="1.5" fill="#e0f2fe" opacity="0.7" />
                <circle cx="155" cy="72" r="1.2" fill="#e0f2fe" opacity="0.5" />
                <circle cx="320" cy="42" r="1.6" fill="#e0f2fe" opacity="0.65" />
                <circle cx="395" cy="84" r="1.3" fill="#e0f2fe" opacity="0.5" />
              </g>
            ) : (
              <g className={prefersReducedMotion ? '' : 'hero-float-slow'}>
                <circle cx="462" cy="66" r="28" fill="#fde68a" opacity="0.38" />
                <circle cx="462" cy="66" r="19" fill="#f59e0b" opacity="0.92" />
                {/* Subtle drifting sunlight particles */}
                <circle cx="390" cy="95" r="2.5" fill="#f59e0b" opacity="0.55" />
                <circle cx="425" cy="118" r="2" fill="#fbbf24" opacity="0.5" />
                <circle cx="348" cy="112" r="2.2" fill="#f59e0b" opacity="0.45" />
              </g>
            )}

            {/* Subtle Wind Streamlines near Turbine */}
            <g
              className={prefersReducedMotion ? '' : 'hero-wind-drift'}
              stroke={heroNightPreview ? '#7dd3fc' : '#0284c7'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity={heroNightPreview ? '0.45' : '0.4'}
            >
              <path d="M 48 64 C 78 64, 92 56, 122 56" />
              <path d="M 36 82 C 70 82, 88 75, 126 75" />
              <path d="M 58 98 C 86 98, 102 92, 132 92" />
            </g>

            {/* Distant Mascap Mountain Ridges */}
            <path
              d="M 0 238 Q 95 162 215 210 T 430 178 L 560 218 L 560 275 L 0 275 Z"
              fill={heroNightPreview ? '#15342b' : '#65a84e'}
            />
            <path
              d="M 150 248 Q 285 178 405 222 T 560 202 L 560 275 L 150 275 Z"
              fill={heroNightPreview ? '#1c4337' : '#53933d'}
              opacity="0.88"
            />

            {/* Swaying Roadside Trees */}
            <g className={prefersReducedMotion ? '' : 'hero-tree-sway'}>
              <rect
                x="66"
                y="212"
                width="6"
                height="28"
                fill={heroNightPreview ? '#292019' : '#4a3728'}
              />
              <polygon
                points="69,162 48,216 90,216"
                fill={heroNightPreview ? '#122b22' : '#1f4e29'}
              />
              <rect
                x="496"
                y="206"
                width="6"
                height="32"
                fill={heroNightPreview ? '#292019' : '#4a3728'}
              />
              <polygon
                points="499,154 476,212 522,212"
                fill={heroNightPreview ? '#122b22' : '#1f4e29'}
              />
            </g>

            {/* Roadside Grass Shoulder & Rough Gravel Road */}
            <rect
              x="0"
              y="236"
              width="560"
              height="124"
              fill={heroNightPreview ? '#183629' : '#6ab04c'}
            />
            <polygon
              points="0,282 560,282 560,360 0,360"
              fill={heroNightPreview ? '#463c31' : '#857058'}
            />
            {/* Rough Road Tire Tracks & Pebbles */}
            <path
              d="M 0 304 Q 180 300 350 305 T 560 302"
              stroke={heroNightPreview ? '#332b22' : '#6b5843'}
              strokeWidth="8"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 0 336 Q 200 340 380 333 T 560 337"
              stroke={heroNightPreview ? '#332b22' : '#6b5843'}
              strokeWidth="8"
              fill="none"
              opacity="0.65"
            />

            {/* Concrete Roadside Pad */}
            <polygon
              points="142,272 442,272 456,286 130,286"
              fill={heroNightPreview ? '#6e736e' : '#b8b0a2'}
            />

            {/* Wind Turbine Rotor on Rear (-Z) Side of Pole (Opposite the Lamp Arm) */}
            <g transform="translate(206, 78)">
              <rect x="-5" y="-5" width="16" height="10" rx="3" fill="#cbd5e1" />
              <g>
                <line
                  x1="7"
                  y1="0"
                  x2="28"
                  y2="-28"
                  stroke="#e2e8f0"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <line
                  x1="7"
                  y1="0"
                  x2="28"
                  y2="28"
                  stroke="#cbd5e1"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <line
                  x1="7"
                  y1="0"
                  x2="-24"
                  y2="2"
                  stroke="#94a3b8"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="0" r="4.5" fill="#f8fafc" />
              </g>
            </g>

            {/* Main Left Green Structural Pole */}
            <rect
              x="194"
              y="62"
              width="13"
              height="214"
              rx="3"
              fill={heroNightPreview ? '#236e33' : '#2b8a3e'}
            />

            {/* Overhanging LED Streetlight Arm (Extending Forward over the Road) */}
            <rect
              x="140"
              y="56"
              width="68"
              height="11"
              rx="3.5"
              fill={heroNightPreview ? '#236e33' : '#2b8a3e'}
            />
            <rect
              x="146"
              y="66"
              width="44"
              height="4"
              rx="1.5"
              fill={heroNightPreview ? '#fef08a' : '#d8dee3'}
            />

            {/* 3D Photocell Sensor Unit Mounted on TOP of the LED Streetlight */}
            <g transform="translate(164, 44)">
              <rect x="0" y="9" width="12" height="4" rx="1" fill="#1e293b" />
              <rect x="1.5" y="3" width="9" height="7" rx="1.5" fill="#1d4ed8" />
              <path d="M 1.5 3 A 4.5 4.5 0 0 1 10.5 3 Z" fill="#bae6fd" />
              <circle
                cx="6"
                cy="6.5"
                r="1.6"
                fill={heroNightPreview ? '#facc15' : '#34d399'}
              />
            </g>

            {/* Nighttime Warm Volumetric Light Cone & Road Pool */}
            {heroNightPreview && (
              <g>
                <polygon
                  points="146,70 190,70 250,352 75,352"
                  fill="url(#heroLampBeam)"
                />
                <ellipse
                  cx="165"
                  cy="322"
                  rx="95"
                  ry="28"
                  fill="url(#heroRoadPool)"
                />
              </g>
            )}

            {/* Canopy Frame & Fixed-Tilt Solar Panel Roof (No Tracker) */}
            <line
              x1="224"
              y1="142"
              x2="224"
              y2="274"
              stroke={heroNightPreview ? '#236e33' : '#2b8a3e'}
              strokeWidth="4.5"
            />
            <line
              x1="406"
              y1="142"
              x2="406"
              y2="274"
              stroke={heroNightPreview ? '#236e33' : '#2b8a3e'}
              strokeWidth="4.5"
            />
            <line
              x1="205"
              y1="142"
              x2="424"
              y2="142"
              stroke={heroNightPreview ? '#236e33' : '#2b8a3e'}
              strokeWidth="5.5"
            />
            {/* Fixed-Tilt Solar Panel Array */}
            <polygon
              points="212,138 432,138 418,112 226,112"
              fill={heroNightPreview ? '#152c4a' : '#1d4477'}
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
            <line
              x1="274"
              y1="112"
              x2="265"
              y2="138"
              stroke="#93c5fd"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <line
              x1="322"
              y1="112"
              x2="322"
              y2="138"
              stroke="#93c5fd"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <line
              x1="370"
              y1="112"
              x2="379"
              y2="138"
              stroke="#93c5fd"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* Yellow Battery & USB Charging Enclosure on Pole */}
            <rect
              x="203"
              y="174"
              width="24"
              height="48"
              rx="3"
              fill={heroNightPreview ? '#ca9a12' : '#dfbe1b'}
              stroke="#1e293b"
              strokeWidth="1.2"
            />
            <circle cx="211" cy="186" r="2" fill="#34d399" />
            <circle cx="211" cy="193" r="2" fill="#34d399" />
            <rect x="216" y="185" width="6" height="4" rx="1" fill="#38bdf8" />
            <rect x="208" y="202" width="13" height="14" rx="1" fill="#ffffff" />

            {/* Orange Slatted Public Bench Underneath Solar Canopy */}
            <g>
              {heroNightPreview && (
                <ellipse
                  cx="318"
                  cy="276"
                  rx="74"
                  ry="12"
                  fill="#fef08a"
                  opacity="0.16"
                />
              )}
              <rect
                x="252"
                y="214"
                width="132"
                height="6"
                rx="2"
                fill={heroNightPreview ? '#b86311' : '#e07a16'}
              />
              <rect
                x="252"
                y="224"
                width="132"
                height="6"
                rx="2"
                fill={heroNightPreview ? '#b86311' : '#e07a16'}
              />
              <rect
                x="246"
                y="240"
                width="144"
                height="8"
                rx="2.5"
                fill={heroNightPreview ? '#c96d14' : '#e07a16'}
              />
              <rect
                x="258"
                y="210"
                width="7"
                height="64"
                rx="2"
                fill="#9a4f0c"
              />
              <rect
                x="371"
                y="210"
                width="7"
                height="64"
                rx="2"
                fill="#9a4f0c"
              />
            </g>
          </svg>
        </div>

        {/* Interactive Quick-Focus Component Pills */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'turbine', label: 'Wind Turbine', color: '#38bdf8' },
              { id: 'solar', label: 'Fixed Solar Canopy', color: '#f59e0b' },
              { id: 'photocell', label: 'Top Photocell', color: '#e879f9' },
              { id: 'battery', label: 'USB + Battery', color: '#34d399' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectComponentAndScroll(item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                  heroNightPreview
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                    : 'bg-white/90 hover:bg-white text-[#1F2421] border-[#D5D2C9]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onPreviewNightMode(heroNightPreview)}
            className={`text-[11px] font-bold underline underline-offset-2 ${
              heroNightPreview ? 'text-[#fde047]' : 'text-[#1B3B2B]'
            }`}
          >
            Open in 3D Scene →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. INTERACTIVE 3D SCENE COMPONENT (THREE.JS REAL-TIME RENDERER)
// ============================================================================

function StreetlightThreeScene({
  timeMinutes,
  isPlaying,
  onTogglePlay,
  onTimeChange,
  simSpeed,
  onSimSpeedChange,
  activePreset,
  onSelectPreset,
  selectedComponentId,
  onSelectComponent,
  showLabels,
  onToggleLabels,
  showAllLabels,
  onToggleShowAllLabels,
  showEnergyFlow,
  onToggleEnergyFlow,
  showPerson,
  onTogglePerson,
  onResetView,
  prefersReducedMotion
}) {
  const mountRef = useRef(null);
  const [webglError, setWebglError] = useState(false);
  const [labelPositions, setLabelPositions] = useState({});
  const [moreControlsOpen, setMoreControlsOpen] = useState(false);

  const sceneStateRef = useRef({
    timeMinutes,
    showEnergyFlow,
    showPerson,
    selectedComponentId,
    prefersReducedMotion,
    cameraPosStart: new THREE.Vector3(...CAMERA_PRESETS[0].position),
    cameraLookStart: new THREE.Vector3(...CAMERA_PRESETS[0].target),
    cameraPosTarget: new THREE.Vector3(...CAMERA_PRESETS[0].position),
    cameraLookTarget: new THREE.Vector3(...CAMERA_PRESETS[0].target),
    transitionStartTime: 0,
    transitionDuration: 950,
    isTransitioningCamera: false,
    triggerNewTransition: false
  });

  useEffect(() => {
    sceneStateRef.current.timeMinutes = timeMinutes;
  }, [timeMinutes]);

  useEffect(() => {
    sceneStateRef.current.showEnergyFlow = showEnergyFlow;
  }, [showEnergyFlow]);

  useEffect(() => {
    sceneStateRef.current.showPerson = showPerson;
  }, [showPerson]);

  useEffect(() => {
    sceneStateRef.current.selectedComponentId = selectedComponentId;
  }, [selectedComponentId]);

  useEffect(() => {
    sceneStateRef.current.prefersReducedMotion = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    const presetObj =
      CAMERA_PRESETS.find((p) => p.id === activePreset) || CAMERA_PRESETS[0];
    sceneStateRef.current.cameraPosTarget.set(...presetObj.position);
    sceneStateRef.current.cameraLookTarget.set(...presetObj.target);
    sceneStateRef.current.triggerNewTransition = true;
  }, [activePreset, selectedComponentId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.error('WebGL initialization failed:', err);
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#c8e3ec');
    scene.fog = new THREE.FogExp2('#c8e3ec', 0.0078);

    const camera = new THREE.PerspectiveCamera(
      44,
      container.clientWidth / container.clientHeight,
      0.1,
      220
    );

    const getResponsiveCameraConfig = (width, height) => {
      const aspect = width / Math.max(height, 1);
      const isPortraitPhone = width < 640 || aspect < 0.85;
      return {
        fov: isPortraitPhone ? 52 : 44,
        distanceMultiplier: isPortraitPhone ? 1.32 : 1.0
      };
    };

    const initialCamCfg = getResponsiveCameraConfig(
      container.clientWidth,
      container.clientHeight
    );
    camera.fov = initialCamCfg.fov;
    camera.updateProjectionMatrix();

    camera.position
      .set(...CAMERA_PRESETS[0].position)
      .multiplyScalar(initialCamCfg.distanceMultiplier);
    const currentLookAt = new THREE.Vector3(...CAMERA_PRESETS[0].target);
    camera.lookAt(currentLookAt);

    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerMovedDistance = 0;
    let initialPinchDistance = null;
    let initialPinchRadius = null;

    const spherical = new THREE.Spherical();
    const offsetVec = new THREE.Vector3();

    const syncSphericalFromCamera = () => {
      offsetVec.copy(camera.position).sub(currentLookAt);
      spherical.setFromVector3(offsetVec);
    };
    syncSphericalFromCamera();

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#3c6e37', 0.78);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.2);
    dirLight.position.set(16, 24, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 75;
    const d = 14;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle Cool Moonlight Rim Light for Realistic Nighttime Visibility
    const moonRimLight = new THREE.DirectionalLight('#93c5fd', 0.0);
    moonRimLight.position.set(-18, 22, -16);
    scene.add(moonRimLight);

    const groundGeo = new THREE.PlaneGeometry(240, 240, 32, 32);
    const groundMat = new THREE.MeshLambertMaterial({ color: '#69b34c' });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const streakGroup = new THREE.Group();
    const streakMat = new THREE.MeshBasicMaterial({
      color: '#a3d98a',
      transparent: true,
      opacity: 0.45
    });
    const streakGeo = new THREE.PlaneGeometry(0.12, 3.2);
    const streakCoords = [
      [-8, -12], [-14, -5], [-9, 6], [-16, 12], [-6, 18],
      [11, -15], [16, -6], [12, 4], [18, 10], [10, 16], [15, -22]
    ];
    streakCoords.forEach(([sx, sz]) => {
      const sMesh = new THREE.Mesh(streakGeo, streakMat);
      sMesh.rotation.x = -Math.PI / 2;
      sMesh.position.set(sx, 0.02, sz);
      streakGroup.add(sMesh);
    });
    scene.add(streakGroup);

    const hillMat = new THREE.MeshLambertMaterial({ color: '#589e3f' });
    const hillsData = [
      { pos: [-38, -2, -45], scale: [34, 14, 24] },
      { pos: [28, -3, -58], scale: [44, 16, 28] },
      { pos: [-28, -2, 35], scale: [28, 10, 24] }
    ];
    hillsData.forEach((h) => {
      const hillGeo = new THREE.SphereGeometry(1, 20, 12);
      const hill = new THREE.Mesh(hillGeo, hillMat);
      hill.position.set(...h.pos);
      hill.scale.set(...h.scale);
      scene.add(hill);
    });

    const roadTex = createRoadTexture();
    const roadGeo = new THREE.PlaneGeometry(7.8, 220, 24, 120);
    const roadPosAttr = roadGeo.attributes.position;
    for (let i = 0; i < roadPosAttr.count; i++) {
      const vx = roadPosAttr.getX(i);
      const vy = roadPosAttr.getY(i);
      const edgeFactor = Math.max(0, 1 - Math.abs(vx) / 3.6);
      const rutWave = Math.cos(vx * 1.65) * 0.025 + Math.sin(vy * 0.45 + vx) * 0.015;
      roadPosAttr.setZ(i, rutWave * edgeFactor);
    }
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.98,
      metalness: 0.02
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = Math.PI / 2;
    roadMesh.position.set(0, 0.035, 4.6);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const rockMat = new THREE.MeshLambertMaterial({ color: '#786b5c' });
    const rockCoords = [
      [-4.2, 1.3], [-3.1, 1.15], [-2.3, 1.4], [3.4, 1.25], [4.5, 1.4],
      [-5.5, 8.2], [-1.2, 8.35], [2.4, 8.2], [5.8, 8.4], [-7.2, 1.35]
    ];
    rockCoords.forEach(([rx, rz], idx) => {
      const rGeo = new THREE.DodecahedronGeometry(0.11 + (idx % 3) * 0.04, 0);
      const rMesh = new THREE.Mesh(rGeo, rockMat);
      rMesh.position.set(rx, 0.05, rz);
      rMesh.scale.set(1.2, 0.55, 1.0);
      rMesh.rotation.y = idx * 1.1;
      rMesh.castShadow = true;
      rMesh.receiveShadow = true;
      scene.add(rMesh);
    });

    const padGeo = new THREE.BoxGeometry(6.2, 0.08, 2.2);
    const padMat = new THREE.MeshStandardMaterial({
      color: '#b8b0a2',
      roughness: 0.95
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0.35, 0.04, 0.0);
    padMesh.receiveShadow = true;
    scene.add(padMesh);

    const houseWindowMaterials = [];
    const buildHouse = (x, z, rotY = 0) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(x, 0, z);
      hGroup.rotation.y = rotY;

      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 2.3, 3.2),
        new THREE.MeshLambertMaterial({ color: '#4b524e' })
      );
      wallMesh.position.y = 1.15;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      hGroup.add(wallMesh);

      const roofGeo = new THREE.ConeGeometry(3.1, 1.5, 4);
      const roofMesh = new THREE.Mesh(
        roofGeo,
        new THREE.MeshLambertMaterial({ color: '#9e4737' })
      );
      roofMesh.position.y = 3.05;
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.castShadow = true;
      hGroup.add(roofMesh);

      const winMat = new THREE.MeshBasicMaterial({ color: '#2a2e2c' });
      houseWindowMaterials.push(winMat);
      const winGeo = new THREE.PlaneGeometry(0.55, 0.65);

      const w1 = new THREE.Mesh(winGeo, winMat);
      w1.position.set(-0.85, 1.25, 1.61);
      hGroup.add(w1);

      const w2 = new THREE.Mesh(winGeo, winMat);
      w2.position.set(0.85, 1.25, 1.61);
      hGroup.add(w2);

      scene.add(hGroup);
    };

    buildHouse(-13.5, -6.5, 0.18);
    buildHouse(-16.8, -14.5, 0.12);
    buildHouse(14.5, -8.0, -0.2);

    const buildTree = (x, z, scale = 1) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(x, 0, z);
      tGroup.scale.setScalar(scale);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 1.2, 8),
        new THREE.MeshLambertMaterial({ color: '#3b2d22' })
      );
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tGroup.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 3.4, 9),
        new THREE.MeshLambertMaterial({ color: '#1b3b22' })
      );
      foliage.position.y = 2.7;
      foliage.castShadow = true;
      tGroup.add(foliage);

      scene.add(tGroup);
    };

    buildTree(-9.5, -7.5, 1.05);
    buildTree(-6.8, -11.5, 0.85);
    buildTree(-12.2, -13.0, 1.15);
    buildTree(9.5, -6.5, 0.95);
    buildTree(12.5, -12.0, 1.15);
    buildTree(-11.5, 11.5, 0.9);

    const interactiveMeshes = [];
    const registerClickable = (mesh, componentId) => {
      mesh.userData.componentId = componentId;
      interactiveMeshes.push(mesh);
    };

    const installationGroup = new THREE.Group();
    scene.add(installationGroup);

    const greenStructureMat = new THREE.MeshStandardMaterial({
      color: '#2b8a3e',
      roughness: 0.45,
      metalness: 0.25
    });

    const darkFrameMat = new THREE.MeshStandardMaterial({
      color: '#27363b',
      roughness: 0.5,
      metalness: 0.4
    });

    // --- 1. Main Left Green Pole ---
    const mainPoleGeo = new THREE.CylinderGeometry(0.22, 0.22, 6.2, 24);
    const mainPoleMesh = new THREE.Mesh(mainPoleGeo, greenStructureMat);
    mainPoleMesh.position.set(-1.85, 3.1, 0);
    mainPoleMesh.castShadow = true;
    mainPoleMesh.receiveShadow = true;
    installationGroup.add(mainPoleMesh);

    // --- 2. LED Streetlight Fixture at Top of Main Pole (Extending Forward +Z over the road) ---
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.85, 6.22, 0);
    installationGroup.add(lampGroup);

    const lampHousingGeo = new THREE.BoxGeometry(0.95, 0.24, 2.45);
    const lampHousingMesh = new THREE.Mesh(lampHousingGeo, greenStructureMat);
    lampHousingMesh.position.set(0, 0.08, 1.05);
    lampHousingMesh.castShadow = true;
    lampGroup.add(lampHousingMesh);
    registerClickable(lampHousingMesh, 'lamp');

    const ledLensMat = new THREE.MeshStandardMaterial({
      color: '#d8dee3',
      emissive: '#fef08a',
      emissiveIntensity: 0.0,
      roughness: 0.2
    });
    const ledLensGeo = new THREE.BoxGeometry(0.74, 0.06, 1.85);
    const ledLensMesh = new THREE.Mesh(ledLensGeo, ledLensMat);
    ledLensMesh.position.set(0, -0.04, 1.18);
    lampGroup.add(ledLensMesh);
    registerClickable(ledLensMesh, 'lamp');

    // --- 2B. Detailed 3D Photocell Sensor Unit on TOP of the LED Streetlight Housing ---
    const photocellGroup = new THREE.Group();
    photocellGroup.position.set(0, 0.2, 1.55);
    lampGroup.add(photocellGroup);

    const pcBaseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.05, 20),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6, metalness: 0.3 })
    );
    pcBaseMesh.position.y = 0.025;
    pcBaseMesh.castShadow = true;
    photocellGroup.add(pcBaseMesh);
    registerClickable(pcBaseMesh, 'photocell');

    const pcCollarMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.135, 0.04, 20),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.6 })
    );
    pcCollarMesh.position.y = 0.065;
    photocellGroup.add(pcCollarMesh);
    registerClickable(pcCollarMesh, 'photocell');

    const pcHousingMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.12, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.3, metalness: 0.2 })
    );
    pcHousingMesh.position.y = 0.15;
    pcHousingMesh.castShadow = true;
    photocellGroup.add(pcHousingMesh);
    registerClickable(pcHousingMesh, 'photocell');

    const pcDomeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: '#e0f2fe',
        transparent: true,
        opacity: 0.78,
        roughness: 0.15,
        metalness: 0.1
      })
    );
    pcDomeMesh.position.y = 0.22;
    photocellGroup.add(pcDomeMesh);
    registerClickable(pcDomeMesh, 'photocell');

    const pcEyeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16),
      new THREE.MeshStandardMaterial({
        color: '#fb923c',
        emissive: '#f97316',
        emissiveIntensity: 0.35,
        roughness: 0.25
      })
    );
    pcEyeMesh.position.set(0, 0.22, 0.03);
    pcEyeMesh.rotation.x = 0.35;
    photocellGroup.add(pcEyeMesh);
    registerClickable(pcEyeMesh, 'photocell');

    const photocellStatusLedMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    const pcStatusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      photocellStatusLedMat
    );
    pcStatusLed.position.set(0, 0.15, 0.118);
    photocellGroup.add(pcStatusLed);
    registerClickable(pcStatusLed, 'photocell');

    // Nighttime SpotLight + Volumetric Light Cone directed strictly out onto the rough road (Z = 4.6)
    const streetSpotLight = new THREE.SpotLight(
      '#fff4b8',
      0,
      28,
      Math.PI / 2.6,
      0.62,
      1.1
    );
    streetSpotLight.position.set(-1.85, 6.12, 1.85);
    streetSpotLight.target.position.set(-1.85, 0, 4.75);
    streetSpotLight.castShadow = true;
    scene.add(streetSpotLight);
    scene.add(streetSpotLight.target);

    // Gentle Warm Nighttime Fill Light near the Public Bench & Canopy
    const benchNightFillLight = new THREE.PointLight('#fde68a', 0, 6.5, 1.6);
    benchNightFillLight.position.set(0.45, 2.75, 0.65);
    scene.add(benchNightFillLight);

    // Subtle Indicator Glow Light near the USB Charging Station
    const usbIndicatorLight = new THREE.PointLight('#34d399', 0, 2.2, 1.8);
    usbIndicatorLight.position.set(-1.32, 2.42, 0.55);
    scene.add(usbIndicatorLight);

    const lightConeGeo = new THREE.ConeGeometry(3.85, 6.5, 32, 1, true);
    const lightConeMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lightConeMesh = new THREE.Mesh(lightConeGeo, lightConeMat);
    lightConeMesh.position.set(-1.85, 3.05, 3.3);
    lightConeMesh.rotation.x = -0.44;
    lightConeMesh.rotation.z = 0.0;
    scene.add(lightConeMesh);

    const softGlowTex = createSoftGlowTexture();
    const roadGlowGeo = new THREE.PlaneGeometry(8.2, 6.8);
    const roadGlowMat = new THREE.MeshBasicMaterial({
      map: softGlowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const roadGlowMesh = new THREE.Mesh(roadGlowGeo, roadGlowMat);
    roadGlowMesh.rotation.x = -Math.PI / 2;
    roadGlowMesh.position.set(-1.65, 0.065, 4.55);
    scene.add(roadGlowMesh);

    const benchGlowGeo = new THREE.PlaneGeometry(4.6, 3.2);
    const benchGlowMat = new THREE.MeshBasicMaterial({
      map: softGlowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const benchGlowMesh = new THREE.Mesh(benchGlowGeo, benchGlowMat);
    benchGlowMesh.rotation.x = -Math.PI / 2;
    benchGlowMesh.position.set(0.65, 0.055, 0.25);
    scene.add(benchGlowMesh);

    // --- 3. 3-Blade Wind Turbine Facing OPPOSITE (-Z) of the LED Streetlight ---
    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(-1.85, 5.95, -0.22);
    installationGroup.add(turbineGroup);

    const turbineBodyMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.35,
      metalness: 0.5
    });
    const nacelleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.65, 16),
      turbineBodyMat
    );
    nacelleMesh.rotation.x = Math.PI / 2;
    nacelleMesh.position.set(0, 0, -0.12);
    turbineGroup.add(nacelleMesh);
    registerClickable(nacelleMesh, 'turbine');

    const rotorHubGroup = new THREE.Group();
    rotorHubGroup.position.set(0, 0, -0.46);
    turbineGroup.add(rotorHubGroup);

    const noseCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.28, 16),
      turbineBodyMat
    );
    noseCone.rotation.x = -Math.PI / 2;
    noseCone.position.set(0, 0, -0.12);
    rotorHubGroup.add(noseCone);
    registerClickable(noseCone, 'turbine');

    const bladeGeo = new THREE.BoxGeometry(0.18, 1.55, 0.05);
    for (let i = 0; i < 3; i++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (i * Math.PI * 2) / 3;

      const bladeMesh = new THREE.Mesh(bladeGeo, turbineBodyMat);
      bladeMesh.position.set(0, 0.78, 0);
      bladeMesh.rotation.y = 0.22;
      bladeMesh.castShadow = true;
      registerClickable(bladeMesh, 'turbine');

      bladePivot.add(bladeMesh);
      rotorHubGroup.add(bladePivot);
    }

    // --- 4. Yellow Battery & USB Charging Station Enclosure on Green Pole ---
    const batteryBoxGroup = new THREE.Group();
    batteryBoxGroup.position.set(-1.52, 2.35, 0);
    installationGroup.add(batteryBoxGroup);

    const bracketMat = new THREE.MeshStandardMaterial({
      color: '#2563eb',
      roughness: 0.5
    });
    const backPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.1, 0.68),
      bracketMat
    );
    backPlate.position.set(-0.18, 0, 0);
    batteryBoxGroup.add(backPlate);
    registerClickable(backPlate, 'battery');

    const yellowBoxMat = new THREE.MeshStandardMaterial({
      color: '#dfbe1b',
      roughness: 0.4,
      metalness: 0.15
    });
    const yellowBoxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.48, 0.65),
      yellowBoxMat
    );
    yellowBoxMesh.position.set(0.12, 0, 0);
    yellowBoxMesh.castShadow = true;
    yellowBoxMesh.receiveShadow = true;
    batteryBoxGroup.add(yellowBoxMesh);
    registerClickable(yellowBoxMesh, 'battery');

    const panelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.36, 0.46),
      darkFrameMat
    );
    panelMesh.position.set(0.38, 0.36, 0);
    batteryBoxGroup.add(panelMesh);
    registerClickable(panelMesh, 'battery');

    const frontDoorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1.26, 0.04),
      new THREE.MeshStandardMaterial({ color: '#c7a712', roughness: 0.45 })
    );
    frontDoorMesh.position.set(0.12, 0, 0.32);
    batteryBoxGroup.add(frontDoorMesh);
    registerClickable(frontDoorMesh, 'battery');

    const ledIndicatorMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    const usbPortGlowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.04, 0.05),
        ledIndicatorMat
      );
      dot.position.set(0.0, 0.25 - i * 0.11, 0.345);
      batteryBoxGroup.add(dot);
    }
    for (let u = 0; u < 2; u++) {
      const usbSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.05, 0.09),
        usbPortGlowMat
      );
      usbSlot.position.set(0.22 + u * 0.08, 0.18, 0.345);
      batteryBoxGroup.add(usbSlot);
    }

    const qrPlaqueCanvas = document.createElement('canvas');
    qrPlaqueCanvas.width = 128;
    qrPlaqueCanvas.height = 160;
    const qCtx = qrPlaqueCanvas.getContext('2d');
    qCtx.fillStyle = '#ffffff';
    qCtx.fillRect(0, 0, 128, 160);
    qCtx.fillStyle = '#1B3B2B';
    qCtx.fillRect(0, 0, 128, 28);
    qCtx.fillStyle = '#ffffff';
    qCtx.font = 'bold 11px sans-serif';
    qCtx.textAlign = 'center';
    qCtx.fillText('SCAN FOR INFO', 64, 18);

    const drawFinder = (fx, fy) => {
      qCtx.fillStyle = '#111827';
      qCtx.fillRect(fx, fy, 26, 26);
      qCtx.fillStyle = '#ffffff';
      qCtx.fillRect(fx + 4, fy + 4, 18, 18);
      qCtx.fillStyle = '#111827';
      qCtx.fillRect(fx + 8, fy + 8, 10, 10);
    };
    drawFinder(18, 38);
    drawFinder(84, 38);
    drawFinder(18, 104);

    qCtx.fillStyle = '#111827';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if ((r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)) continue;
        if ((r * 7 + c * 13) % 3 !== 0) {
          qCtx.fillRect(20 + c * 10, 40 + r * 10, 7, 7);
        }
      }
    }
    const qrPlaqueTex = new THREE.CanvasTexture(qrPlaqueCanvas);
    const qrPlaqueMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.3),
      new THREE.MeshBasicMaterial({ map: qrPlaqueTex })
    );
    qrPlaqueMesh.position.set(0.12, -0.28, 0.346);
    batteryBoxGroup.add(qrPlaqueMesh);
    registerClickable(qrPlaqueMesh, 'battery');

    // --- 5. Canopy Support Frame & Fixed-Tilt Overhead Solar Panel (No Solar Tracker) ---
    const leftCanopyPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.6, 12),
      greenStructureMat
    );
    leftCanopyPost.position.set(-1.15, 1.8, 0);
    leftCanopyPost.castShadow = true;
    installationGroup.add(leftCanopyPost);

    const rightCanopyPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.6, 12),
      greenStructureMat
    );
    rightCanopyPost.position.set(2.55, 1.8, 0);
    rightCanopyPost.castShadow = true;
    installationGroup.add(rightCanopyPost);

    const horizontalBeam = new THREE.Mesh(
      new THREE.BoxGeometry(5.35, 0.08, 0.12),
      greenStructureMat
    );
    horizontalBeam.position.set(0.75, 3.58, 0);
    horizontalBeam.castShadow = true;
    installationGroup.add(horizontalBeam);
    registerClickable(horizontalBeam, 'solar');

    const fixedMountRiser = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.14, 0.16),
      greenStructureMat
    );
    fixedMountRiser.position.set(0.75, 3.72, 0);
    installationGroup.add(fixedMountRiser);
    registerClickable(fixedMountRiser, 'solar');

    const solarPanelGroup = new THREE.Group();
    solarPanelGroup.position.set(0.78, 3.88, 0);
    solarPanelGroup.rotation.x = 0.18; // Fixed static tilt
    installationGroup.add(solarPanelGroup);

    const solarFrameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.15, 0.1, 1.68),
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.35,
        metalness: 0.5
      })
    );
    solarFrameMesh.castShadow = true;
    solarFrameMesh.receiveShadow = true;
    solarPanelGroup.add(solarFrameMesh);
    registerClickable(solarFrameMesh, 'solar');

    const solarTex = createSolarGridTexture();
    const solarSurfaceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.98, 1.54),
      new THREE.MeshStandardMaterial({
        map: solarTex,
        roughness: 0.25,
        metalness: 0.4
      })
    );
    solarSurfaceMesh.rotation.x = -Math.PI / 2;
    solarSurfaceMesh.position.y = 0.055;
    solarPanelGroup.add(solarSurfaceMesh);
    registerClickable(solarSurfaceMesh, 'solar');

    // --- 6. Warm Wood Orange Slatted Public Bench Underneath Canopy ---
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0.7, 0, 0.12);
    installationGroup.add(benchGroup);

    const benchWoodMat = new THREE.MeshStandardMaterial({
      color: '#e07a16',
      roughness: 0.5,
      metalness: 0.08
    });

    const frontLegPositions = [-1.42, 1.42];
    frontLegPositions.forEach((lx) => {
      const frontPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.095, 1.05, 16),
        benchWoodMat
      );
      frontPost.position.set(lx, 0.525, 0.34);
      frontPost.castShadow = true;
      benchGroup.add(frontPost);
      registerClickable(frontPost, 'bench');

      const backPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 1.85, 16),
        benchWoodMat
      );
      backPost.position.set(lx, 0.925, -0.28);
      backPost.castShadow = true;
      benchGroup.add(backPost);
      registerClickable(backPost, 'bench');

      const armrest = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.68, 12),
        benchWoodMat
      );
      armrest.rotation.x = Math.PI / 2 - 0.12;
      armrest.position.set(lx, 0.98, 0.03);
      armrest.castShadow = true;
      benchGroup.add(armrest);
      registerClickable(armrest, 'bench');
    });

    const seatPlank = new THREE.Mesh(
      new THREE.BoxGeometry(3.25, 0.09, 0.78),
      benchWoodMat
    );
    seatPlank.position.set(0, 0.68, 0.05);
    seatPlank.castShadow = true;
    seatPlank.receiveShadow = true;
    benchGroup.add(seatPlank);
    registerClickable(seatPlank, 'bench');

    const slatHeights = [1.14, 1.42, 1.7];
    slatHeights.forEach((sy) => {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(2.84, 0.11, 0.06),
        benchWoodMat
      );
      slat.position.set(0, sy, -0.28);
      slat.castShadow = true;
      benchGroup.add(slat);
      registerClickable(slat, 'bench');
    });

    // --- 6B. Seated Person on Bench Using the USB Charging Station ---
    const personChargingGroup = new THREE.Group();
    personChargingGroup.visible = sceneStateRef.current.showPerson;
    installationGroup.add(personChargingGroup);

    const humanFigureGroup = new THREE.Group();
    humanFigureGroup.position.set(-0.35, 0, 0.17);
    personChargingGroup.add(humanFigureGroup);

    const skinMat = new THREE.MeshStandardMaterial({
      color: '#d9a17c',
      roughness: 0.65
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: '#1e4e68',
      roughness: 0.75
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: '#293241',
      roughness: 0.85
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#1f2421',
      roughness: 0.7
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: '#1c1917',
      roughness: 0.8
    });

    const hipsMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.14, 0.32),
      pantsMat
    );
    hipsMesh.position.set(0, 0.78, -0.02);
    hipsMesh.castShadow = true;
    humanFigureGroup.add(hipsMesh);
    registerClickable(hipsMesh, 'bench');

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.84, -0.04);
    torsoGroup.rotation.x = 0.08;
    humanFigureGroup.add(torsoGroup);

    const torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.56, 0.24),
      shirtMat
    );
    torsoMesh.position.set(0, 0.28, 0);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);
    registerClickable(torsoMesh, 'bench');

    const bagMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.34, 0.22),
      new THREE.MeshStandardMaterial({ color: '#4a5568', roughness: 0.8 })
    );
    bagMesh.position.set(0.36, 0.89, -0.06);
    bagMesh.rotation.z = -0.15;
    bagMesh.castShadow = true;
    humanFigureGroup.add(bagMesh);
    registerClickable(bagMesh, 'bench');

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 0.12, 12),
      skinMat
    );
    neckMesh.position.set(0, 0.6, 0.02);
    torsoGroup.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.74, 0.04);
    headGroup.rotation.x = 0.32;
    headGroup.rotation.y = 0.1;
    torsoGroup.add(headGroup);

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 18, 18),
      skinMat
    );
    headMesh.castShadow = true;
    headGroup.add(headMesh);
    registerClickable(headMesh, 'bench');

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairCap.rotation.x = -0.25;
    hairCap.position.y = 0.01;
    headGroup.add(hairCap);

    [-0.11, 0.11].forEach((lx) => {
      const thighMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.44),
        pantsMat
      );
      thighMesh.position.set(lx, 0.78, 0.16);
      thighMesh.castShadow = true;
      humanFigureGroup.add(thighMesh);
      registerClickable(thighMesh, 'bench');

      const calfMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.66, 12),
        pantsMat
      );
      calfMesh.position.set(lx, 0.42, 0.34);
      calfMesh.castShadow = true;
      humanFigureGroup.add(calfMesh);
      registerClickable(calfMesh, 'bench');

      const shoeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.24),
        shoeMat
      );
      shoeMesh.position.set(lx, 0.08, 0.4);
      shoeMesh.castShadow = true;
      humanFigureGroup.add(shoeMesh);
    });

    [-0.22, 0.22].forEach((ax, idx) => {
      const isLeft = idx === 0;
      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.05, 0.32, 12),
        shirtMat
      );
      upperArm.position.set(ax, 0.4, 0.06);
      upperArm.rotation.x = -0.45;
      upperArm.rotation.z = isLeft ? -0.18 : 0.18;
      upperArm.castShadow = true;
      torsoGroup.add(upperArm);

      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.04, 0.28, 12),
        skinMat
      );
      forearm.position.set(isLeft ? -0.14 : 0.14, 0.25, 0.24);
      forearm.rotation.x = -1.15;
      forearm.rotation.y = isLeft ? -0.42 : 0.42;
      forearm.castShadow = true;
      torsoGroup.add(forearm);
    });

    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.02, 0.26, 0.35);
    phoneGroup.rotation.x = -0.75;
    phoneGroup.rotation.y = 0.08;
    torsoGroup.add(phoneGroup);

    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.21, 0.016),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3 })
    );
    phoneGroup.add(phoneBody);
    registerClickable(phoneBody, 'battery');

    const phoneScreenMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.18),
      phoneScreenMat
    );
    phoneScreen.position.z = 0.009;
    phoneGroup.add(phoneScreen);
    registerClickable(phoneScreen, 'battery');

    const phoneChargeIcon = new THREE.Mesh(
      new THREE.PlaneGeometry(0.055, 0.03),
      new THREE.MeshBasicMaterial({ color: '#34d399' })
    );
    phoneChargeIcon.position.set(0, 0, 0.01);
    phoneGroup.add(phoneChargeIcon);

    const phonePointLight = new THREE.PointLight('#38bdf8', 0.45, 1.4);
    phonePointLight.position.set(-0.37, 1.18, 0.52);
    personChargingGroup.add(phonePointLight);

    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.25, 2.53, 0.35),
      new THREE.Vector3(-1.05, 1.85, 0.48),
      new THREE.Vector3(-0.75, 1.18, 0.56),
      new THREE.Vector3(-0.37, 1.12, 0.49)
    ]);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 28, 0.015, 8, false);
    const cableMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.4
    });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    cableMesh.castShadow = true;
    personChargingGroup.add(cableMesh);
    registerClickable(cableMesh, 'battery');

    const cordPulseParticles = [];
    const cordPulseGeo = new THREE.SphereGeometry(0.032, 10, 10);
    const cordPulseMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    for (let i = 0; i < 4; i++) {
      const pMesh = new THREE.Mesh(cordPulseGeo, cordPulseMat);
      personChargingGroup.add(pMesh);
      cordPulseParticles.push({
        mesh: pMesh,
        offset: i / 4
      });
    }

    // --- 7. Conceptual Energy Flow Particles ---
    const energyFlowGroup = new THREE.Group();
    scene.add(energyFlowGroup);

    const createFlowPath = (points, colorHex, count = 6, speed = 0.45) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...p))
      );
      const particles = [];
      const sphereGeo = new THREE.SphereGeometry(0.065, 10, 10);
      const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });

      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        energyFlowGroup.add(mesh);
        particles.push({
          mesh,
          offset: i / count,
          curve,
          speed
        });
      }
      return particles;
    };

    const solarParticles = createFlowPath(
      [
        [0.75, 3.85, 0],
        [-0.6, 3.58, 0],
        [-1.8, 3.58, 0],
        [-1.6, 2.55, 0.15]
      ],
      '#f59e0b',
      6,
      0.38
    );

    const windParticles = createFlowPath(
      [
        [-1.78, 5.85, 0.18],
        [-1.8, 4.7, 0.22],
        [-1.8, 3.5, 0.22],
        [-1.6, 2.6, 0.22]
      ],
      '#38bdf8',
      6,
      0.48
    );

    const lampParticles = createFlowPath(
      [
        [-1.6, 2.6, 0.26],
        [-1.82, 4.1, 0.26],
        [-1.82, 5.9, 0.26],
        [-1.82, 6.18, 0.95]
      ],
      '#fde047',
      6,
      0.42
    );

    const usbParticles = createFlowPath(
      [
        [-1.5, 1.9, 0.34],
        [-1.4, 2.25, 0.35],
        [-1.32, 2.55, 0.35]
      ],
      '#34d399',
      4,
      0.55
    );

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handlePointerDown = (e) => {
      sceneStateRef.current.isTransitioningCamera = false;
      if (e.touches && e.touches.length === 2) {
        isPointerDown = false;
        initialPinchDistance = getTouchDistance(e.touches);
        initialPinchRadius = spherical.radius;
        return;
      }
      isPointerDown = true;
      pointerMovedDistance = 0;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      pointerStartX = clientX;
      pointerStartY = clientY;
    };

    const handlePointerMove = (e) => {
      if (e.touches && e.touches.length === 2 && initialPinchDistance) {
        if (e.cancelable) e.preventDefault();
        const currentDist = getTouchDistance(e.touches);
        const scale = initialPinchDistance / Math.max(currentDist, 10);
        spherical.radius = THREE.MathUtils.clamp(
          initialPinchRadius * scale,
          3.2,
          26.0
        );
        offsetVec.setFromSpherical(spherical);
        camera.position.copy(currentLookAt).add(offsetVec);
        camera.lookAt(currentLookAt);
        return;
      }

      if (!isPointerDown) return;
      if (e.touches && e.cancelable) {
        e.preventDefault();
      }
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - pointerStartX;
      const dy = clientY - pointerStartY;
      pointerMovedDistance += Math.abs(dx) + Math.abs(dy);
      pointerStartX = clientX;
      pointerStartY = clientY;

      spherical.theta -= dx * 0.0065;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi - dy * 0.0055,
        0.18,
        Math.PI / 2 - 0.04
      );

      offsetVec.setFromSpherical(spherical);
      camera.position.copy(currentLookAt).add(offsetVec);
      camera.lookAt(currentLookAt);
    };

    const handlePointerUp = (e) => {
      initialPinchDistance = null;
      initialPinchRadius = null;
      if (!isPointerDown) return;
      isPointerDown = false;

      if (pointerMovedDistance < 10) {
        const touchObj =
          e.changedTouches && e.changedTouches.length > 0
            ? e.changedTouches[0]
            : e;
        if (typeof touchObj.clientX === 'number') {
          const rect = renderer.domElement.getBoundingClientRect();
          pointerNDC.x = ((touchObj.clientX - rect.left) / rect.width) * 2 - 1;
          pointerNDC.y = -((touchObj.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointerNDC, camera);
          const hits = raycaster.intersectObjects(interactiveMeshes, false);
          if (hits.length > 0 && hits[0].object.userData.componentId) {
            onSelectComponent(hits[0].object.userData.componentId);
          }
        }
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      sceneStateRef.current.isTransitioningCamera = false;
      spherical.radius = THREE.MathUtils.clamp(
        spherical.radius + e.deltaY * 0.008,
        3.2,
        24.0
      );
      offsetVec.setFromSpherical(spherical);
      camera.position.copy(currentLookAt).add(offsetVec);
      camera.lookAt(currentLookAt);
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElem.addEventListener('touchstart', handlePointerDown, { passive: false });
    domElem.addEventListener('touchmove', handlePointerMove, { passive: false });
    domElem.addEventListener('touchend', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cfg = getResponsiveCameraConfig(w, h);
      camera.fov = cfg.fov;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId;
    let labelUpdateCounter = 0;

    const dayHemiGround = new THREE.Color('#3c6e37');
    const nightHemiGround = new THREE.Color('#132a36');
    const dayHemiSky = new THREE.Color('#ffffff');
    const nightHemiSky = new THREE.Color('#7dd3fc');

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const nowMs = performance.now();

      const state = sceneStateRef.current;
      const {
        timeMinutes: curMins,
        showEnergyFlow: flowActive,
        showPerson: personActive,
        cameraPosTarget,
        cameraLookTarget
      } = state;

      // Start a smooth ease-out camera transition if triggered
      if (state.triggerNewTransition) {
        state.triggerNewTransition = false;
        state.cameraPosStart.copy(camera.position);
        state.cameraLookStart.copy(currentLookAt);
        state.transitionStartTime = nowMs;
        state.transitionDuration = state.prefersReducedMotion ? 60 : 950;
        state.isTransitioningCamera = true;
      }

      personChargingGroup.visible = personActive;
      if (personActive) {
        torsoGroup.rotation.x = 0.08 + Math.sin(elapsed * 2.1) * 0.018;
        headGroup.rotation.x = 0.32 + Math.sin(elapsed * 1.5) * 0.025;
        cordPulseParticles.forEach((cp) => {
          const t = (elapsed * 0.65 + cp.offset) % 1;
          cableCurve.getPointAt(t, cp.mesh.position);
        });
      }

      const env = computeEnvironmentState(curMins);
      scene.background.copy(env.skyColor);
      scene.fog.color.copy(env.fogColor);

      dirLight.position.set(...env.sunPosition);
      dirLight.intensity = env.sunIntensity;
      hemiLight.intensity = env.ambientIntensity;
      hemiLight.color.lerpColors(dayHemiSky, nightHemiSky, env.lampIntensity * 0.65);
      hemiLight.groundColor.lerpColors(dayHemiGround, nightHemiGround, env.lampIntensity);

      // Cool moonlight rim illumination so the wind turbine, pole, and fixed solar panel remain readable at night
      moonRimLight.intensity = env.moonIntensity;

      const dayFactor = THREE.MathUtils.clamp(env.ambientIntensity / 0.85, 0.22, 1);
      groundMat.color.setRGB(
        0.38 * dayFactor,
        0.68 * dayFactor,
        0.31 * dayFactor
      );
      hillMat.color.setRGB(
        0.32 * dayFactor,
        0.60 * dayFactor,
        0.26 * dayFactor
      );
      streakMat.opacity = 0.42 * dayFactor;

      // Keep streetlight strictly OFF during daytime and smoothly active at dusk/night
      ledLensMat.emissiveIntensity = env.lampIntensity * 1.65;
      streetSpotLight.intensity = env.lampIntensity * 7.2;
      benchNightFillLight.intensity = env.lampIntensity * 0.85;
      usbIndicatorLight.intensity = 0.15 + env.lampIntensity * 0.75;
      lightConeMat.opacity = env.lampIntensity * 0.22;
      roadGlowMat.opacity = env.lampIntensity * 0.68;
      benchGlowMat.opacity = env.lampIntensity * 0.28;
      photocellStatusLedMat.color.set(
        env.lampIntensity > 0.35 ? '#facc15' : '#34d399'
      );

      houseWindowMaterials.forEach((wMat) => {
        if (env.lampIntensity > 0.35) {
          wMat.color.set('#fde68a');
        } else {
          wMat.color.set('#272b29');
        }
      });

      // Wind turbine rotor spins cleanly on the rear (-Z) side opposite the LED lamp
      const spinSpeed = state.prefersReducedMotion ? 1.2 : 4.2;
      rotorHubGroup.rotation.z += delta * spinSpeed;

      energyFlowGroup.visible = flowActive;
      if (flowActive) {
        const isDaytime = env.sunIntensity > 0.25;
        const isNighttime = env.lampIntensity > 0.25;

        const updateParticleSet = (list, active) => {
          list.forEach((p) => {
            p.mesh.visible = active;
            if (active) {
              const t = (elapsed * p.speed + p.offset) % 1;
              p.curve.getPointAt(t, p.mesh.position);
            }
          });
        };

        updateParticleSet(solarParticles, isDaytime);
        updateParticleSet(windParticles, true);
        updateParticleSet(lampParticles, isNighttime);
        updateParticleSet(usbParticles, true);
      }

      if (state.isTransitioningCamera) {
        const w = container ? container.clientWidth : 1024;
        const h = container ? container.clientHeight : 600;
        const { distanceMultiplier } = getResponsiveCameraConfig(w, h);
        const adjustedTargetPos = cameraLookTarget
          .clone()
          .add(
            cameraPosTarget
              .clone()
              .sub(cameraLookTarget)
              .multiplyScalar(distanceMultiplier)
          );

        const rawProgress = Math.min(
          1,
          (nowMs - state.transitionStartTime) / Math.max(1, state.transitionDuration)
        );
        // Cubic ease-out for smooth, natural camera deceleration
        const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

        camera.position.lerpVectors(
          state.cameraPosStart,
          adjustedTargetPos,
          easedProgress
        );
        currentLookAt.lerpVectors(
          state.cameraLookStart,
          cameraLookTarget,
          easedProgress
        );
        camera.lookAt(currentLookAt);
        syncSphericalFromCamera();

        if (rawProgress >= 1) {
          state.isTransitioningCamera = false;
        }
      }

      renderer.render(scene, camera);

      labelUpdateCounter++;
      if (labelUpdateCounter % 2 === 0 && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const nextPositions = {};
        const projVec = new THREE.Vector3();

        Object.values(SYSTEM_COMPONENTS).forEach((comp) => {
          projVec.set(...comp.anchor3D);
          projVec.project(camera);
          const x = (projVec.x * 0.5 + 0.5) * width;
          const y = (-(projVec.y * 0.5) + 0.5) * height;
          const visible =
            projVec.z < 1.0 &&
            x > 20 &&
            x < width - 20 &&
            y > 20 &&
            y < height - 20;
          nextPositions[comp.id] = { x, y, visible };
        });
        setLabelPositions(nextPositions);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      domElem.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElem.removeEventListener('touchstart', handlePointerDown);
      domElem.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      // Clean up Three.js resources to prevent memory leaks
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [onSelectComponent]);

  const formattedClock = useMemo(
    () => formatMinutesToClock(timeMinutes),
    [timeMinutes]
  );
  const periodInfo = useMemo(
    () => getTimePeriodInfo(timeMinutes),
    [timeMinutes]
  );

  const arcProgress = useMemo(() => {
    const hours = (((timeMinutes % 1440) + 1440) % 1440) / 60;
    let t = 0.5;
    if (hours >= 6 && hours <= 18) {
      t = (hours - 6) / 12;
    } else if (hours > 18) {
      t = (hours - 18) / 12;
    } else {
      t = (hours + 6) / 12;
    }
    const angle = Math.PI * (1 - t);
    const cx = 42 + Math.cos(angle) * 30;
    const cy = 34 - Math.sin(angle) * 26;
    return { cx, cy, isDayOrb: hours >= 6 && hours < 18 };
  }, [timeMinutes]);

  // Offset and de-collide 2D projected labels so they do not overlap each other or obscure the model center
  const adjustedLabelPositions = useMemo(() => {
    const visibleItems = Object.values(SYSTEM_COMPONENTS)
      .filter(
        (comp) =>
          showAllLabels ||
          DEFAULT_KEY_LABEL_IDS.includes(comp.id) ||
          comp.id === selectedComponentId
      )
      .map((comp) => {
        const raw = labelPositions[comp.id];
        if (!raw || !raw.visible) return null;
        return {
          comp,
          x: raw.x,
          y: raw.y - 16
        };
      })
      .filter(Boolean);

    visibleItems.sort((a, b) => a.y - b.y);
    for (let i = 1; i < visibleItems.length; i++) {
      const prev = visibleItems[i - 1];
      const curr = visibleItems[i];
      if (Math.abs(curr.x - prev.x) < 95 && Math.abs(curr.y - prev.y) < 34) {
        curr.y = prev.y + 34;
      }
    }

    const map = {};
    visibleItems.forEach((item) => {
      map[item.comp.id] = item;
    });
    return map;
  }, [labelPositions, showAllLabels, selectedComponentId]);

  return (
    <div className="w-full">
      <div className="relative w-full h-[310px] sm:h-[460px] lg:h-[580px] rounded-2xl overflow-hidden border border-[#D8D5CD] shadow-sm bg-[#102019] select-none">
        {webglError ? (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-[#F7F6F2] flex flex-col justify-center">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E] text-xs font-semibold mb-3">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                WebGL 3D preview is unavailable on this device — Showing the
                interactive 2D System Diagram as primary view.
              </span>
            </div>
            <Interactive2DEnergyDiagram
              selectedComponentId={selectedComponentId}
              onSelectComponent={onSelectComponent}
              timeMinutes={timeMinutes}
              prefersReducedMotion={prefersReducedMotion}
              isFallback={true}
            />
          </div>
        ) : (
          <div
            ref={mountRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            style={{ touchAction: 'none' }}
            aria-label="Interactive 3D visualization of the Macopoy Hybrid Solar-Wind Streetlight, Charging Station, and Bench"
          />
        )}

        {/* TOP-LEFT HUD OVERLAY: Digital Clock, Period Label, & Sun/Moon Arc */}
        {!webglError && (
          <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 flex items-center gap-2.5 sm:gap-4 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#1A261F]/80 backdrop-blur-md border border-white/10 text-white pointer-events-none">
            <div>
              <div className="text-base sm:text-2xl font-bold tracking-tight leading-none">
                {formattedClock}
              </div>
              <div className="text-[11px] sm:text-xs text-white/85 font-medium mt-0.5">
                {periodInfo.label}
              </div>
            </div>

            <svg
              width="58"
              height="28"
              viewBox="0 0 84 42"
              className="overflow-visible shrink-0 sm:w-[76px] sm:h-[38px]"
              aria-hidden="true"
            >
              <line
                x1="6"
                y1="34"
                x2="78"
                y2="34"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.2"
              />
              <path
                d="M 12 34 A 30 26 0 0 1 72 34"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.3"
                strokeDasharray="3 3"
              />
              <circle
                cx={arcProgress.cx}
                cy={arcProgress.cy}
                r="4.5"
                fill={arcProgress.isDayOrb ? '#f59e0b' : '#e2e8f0'}
              />
            </svg>
          </div>
        )}

        {/* TOP-RIGHT PHOTOCELL & ENERGY FLOW MINI BADGE */}
        {!webglError && (
          <div className="hidden sm:flex absolute top-4 right-4 z-10 items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A261F]/75 backdrop-blur-md border border-white/10 text-xs text-white/90">
            <span
              className={`w-2 h-2 rounded-full ${
                periodInfo.isNight
                  ? 'bg-[#facc15] shadow-[0_0_8px_#facc15]'
                  : 'bg-[#34d399]'
              }`}
            />
            <span>
              {periodInfo.isNight
                ? 'Photocell Demo: Night Illumination ON'
                : 'Photocell Demo: Daytime Charging Mode'}
            </span>
          </div>
        )}

        {/* FLOATING 3D COMPONENT PILL LABELS (Key labels by default + selected component, or All labels) */}
        {showLabels &&
          !webglError &&
          Object.values(SYSTEM_COMPONENTS)
            .filter(
              (comp) =>
                showAllLabels ||
                DEFAULT_KEY_LABEL_IDS.includes(comp.id) ||
                comp.id === selectedComponentId
            )
            .map((comp) => {
              const pos = adjustedLabelPositions[comp.id];
              if (!pos) return null;
              const isSelected = selectedComponentId === comp.id;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => onSelectComponent(comp.id)}
                  aria-label={`Inspect ${comp.fullTitle} in 3D`}
                  aria-pressed={isSelected}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  className={`absolute z-10 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 min-h-[32px] rounded-full text-[11px] sm:text-xs font-medium transition-all duration-200 backdrop-blur-md border ${
                    isSelected
                      ? 'bg-[#1D4332] text-white border-[#FDE68A] ring-2 ring-[#E5A93B]/60 scale-105 shadow-lg z-20 opacity-100 font-semibold'
                      : 'bg-[#1F2923]/80 text-white/85 border-white/20 opacity-75 hover:opacity-100 hover:bg-[#1D4332]/90 shadow-sm'
                  }`}
                >
                  <span
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: comp.dotColor }}
                  />
                  <span className="whitespace-nowrap">{comp.label}</span>
                </button>
              );
            })}
      </div>

      {/* Mobile Touch Hint Bar */}
      <div className="mt-2.5 flex sm:hidden items-center justify-between px-1 text-[11px] text-[#525B56]">
        <span>1-finger drag: Orbit 3D • 2-finger pinch: Zoom</span>
        <span>Tap parts to inspect</span>
      </div>

      {/* SIMPLIFIED & GROUPED 3D CONTROL PANEL */}
      <div className="mt-4 bg-white rounded-2xl p-4 sm:p-5 border border-[#DCD9D0] shadow-2xs space-y-4">
        {/* GROUP 1 & 2: SCENE ACTIONS + TIME SIMULATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Scene Actions (Primary Controls Visible by Default) */}
          <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#525B56] w-full sm:w-auto mr-1">
              Scene actions
            </span>

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause time simulation' : 'Play time simulation'}
              aria-pressed={isPlaying}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold transition-colors border shadow-2xs ${
                isPlaying
                  ? 'bg-[#E5A93B] text-[#1A241E] border-[#d99726]'
                  : 'bg-[#1D4332] hover:bg-[#153325] text-white border-[#1D4332]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleLabels}
              aria-pressed={showLabels}
              aria-label="Toggle 3D component labels"
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
                showLabels
                  ? 'bg-[#EFF6F2] text-[#1B3B2B] border-[#95D5B2] font-semibold'
                  : 'bg-[#F7F6F2] text-[#525B56] border-[#D5D2C9] hover:bg-[#EAE7DF]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Labels</span>
            </button>

            <button
              type="button"
              onClick={onToggleEnergyFlow}
              aria-pressed={showEnergyFlow}
              aria-label="Toggle conceptual energy flow particles"
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
                showEnergyFlow
                  ? 'bg-[#EFF6F2] text-[#1B3B2B] border-[#95D5B2] font-semibold'
                  : 'bg-[#F7F6F2] text-[#525B56] border-[#D5D2C9] hover:bg-[#EAE7DF]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Energy Flow</span>
            </button>

            <button
              type="button"
              onClick={onResetView}
              aria-label="Reset camera view and simulation time"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-medium bg-[#F7F6F2] hover:bg-[#EAE7DF] text-[#1F2421] border border-[#D5D2C9] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#525B56]" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setMoreControlsOpen((prev) => !prev)}
              aria-expanded={moreControlsOpen}
              aria-controls="more-3d-controls-drawer"
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-colors border ml-auto sm:ml-0 ${
                moreControlsOpen || showPerson || showAllLabels
                  ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                  : 'bg-white hover:bg-[#F7F6F2] text-[#37403B] border-[#D5D2C9]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More controls</span>
            </button>
          </div>

          {/* Time Simulation Slider */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pl-4 lg:border-l border-[#ECEAE3]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#525B56]">
                Time simulation
              </span>
              <span className="text-xs font-semibold text-[#1B3B2B]">
                {formattedClock} • {periodInfo.label}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={1439}
              value={Math.floor(timeMinutes)}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              aria-label="Time of day simulation slider"
              className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-[#E2E0D8] accent-[#1D4332]"
              style={{
                background: `linear-gradient(to right, #1D4332 0%, #1D4332 ${
                  (timeMinutes / 1439) * 100
                }%, #E2E0D8 ${(timeMinutes / 1439) * 100}%, #E2E0D8 100%)`
              }}
            />

            <div className="flex justify-between text-[11px] text-[#525B56] font-medium mt-1.5 select-none">
              <button
                type="button"
                onClick={() => onTimeChange(0)}
                className="py-1 px-1 hover:text-[#1B3B2B]"
              >
                12 AM
              </button>
              <button
                type="button"
                onClick={() => onTimeChange(360)}
                className="py-1 px-1 hover:text-[#1B3B2B]"
              >
                6 AM
              </button>
              <button
                type="button"
                onClick={() => onTimeChange(720)}
                className="py-1 px-1 hover:text-[#1B3B2B]"
              >
                12 PM
              </button>
              <button
                type="button"
                onClick={() => onTimeChange(1065)}
                className="py-1 px-1 hover:text-[#1B3B2B]"
              >
                5:45 PM
              </button>
              <button
                type="button"
                onClick={() => onTimeChange(1320)}
                className="py-1 px-1 hover:text-[#1B3B2B]"
              >
                10 PM
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDABLE "MORE CONTROLS" DRAWER */}
        {moreControlsOpen && (
          <div
            id="more-3d-controls-drawer"
            className="pt-3.5 border-t border-[#ECEAE3] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F7F6F2] p-3.5 rounded-xl"
          >
            {/* Commuter Simulation Toggle */}
            <div className="flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#525B56] mb-1.5">
                Commuter &amp; USB Demo
              </span>
              <button
                type="button"
                onClick={onTogglePerson}
                aria-pressed={showPerson}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-colors border ${
                  showPerson
                    ? 'bg-[#E5A93B] text-[#1A241E] border-[#d99726]'
                    : 'bg-white text-[#1F2421] border-[#D5D2C9] hover:bg-[#EAE7DF]'
                }`}
              >
                {showPerson ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Person charging: ON</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add person on bench</span>
                  </>
                )}
              </button>
            </div>

            {/* Label Density Selector */}
            <div className="flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#525B56] mb-1.5">
                3D Scene Label Density
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleShowAllLabels(false)}
                  aria-pressed={!showAllLabels}
                  className={`px-2.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold border transition-colors ${
                    !showAllLabels
                      ? 'bg-[#1D4332] text-white border-[#1D4332]'
                      : 'bg-white text-[#37403B] border-[#D5D2C9] hover:bg-[#EAE7DF]'
                  }`}
                >
                  Key labels (3)
                </button>
                <button
                  type="button"
                  onClick={() => onToggleShowAllLabels(true)}
                  aria-pressed={showAllLabels}
                  className={`px-2.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold border transition-colors ${
                    showAllLabels
                      ? 'bg-[#1D4332] text-white border-[#1D4332]'
                      : 'bg-white text-[#37403B] border-[#D5D2C9] hover:bg-[#EAE7DF]'
                  }`}
                >
                  Show all (6)
                </button>
              </div>
            </div>

            {/* Simulation Speed Selector */}
            <div className="flex flex-col justify-between">
              <label
                htmlFor="sim-speed-select"
                className="text-[11px] font-bold uppercase tracking-wider text-[#525B56] mb-1.5"
              >
                Time Cycle Speed
              </label>
              <select
                id="sim-speed-select"
                value={simSpeed}
                onChange={(e) => onSimSpeedChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 min-h-[42px] rounded-xl bg-white border border-[#D5D2C9] text-xs font-semibold text-[#1F2421] focus:outline-none focus:ring-2 focus:ring-[#1D4332]"
              >
                <option value={0.5}>Slow (0.5x)</option>
                <option value={1}>Normal (1x)</option>
                <option value={2.5}>Fast (2.5x)</option>
              </select>
            </div>
          </div>
        )}

        {/* GROUP 3: CAMERA VIEWS (Horizontally scrollable on mobile) */}
        <div className="pt-3 border-t border-[#ECEAE3] flex flex-col sm:flex-row sm:items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#525B56] shrink-0 mr-1">
            Camera views
          </span>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar"
            role="group"
            aria-label="Camera view presets"
          >
            {CAMERA_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  aria-pressed={isActive}
                  className={`px-3.5 py-2 min-h-[40px] rounded-full text-xs sm:text-sm font-medium transition-all border shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1D4332] text-white border-[#1D4332] shadow-xs font-semibold'
                      : 'bg-[#F7F6F2] hover:bg-[#EAE7DF] text-[#1F2421] border-[#D5D2C9]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4B. ACCESSIBLE 2D INTERACTIVE ENERGY-FLOW DIAGRAM COMPONENT
// ============================================================================

function Interactive2DEnergyDiagram({
  selectedComponentId,
  onSelectComponent,
  timeMinutes,
  prefersReducedMotion,
  isFallback = false
}) {
  const [activeNodeKey, setActiveNodeKey] = useState(null);
  const periodInfo = useMemo(
    () => getTimePeriodInfo(timeMinutes),
    [timeMinutes]
  );

  const handleNodeClick = (nodeKey, componentRef) => {
    setActiveNodeKey(nodeKey);
    onSelectComponent(componentRef);
  };

  const isHighlighted = (nodeKey, componentRef) => {
    if (activeNodeKey) return activeNodeKey === nodeKey;
    return selectedComponentId === componentRef;
  };

  return (
    <div
      className={`rounded-3xl border ${
        isFallback
          ? 'bg-white border-[#D8D5CD] p-4 sm:p-5'
          : 'bg-white border-[#DCD9D0] p-5 sm:p-7 shadow-2xs'
      }`}
      role="region"
      aria-label="Interactive 2D Hybrid Solar-Wind Energy Flow Diagram"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#ECEAE3]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive 2D System Schematic</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#1B3B2B] mt-0.5">
            Hybrid Solar–Wind Power Routing &amp; Storage Diagram
          </h3>
          <p className="text-xs sm:text-sm text-[#454F4A] mt-0.5">
            Tap or click any block below to inspect its function and focus the
            3D camera on that hardware stage.
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Solar
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-900 border border-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Wind
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Battery Storage
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-900 border border-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            LED Lamp
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            USB Charging
          </span>
        </div>
      </div>

      {/* 2D DIAGRAM FLOW PATHWAYS */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
        {/* COLUMN 1: GENERATION + CONVERSION PATHS (SOLAR & WIND) */}
        <div className="lg:col-span-5 space-y-4">
          {/* PATH 1: Solar Panel → Solar Charge Controller */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-2.5">
              <span>Path 1 • Solar Harvesting</span>
              <span>{periodInfo.isDay ? 'Active (Daylight)' : 'Standby (Night)'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
              <button
                type="button"
                onClick={() => handleNodeClick('solar_panel', 'solar')}
                aria-pressed={isHighlighted('solar_panel', 'solar')}
                className={`sm:col-span-5 w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                  isHighlighted('solar_panel', 'solar')
                    ? 'bg-amber-500 text-white border-amber-700 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-amber-50 text-[#1F2421] border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun
                    className={`w-4 h-4 shrink-0 ${
                      isHighlighted('solar_panel', 'solar')
                        ? 'text-white'
                        : 'text-amber-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    Solar Panel
                  </span>
                </div>
                <span
                  className={`block text-[11px] mt-1 ${
                    isHighlighted('solar_panel', 'solar')
                      ? 'text-amber-50'
                      : 'text-[#525B56]'
                  }`}
                >
                  Fixed-tilt canopy array
                </span>
              </button>

              <div
                className="sm:col-span-1 flex items-center justify-center py-0.5 sm:py-0"
                aria-hidden="true"
              >
                <span className="text-amber-600 font-bold text-sm sm:rotate-0 rotate-90">
                  →
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleNodeClick('solar_controller', 'battery')}
                aria-pressed={isHighlighted('solar_controller', 'battery')}
                className={`sm:col-span-5 w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                  activeNodeKey === 'solar_controller'
                    ? 'bg-amber-600 text-white border-amber-800 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-amber-50 text-[#1F2421] border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders
                    className={`w-4 h-4 shrink-0 ${
                      activeNodeKey === 'solar_controller'
                        ? 'text-white'
                        : 'text-amber-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    Solar Charge Controller
                  </span>
                </div>
                <span
                  className={`block text-[11px] mt-1 ${
                    activeNodeKey === 'solar_controller'
                      ? 'text-amber-50'
                      : 'text-[#525B56]'
                  }`}
                >
                  MPPT DC regulation
                </span>
              </button>
            </div>
          </div>

          {/* PATH 2: Wind Turbine → Wind Power Conversion */}
          <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-900 mb-2.5">
              <span>Path 2 • Wind Harvesting</span>
              <span>Complementary Source</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
              <button
                type="button"
                onClick={() => handleNodeClick('wind_turbine', 'turbine')}
                aria-pressed={isHighlighted('wind_turbine', 'turbine')}
                className={`sm:col-span-5 w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                  isHighlighted('wind_turbine', 'turbine')
                    ? 'bg-cyan-600 text-white border-cyan-800 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-cyan-50 text-[#1F2421] border-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wind
                    className={`w-4 h-4 shrink-0 ${
                      isHighlighted('wind_turbine', 'turbine')
                        ? 'text-white'
                        : 'text-cyan-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    Wind Turbine
                  </span>
                </div>
                <span
                  className={`block text-[11px] mt-1 ${
                    isHighlighted('wind_turbine', 'turbine')
                      ? 'text-cyan-50'
                      : 'text-[#525B56]'
                  }`}
                >
                  Rear-facing 3-blade rotor
                </span>
              </button>

              <div
                className="sm:col-span-1 flex items-center justify-center py-0.5 sm:py-0"
                aria-hidden="true"
              >
                <span className="text-cyan-600 font-bold text-sm sm:rotate-0 rotate-90">
                  →
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleNodeClick('wind_conversion', 'battery')}
                aria-pressed={activeNodeKey === 'wind_conversion'}
                className={`sm:col-span-5 w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                  activeNodeKey === 'wind_conversion'
                    ? 'bg-cyan-700 text-white border-cyan-900 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-cyan-50 text-[#1F2421] border-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap
                    className={`w-4 h-4 shrink-0 ${
                      activeNodeKey === 'wind_conversion'
                        ? 'text-white'
                        : 'text-cyan-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    Wind Power Conversion
                  </span>
                </div>
                <span
                  className={`block text-[11px] mt-1 ${
                    activeNodeKey === 'wind_conversion'
                      ? 'text-cyan-50'
                      : 'text-[#525B56]'
                  }`}
                >
                  Rectifier &amp; wind controller
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTOR ARROWS INTO BATTERY */}
        <div
          className="lg:col-span-1 flex flex-col items-center justify-center py-1 lg:py-0"
          aria-hidden="true"
        >
          <div className="hidden lg:flex flex-col items-center gap-6 text-emerald-700 font-bold text-lg">
            <span>↘</span>
            <span>↗</span>
          </div>
          <div className="lg:hidden text-emerald-700 font-bold text-base">↓</div>
        </div>

        {/* COLUMN 2: CENTRAL BATTERY STORAGE HUB */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={() => handleNodeClick('battery_hub', 'battery')}
            aria-pressed={
              selectedComponentId === 'battery' &&
              activeNodeKey !== 'usb_station' &&
              activeNodeKey !== 'solar_controller' &&
              activeNodeKey !== 'wind_conversion'
            }
            className={`w-full text-left p-4 sm:p-5 min-h-[110px] rounded-2xl border-2 transition-all ${
              selectedComponentId === 'battery' &&
              activeNodeKey !== 'usb_station'
                ? 'bg-emerald-700 text-white border-emerald-900 shadow-lg scale-[1.02]'
                : 'bg-emerald-50/90 hover:bg-emerald-100/80 text-[#1B3B2B] border-emerald-400'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-900/15 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Central Storage</span>
            </div>
            <div className="flex items-center gap-2.5">
              <BatteryCharging
                className={`w-6 h-6 shrink-0 ${
                  selectedComponentId === 'battery' &&
                  activeNodeKey !== 'usb_station'
                    ? 'text-emerald-200'
                    : 'text-emerald-700'
                }`}
              />
              <div>
                <span className="block text-sm sm:text-base font-bold leading-tight">
                  Battery
                </span>
                <span
                  className={`block text-[11px] mt-0.5 ${
                    selectedComponentId === 'battery' &&
                    activeNodeKey !== 'usb_station'
                      ? 'text-emerald-100'
                      : 'text-[#37403B]'
                  }`}
                >
                  LiFePO₄ Reserve + Breakers
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* CONNECTOR ARROWS OUT OF BATTERY */}
        <div
          className="lg:col-span-1 flex flex-col items-center justify-center py-1 lg:py-0"
          aria-hidden="true"
        >
          <div className="hidden lg:flex flex-col items-center gap-6 text-emerald-700 font-bold text-lg">
            <span>↗</span>
            <span>↘</span>
          </div>
          <div className="lg:hidden text-emerald-700 font-bold text-base">↓</div>
        </div>

        {/* COLUMN 3: PUBLIC OUTPUT LOADS (LED STREETLIGHT & USB CHARGING STATION) */}
        <div className="lg:col-span-2 space-y-4">
          {/* OUTPUT 1: Battery → LED Streetlight */}
          <div className="p-3 rounded-2xl bg-yellow-50/70 border border-yellow-300">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-yellow-900 mb-1.5">
              <span>Night Illumination</span>
              <span>{periodInfo.isNight ? 'ON' : 'Standby'}</span>
            </div>
            <button
              type="button"
              onClick={() => handleNodeClick('led_lamp', 'lamp')}
              aria-pressed={selectedComponentId === 'lamp'}
              className={`w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                selectedComponentId === 'lamp'
                  ? 'bg-yellow-400 text-[#1F2421] border-yellow-600 shadow-md scale-[1.01]'
                  : 'bg-white hover:bg-yellow-50 text-[#1F2421] border-yellow-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold leading-tight">
                  LED Streetlight
                </span>
              </div>
              <span className="block text-[11px] text-[#525B56] mt-1">
                Switched by top photocell
              </span>
            </button>
          </div>

          {/* OUTPUT 2: Battery → USB Charging Station */}
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-1.5">
              <span>Public Utility</span>
              <span>Regulated DC</span>
            </div>
            <button
              type="button"
              onClick={() => handleNodeClick('usb_station', 'battery')}
              aria-pressed={activeNodeKey === 'usb_station'}
              className={`w-full text-left p-3 min-h-[64px] rounded-xl border-2 transition-all ${
                activeNodeKey === 'usb_station'
                  ? 'bg-blue-600 text-white border-blue-800 shadow-md scale-[1.01]'
                  : 'bg-white hover:bg-blue-50 text-[#1F2421] border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Usb
                  className={`w-4 h-4 shrink-0 ${
                    activeNodeKey === 'usb_station'
                      ? 'text-white'
                      : 'text-blue-600'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold leading-tight">
                  USB Charging Station
                </span>
              </div>
              <span
                className={`block text-[11px] mt-1 ${
                  activeNodeKey === 'usb_station'
                    ? 'text-blue-100'
                    : 'text-[#525B56]'
                }`}
              >
                Roadside mobile charging
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Screen-Reader & Quick Text Summary of the 4 Pathways */}
      <div className="mt-5 pt-4 border-t border-[#ECEAE3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-[#37403B]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F6F2]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>
            <strong>Solar Panel</strong> → Controller → <strong>Battery</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F6F2]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <span>
            <strong>Wind Turbine</strong> → Conversion → <strong>Battery</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F6F2]">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-600 shrink-0" />
          <span>
            <strong>Battery</strong> → <strong>LED Streetlight</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F6F2]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span>
            <strong>Battery</strong> → <strong>USB Charging Station</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.location?.href) {
      return window.location.href.split('#')[0];
    }
    return 'https://macopoy-energy-hub.vercel.app';
  });

  const [timeMinutes, setTimeMinutes] = useState(658);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);

  const [activePreset, setActivePreset] = useState('whole');
  const [selectedComponentId, setSelectedComponentId] = useState('solar');
  const [showLabels, setShowLabels] = useState(true);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showEnergyFlow, setShowEnergyFlow] = useState(true);
  const [showPerson, setShowPerson] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [telemetryScenarioKey, setTelemetryScenarioKey] =
    useState('night_operational');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (event) => setPrefersReducedMotion(event.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let animId;

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTimeMinutes((prev) => (prev + dt * 35 * simSpeed) % 1440);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, simSpeed]);

  const handleSelectPreset = useCallback((preset) => {
    setActivePreset(preset.id);
    if (preset.componentId) {
      setSelectedComponentId(preset.componentId);
    }
  }, []);

  const handleSelectComponent = useCallback((compId) => {
    setSelectedComponentId(compId);
    const matchingPreset = CAMERA_PRESETS.find((p) => p.componentId === compId);
    if (matchingPreset) {
      setActivePreset(matchingPreset.id);
    }
  }, []);

  const handleResetView = useCallback(() => {
    setActivePreset('whole');
    setTimeMinutes(658);
    setIsPlaying(false);
  }, []);

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectedComponent =
    SYSTEM_COMPONENTS[selectedComponentId] || SYSTEM_COMPONENTS.solar;
  const periodInfo = getTimePeriodInfo(timeMinutes);
  const currentTelemetry =
    DEMO_TELEMETRY_SCENARIOS[telemetryScenarioKey] ||
    DEMO_TELEMETRY_SCENARIOS.night_operational;

  const getComponentDemoStatus = (compId) => {
    switch (compId) {
      case 'solar':
        return periodInfo.isDay
          ? 'Daytime simulation: Harvesting solar power via fixed-tilt canopy array'
          : 'Nighttime simulation: Standby (No solar irradiance)';
      case 'turbine':
        return 'Simulation: Harvesting wind energy via rear-facing 3-blade rotor';
      case 'lamp':
        return periodInfo.isNight
          ? 'Nighttime simulation: Switched ON by top photocell — Illuminating rough road'
          : 'Daytime simulation: Switched OFF by top photocell (Standby)';
      case 'photocell':
        return periodInfo.isNight
          ? 'Nighttime simulation: Low ambient light detected — Triggering LED lamp ON'
          : 'Daytime simulation: Daylight detected — Keeping LED lamp OFF';
      case 'battery':
        return periodInfo.isDay
          ? 'Simulation: Storing renewable charge & supplying USB ports'
          : 'Simulation: Discharging stored LiFePO₄ energy to LED lamp & USB ports';
      case 'bench':
        return periodInfo.isNight
          ? 'Sheltered roadside seating beside the illuminated rough road'
          : 'Shaded by overhead fixed solar panel canopy';
      default:
        return 'Interactive demonstration component';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1F2421] font-sans antialiased selection:bg-[#1B3B2B] selection:text-white">
      <style>{`
        @keyframes heroFadeUp {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes heroFloatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes heroWindDrift {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(6px);
          }
        }
        @keyframes heroTreeSway {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(0.8deg);
          }
        }
        .hero-fade-up {
          animation: heroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .hero-fade-up-delay {
          animation: heroFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
        }
        .hero-float-slow {
          animation: heroFloatSlow 6s ease-in-out infinite;
        }
        .hero-wind-drift {
          animation: heroWindDrift 5s ease-in-out infinite;
        }
        .hero-tree-sway {
          transform-origin: center bottom;
          animation: heroTreeSway 7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-up,
          .hero-fade-up-delay,
          .hero-float-slow,
          .hero-wind-drift,
          .hero-tree-sway {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* SECTION 1: NAVIGATION BAR */}
      <header className="sticky top-0 z-40 h-16 bg-[#F7F6F2]/95 backdrop-blur-md border-b border-[#E2DFD7]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1B3B2B] flex items-center justify-center text-[#E5A93B] shadow-xs group-hover:bg-[#154343] transition-colors">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-[#1B3B2B] leading-none">
                Macopoy Energy Hub
              </span>
              <span className="block text-[11px] text-[#525B56] mt-0.5">
                Mascap, Rodriguez, Rizal
              </span>
            </div>
          </button>

          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#37403B]"
            aria-label="Primary Navigation"
          >
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="hover:text-[#1B3B2B] transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('explore-system')}
              className="hover:text-[#1B3B2B] transition-colors"
            >
              Explore System
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('energy-flow')}
              className="hover:text-[#1B3B2B] transition-colors"
            >
              Energy Flow
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('community')}
              className="hover:text-[#1B3B2B] transition-colors"
            >
              Community
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about-project')}
              className="hover:text-[#1B3B2B] transition-colors"
            >
              About the Project
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B3B2B] hover:bg-[#143022] text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E5A93B]" />
              <span>Public QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('facility-status')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#EAE7DF] hover:bg-[#DFDCD2] text-[#1B3B2B] text-xs font-semibold transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
              <span>Check the Facility</span>
            </button>
          </div>

          {/* Mobile Quick QR + Menu Actions so QR Code is always 1 tap away */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              aria-label="Open Public QR Code"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg bg-[#1B3B2B] text-white text-xs font-semibold shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E5A93B]" />
              <span>QR</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2.5 min-h-[40px] rounded-lg text-[#1F2421] hover:bg-[#EAE7DF] focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F7F6F2] border-b border-[#D8D5CD] px-4 pt-2 pb-5 space-y-2 shadow-lg">
            {[
              { id: 'home', label: 'Home' },
              { id: 'facility-status', label: 'Check the Facility' },
              { id: 'explore-system', label: 'Explore 3D System' },
              { id: 'energy-flow', label: '2D Energy Flow Diagram' },
              { id: 'community', label: 'Community' },
              { id: 'about-project', label: 'About the Project' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-3 py-2.5 min-h-[42px] rounded-lg text-sm font-medium text-[#1F2421] hover:bg-[#EAE7DF]"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setQrModalOpen(true);
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-[#1B3B2B] text-white text-sm font-semibold"
            >
              <QrCode className="w-4 h-4 text-[#E5A93B]" />
              <span>Open Public QR Code</span>
            </button>
          </div>
        )}
      </header>

      <main>
        {/* SECTION 2: HERO INTRODUCTION (Two-Column Balanced Layout on Desktop, Stacked on Mobile) */}
        <section
          id="home"
          className="pt-6 pb-8 sm:pt-10 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Description, and Primary Actions */}
            <div className="lg:col-span-6 hero-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EAE7DF] border border-[#D8D5CD] text-[#1B3B2B] text-xs font-semibold tracking-wide uppercase mb-4">
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Macopoy, Mascap, Rodriguez, Rizal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1B3B2B] leading-[1.12]">
                Clean Energy. A Brighter Community.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#454F4A] leading-relaxed max-w-2xl">
                Discover how solar and wind energy can power safer streets, public
                phone charging, and a place to rest in Macopoy, Mascap.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('explore-system')}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-[#1B3B2B] hover:bg-[#153023] text-white text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>Explore the Installation</span>
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('energy-flow')}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-white hover:bg-[#EAE7DF] text-[#1F2421] border border-[#D5D2C9] text-sm font-semibold transition-colors"
                >
                  <span>2D Energy Diagram</span>
                  <ChevronRight className="w-4 h-4 text-[#525B56]" />
                </button>

                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-[#EAE7DF] hover:bg-[#DFDCD2] text-[#1B3B2B] border border-[#D5D2C9] text-sm font-semibold transition-colors"
                >
                  <QrCode className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Get Roadside QR Sticker</span>
                </button>
              </div>
            </div>

            {/* Right Column (Below text on mobile): Lightweight Interactive Architectural Preview */}
            <div className="lg:col-span-6 hero-fade-up-delay">
              <HeroInstallationPreview
                prefersReducedMotion={prefersReducedMotion}
                onSelectComponentAndScroll={(compId) => {
                  handleSelectComponent(compId);
                  scrollToSection('explore-system');
                }}
                onPreviewNightMode={(isNight) => {
                  setIsPlaying(false);
                  setTimeMinutes(isNight ? 1320 : 658);
                  scrollToSection('explore-system');
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: CHECK THE FACILITY (Moved near the top for immediate commuter access on mobile & desktop) */}
        <section
          id="facility-status"
          className="py-8 sm:py-12 bg-[#EFECE6] border-y border-[#DFDCD3] px-4 sm:px-6 lg:px-8 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E] text-xs font-semibold mb-2.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Demonstration Mode — Simulated Public Status Layer</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1B3B2B] tracking-tight">
                  Check the Facility
                </h2>
                <p className="mt-1.5 text-sm sm:text-base text-[#454F4A] leading-relaxed">
                  Check the availability of the streetlight and public USB charging
                  station. Because the physical ESP32 sensor telemetry is not yet
                  connected, the cards below display clearly labeled demonstration
                  states.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#D8D5CD] shadow-2xs">
                <label
                  htmlFor="telemetry-scenario-picker"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#525B56] mb-1.5"
                >
                  Preview Telemetry State (Demo Layer):
                </label>
                <select
                  id="telemetry-scenario-picker"
                  value={telemetryScenarioKey}
                  onChange={(e) => setTelemetryScenarioKey(e.target.value)}
                  className="w-full sm:w-72 px-3 py-2.5 min-h-[42px] rounded-xl bg-[#F7F6F2] border border-[#D5D2C9] text-xs sm:text-sm font-semibold text-[#1B3B2B] focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                >
                  <option value="night_operational">
                    1. Operational &amp; Available (Night Demo)
                  </option>
                  <option value="day_standby">
                    2. Daytime Standby &amp; Port In Use (Demo)
                  </option>
                  <option value="unverified_hardware">
                    3. Unknown Status (Unverified Sensor Feedback)
                  </option>
                  <option value="esp32_offline">
                    4. Offline / Stale ESP32 Data Timeout
                  </option>
                </select>
              </div>
            </div>

            {currentTelemetry.isStale && (
              <div className="mt-5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs sm:text-sm text-[#991B1B]">
                <WifiOff className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Status unavailable:</strong> The website has not received
                  recent telemetry from the ESP32 microcontroller (
                  {currentTelemetry.lastUpdatedText}). Misleading green indicators
                  are suppressed until fresh hardware data arrives.
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <StatusCard
                category="Roadside Illumination"
                title="Streetlight Status"
                icon={Lightbulb}
                stateLabel={currentTelemetry.streetlight.state}
                statusKey={currentTelemetry.streetlight.statusKey}
                summary={currentTelemetry.streetlight.summary}
                detail={currentTelemetry.streetlight.detail}
                lastUpdated={currentTelemetry.lastUpdatedText}
                possibleStates={['Operational', 'Not operating', 'Unknown', 'Offline']}
              />

              <StatusCard
                category="Mobile Device Charging"
                title="Public Charging Status"
                icon={Usb}
                stateLabel={currentTelemetry.charging.state}
                statusKey={currentTelemetry.charging.statusKey}
                summary={currentTelemetry.charging.summary}
                detail={currentTelemetry.charging.detail}
                lastUpdated={currentTelemetry.lastUpdatedText}
                possibleStates={[
                  'Available',
                  'In use',
                  'Unavailable',
                  'Unknown',
                  'Offline'
                ]}
              />
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/80 border border-[#D8D5CD] text-xs text-[#525B56]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                <span>
                  <strong>Telemetry readiness:</strong> Actual status verification
                  depends on installed monitoring hardware (e.g., load-current or
                  voltage sensing wired to the ESP32), rather than assuming a
                  component works solely from a software command.
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#1B3B2B] shrink-0">
                Source: src/data/demoTelemetry
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE 3D INSTALLATION */}
        <section
          id="explore-system"
          className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16"
        >
          <div className="bg-[#EFECE4] rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#DFDCD3] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D6A4F]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Interactive 3D System Visualization</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1B3B2B] mt-0.5">
                  Roadside Hybrid Solar–Wind Streetlight, Charging Station &amp; Bench
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#525B56] mr-1">
                  Lighting Presets:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeMinutes(658);
                  }}
                  className={`px-3 py-2 min-h-[38px] rounded-lg text-xs font-semibold border transition-colors ${
                    timeMinutes >= 360 && timeMinutes < 1005
                      ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                      : 'bg-white text-[#1F2421] border-[#D5D2C9] hover:bg-[#F7F6F2]'
                  }`}
                >
                  Day (10:58 AM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeMinutes(1065);
                  }}
                  className={`px-3 py-2 min-h-[38px] rounded-lg text-xs font-semibold border transition-colors ${
                    timeMinutes >= 1005 && timeMinutes < 1140
                      ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                      : 'bg-white text-[#1F2421] border-[#D5D2C9] hover:bg-[#F7F6F2]'
                  }`}
                >
                  Sunset (5:45 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeMinutes(1320);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-semibold border transition-colors ${
                    timeMinutes >= 1140 || timeMinutes < 360
                      ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                      : 'bg-white text-[#1F2421] border-[#D5D2C9] hover:bg-[#F7F6F2]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-[#E5A93B]" />
                  <span>Night Mode (10:00 PM)</span>
                </button>
              </div>
            </div>

            <StreetlightThreeScene
              timeMinutes={timeMinutes}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onTimeChange={(val) => {
                setIsPlaying(false);
                setTimeMinutes(val);
              }}
              simSpeed={simSpeed}
              onSimSpeedChange={setSimSpeed}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              selectedComponentId={selectedComponentId}
              onSelectComponent={handleSelectComponent}
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels((l) => !l)}
              showAllLabels={showAllLabels}
              onToggleShowAllLabels={setShowAllLabels}
              showEnergyFlow={showEnergyFlow}
              onToggleEnergyFlow={() => setShowEnergyFlow((f) => !f)}
              showPerson={showPerson}
              onTogglePerson={() => setShowPerson((p) => !p)}
              onResetView={handleResetView}
              prefersReducedMotion={prefersReducedMotion}
            />

            {/* CLICKABLE COMPONENT INFORMATION PANEL */}
            <div
              id="component-inspector-panel"
              className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
            >
              <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-[#DCD9D0] flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#ECEAE3]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: selectedComponent.dotColor }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#525B56]">
                        Selected Component Inspector
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#F3F1EC] text-[#1B3B2B] text-xs font-medium">
                      {selectedComponent.badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap mt-4 no-scrollbar">
                    {Object.values(SYSTEM_COMPONENTS).map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => handleSelectComponent(comp.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium transition-colors shrink-0 ${
                          selectedComponentId === comp.id
                            ? 'bg-[#1B3B2B] text-white font-semibold'
                            : 'bg-[#F7F6F2] text-[#37403B] hover:bg-[#EAE7DF]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: comp.dotColor }}
                        />
                        <span>{comp.fullTitle}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold text-[#1B3B2B] mt-4">
                    {selectedComponent.fullTitle}
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-[#2F3632] leading-relaxed">
                    {selectedComponent.functionText}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#ECEAE3]">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525B56]">
                        Role in Hybrid System
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-[#454F4A] leading-relaxed">
                        {selectedComponent.roleInSystem}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525B56]">
                        Public-Service Benefit
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-[#454F4A] leading-relaxed">
                        {selectedComponent.publicBenefit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#ECEAE3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#37403B]">
                  <div className="flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-[#2D6A4F]" />
                    <span>{getComponentDemoStatus(selectedComponent.id)}</span>
                  </div>
                  <span className="text-[#6C7570] italic">
                    Simulated 3D model — Not a verified physical build
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#F7F6F2] rounded-2xl p-5 sm:p-6 border border-[#DCD9D0] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1B3B2B]">
                      Conceptual Energy Flow
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        showEnergyFlow
                          ? 'bg-[#D8F3DC] text-[#1B4332]'
                          : 'bg-[#E2DFD7] text-[#525B56]'
                      }`}
                    >
                      {showEnergyFlow ? 'Visible in 3D' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#454F4A] leading-relaxed">
                    When enabled, animated directional markers illustrate how
                    harvested energy moves through the installation:
                  </p>

                  <ul className="mt-3.5 space-y-2.5 text-xs text-[#2F3632]">
                    <li className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] mt-1 shrink-0" />
                      <span>
                        <strong>Solar Panel →</strong> Solar Charge Controller →{' '}
                        <strong>Battery</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] mt-1 shrink-0" />
                      <span>
                        <strong>Wind Turbine →</strong> Wind Power Conversion &amp;
                        Charge Controller → <strong>Battery</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fde047] border border-[#ca8a04] mt-1 shrink-0" />
                      <span>
                        <strong>Battery → LED Streetlight</strong> (Active at
                        night via top photocell)
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] mt-1 shrink-0" />
                      <span>
                        <strong>Battery → USB Charging Station</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#E2DFD7] text-[11px] text-[#525B56] leading-relaxed">
                  <strong>Note:</strong> This 3D visualization and particle animation
                  represent a conceptual educational overview of the proposed design,
                  not a verified electrical schematic or completed physical
                  construction.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: WHERE THE ENERGY GOES (Now featuring the Interactive 2D System Diagram) */}
        <section
          id="energy-flow"
          className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16"
        >
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2D6A4F]">
              System Architecture &amp; Conversion Stages
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-[#1B3B2B] tracking-tight">
              Where the Energy Goes
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#454F4A] leading-relaxed">
              Power from the sun and wind is collected, converted, stored in a
              battery, and then shared between the streetlight and public phone
              chargers.
            </p>
          </div>

          {/* Interactive 2D System Diagram */}
          <Interactive2DEnergyDiagram
            selectedComponentId={selectedComponentId}
            onSelectComponent={(compId) => {
              handleSelectComponent(compId);
              scrollToSection('explore-system');
            }}
            timeMinutes={timeMinutes}
            prefersReducedMotion={prefersReducedMotion}
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {ENERGY_FLOW_STAGES.map((stage, idx) => (
              <div
                key={stage.stageNumber}
                className="bg-white rounded-2xl border border-[#DEDBD2] p-5 sm:p-6 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center text-white"
                        style={{ backgroundColor: stage.accentColor }}
                      >
                        {stage.stageNumber}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-[#1F2421] leading-none">
                          {stage.stageName}
                        </h3>
                        <span className="text-xs text-[#525B56] mt-0.5 block">
                          {stage.subtitle}
                        </span>
                      </div>
                    </div>
                    {idx < 3 && (
                      <ChevronRight
                        className="hidden lg:block w-5 h-5 text-[#9CA39F]"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    {stage.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <div
                          key={item.title}
                          className={`p-3.5 rounded-xl border ${stage.bgTint} ${stage.borderTint}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                              <h4 className="text-sm font-bold text-[#1B3B2B]">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                          <p className="mt-2 text-xs sm:text-sm text-[#37403B] leading-relaxed">
                            {item.description}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectComponent(item.componentRef);
                              scrollToSection('explore-system');
                            }}
                            className="mt-2.5 inline-flex items-center gap-1 py-1 text-xs font-semibold text-[#1B3B2B] hover:underline"
                          >
                            <span>Locate in 3D scene</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-[#EFECE6] border border-[#D8D5CD] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1B3B2B] text-[#E5A93B] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-[#37403B] leading-relaxed space-y-1.5">
              <h3 className="font-bold text-[#1B3B2B] text-sm sm:text-base">
                Electrical Safety &amp; Charge-Regulation Note
              </h3>
              <p>
                Appropriate overcurrent protection (such as DC breakers and fuses),
                proper grounding, weather-resistant wiring, and regulated
                power-conversion equipment are essential to safe public operation.
                The streetlight’s automatic nighttime switching is controlled
                locally by its photocell and remains independent of website
                connectivity.
              </p>
              <p className="text-[#525B56] text-xs">
                <em>Engineering note:</em> The solar and wind charging paths use
                dedicated regulation stages suited to their respective sources.
                Final protection ratings, grounding verification, and charge
                controller specifications depend on physical hardware testing.
              </p>
            </div>
          </div>

          {/* QR Code Banner for Roadside Access */}
          <div className="mt-6 bg-[#1B3B2B] text-white rounded-2xl p-5 sm:p-6 border border-[#143022] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#E5A93B] shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                  On-Site Community Access • Weatherproof Pole Plaque
                </span>
                <h3 className="text-lg sm:text-xl font-bold mt-0.5">
                  Scan at the Streetlight Pole to Open This Public Dashboard
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                  A printed QR code plaque mounted on the yellow battery and USB
                  charging enclosure lets residents, students, and commuters open
                  this 3D guide and facility status page directly on their phones.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-[#E5A93B] hover:bg-[#d89b2b] text-[#1A241E] text-xs sm:text-sm font-bold transition-colors shrink-0 shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>View &amp; Download QR Sticker</span>
            </button>
          </div>
        </section>

        {/* SECTION 7: WHY MACOPOY NEEDS IT */}
        <section
          id="community"
          className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2D6A4F]">
                Community Context &amp; Design Rationale
              </span>
              <h2 className="mt-1 text-3xl sm:text-4xl font-bold text-[#1B3B2B] tracking-tight">
                Why Macopoy Needs It
              </h2>

              <div className="mt-5 space-y-4 text-base sm:text-lg text-[#2F3632] leading-relaxed bg-white p-6 rounded-2xl border border-[#DFDCD3] shadow-2xs">
                <p>
                  Parts of the road in Macopoy, Mascap have no streetlights,
                  especially in the middle and far-end sections. Students and
                  workers still travel early in the morning and late at night, and
                  many walk because transportation is limited.
                </p>
                <p>
                  There are no benches along the way either. The area gets plenty
                  of sunshine in the day and, because it sits high in the
                  mountains, steady wind. That makes sun and wind a good pair for a
                  light that does not depend on the power grid.
                </p>
              </div>

              <p className="mt-4 text-xs text-[#525B56] leading-relaxed">
                <em>Note on site conditions:</em> Local solar and wind availability
                serve as the engineering rationale for choosing a hybrid off-grid
                configuration. Actual energy yield and sufficiency depend on
                on-site environmental measurements and physical prototype testing.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#1B3B2B] rounded-3xl p-6 sm:p-8 text-white border border-[#153023] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A7F3D0]">
                    Roadside Service Concept • Sitio Macopoy, Brgy. Mascap
                  </span>
                  <span className="text-xs text-white/75">Off-Grid Utility</span>
                </div>

                <svg
                  viewBox="0 0 520 230"
                  className="w-full h-auto rounded-2xl bg-[#12291F] border border-white/10"
                  role="img"
                  aria-label="Illustration showing a mountainous road in Macopoy with the hybrid solar-wind streetlight and shaded public bench"
                >
                  <path
                    d="M 0 165 Q 95 75 200 140 T 410 110 L 520 155 L 520 230 L 0 230 Z"
                    fill="#1B4332"
                  />
                  <path
                    d="M 140 175 Q 260 85 375 145 T 520 130 L 520 230 L 140 230 Z"
                    fill="#2D6A4F"
                    opacity="0.65"
                  />

                  <circle cx="430" cy="54" r="20" fill="#E5A93B" opacity="0.9" />
                  <path
                    d="M 65 55 C 95 55, 110 45, 135 45 M 50 72 C 85 72, 105 64, 145 64"
                    stroke="#7DD3FC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                  />

                  <polygon
                    points="0,230 520,230 520,182 0,182"
                    fill="#6E5A44"
                  />
                  <path
                    d="M 0 196 Q 140 193 270 197 T 520 195"
                    stroke="#544332"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.65"
                  />
                  <path
                    d="M 0 216 Q 160 219 310 214 T 520 217"
                    stroke="#544332"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.65"
                  />
                  <circle cx="65" cy="205" r="2.2" fill="#9C8B75" />
                  <circle cx="145" cy="190" r="2.5" fill="#4F4336" />
                  <circle cx="240" cy="208" r="2" fill="#9C8B75" />
                  <circle cx="385" cy="202" r="2.8" fill="#4F4336" />
                  <circle cx="455" cy="212" r="2.2" fill="#9C8B75" />

                  <rect x="175" y="42" width="10" height="140" fill="#2b8a3e" />
                  <rect x="148" y="36" width="38" height="8" rx="2" fill="#2b8a3e" />
                  {/* Top Photocell Sensor on Lamp */}
                  <rect x="158" y="31" width="7" height="5" rx="1.5" fill="#38BDF8" />
                  <polygon
                    points="152,44 176,44 195,228 75,228"
                    fill="#FEF08A"
                    opacity="0.22"
                  />
                  <circle cx="195" cy="48" r="4" fill="#E2E8F0" />
                  <line
                    x1="195"
                    y1="48"
                    x2="212"
                    y2="22"
                    stroke="#CBD5E1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="195"
                    y1="48"
                    x2="214"
                    y2="72"
                    stroke="#CBD5E1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="195"
                    y1="48"
                    x2="165"
                    y2="48"
                    stroke="#CBD5E1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <rect
                    x="182"
                    y="112"
                    width="18"
                    height="34"
                    rx="2"
                    fill="#eab308"
                  />

                  <line
                    x1="185"
                    y1="96"
                    x2="345"
                    y2="96"
                    stroke="#2b8a3e"
                    strokeWidth="4"
                  />
                  <line
                    x1="206"
                    y1="96"
                    x2="206"
                    y2="182"
                    stroke="#2b8a3e"
                    strokeWidth="3"
                  />
                  <line
                    x1="332"
                    y1="96"
                    x2="332"
                    y2="182"
                    stroke="#2b8a3e"
                    strokeWidth="3"
                  />
                  <polygon
                    points="192,92 348,92 338,76 202,76"
                    fill="#1D4ED8"
                    stroke="#E2E8F0"
                    strokeWidth="2"
                  />

                  <rect
                    x="220"
                    y="150"
                    width="98"
                    height="6"
                    rx="2"
                    fill="#D97724"
                  />
                  <rect
                    x="224"
                    y="132"
                    width="90"
                    height="4"
                    rx="1.5"
                    fill="#D97724"
                  />
                  <rect
                    x="224"
                    y="140"
                    width="90"
                    height="4"
                    rx="1.5"
                    fill="#D97724"
                  />
                  <rect x="224" y="128" width="6" height="54" fill="#D97724" />
                  <rect x="308" y="128" width="6" height="54" fill="#D97724" />
                </svg>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <Lightbulb className="w-5 h-5 text-[#FACC15] mb-2" />
                    <h3 className="text-sm font-bold text-white">
                      Safer nighttime travel
                    </h3>
                    <p className="mt-1 text-xs text-white/80 leading-relaxed">
                      Streetlighting is intended to improve visibility along an
                      otherwise poorly illuminated road.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <Usb className="w-5 h-5 text-[#38BDF8] mb-2" />
                    <h3 className="text-sm font-bold text-white">
                      Convenient public charging
                    </h3>
                    <p className="mt-1 text-xs text-white/80 leading-relaxed">
                      A shared charging facility can help travelers charge their
                      mobile devices.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <Armchair className="w-5 h-5 text-[#FB923C] mb-2" />
                    <h3 className="text-sm font-bold text-white">
                      A place to rest
                    </h3>
                    <p className="mt-1 text-xs text-white/80 leading-relaxed">
                      A public bench provides a convenient stopping point for
                      students, workers, and other passersby.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: ABOUT THE PROJECT */}
        <section
          id="about-project"
          className="py-16 sm:py-20 bg-white border-t border-[#E2DFD7] px-4 sm:px-6 lg:px-8 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6F2] text-[#1B3B2B] text-xs font-semibold uppercase tracking-wider mb-3">
                  <BookOpen className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>About the Project • Undergraduate Thesis</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#1B3B2B] leading-snug">
                  “{THESIS_METADATA.fullTitle}”
                </h2>

                <p className="mt-4 text-base text-[#37403B] leading-relaxed">
                  This public-facing website presents the proposed hybrid
                  renewable-energy streetlight system and its intended community
                  benefits for Sitio Macopoy, Barangay Mascap, Rodriguez, Rizal.
                  It provides an interactive 3D educational model alongside a
                  public availability overview designed for future hardware
                  telemetry integration.
                </p>

                <div className="mt-6 p-5 rounded-2xl bg-[#F7F6F2] border border-[#E2DFD7]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#525B56]">
                    Planned Physical Hardware Architecture
                  </h3>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm font-medium text-[#1F2421]">
                    {[
                      'Wind turbine + Wind MPPT',
                      'Fixed solar panel + Solar MPPT',
                      'LiFePO₄ battery storage',
                      'LED streetlight + Top Photocell',
                      'Public USB charging station',
                      'DC breaker & Inverter stage',
                      'ESP32 telemetry node',
                      'Public roadside bench'
                    ].map((hw) => (
                      <div
                        key={hw}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E6E3DC]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0" />
                        <span>{hw}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-[#F7F6F2] rounded-3xl p-6 sm:p-7 border border-[#DFDCD3] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-[#1B3B2B]">
                      <Users className="w-5 h-5 text-[#2D6A4F]" />
                      <h3 className="text-lg font-bold">Research Team</h3>
                    </div>
                    <p className="mt-1 text-xs text-[#525B56]">
                      Student researchers developing the proposed Macopoy hybrid
                      streetlight and public charging installation:
                    </p>

                    <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                      {THESIS_METADATA.researchers.map((name, idx) => (
                        <li
                          key={name}
                          className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E2DFD7] shadow-2xs"
                        >
                          <span className="text-sm font-semibold text-[#1F2421]">
                            {name}
                          </span>
                          <span className="text-[11px] font-mono text-[#6C7570]">
                            0{idx + 1}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2DFD7] flex items-center justify-between text-xs text-[#525B56]">
                    <span>Target Site:</span>
                    <span className="font-semibold text-[#1B3B2B]">
                      {THESIS_METADATA.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 9: FOOTER */}
      <footer className="bg-[#162920] text-[#E6EAE7] py-12 px-4 sm:px-6 lg:px-8 border-t border-[#243D31]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/10">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-[#E5A93B]">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {THESIS_METADATA.shortName}
              </span>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-[#B8C4BD] max-w-md leading-relaxed">
              Public information and interactive 3D visualization dashboard for a
              proposed hybrid solar–wind powered streetlight with a public USB
              charging station and roadside bench.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#A7F3D0]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{THESIS_METADATA.location}, Philippines</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Page Sections
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#B8C4BD]">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('home')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('explore-system')}
                  className="hover:text-white transition-colors"
                >
                  Interactive 3D System
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('energy-flow')}
                  className="hover:text-white transition-colors"
                >
                  Where the Energy Goes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('facility-status')}
                  className="hover:text-white transition-colors"
                >
                  Check the Facility
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('community')}
                  className="hover:text-white transition-colors"
                >
                  Why Macopoy Needs It
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('about-project')}
                  className="hover:text-white transition-colors"
                >
                  About the Project
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Academic Attribution
            </h3>
            <p className="mt-3 text-xs text-[#B8C4BD] leading-relaxed">
              Developed as an undergraduate thesis public visualization prototype.
              All status metrics currently operate in demonstration mode pending
              finalized sensor and ESP32 telemetry deployment.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8FA197]">
          <span>{THESIS_METADATA.fullTitle}</span>
          <span>Macopoy, Mascap • Public Information Dashboard</span>
        </div>
      </footer>

      {qrModalOpen && (
        <PublicQrModal
          url={publicUrl}
          onChangeUrl={setPublicUrl}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// 6. SUB-COMPONENT: PUBLIC FACILITY STATUS CARD
// ============================================================================

function StatusCard({
  category,
  title,
  icon: Icon,
  stateLabel,
  statusKey,
  summary,
  detail,
  lastUpdated,
  possibleStates
}) {
  const badgeStyles = {
    operational: {
      bg: 'bg-[#D8F3DC]',
      text: 'text-[#1B4332]',
      border: 'border-[#95D5B2]',
      dot: 'bg-[#2D6A4F]'
    },
    available: {
      bg: 'bg-[#D8F3DC]',
      text: 'text-[#1B4332]',
      border: 'border-[#95D5B2]',
      dot: 'bg-[#2D6A4F]'
    },
    in_use: {
      bg: 'bg-[#E0F2FE]',
      text: 'text-[#075985]',
      border: 'border-[#BAE6FD]',
      dot: 'bg-[#0284C7]'
    },
    not_operating: {
      bg: 'bg-[#F3F4F6]',
      text: 'text-[#374151]',
      border: 'border-[#D1D5DB]',
      dot: 'bg-[#6B7280]'
    },
    unavailable: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      dot: 'bg-[#D97706]'
    },
    unknown: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      dot: 'bg-[#D97706]'
    },
    offline: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      border: 'border-[#FECACA]',
      dot: 'bg-[#DC2626]'
    }
  };

  const style = badgeStyles[statusKey] || badgeStyles.unknown;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#D8D5CD] shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#EFF6F2] text-[#1B3B2B] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#525B56]">
                {category}
              </span>
              <h3 className="text-xl font-bold text-[#1B3B2B]">{title}</h3>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${style.bg} ${style.text} ${style.border}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
            <span>{stateLabel}</span>
          </div>
        </div>

        <p className="mt-5 text-sm sm:text-base font-semibold text-[#1F2421]">
          {summary}
        </p>
        <p className="mt-2 text-xs sm:text-sm text-[#454F4A] leading-relaxed">
          {detail}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-[#ECEAE3] space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#6C7570] mr-1">
            Supported states:
          </span>
          {possibleStates.map((st) => (
            <span
              key={st}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                st === stateLabel
                  ? 'bg-[#1B3B2B] text-white'
                  : 'bg-[#F3F1EC] text-[#525B56]'
              }`}
            >
              {st}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6C7570]">
          <span>{lastUpdated}</span>
          <span className="font-semibold text-[#92400E]">Simulated Data</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. SUB-COMPONENT: PUBLIC QR CODE & PRINTABLE POLE SIGNAGE MODAL
// ============================================================================

function PublicQrModal({ url, onChangeUrl, onClose }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cleanUrl = (url || '').trim() || 'https://macopoy-energy-hub.vercel.app';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&color=1B3B2B&bgcolor=FFFFFF&ecc=M&data=${encodeURIComponent(
    cleanUrl
  )}`;

  const handleCopyLink = () => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = cleanUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleDownloadSticker = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    const drawPoster = (qrImageElement = null) => {
      ctx.fillStyle = '#F7F6F2';
      ctx.fillRect(0, 0, 900, 1200);

      ctx.strokeStyle = '#1B3B2B';
      ctx.lineWidth = 24;
      ctx.strokeRect(24, 24, 852, 1152);

      ctx.fillStyle = '#1B3B2B';
      ctx.fillRect(36, 36, 828, 220);

      ctx.fillStyle = '#E5A93B';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PUBLIC UTILITY & INFORMATION HUB', 450, 95);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('MACOPOY ENERGY HUB', 450, 155);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = '600 22px sans-serif';
      ctx.fillText('Sitio Macopoy, Brgy. Mascap • Rodriguez, Rizal', 450, 205);

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#D5D2C9';
      ctx.lineWidth = 4;
      ctx.fillRect(190, 310, 520, 520);
      ctx.strokeRect(190, 310, 520, 520);

      if (qrImageElement) {
        ctx.drawImage(qrImageElement, 220, 340, 460, 460);
      } else {
        ctx.fillStyle = '#1B3B2B';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('SCAN QR ON LIVE DASHBOARD', 450, 570);
      }

      ctx.fillStyle = '#1B3B2B';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('SCAN WITH YOUR PHONE CAMERA', 450, 905);

      ctx.fillStyle = '#37403B';
      ctx.font = '500 24px sans-serif';
      ctx.fillText(
        '• Explore the Interactive 3D Solar–Wind Streetlight',
        450,
        960
      );
      ctx.fillText(
        '• Check Streetlight & Public USB Charging Status',
        450,
        1000
      );

      ctx.fillStyle = '#EAE7DF';
      ctx.fillRect(110, 1045, 680, 62);
      ctx.fillStyle = '#1B3B2B';
      ctx.font = 'bold 21px monospace';
      const displayUrl =
        cleanUrl.length > 52 ? cleanUrl.slice(0, 49) + '...' : cleanUrl;
      ctx.fillText(displayUrl, 450, 1084);

      ctx.fillStyle = '#6C7570';
      ctx.font = '500 17px sans-serif';
      ctx.fillText(
        'Hybrid Solar–Wind Powered Streetlight with Public Charging Station & Bench',
        450,
        1145
      );

      const link = document.createElement('a');
      link.download = 'Macopoy-Energy-Hub-QR-Sticker.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawPoster(img);
    img.onerror = () => drawPoster(null);
    img.src = qrApiUrl;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="bg-[#F7F6F2] border border-[#D8D5CD] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="bg-[#1B3B2B] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#E5A93B]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A7F3D0] block">
                Public Access &amp; Pole Signage
              </span>
              <h2 id="qr-modal-title" className="text-lg font-bold leading-tight">
                Macopoy Energy Hub QR Code
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close QR code modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 border-2 border-[#1B3B2B] text-center shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6F2] text-[#1B3B2B] text-[11px] font-bold uppercase tracking-wider mb-3">
              <Smartphone className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Scan to Open Public Dashboard</span>
            </div>

            <div className="mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white p-3 border border-[#E2DFD7] flex items-center justify-center relative">
              {!imgError ? (
                <img
                  src={qrApiUrl}
                  alt={`QR Code for ${cleanUrl}`}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <QrCode className="w-24 h-24 text-[#1B3B2B] mx-auto mb-2" />
                  <p className="text-xs text-[#525B56]">
                    Offline preview mode — Connect to the internet to render the
                    live scannable QR image for this URL.
                  </p>
                </div>
              )}
            </div>

            <h3 className="mt-3 text-base font-bold text-[#1B3B2B]">
              Macopoy Hybrid Solar–Wind Streetlight
            </h3>
            <p className="text-xs text-[#525B56] mt-0.5">
              Sitio Macopoy, Brgy. Mascap, Rodriguez, Rizal
            </p>
            <p className="mt-2 text-[11px] font-mono text-[#2D6A4F] bg-[#F7F6F2] px-3 py-1.5 rounded-lg border border-[#E2DFD7] truncate">
              {cleanUrl}
            </p>
          </div>

          <div>
            <label
              htmlFor="public-qr-url-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#37403B] mb-1.5"
            >
              Public Website URL Encoded in QR Code:
            </label>
            <div className="flex gap-2">
              <input
                id="public-qr-url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setImgError(false);
                  onChangeUrl(e.target.value);
                }}
                placeholder="https://your-deployed-site.vercel.app"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D5D2C9] text-xs sm:text-sm text-[#1F2421] focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#EAE7DF] hover:bg-[#DFDCD2] text-[#1B3B2B] text-xs font-semibold transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#525B56]">
              Tip: Once you deploy this project (e.g., on Vercel, Netlify, or
              GitHub Pages), paste your live link above and download the sticker
              to print for your thesis defense or pole enclosure.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadSticker}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B3B2B] hover:bg-[#143022] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-[#E5A93B]" />
              <span>Download Printable Pole Sticker (PNG)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#EAE7DF] text-[#37403B] border border-[#D5D2C9] text-xs sm:text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
