// script
/// <reference path="../../babylon.d.ts" />

const canvas = document.getElementById("c"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var createScene = function () {
	var scene = new BABYLON.Scene(engine);
	scene.createDefaultCamera(true, true, true);
	var light = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	// here we add XR support
	const xr = scene.createDefaultXRExperienceAsync({
		//floorMeshes: [env.ground],
	});

	mapgen(scene, 60, 60);

	return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});