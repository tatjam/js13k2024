// script
/// <reference path="../../babylon.d.ts" />

const canvas = document.getElementById("c"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var createScene = function () {
	var scene = new BABYLON.Scene(engine);
	var cam = new BABYLON.FlyCamera("FlyCamera", new BABYLON.Vector3(0, 5, -10), scene);
	cam.attachControl(canvas, true);
	var light = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 1, 0), scene);
	light.groundColor = new BABYLON.Color3(1.0, 1.0, 1.0);
	light.intensity = 0.1;

	scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
	scene.clearColor = new BABYLON.Color4(0.3, 0.15, 0.12, 1.0);
	scene.fogColor = scene.clearColor;

	const [floor, wall, root, npcs, doors, props] = mapgen(60, 60);

	// here we add XR support
	const xr = scene.createDefaultXRExperienceAsync({
		floorMeshes: floor,
	}).then(experience => {
		for (w of wall) {
			experience.teleportation.addBlockerMesh(w);
			//experience.teleportation.onAfterCameraTeleport
			experience.teleportation.backwardsMovementEnabled = false;
		}
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