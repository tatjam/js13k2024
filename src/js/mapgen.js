// Idea of the algorithm:
//
// CORRIDOR GENERATION:
// Start with a rectangle (floorplan of the building)
// Binary partition switching directions. Each partition line
// 	is a corridor
// Once the partitions are small enough, don't partition them further
// Once no partition remains, move onto room generation
// (Mark big partitions as outdoor space, for interior patios)
//
// ROOM GENERATION:
// Partition each room with walls, allowing smaller partitions than before
//
// DOOR GENERATION:
// Run until all rooms have (atleast) one door
// If a room leads into a corridor and has no doors, place a door to the corridor
// If a room doesn't lead into any corridor, and has no doors, place a door to other room
// If a room leads into an exterior, add a window (ALWAYS)

// Data structures:
//
// Mesh generation:
// Extrude walls upwards as a line (two-sided)
// Doors are two walls with a hole in between where the door "model" goes
// Windows are 90º rotated doors in essence, and can see outside the building (Simple VFX or real geom?)

// Returns 0.5 if the partition cannot be split further
// Otherwise, returns clamping for random factor (ret and 1.0 - ret)
// such that both generated rooms have minimum side greater than minside
// SIZE: Maybe inlined?
function size_final(op, hor, minside) {
	return minside / (hor ? op.h : op.w);
}

function find_open(root) {
	let out = [];
	if (root.s.length != 0) {
		for (o of find_open(root.s[0])) { out.push(o); }
		for (o of find_open(root.s[1])) { out.push(o); }
	} else {
		out.push(root);
	}

	return out;
}

function clamp(num, mi, ma) {
	return num <= mi ? mi : num >= ma ? ma : num;
}

function split(root, min_size) {

	let finished = false;
	// We start splitting horizontally
	let hor = true;
	let it = 0;
	while (!finished) {
		let split_any = false;
		let open = find_open(root);
		for (op of open) {
			// Split 
			// Constant is minimum partition size
			let spl_lim = size_final(op, hor, min_size);
			if (Math.random() >= 0.8 && it > 3) {
				op.b = true;
			}
			if (spl_lim < 0.5 && op.b === undefined) {
				let nw1, nh1, nw2, nh2 = 0.0;
				let spl = clamp(Math.random(), spl_lim, 1.0 - spl_lim);
				if (hor) {
					nw1 = op.w;
					nw2 = op.w;
					nh1 = op.h * spl;
					nh2 = op.h - nh1;
					op.s.push({ s: [], x: op.x, y: op.y, w: nw1, h: nh1 });
					op.s.push({ s: [], x: op.x, y: op.y + nh1, w: nw2, h: nh2 });
				} else {
					nh1 = op.h;
					nh2 = op.h;
					nw1 = op.w * spl;
					nw2 = op.w - nw1;
					op.s.push({ s: [], x: op.x, y: op.y, w: nw1, h: nh1 });
					op.s.push({ s: [], x: op.x + nw1, y: op.y, w: nw2, h: nh2 });
				}
				split_any = true;
			}
		}

		if (!split_any) {
			finished = true;
		}
		it++;
		hor = !hor;
	}
}

function debug_draw(scene, node) {
	let open = find_open(node);
	for (op of open) {
		const plane = BABYLON.MeshBuilder.CreatePlane("plane", { height: op.h * 0.01, width: op.w * 0.01 });
		plane.enableEdgesRendering();
		plane.edgesWidth = 0.1;
		// position of the center!
		plane.position.x = op.x * 0.01 + op.w * 0.01 * 0.5;
		plane.position.y = op.y * 0.01 + op.h * 0.01 * 0.5;
	}
}

function mapgen(scene, w, h) {
	const root = { s: [], x: 0, y: 0, w: w, h: h };

	// Now shrink spaces to make the corridors
	split(root, 10.0);
	debug_draw(scene, root);

	// Similar splitting, but this time for rooms

	// Wall generation, including doors and windows

	// Place props and enemies

	// Done!

	console.log(root);
}