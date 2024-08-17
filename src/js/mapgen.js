/// <reference path="../../babylon.d.ts" />
// Each room contains:
// x, y, w, h
// s: [child_0, child_1], maybe empty if open node
// g: optional root parent
// W: wall segments (maybe undefined)
// R: true if reachable, undefined otherwise
// n: [corridor, ...] (up to 4 corridors)
// N: [{x, y}, ...] (as many as neighbors, connection points to them for pathing)


// Corridors are simpler:
// x, y, w, h
// T: 0 if horizontal, 1 if vertical, 2 if middle segment
// n: [room, ...] (an arbitrary number of rooms)
// c: [corridor, ...] (up to 4 corridors)
// N: [{x, y}, ...] (as many as rooms, connection points to them for pathing)
// C: [{x, y}, ...] (as many as corridors, connection points to them for pathing)

// Returns 0.5 if the partition cannot be split further
// Otherwise, returns clamping for random factor (ret and 1.0 - ret)
// such that both generated rooms have minimum side greater than minside
function size_final(op, hor, minside) {
	return minside / (hor ? op.h : op.w);
}

function find_open(root) {
	let out = [];
	if (root.s.length != 0) {
		for (const o of find_open(root.s[0])) { out.push(o); }
		for (const o of find_open(root.s[1])) { out.push(o); }
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
		for (const op of open) {
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

// Exploits the binary tree for a fast search
// pos is {x: x, y: z} (ie. it's in map coordinates)
// NEVER RETURNS CORRIDORS!
function find_containing_room(r, pos) {
	if(pos.x >= r.x && pos.y >= r.y && pos.x <= r.x + r.w && pos.y <= r.y + r.h) {
		if(r.s.length != 0) {
			for(const c of r.s) {
				let a = find_containing_room(c, pos);
				if(a) { return a; }
			}
		} else {
			return r;
		}
	}
	return null;
}

function find_containing_corridor(root, pos) {
	for(const r of root.C) {
		if(pos.x >= r.x && pos.y >= r.y && pos.x <= r.x + r.w && pos.y <= r.y + r.h) {
			return r;
		}
	}
	return null;
}

function find_containing(root, pos) {
	const corr = find_containing_corridor(root, pos);
	if(corr) { return corr; }
	return find_containing_room(root, pos);
}

function debug_connectivity(root) {
	const mat = new BABYLON.StandardMaterial("debug");
	mat.emissiveColor = new BABYLON.Color3(1.0, 0.0, 1.0);
	for(const c of root.C) {
		for(let a = 0; a < c.C.length; a++)
		{
			const points = [];
			points.push(new BABYLON.Vector3(c.x + c.w * 0.5, 1.0, -(c.y + c.h * 0.5)));
			points.push(new BABYLON.Vector3(c.C[a].x, 1.0, -c.C[a].y));
			const line = BABYLON.MeshBuilder.CreateLines("l", {points: points});
			line.material = mat;
		}
		for(let a = 0; a < c.N.length; a++)
		{
			const points = [];
			points.push(new BABYLON.Vector3(c.x + c.w * 0.5, 1.0, -(c.y + c.h * 0.5)));
			points.push(new BABYLON.Vector3(c.N[a].x, 1.0, -c.N[a].y));
			const line = BABYLON.MeshBuilder.CreateLines("l", {points: points});
			line.material = mat;
		}
	}

}


function mapgen(scene, w, h) {
	const root = { s: [], x: 0, y: 0, w: w, h: h };
	const floor = [];
	const wall = [];
	const lights = [];

	var pivot = new BABYLON.TransformNode("rt");

	// Now shrink spaces to make the corridors
	split(root, 15.0, 0.9, 2);
	let groups = find_open(root);
	const max_x = w - 3.0;
	const max_y = h - 3.0;
	root.C = [];
	for (const op of groups) {
		op.w -= 3.0;
		op.h -= 3.0;
		
		// We build corridors, as children of root
		// Corridors are built on spaces created by previous substractions
		// One plane for the horizontal
		const planeh = BABYLON.MeshBuilder.CreatePlane("co", { height: 3.0, width: op.w,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		});
		planeh.position.x = (op.x + op.w / 2);
		planeh.position.y = (op.y + op.h + 1.5);
		root.C.push({x: op.x, y: op.y + op.h, w: op.w, h: 3.0, T: 0, n: [], N: [], c: [], C:[]});
		// Another for the vertical
		const planev = BABYLON.MeshBuilder.CreatePlane("co", { height: op.h, width: 3.0,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		});
		planev.position.x = (op.x + op.w + 1.5);
		planev.position.y = (op.y + op.h / 2);
		root.C.push({x: op.x + op.w, y: op.y, w: 3.0, h: op.h, T: 1, n: [], N: [], c: [], C:[]});
		// And another for the left-over rectangular section
		const planec = BABYLON.MeshBuilder.CreatePlane("co", { height: 3.0, width: 3.0,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		});
		planec.position.x = (op.x + op.w + 1.5);
		planec.position.y = (op.y + op.h + 1.5);
		root.C.push({x: op.x + op.w, y: op.y + op.h, w: 3.0, h: 3.0, T: 2, n: [], N: [], c: [], C:[]});


		floor.push(planeh);
		floor.push(planev);
		floor.push(planec);
		
		planeh.parent = pivot;
		planev.parent = pivot;
		planec.parent = pivot;

		// Ceiling for corridor
		const ceilh = planeh.clone();
		const ceilv = planev.clone();
		const ceilc = planec.clone();
		ceilh.parent = pivot;
		ceilv.parent = pivot;
		ceilc.parent = pivot;
		ceilh.position.z = 2.5;
		ceilv.position.z = 2.5;
		ceilc.position.z = 2.5;

		// TODO: Generate corridor endpoints, and prevent the "surrounding" corridor from spawning


		// Similar splitting, but this time for rooms
		split(op, 4.0, 0.5, 2);
	}

	// Pathfinding map generation for corridors
	for(const corr of root.C) {
		if(corr.T == 0) {
			// Check left and right for corridors
			const cl = {x: corr.x - 0.5, y: corr.y + 1.5};
			const cr = {x: corr.x + corr.w + 0.5, y: corr.y + 1.5};
			const corr_l = find_containing_corridor(root, cl);
			const corr_r = find_containing_corridor(root, cr);
			if(corr_l) {corr.c.push(corr_l); corr.C.push(cl); corr_l.c.push(corr); corr_l.C.push(cl);};
			if(corr_r) {corr.c.push(corr_r); corr.C.push(cr); corr_r.c.push(corr); corr_r.C.push(cr);};
		} else if(corr.T == 1) {
			// Check top and bottom for corridors
			const cu = {x: corr.x + 1.5, y: corr.y - 0.5};
			const cd = {x: corr.x + 1.5, y: corr.y + corr.h + 0.5};
			const corr_u = find_containing_corridor(root, cu);
			const corr_d = find_containing_corridor(root, cd);
			if(corr_u) {corr.c.push(corr_u); corr.C.push(cu); corr_u.c.push(corr); corr_u.C.push(cu);};
			if(corr_d) {corr.c.push(corr_d); corr.C.push(cd); corr_d.c.push(corr); corr_d.C.push(cd);};
		}
		// Rectangular segments "inherit" pathing map from the other two, so no need for special cases
	}


	// Generate door locations
	let rooms = find_open(root);
	for (const op of rooms) {
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
		if(dirs[3] || op.y + op.h - max_y >= -.01) {
			// Aditionally generate top wall
			op.W[3].push({x: op.x, y: op.y + op.h, X: op.x + op.w, Y: op.y + op.h});
		}
		
		// The next line counts the number of doors: 0, 1, 2, 3 or 4
		// the higher the number, the rarer the chance of a door (to prevent overloading of doors!)
		// 0 doors (interior rooms) are of course always blocked
		// There's the chance of an exterior room being locked too!
		op.n = [];
		op.N = [];
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
				let mx = start.x + (dx / 2);
				let my = start.y + (dy / 2);
				op.W[dir_idx][0].X = mx - (dx != 0 ? 0.75 : 0);
				op.W[dir_idx][0].Y = my - (dy != 0 ? 0.75 : 0);
				op.W[dir_idx].push({
					x: op.W[dir_idx][0].X + (dx != 0 ? 1.5 : 0),
					y: op.W[dir_idx][0].Y + (dy != 0 ? 1.5 : 0),
					X: ex,
					Y: ey
				});
				op.R = true;

				// Little trick, from center of room to door is approximately perpendicular to door
				// We divide by a large number to prevent huge oversteps
				const px = mx - (op.x + op.w / 2);
				const py = my - (op.y + op.y / 2);
				// Pathfinding map generation: We simply step a bit into the direction of the door
				// and find the corridor that we expect there (this is very naive, but light on code!)
				const np = {x: mx + px * .01, y: my + py * .01}
				const corr = find_containing_corridor(root, np);
				// TODO: What the hell??? This should really never happen, yet it does!
				if(corr) {
					op.n.push(corr);
					op.N.push(np);
					corr.n.push(op);
					corr.N.push(np);
				}
			}
		}
		
	}
	
	// Wall generation, including doors and windows
	// We only generate right-bottom facing walls (except those of corridors)
	let path = [
		new BABYLON.Vector3(0, 0, 0),
		new BABYLON.Vector3(0, 0, 2.5)
	];
	for(const op of rooms) {
		for (let dir_idx = 0; dir_idx < 4; dir_idx++) {
			if(op.W[dir_idx].length == 0) {continue;}

			for(const segment of op.W[dir_idx]) {
				let shape = [];
				shape.push(new BABYLON.Vector3(segment.x, segment.y, 0));
				shape.push(new BABYLON.Vector3(segment.X, segment.Y, 0));
				let ext = BABYLON.MeshBuilder.ExtrudeShape("sh", {
					shape: shape, 
					path: path,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE
				});	
				wall.push(ext);
			}
		}

		// We also export REACHABLE rooms to XR floorplan
		// and a non-floor ceiling
		if(op.R) {
			const plane = BABYLON.MeshBuilder.CreatePlane("fl", { height: op.h, width: op.w ,
				sideOrientation: BABYLON.Mesh.DOUBLESIDE
			});
			plane.position.x = op.x + op.w * 0.5;
			plane.position.y = op.y + op.h * 0.5;
			plane.parent = pivot;
			floor.push(plane);
			op.f = plane;

			const ceil = plane.clone();
			ceil.position.z = 2.5;
			ceil.parent = pivot;
		}
	}

	
	// Rotate all floor and walls so scene is Z-up
	for(const w of wall) {
		w.parent = pivot;
	}

	pivot.rotate(new BABYLON.Vector3(1, 0, 0), -0.5 * Math.PI, BABYLON.Space.WORLD);


	debug_connectivity(root);

	// Place props and enemies


	// Done!

	return [floor, wall, root];

}