/// <reference path="../../babylon.d.ts" />

// Recursive
function corridor_path(start, end, path, visited) {
	visited.push(start);

	// Check if any of start's neighbors are end
	for(const n of start) {
		if(n == end) {
			// Done!
			return true;
		}
	}
	for(const c of start) {
		if(c == end) {
			// Done!
			return true;
		}
	}

	// Otherwise, recurse
	for(const c of start) {
		// If unvisited, explore the corridor
		if(!visited.includes(c)) {
			const npath = path.slice(0);
			if(corridor_path(start, end, npath, visited)) {
				return npath;
			}
		}
	}

	return false;
}

function path_from_to(map, cur_pos, target_pos) {
	const start = find_containing(map, cur_pos);
	if(!start) return [];
	const end = find_containing(map, target_pos);
	if(!end) return [];
	if(start == end) return [];
	
	const path = [start];
	const visited = [];
	if('s' in start)
	{
		// We are a room, first step is just go into one of its corridors (random one)
		path.push(array[Math.floor(Math.random() * start.n.length)]);
	}

	// Now surely path [path.length - 1] is a corridor, path through them
	corridor_path(path[path.length - 1], end, path, visited);

	return path;
}