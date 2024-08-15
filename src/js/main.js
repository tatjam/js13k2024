// script
/// <reference path="../../babylon.d.ts" />

const canvas = document.getElementById("c"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var createScene = function () {
	var scene = new BABYLON.Scene(engine);
	scene.createDefaultCamera(true, true, true);
	var light = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;
	
	const [floor, wall] = mapgen(scene, 60, 60);

	// here we add XR support
	const xr = scene.createDefaultXRExperienceAsync({
		floorMeshes: floor,
	}).then(experience => {
		for(w of wall) {
			experience.teleportation.addBlockerMesh(w);
		}
	});

    // Create SSAO and configure all properties (for the example)
    var ssaoRatio = {
        ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
        combineRatio: 1.0 // Ratio of the combine post-process (combines the SSAO and the scene)
    };

    var ssao = new BABYLON.SSAORenderingPipeline("ssao", scene, ssaoRatio);
    ssao.fallOff = 0.000001;
    ssao.area = 0.0075;
    ssao.radius = 0.001;
    ssao.totalStrength = 1.0;
    ssao.base = 0.5;

    // Attach camera to the SSAO render pipeline
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", scene.activeCamera);

	return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});