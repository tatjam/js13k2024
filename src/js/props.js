function make_lamp(x, y, room) {
	const box = BABYLON.MeshBuilder.CreateBox("l", { height: 0.1, width: 0.5, depth: 0.5 })
	box.position = new BABYLON.Vector3(x, 1.5, -y);
	const light = new BABYLON.PointLight("l", new BABYLON.Vector3(x, 1.5, -y));

	light.includedOnlyMeshes = room.M
}