// script
/// <reference path="../../babylon.d.ts" />

const canvas = document.getElementById("c"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var createScene = function () {
	mapgen(50, 50);
	var scene = new BABYLON.Scene(engine);
	scene.createDefaultCamera(false, true, true);
	var light = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	const env = scene.createDefaultEnvironment();

	// here we add XR support
	const xr = scene.createDefaultXRExperienceAsync({
		floorMeshes: [env.ground],
	});

	return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});