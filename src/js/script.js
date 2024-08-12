// script
const canvas = document.getElementById("c"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var createScene = function () {
	var scene = new BABYLON.Scene(engine);
	var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
	var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;
	var sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
	sphere.position.y = 1;

	const env = scene.createDefaultEnvironment();

	// here we add XR support
	const xr = scene.createDefaultXRExperienceAsync({
		floorMeshes: [env.ground],
	});


	return scene;
};

const scene = createScene(); //Call the createScene function
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
	scene.render();
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
	engine.resize();
});