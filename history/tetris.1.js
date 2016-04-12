/**
 * 最原始版本, 纯函数编写
 */

var layout = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

var 亠 = [ [64, 224], [64, 96, 64], [0, 224, 64], [64, 192, 64] ];

var L = [ [64, 64, 96], [0, 224, 128], [192, 64, 64], [0, 32, 224] ];

var m_L = [ [64, 64, 192], [128, 224], [96, 64, 64], [0, 224, 32] ];

var 田 = [ [96, 96] ];

var z = [ [192, 96], [32, 96, 64] ];

var m_z = [ [96, 192], [64, 96, 32] ];

var l = [ [64, 64, 64, 64], [0, 240] ];

var tiles = [亠, 亠, L, m_L, 田, z, m_z, l, l];

var stage = document.getElementById('stage');

var tile, work, n;			//旋转轴在第几排

var row, col, delta;		// delta -> 水平偏移量

var timer;
function start() {
	delta = 0;
	work = true;
	tile = getRandTile();
	n = -1;
	timer = setInterval(function() {
		if(work) {
			mix(function() {
				n++;
				if(!isAllowed()) {
					n--;
					work = false;
				}
			})
		} else {
			clearInterval(timer);
			if( n <= 0 ) {
				if(confirm('Game over! Restart???')) {
					layout.forEach(function(e, i) { return layout[i] = 0 });
					start();
				}
			} else {
				for(var i = 0; i < layout.length; i++) {
					if(trim(layout[i]) >= 1023) {
						layout.splice(i, 1);
						layout.unshift(0);
					}
				}
				start();
			}
		}
	}, 500);
}

start();

document.onkeydown = function(e) {
	var code = e.keyCode;
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
	var a = tile.length + n;
	if(a < 1 || a > layout.length) return false;
	for(var i = 0; i < tile.length; i++)
		if(i + n >= 0)
			layout[i + n] += tile[i];
}

function minus() {
	var a = tile.length + n;
	if(a < 1 || a > layout.length) return false;
	for(var i = 0; i < tile.length; i++)
		if(i + n >= 0)
			layout[i + n] = Math.max(layout[i + n] - tile[i], 0);
}

function render() {
	var html = ''
	layout.forEach(function(e, i) {
		html += pad(e.toString(2), 12).substring(1, 11).replace(/0/g, `<div></div>`).replace(/1/g, `<div style="background:#6cf"></div>`);
	});
	stage.innerHTML = html;
}

function left() {
	if(!work) return
	var bak = tile;
	mix(function() {
		tile = tile.map(function(e) {
			return e << 1;
		});
		isAllowed() ? delta-- : tile = bak;
	})
}

function up() {
	if(!work) return
	if(tiles[row] === 田) return;
	var bak = tile;
	mix(function() {
		rotate();
		if(!isAllowed())
			tile = bak;
	})
}

function right() {
	if(!work) return
	var bak = tile;
	mix(function() {
		tile = tile.map(function(e) {
			return e >> 1;
		});
		isAllowed() ? delta++ : tile = bak;
	})
}

function down() {
	mix(function() {
		n++;
		if(!isAllowed()) {
			n--;
			work = false;
		}
	})
}

function fall() {
	if(n < 0) return;	// 模块还未出现按space就跑到最下面去了
	mix(function() {
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

function pad(str, n) {
	var len = str.length;
	return len < n ? fill(new Array(n - len), '0').join('') + str : str.substring(len - n);
}

function fill(arr, p) {
	for(var i = 0; i < arr.length; i++) arr[i] = p;
	return arr
}

function rand(a, b) {
	if(a == null) a = 0;
	if(b == null) b = 8;
	return Math.round(a + Math.random()*(b - a));
}

function isAllowed() {
	var a = tile.length + n;

	// 超出上下边界时
	if(a < 1 || a > layout.length ) return false;

	// 平移超出左右边界时
	if( tile.some(function(e) { return (e >= 2048) || (e & 1) }) )
		return false;

	// 方块发生碰撞时
	for(var i = 0; i < tile.length; i++)
		if( (tile[i] & (layout[i + n] || 0)) > 0 )
			return false;
	return true;
}

function rotate() {
	if(tiles[row] === 田) return;
	var nextTile = tiles[row][++col] || (col = 0, tiles[row][0]);
	tile = nextTile.slice(0).map(function(e) {
		return delta > 0 ? e >> delta : e << -delta;
	});
}

function getRandTile() {
	var tmp = tiles[row = rand(0, tiles.length - 1)];
	return tmp[col = rand(0, tmp.length - 1)].slice(0);
}

// 将12bit的二进制数两边去掉一位, 得到10bit的数
function trim(num) {
	return (num >> 1) & 2047;
}


