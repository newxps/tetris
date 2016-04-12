
let layout = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]

let 亠 = [
		[32, 112], [32, 48, 32], [0, 112, 32], [32, 96, 32]
	];

let L = [
		[32, 32, 48], [0, 112, 64], [96, 32, 32], [0, 16, 112]
	]

let m_L = [
		[32, 32, 96], [64, 112], [48, 32, 32], [0, 112, 16]
	]

let 田 = [[48, 48]]

let z = [
		[96, 48], [16, 48, 32]
	]

let m_z = [
		[48, 96], [32, 48, 16]
	]


let l = [[32, 32, 32, 32], [120]]

let tiles = [亠, 亠, L, m_L, 田, z, m_z, l, l];

let stage = document.getElementById('stage');

let tile, work, n;			//旋转轴在第几排

let row, col, delta;

let timer;
function start() {
	delta = 0;
	work = true;
	tile = getRandTile();
	n = -1;
	timer = setInterval(() => {
		if(work) {
			mix(() => {
				n++;
				if(!isAllowed()) {
					n--;
					work = false;
				}
			})
		} else {
			clearInterval(timer);
			if( n <= 0 ) {
				alert('game over!');
			} else {
				for(let i = 0; i < layout.length; i++) {
					if(layout[i] >= 1023) {
						layout.splice(i, 1);
						layout.unshift(0);
					}
				}
				start();
			}
		}
		// console.log(Math.random())
	}, 600);
}

start();

document.onkeydown = (e) => {
	let code = e.keyCode;
	if(code === 37)				//	←
		left();
	else if(code === 38)	//	↑
		up();
	else if(code === 39)	//	→
		right()
	else if(code === 40)	//	↓
		down()
	else if(code === 32)	//	空格
		fall()
}

function mix(fn) {
	if(fn) {
		minus(); fn(); add(); render();
	}
}

function add() {
	let a = tile.length + n;
	if(a < 1 || a > layout.length) return false;
	for(var i = 0; i < tile.length; i++)
		if(i + n >= 0)
			layout[i + n] += tile[i];
}

function minus() {
	let a = tile.length + n;
	if(a < 1 || a > layout.length) return false;
	for(var i = 0; i < tile.length; i++)
		if(i + n >= 0)
			layout[i + n] = Math.max(layout[i + n] - tile[i], 0);
}

function render() {
	let html = ''
	layout.forEach((e, i) =>  html += pad(e.toString(2)).replace(/0/g, `<div></div>`).replace(/1/g, `<div style="background:#6cf"></div>`) );
	stage.innerHTML = html;
}

function left() {
	if(!work) return
	if(horizon() >> 9 === 1) return
	let bak = tile;
	mix(() => {
		tile = tile.map(e => e << 1 );
		isAllowed() ? delta-- : tile = bak;
	})
}

function up() {
	if(!work) return
	if(tiles[row] === 田) return;
	let bak = tile;
	mix(() => {
		rotate();
		if(!isAllowed())
			tile = bak;
	})
}

function right() {
	if(!work) return
	if(horizon() & 1) return;
	let bak = tile;
	mix(() => {
		tile = tile.map(e => e >> 1 );
		isAllowed() ? delta++ : tile = bak;
	})
}

function down() {
	mix(() => {
		n++;
		if(!isAllowed()) {
			n--;
			work = false;
		}
	})
}

function fall() {
	if(n < 0) return;	// 模块还未出现按space就跑到最下面去了
	mix(() => {
		while(n <= layout.length - tile.length) {
			n++;
			if(!isAllowed()) {
				n--;
				work = false;
				break;
			}
		}
	})
	
}

function pad(str, n = 10) {
	let len = str.length;
	return len < n ? new Array(n - len).fill('0').join('') + str : str.substring(len - n);
}

function rand(a = 0, b = 4) {
	return Math.round(a + Math.random()*(b - a));
}

// 计算方块水平方向Bounding-box总宽度
function horizon() {
	let i = tile.length, e = tile[i - 1];
	while(i--)
		e = e | tile[i];
	return e;
}

function isAllowed() {
	let a = tile.length + n;

	if(a < 1 || a > layout.length ) return false;
	if(tile.some(e => e > 1024)) return false;
	for(let i = 0; i < tile.length; i++)
		if( (tile[i] & (layout[i + n] || 0)) > 0 )
			return false;
	return true;
}


function rotate() {
	if(tiles[row] === 田) return;

	// let oldPad = tiles[row][col][0];
	let nextTile = tiles[row][++col] || (col = 0, tiles[row][0]);
	// let newPad = nextTile[0];
	// n += newPad - oldPad;
	tile = nextTile.slice(0).map(e => delta > 0 ? e >> delta : e << -delta);
}

function getRandTile() {
	let tmp = tiles[row = rand(0, 8)];
	return tmp[col = rand(0, tmp.length - 1)].slice(0);
}



