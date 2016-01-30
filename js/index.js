'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function TimeToStr(timeMili) {
  var secondsTotal = Math.floor(timeMili / 1000);
  var minutes = Math.floor(secondsTotal / 60);
  var seconds = secondsTotal - 60 * minutes;
  return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

var alt = new Alt();

var TimerActions = (function () {
  function TimerActions() {
    _classCallCheck(this, TimerActions);
  }

  TimerActions.prototype.start = function start() {
    return {};
  };

  TimerActions.prototype.pause = function pause() {
    return {};
  };

  TimerActions.prototype.reset = function reset() {
    return {};
  };

  TimerActions.prototype.updateWorkTime = function updateWorkTime(minutes) {
    return minutes;
  };

  TimerActions.prototype.updateRestTime = function updateRestTime(minutes) {
    return minutes;
  };

  TimerActions.prototype.updateTick = function updateTick() {
    return {};
  };

  return TimerActions;
})();

;

var actions = alt.createActions(TimerActions);

var TimerState = {
  INIT: 1,
  STARTED: 2,
  PAUSED: 3
};

var TimeType = {
  WORK: 1,
  REST: 2
};

var TimerStore = (function () {
  function TimerStore() {
    _classCallCheck(this, TimerStore);

    this.maxMinutes = 99;
    this.minMinutes = 1;
    this.minutesWork = 25;
    this.minutesRest = 5;
    this.playSound = false;
    this.timeLeft = this.minutesWork * 60 * 1000;
    this.lastUpdate = null;
    this.timerState = TimerState.INIT;
    this.timeType = TimeType.WORK;
    this.bindListeners({
      handleStart: actions.START,
      handlePause: actions.PAUSE,
      handleReset: actions.RESET,
      handleUpdateWorkTime: actions.UPDATE_WORK_TIME,
      handleUpdateRestTime: actions.UPDATE_REST_TIME,
      handleUpdateTick: actions.UPDATE_TICK
    });
    this.exportPublicMethods({
      getTimerState: this.getTimerState
    });
  }

  TimerStore.prototype.handleStart = function handleStart() {
    if (this.timerState == TimerState.INIT || this.timerState == TimerState.PAUSED) {
      this.timerState = TimerState.STARTED;
      this.lastUpdate = Date.now();
    }
  };

  TimerStore.prototype.handlePause = function handlePause() {
    if (this.timerState == TimerState.STARTED) {
      this.timerState = TimerState.PAUSED;
    }
  };

  TimerStore.prototype.handleReset = function handleReset() {
    if (this.timerState == TimerState.STARTED || this.timerState == TimerState.PAUSED) {
      this.timeLeft = this.minutesWork * 60 * 1000;
      this.lastUpdate = null;
      this.timerState = TimerState.INIT;
      this.timeType = TimeType.WORK;
    }
  };

  TimerStore.prototype.handleUpdateWorkTime = function handleUpdateWorkTime(minutes) {
    this.minutesWork = Math.min(Math.max(this.minutesWork + minutes, this.minMinutes), this.maxMinutes);
    if (this.timerState == TimerState.INIT) {
      this.timeLeft = this.minutesWork * 60 * 1000;
    }
  };

  TimerStore.prototype.handleUpdateRestTime = function handleUpdateRestTime(minutes) {
    this.minutesRest = Math.min(Math.max(this.minutesRest + minutes, this.minMinutes), this.maxMinutes);
  };

  TimerStore.prototype.handleUpdateTick = function handleUpdateTick() {
    if (this.timerState == TimerState.STARTED) {
      var newDate = Date.now();
      var timeDelta = newDate - this.lastUpdate;
      this.timeLeft -= timeDelta;
      this.lastUpdate = newDate;
      if (this.timeLeft <= 0) {
        this.playSound = true;
        if (this.timeType == TimeType.WORK) {
          this.timeType = TimeType.REST;
          this.timeLeft = this.minutesRest * 60 * 1000;
        } else {
          this.timeType = TimeType.WORK;
          this.timeLeft = this.minutesWork * 60 * 1000;
        }
      }
    }
  };

  TimerStore.prototype.getTimerState = function getTimerState() {
    return this.timerState;
  };

  return TimerStore;
})();

;

var store = alt.createStore(TimerStore, 'TimerStore');

