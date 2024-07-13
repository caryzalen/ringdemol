const _settings = {
  threshold: 0.99,
  poseLandmarksLabels: ["wristBack", "wristRight", "wristPalm", "wristPalmTop", "wristBackTop", "wristLeft"],
  NNsPaths: ['../../neuralNets/NN_WRISTBACK_29.json'],
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

let _state = -1; // notLoaded
let _isInstructionsHidden = false;

function main() {
  _state = 0; // loading
  const handTrackerCanvas = document.getElementById('handTrackerCanvas');
  const VTOCanvas = document.getElementById('VTOCanvas');
  setFullScreen(handTrackerCanvas);
  setFullScreen(VTOCanvas);

  HandTrackerThreeHelper.init({
    landmarksStabilizerSpec: _settings.stabilizerOptions,
    scanSettings: { translationScalingFactors: [0.3, 0.3, 0.3] },
    stabilizationSettings: { switchNNErrorThreshold: 0.2, NNSwitchMask: { isRightHand: true, isFlipped: false } },
    objectPointsPositionFactors: _settings.objectPointsPositionFactors,
    poseLandmarksLabels: _settings.poseLandmarksLabels,
    NNsPaths: _settings.NNsPaths,
    threshold: _settings.threshold,
    callbackTrack: callbackTrack,
    VTOCanvas: VTOCanvas,
    videoSettings: { facingMode: 'user' },
    handTrackerCanvas: handTrackerCanvas,
    debugDisplayLandmarks: _settings.debugDisplayLandmarks,
  }).then(start).catch(err => { throw new Error(err); });
}

function start(three) {
  setup_lighting(three);
  three.loadingManager.onLoad = function() {
    console.log('INFO in main.js: All THREE.js stuffs are loaded');
    hide_loading();
    _state = 2; // running
  }
  add_softOccluder().then(() => {
    _state = 1; // idle
    load_model(three.loadingManager);
  });
}

// 其余函数定义如 setup_lighting, load_model, add_softOccluder, hide_loading, hide_instructions, setFullScreen, callbackTrack 等保持不变

window.addEventListener('load', main);
