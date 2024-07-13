// Global settings and state definitions
const _settings = {
  threshold: 0.98,
  poseLandmarksLabels: ["wristBack", "wristRight", "wristPalm", "wristPalmTop", "wristBackTop", "wristLeft"],
  NNsPaths: ['../../neuralNets/NN_WRISTBACK_29.json'],
  isPoseFilter: true,
  objectPointsPositionFactors: [1.0, 1.3, 1.0],
  occluderRadiusRange: [4, 4.7],
  occluderHeight: 48,
  occluderOffset: [0,0,0],
  occluderQuaternion: [0.707,0,0,0.707],
  occluderFlattenCoeff: 0.6,
  stabilizerOptions: {
    minCutOff: 0.001,
    beta: 4,
    freqRange: [2, 144],
    forceFilterNNInputPxRange: [2.5, 6],
  },
  modelURL: 'assets/watchCasio.glb',
  modelScale: 1.3 * 1.462,
  modelOffset: [0.076, -0.916, -0.504],
  modelQuaternion: [0,0,0,1],
  debugDisplayLandmarks: false,
  debugMeshMaterial: false,
  debugOccluder: false
};

const _states = {
  notLoaded: -1,
  loading: 0,
  idle: 1,
  running: 2,
  busy: 3
};
let _state = _states.notLoaded;
let _isInstructionsHidden = false;

// Function to set canvas size to full screen
function setFullScreen(cv) {
  const pixelRatio = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  cv.width = pixelRatio * Math.min(w, h * 3 / 4);
  cv.height = pixelRatio * h;
}

// Main entry point of the application
function main() {
  _state = _states.loading;
  const handTrackerCanvas = document.getElementById('handTrackerCanvas');
  const VTOCanvas = document.getElementById('VTOCanvas');

  setFullScreen(handTrackerCanvas);
  setFullScreen(VTOCanvas);

  HandTrackerThreeHelper.init({
    landmarksStabilizerSpec: _settings.stabilizerOptions,
    scanSettings: {
      translationScalingFactors: [0.3,0.3,0.3],
    },
    stabilizationSettings: {
      switchNNErrorThreshold: 0.2,
      NNSwitchMask: {
        isRightHand: true,
        isFlipped: false
      }
    },
    objectPointsPositionFactors: _settings.objectPointsPositionFactors,
    poseLandmarksLabels: _settings.poseLandmarksLabels,
    poseFilter: null,
    NNsPaths: _settings.NNsPaths,
    threshold: _settings.threshold,
    callbackTrack: callbackTrack,
    VTOCanvas: VTOCanvas,
    videoSettings: {
      facingMode: 'environment'
    },
    handTrackerCanvas: handTrackerCanvas,
    debugDisplayLandmarks: _settings.debugDisplayLandmarks,
  }).then(start).catch(err => {
    throw new Error(err);
  });
}

// Set up the scene lighting
function setup_lighting(three) {
  const scene = three.scene;
  const pmremGenerator = new THREE.PMREMGenerator(three.renderer);
  pmremGenerator.compileEquirectangularShader();
  new THREE.RGBELoader().setDataType(THREE.HalfFloatType)
    .load('assets/hotel_room_1k.hdr', function(texture) {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();
      scene.environment = envMap;
    });
  three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  three.renderer.outputEncoding = THREE.sRGBEncoding;
}

// Load the 3D model
function load_model(threeLoadingManager) {
  if (_state !== _states.running && _state !== _states.idle) {
    return; // Early return if the model is already loaded or the state is busy/loading
  }
  _state = _states.busy;
  HandTrackerThreeHelper.clear_threeObjects(false); // Remove previous model but keep occluders
  new THREE.GLTFLoader(threeLoadingManager).load(_settings.modelURL, function(model) {
    const me = model.scene.children[0];
    me.scale.set(1, 1, 1);
    if (_settings.debugMeshMaterial) {
      me.traverse(child => {
        if (child.material) {
          child.material = new THREE.MeshNormalMaterial();
        }
      });
    }
    if (_settings.modelScale) {
      me.scale.multiplyScalar(_settings.modelScale);
    }
    if (_settings.modelOffset) {
      const displacement = new THREE.Vector3(..._settings.modelOffset.map((d, i) => i === 1 ? -d : d));
      me.position.add(displacement);
    }
    if (_settings.modelQuaternion) {
      me.quaternion.set(..._settings.modelQuaternion);
    }
    HandTrackerThreeHelper.add_threeObject(me);
    _state = _states.running;
  });
}

// Start the application setup
function start(three) {
  VTOCanvas.style.zIndex = 3;
  setup_lighting(three);
  three.loadingManager.onLoad = function() {
    console.log('All THREE.js stuffs are loaded');
    hide_loading();
    _state = _states.running;
  };
  add_softOccluder().then(() => {
    _state = _states.idle;
    load_model(three.loadingManager);
  });
}

// Additional functions for UI interactions and loading states
function hide_loading() {
  const domLoading = document.getElementById('loading');
  domLoading.style.opacity = 0;
  setTimeout(() => {
    domLoading.parentNode.removeChild(domLoading);
  }, 800);
}

function hide_instructions() {
  const domInstructions = document.getElementById('instructions');
  if (!domInstructions) return;
  domInstructions.style.opacity = 0;
  _isInstructionsHidden = true;
  setTimeout(() => {
    domInstructions.parentNode.removeChild(domInstructions);
  }, 800);
}

function callbackTrack(detectState) {
  if (detectState.isDetected && !_isInstructionsHidden) {
    hide_instructions();
  }
}

window.addEventListener('load', main);