var StartPauseButton = React.createClass({
  displayName: 'StartPauseButton',

  getInitialState: function getInitialState() {
    return store.getState();
  },
  componentDidMount: function componentDidMount() {
    store.listen(this.stateChanged);
  },
  stateChanged: function stateChanged(state) {
    this.setState(state);
  },
  render: function render() {
    var text = this.state.timerState == TimerState.STARTED ? "Pause" : "Start";
    return React.createElement('input', { type: 'button',
      onClick: this.clickHandler,
      value: text });
  },
  clickHandler: function clickHandler() {
    if (this.state.timerState == TimerState.STARTED) {
      actions.pause();
    } else {
      actions.start();
    }
  }
});

var ResetButton = React.createClass({
  displayName: 'ResetButton',

  render: function render() {
    return React.createElement('input', { type: 'button',
      onClick: this.clickHandler,
      value: 'Reset' });
  },
  clickHandler: function clickHandler() {
    actions.reset();
  }
});

var TimePanel = React.createClass({
  displayName: 'TimePanel',

  getInitialState: function getInitialState() {
    return store.getState();
  },
  componentDidMount: function componentDidMount() {
    store.listen(this.stateChanged);
  },
  stateChanged: function stateChanged(state) {
    this.setState(state);
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
    return TimeToStr(this.state.timeLeft) != TimeToStr(nextState.timeLeft);
  },
  render: function render() {
    var status = this.state.timeType == TimeType.WORK ? "Work" : "Break";
    return React.createElement(
      'div',
      null,
      React.createElement(
        'p',
        { className: 'time-type-label' },
        status + ": "
      ),
      React.createElement(
        'p',
        { className: 'time-value' },
        TimeToStr(this.state.timeLeft)
      )
    );
  }
});

var TimerControlPanel = React.createClass({
  displayName: 'TimerControlPanel',

  render: function render() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        null,
        React.createElement(StartPauseButton, null),
        React.createElement(ResetButton, null)
      ),
      React.createElement(TimePanel, null)
    );
  }
});

var UpdateTimeButton = React.createClass({
  displayName: 'UpdateTimeButton',

  render: function render() {
    return React.createElement('input', { type: 'button',
      onClick: this.clickHandler,
      value: this.props.value });
  },
  clickHandler: function clickHandler() {
    var value = parseInt(this.props.value);
    if (this.props.type == TimeType.WORK) {
      actions.updateWorkTime(value);
    } else {
      actions.updateRestTime(value);
    }
  }
});

var TimerSettigsPanel = React.createClass({
  displayName: 'TimerSettigsPanel',

  getInitialState: function getInitialState() {
    return store.getState();
  },
  componentDidMount: function componentDidMount() {
    store.listen(this.stateChanged);
  },
  stateChanged: function stateChanged(state) {
    this.setState(state);
  },
  render: function render() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          { className: 'setting-type-label' },
          'Work time: '
        ),
        React.createElement(
          'div',
          null,
          React.createElement(UpdateTimeButton, { value: '+5', type: TimeType.WORK }),
          React.createElement(UpdateTimeButton, { value: '+1', type: TimeType.WORK }),
          React.createElement(
            'p',
            { className: 'setting-value' },
            this.state.minutesWork
          ),
          React.createElement(UpdateTimeButton, { value: '-1', type: TimeType.WORK }),
          React.createElement(UpdateTimeButton, { value: '-5', type: TimeType.WORK })
        )
      ),
      React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          { className: 'setting-type-label' },
          'Break time: '
        ),
        React.createElement(
          'div',
          null,
          React.createElement(UpdateTimeButton, { value: '+5', type: TimeType.REST }),
          React.createElement(UpdateTimeButton, { value: '+1', type: TimeType.REST }),
          React.createElement(
            'p',
            { className: 'setting-value' },
            this.state.minutesRest
          ),
          React.createElement(UpdateTimeButton, { value: '-1', type: TimeType.REST }),
          React.createElement(UpdateTimeButton, { value: '-5', type: TimeType.REST })
        )
      )
    );
  }
});

React.render(React.createElement(TimerControlPanel, null), document.getElementById('timer-control-panel'));

React.render(React.createElement(TimerSettigsPanel, null), document.getElementById('timer-settings-panel'));

var camera, scene, renderer, geometry, material, mesh, light;
var progressMesh;
var width = 300;
var height = 300;
var arc = 2;
var progressDelta = -0.01;
var modelBasePath = "https://raw.githubusercontent.com/kwetril/pomodoro-clock/master/tomato-model/";

