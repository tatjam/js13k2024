// Returns 0.5 if the partition cannot be split further
// Otherwise, returns clamping for random factor (ret and 1.0 - ret)
// such that both generated rooms have minimum side greater than minside
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

function split(root, min_size, prob, itv) {

	let finished = false;
	// We start splitting horizontally
	let hor = true;
	let it = 0;
	while (!finished) {
		let split_any = false;
		let open = find_open(root);
		for (op of open) {
			op.g = root;
			// Split 
			// Constant is minimum partition size
			let spl_lim = size_final(op, hor, min_size);
			if (Math.random() >= prob && it > itv) {
				op.b = true;
			}
			if (spl_lim < 0.5 && op.b === undefined) {
				let nw1, nh1, nw2, nh2;
				let spl = clamp(Math.random(), spl_lim, 1.0 - spl_lim);
				if (hor) {
					nw1 = op.w;
					nw2 = op.w;
					nh1 = op.h * spl;
					nh2 = op.h - nh1;
					op.s.push({ s: [], x: op.x, y: op.y, w: nw1, h: nh1, g: root });
					op.s.push({ s: [], x: op.x, y: op.y + nh1, w: nw2, h: nh2, g: root });
				} else {
					nh1 = op.h;
					nh2 = op.h;
					nw1 = op.w * spl;
					nw2 = op.w - nw1;
					op.s.push({ s: [], x: op.x, y: op.y, w: nw1, h: nh1, g: root });
					op.s.push({ s: [], x: op.x + nw1, y: op.y, w: nw2, h: nh2, g: root });
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
		const plane = BABYLON.MeshBuilder.CreatePlane("plane", { height: op.h * 0.01, width: op.w * 0.01 ,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		});
		if (op.D === true) {
			plane.edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());
		}
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
	split(root, 15.0, 0.9, 2);
	let groups = find_open(root);
	const max_x = w - 3.0;
	const max_y = h - 3.0;
	for (op of groups) {
		op.w -= 3.0;
		op.h -= 3.0;

		// Similar splitting, but this time for rooms
		split(op, 4.0, 0.5, 2);
	}

	// TODO: Corridor floorplan: Simply spaces created by previous substractions

	// Generate door locations
	let rooms = find_open(root);
	console.log("GUamedo!");
	for (op of rooms) {
		var dirs = [false, false, false, false];
		// TODO: These float comparisons could lead to trouble, use epsilons!
		// A edge leads to a corridor if it matches an edge in its parent group

		// left corridor
		dirs[0] = op.x == op.g.x && op.g.x >= 0.1;
		// bottom corridor
		dirs[1] = op.y == op.g.y && op.g.y >= 0.1;
		// right corridor
		dirs[2] = op.x + op.w == op.g.x + op.g.w && op.x + op.w != max_x;
		// top corridor
		dirs[3] = op.y + op.h == op.g.y + op.g.h && op.y + op.h != max_y;

		// Generate default, full walls for right-bottom (by default)
		op.W = [
			[],
			[{x: op.x, y: op.y, X: op.x + op.w, Y: op.y}], 
			[{x: op.x + op.w, y: op.y, X: op.x + op.w, Y: op.y + op.h}], 
			[]
		];
		if(dirs[0] || op.x == 0.0 ) {
			// Aditionally generate left wall
			op.W[0].push({x: op.x, y: op.y, X: op.x, Y: op.y + op.h});
		}
		if(dirs[3] || op.y + op.h == max_y) {
			// Aditionally generate top wall
			op.W[3].push({x: op.x, y: op.y + op.h, X: op.x + op.w, Y: op.y + op.h});
		}
		
		// The next line counts the number of doors: 0, 1, 2, 3 or 4
		// the higher the number, the rarer the chance of a door (to prevent overloading of doors!)
		// 0 doors (interior rooms) are of course always blocked
		// There's the chance of an exterior room being locked too!
		var num_doors = dirs.filter(x => x).length;
		for (let dir_idx = 0; dir_idx < 4; dir_idx++) {
			if (Math.random() >= num_doors / (num_doors + 0.6)) {
				if(op.W[dir_idx].length == 0) {continue;}
				if(!dirs[dir_idx]) {continue; }

				let start = op.W[dir_idx][0]
				// We split the wall with the door, we can do it generically using some vector logic
				// SIZE: Maybe duplicating ourselves can be better? (Deflate!)
				let ex = start.X;
				let ey = start.Y;
				let dx = start.X - start.x;
				let dy = start.Y - start.y;
				op.W[dir_idx][0].X = start.x + (dx / 2) - (dx != 0 ? 0.75 : 0);
				op.W[dir_idx][0].Y = start.y + (dy / 2) - (dy != 0 ? 0.75 : 0);
				op.W[dir_idx].push({
					x: op.W[dir_idx][0].X + (dx != 0 ? 1.5 : 0),
					y: op.W[dir_idx][0].Y + (dy != 0 ? 1.5 : 0),
					X: ex,
					Y: ey
				});
			}
		}
		
	}

	// TODO: Maybe generate doors into other rooms? (Increase chance of no corridor room then)

	debug_draw(scene, root);

	// Wall generation, including doors and windows
	// We only generate right-bottom facing walls (except those of corridors)
	let path = [
		new BABYLON.Vector3(0, 0, 0),
		new BABYLON.Vector3(0, 0, 0.1)
	];
	for(op of rooms) {
		for (let dir_idx = 0; dir_idx < 4; dir_idx++) {
			if(op.W[dir_idx].length == 0) {continue;}

			for(segment of op.W[dir_idx]) {
				let shape = [];
				shape.push(new BABYLON.Vector3(segment.x * 0.01, segment.y * 0.01, 0));
				shape.push(new BABYLON.Vector3(segment.X * 0.01, segment.Y * 0.01, 0));
				let ext = BABYLON.MeshBuilder.ExtrudeShape("sh", {
					shape: shape, 
					path: path,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE
				});	
			}
		}
	}

	// Place props and enemies

	// Done!

}