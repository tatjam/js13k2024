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

function mapgen(w, h) {
	const root = { s: [], x: 0, y: 0, w: w, h: h };

	let finished = false;
	// We start splitting horizontally
	let hor = true;
	while (!finished) {
		let split_any = false;
		let open = find_open(root);
		for (op of open) {
			// Split 
			// Constant is minimum partition size
			let spl_lim = size_final(op, hor, 5.0);
			if (spl_lim < 0.5) {
				let nw1, nh1, nw2, nh2 = 0.0;
				let spl = clamp(Math.random(), spl_lim, 1.0 - spl_lim);
				if (hor) {
					nw1 = op.w;
					nw2 = op.w;
					nh1 = op.h * spl;
					nh2 = op.h - nh1;
				} else {
					nh1 = op.h;
					nh2 = op.h;
					nw1 = op.w * spl;
					nw2 = op.w - nw1;
				}
				op.s.push({ s: [], x: op.x, y: op.y, w: nw1, h: nh1 });
				op.s.push({ s: [], x: op.x + nw1, y: op.y + nh1, w: nw2, h: nh2 });
				split_any = true;
			} else {
			}
		}

		if (!split_any) {
			finished = true;
		}
		hor = !hor;
	}

	console.log(root);
}