var init = function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x3e2723, 0);
  renderer.setSize(width, height);
  $("#pomodoro").append(renderer.domElement);

  var tgeometry = new THREE.TorusGeometry(3.3, 0.3, 50, 100, 6);
  var tmaterial = new THREE.MeshLambertMaterial({ color: 0x1b6e20, shading: THREE.FlatShading });
  progressMesh = new THREE.Mesh(tgeometry, tmaterial);
  progressMesh.rotation.z = Math.PI / 2;
  scene.add(progressMesh);

  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 2);
  scene.add(light);

  geometry = new THREE.BoxGeometry(1, 1, 1);
  material = new THREE.MeshBasicMaterial({
    color: 0xffff00
  });
  camera.position.z = 6;
  var jsonLoader = new THREE.JSONLoader();
  THREE.ImageUtils.crossOrigin = '';
  var tex = THREE.ImageUtils.loadTexture(modelBasePath + 'Tomato_texture.png', null, function () {
    material = new THREE.MeshBasicMaterial({
      map: tex
    });
    jsonLoader.load(modelBasePath + "Tomato.js", function (geometry) {
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -1.7, 0));
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      render();
    });
  });
};

var render = function render() {
  requestAnimationFrame(render);
  if (store.state.timerState == TimerState.STARTED) {
    mesh.rotation.x += 0.05;
    mesh.rotation.y += 0.04;
    updateProgress();
  } else if (store.state.timerState == TimerState.INIT) {
    mesh.rotation.x = 0.0;
    mesh.rotation.y = 0.0;
    updateProgress();
  }
  renderer.render(scene, camera);
};

var updateProgress = function updateProgress() {
  var progressGeometry = progressMesh.geometry;
  var params = progressGeometry.parameters;
  progressGeometry.verticesNeedUpdate = true;

  var timeLeft = store.state.timeLeft;
  if (store.state.timerState == TimerState.STARTED) {
    if (store.state.timeType == TimeType.WORK) {
      progressMesh.rotation.y = 0;
      var maxTime = store.state.minutesWork * 60 * 1000;
      params.arc = timeLeft / maxTime * 2 * Math.PI;
    } else {
      progressMesh.rotation.y = Math.PI;
      var maxTime = store.state.minutesRest * 60 * 1000;
      params.arc = (1 - timeLeft / maxTime) * 2 * Math.PI;
    }
  } else if (store.state.timerState == TimerState.INIT) {
    if (params.arc == 2 * Math.PI) {
      return;
    }
    params.arc = 2 * Math.PI;
  } else {
    return;
  }

  var center = new THREE.Vector3(),
      uvs = [],
      normals = [];
  var index = -1;
  for (var j = 0; j <= params.radialSegments; j++) {
    for (var i = 0; i <= params.tubularSegments; i++) {
      index++;
      var u = i / params.tubularSegments * params.arc;
      var v = j / params.radialSegments * Math.PI * 2;

      center.x = params.radius * Math.cos(u);
      center.y = params.radius * Math.sin(u);

      var vertex = new THREE.Vector3();
      progressGeometry.vertices[index].x = (params.radius + params.tube * Math.cos(v)) * Math.cos(u);
      progressGeometry.vertices[index].y = (params.radius + params.tube * Math.cos(v)) * Math.sin(u);
      progressGeometry.vertices[index].z = params.tube * Math.sin(v);
    }
  }
};

init();

var wav = 'http://www.harbormodels.com/site08/audio/diesel_v1_bells.mp3';
var audio = new Audio(wav);
setInterval(function () {
  if (store.state.timerState == TimerState.STARTED) {
    actions.updateTick();
  }
  if (store.state.playSound) {
    audio.play();
    store.state.playSound = false;
  }
}, 30);

$(document).ready(function () {
  $('#timer-settings-label').click(function () {
    var icon = $("#timer-settings-label i.glyphicon");
    icon.addClass('rotate');
    if ($("#timer-settings-panel").is(":hidden")) {
      $("#timer-settings-panel").slideDown(500, function () {
        console.log(icon);
        icon.removeClass('rotate');
        $("html, body").animate({ scrollTop: $(document).height() }, "slow");
      });
    } else {
      $("#timer-settings-panel").slideUp(500, function () {
        icon.removeClass('rotate');
      });
    }
  });
});