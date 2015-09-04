;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.create = function (width, height) {
	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
};

},{}],2:[function(require,module,exports){
var utils = require("./utils");

var components = {};
var prefabs = {};

var entities = [];

exports.init = function (componentData, prefabData) {
	components = componentData;
	prefabs = prefabData;
};

exports.get = function () {
	return entities;
};

exports.trigger = function (entity, method, args) {
	for (var key in entity) {
		var component = components[key];
		if (!component || !component[method]) { continue; }
		component[method].apply(entity, args);
	}
};

exports.triggerAll = function (method, args) {
	for (var i = 0; i < entities.length; ++i) {
		exports.trigger(entities[i], method, args);
	}
};

exports.add = function (entity) {
	entities.push(entity);
	// exports.trigger(entity, "add");
	return entity;
};

exports.spawn = function (key) {
	// TODO: Handle missing prefab key
	var entity = utils.clone(prefabs[key]);
	return exports.add(entity);
};

},{"./utils":7}],3:[function(require,module,exports){
var stage = require("./stage");
var time = require("./time");
var entities = require("./entities");
var tween = require("./tween");

var keys = {};

var scenes = {};
var activeScene = null;

var camera = {
	x: 0, y: 0, width: 0, height: 0
};

var followTarget = null;

var update = function (dt) {
	activeScene.update(dt, keys);
	entities.triggerAll("update", [dt, keys]);
	tween.update(dt);

	if (followTarget) {
		camera.x = Math.round(followTarget.transform.x - camera.width / 2);
		camera.y = Math.round(followTarget.transform.y - camera.height / 2);
	}

	stage.render(camera);
};

var keydown = function (e) {
	keys[e.keyCode] = true;
};

var keyup = function (e) {
	keys[e.keyCode] = false;
};

exports.init = function (config) {
	camera.width = config.width;
	camera.height = config.height;
	stage.init(camera.width, camera.height);
	scenes = config.scenes;
	entities.init(config.components, config.prefabs);

	window.addEventListener("keydown", keydown, false);
	window.addEventListener("keyup", keyup, false);
};

exports.loadScene = function (key) {
	activeScene = scenes[key];
	activeScene.start();
};

exports.start = function () {
	time.start(update);
};

exports.setCameraFollowTarget = function (entity) {
	followTarget = entity;
};

},{"./entities":2,"./stage":4,"./time":5,"./tween":6}],4:[function(require,module,exports){
var canvas = require("./canvas");
var entities = require("./entities");

var stage;
var ctx;

var resize = function () {
	var clientWidth = window.innerWidth;
	var clientHeight = window.innerHeight;
	var ratioX = clientWidth / stage.width;
	var ratioY = clientHeight / stage.height;
	var scale = Math.min(ratioX, ratioY);

	var style = stage.style;
	style.position = "absolute";
	style.transformOrigin = "0 0";
	style.transform = "scale(" + scale + "," + scale + ")";
	style.left = Math.round(clientWidth / 2 - (stage.width * scale) / 2) + "px";
	style.top = Math.round(clientHeight / 2 - (stage.height * scale) / 2) + "px";
};

exports.init = function (width, height) {
	stage = canvas.create(width, height);
	document.body.appendChild(stage);
	ctx = stage.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	resize();
	window.addEventListener("resize", resize, false);
};

exports.clear = function (fill) {
	ctx.fillStyle = fill;
	ctx.fillRect(0, 0, stage.width, stage.height);
};

exports.render = function (camera) {
	this.clear("dodgerblue");

	var list = entities.get();
	for (var i = 0; i < list.length; ++i) {
		var entity = list[i];
		ctx.save();
		entities.trigger(entity, "render", [ctx, camera]);
		ctx.restore();
	}
};

},{"./canvas":1,"./entities":2}],5:[function(require,module,exports){
var threshold = 100;
var last = 0;
var onUpdate;

var update = function (time) {
	delta = time - last;
	last = time;
	if (delta <= threshold && onUpdate) {
		onUpdate(delta);
	}
	requestAnimationFrame(update);
};

exports.start = function (callback) {
	onUpdate = callback;
	update(0);
};

},{}],6:[function(require,module,exports){
var easing = require("./utils/easing");
var math = require("./utils/math");

var tweens = [];

exports.create = function (target, to, duration, delay, ease) {
	var from = {};
	for (var key in to) {
		from[key] = target[key];
	}
	tweens.push({
		target: target,
		from: from,
		to: to,
		duration: duration,
		delay: delay || 0,
		ease: ease || "linear",
		elapsed: 0
	});
};

exports.update = function (dt) {
	for (var i = tweens.length - 1; i >= 0; --i) {
		var tween = tweens[i];
		if (tween.delay > 0) {
			tween.delay -= dt;
		} else {
			tween.elapsed = Math.min(tween.elapsed + dt, tween.duration);
			var normal = tween.elapsed / tween.duration;
			for (var key in tween.to) {
				tween.target[key] = math.lerp(
					tween.from[key],
					tween.to[key],
					easing[tween.ease](normal)
				);
			}
			if (tween.elapsed >= tween.duration) {
				tweens.splice(i, 1);
			}
		}
	}
};

},{"./utils/easing":8,"./utils/math":9}],7:[function(require,module,exports){
exports.clone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

},{}],8:[function(require,module,exports){
exports.linear = function (k) {
	return k;
};

exports.quadIn = function (k) {
	return k * k;
};

exports.quadOut = function (k) {
	return k * (2 - k);
};

exports.quadInOut = function (k) {
	return k < 0.5 ? exports.quadIn(k) : exports.quadOut(k);
};

exports.sineIn = function (k) {
	if (k === 1) { return 1; }
	return 1 - Math.cos(k * Math.PI / 2);
};

exports.sineOut = function (k) {
	return Math.sin(k * Math.PI / 2);
};

exports.sineInOut = function (k) {
	return 0.5 * (1 - Math.cos(Math.PI * k));
};

},{}],9:[function(require,module,exports){
exports.tau = Math.PI * 2;

exports.lerp = function (a, b, t) {
	return a + ((b - a) * t);
};

},{}],10:[function(require,module,exports){
var game = require("../../lib/ocelot");

},{"../../lib/ocelot":3}]},{},[10])
;