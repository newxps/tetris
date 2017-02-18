;(function() {
	var a = [ [4, 14], [4, 6, 4], [0, 14, 4], [4, 12, 4] ];				// 亠
	var b = [ [4, 4, 6], [0, 14, 8], [12, 4, 4], [2, 14] ];				// L
	var c = [ [4, 4, 12], [8, 14], [6, 4, 4], [0, 14, 2] ];				// m_L
	var d = [ [6, 6] ];																						// 田
	var e = [ [12, 6], [4, 12, 8] ];															// z
	var f = [ [6, 12], [4, 6, 2] ];																// m_z
	var g = [ [4, 4, 4, 4], [0, 15] ];														// l

	var tiles = [a, b, c, d, e, f, g, a, b, c, d, e, f, g];

	var Tetris = function(w, h, t) {
		this.w = w || 10;
		this.h = h || 20;
		this.t = t || 500;
		this._init();
	};

	Tetris.prototype = {
		constructor: Tetris,

		_init: function() {
			var self = this;
			this._translateX = ~~(this.w/2) - 1;
			this.layout = fill(new Array(this.h), 0);
			this.tiles = tiles.map(function(e, i) {
				return e.map(function(v, j) {
					return v.map(function(n) {
						return n << self._translateX;
					});
				});
			});

			this.tiles;

			this.totalScore = 0;

			this._zero();
			this._bind();
		},

		_zero: function() {
			clearInterval( this.timer );
			this.delta = 0;
			this.work = true;
			this.n = -1;

			this.running = false;
			
			if(!this.nextTileObj) this.nextTileObj = this._getRandTileObj();
			var next = this.nextTileObj
			this.tile = next.tile;
			this.row = next.row;
			this.col = next.col;

			this.nextTileObj = this._getRandTileObj();
		},

		getNextTile: function() {
			return this.nextTileObj.tile;
		},

		_getRandTileObj: function() {
			var row, col, tile;
			var tmp = this.tiles[row = rand(0, this.tiles.length - 1)];
			var tile = tmp[col = rand(0, tmp.length - 1)].slice(0);
			return { row: row, col: col, tile: tile }
		},

		_mix: function(fn) {
			if( fn ) {
				this._minus(); fn.call(this); this._add(); this._render();
			}
		},

		_add: function() {
			var a = this.tile.length + this.n;
			if(a < 1 || a > this.layout.length) return false;
			for(var i = 0, m = this.tile.length; i < m; i++)
				if(i + this.n >= 0)
					this.layout[i + this.n] += this.tile[i];
		},

		_minus: function() {
			var a = this.tile.length + this.n;
			if(a < 1 || a > this.layout.length) return false;
			for(var i = 0, m = this.tile.length; i < m; i++)
				if(i + this.n >= 0)
					this.layout[i + this.n] = Math.max(this.layout[i + this.n] - this.tile[i], 0);
		},

		start: function(t) {
			if(this.running) return;
			this.running = true;

			// 输出 4X4 的矩阵
			var nextRow = this.nextTileObj.row, nextCol = this.nextTileObj.col;
			this.emit('start', tiles[nextRow][nextCol].map(function(e) {
				return pad(e.toString(2), 4)
			}) );

			var self = this;
			this.timer = setInterval(function() {
				if( self.work === true ) {
					self._mix(function() {
						self.n++;
						if( !this._isAllowed() ) {
							self.n--;
							self.work = false;
						}
					});
				} else if( self.work === false ) {
					clearInterval( self.timer );
					this.running = false;

					if( self.n <= 0 ) {
						self._clear();
						self.emit('lose');
					} else {
						var fullNum = 0;
						var maxFullNumber = ( 1 << self.w ) - 1;
						for(var i = 0, m = self.layout.length; i < m; i++) {
							if( trim(self.layout[i]) >= maxFullNumber ) {
								fullNum++;
								self.layout.splice(i, 1);
								self.layout.unshift(0);
							}
						}

						//触发得分事件
						if(fullNum) {
							self.totalScore += fullNum;
							self.emit('score', self.totalScore, fullNum)
						}

						self._zero();
						self.start();
					}
				}
			}, this.t);
			return this;
		},

		on: function(type, fn) {
			if( !this.eventQueue ) this.eventQueue = {};
			if( !this.eventQueue[type] ) this.eventQueue[type] = [];

			if(fn)
				this.eventQueue[type].push(fn.bind(this));
			return this;
		},

		emit: function(type) {
			// if( ['start', 'pause', 'score', 'lose'].indexOf(type) === -1 ) return;
			var arg = Array.prototype.slice.call(arguments, 1);

			if( this.eventQueue && this.eventQueue[type] )
				this.eventQueue[type].forEach(function(e) { e.apply(null, arg); });
			return this;
		},

		detach: function(type) {
			if( type && this.eventQueue[type]) this.eventQueue[type].length = 0;
		},

		pause: function() {
			clearInterval(this.timer);
			if(this.running === false) return;
			this.running = false;
			this.emit('pause');
			return this;
		},

		restart: function(t) {
			this.layout = fill(new Array(this.h), 0);
			this._zero();
			this.start(t);
			return this;
		},

		_clear: function() {
			this.layout = fill(new Array(this.h), 0);
			this._render();
		},

		_render: function() {
			var self = this;
			if( this.eventQueue && this.eventQueue.render && this.eventQueue.render.length ) {
				var res = this.layout.map(function(e) {
					return pad(e.toString(2), self.w + 2).substring(1, self.w + 1)
				});
				this.emit('render', res);
			}
		},

		_bind: function() {
			var self = this;
			bind(document, 'keydown', function(e) {
				if( !self.work || !self.running ) return;
				var code = e.keyCode;
				if( code === 37 )
					self._shift(-1);
				else if( code === 38 )
					self._up();
				else if( code === 39 )
					self._shift(1);
				else if( code === 40 )
					self._down();
				else if( code === 32 )
					self._fall();
			});
		},

		_up: function() {
			if( this.tile[this.row] === d ) return;
			var bak = this.tile;
			this._mix(function() {
				this._rotate();
				if( !this._isAllowed() )
					this.tile = bak;
			});
		},

		_shift: function(n) {
			var bak = this.tile;
			this._mix(function() {
				this.tile = this.tile.map(function(e) {
					return n > 0 ? e >> n : e << -n;
				});
				this._isAllowed() ? this.delta += n : this.tile = bak;
			});
		},

		_down: function() {
			this._mix(function() {
				this.n++;
				if( !this._isAllowed() ) {
					this.n--;
					this.work = false;
				}
			})
		},

		_fall: function() {
			if( this.n < 0 ) return;	// 防止模块还未出现按space就跑到最下面去了
			this._mix(function() {
				while( this.n <= this.layout.length - this.tile.length ) {
					this.n++;
					if( !this._isAllowed() ) {
						this.n--;
						this.work = false;
						break;
					}
				}
			});
		},

		_isAllowed: function() {
			var a = this.tile.length + this.n;

			// 超出上下边界时
			if( a < 1 || a > this.layout.length ) return false;

			var max = 1 << (this.w + 1);
			// 平移超出左右边界时
			if( this.tile.some(function(e) { return (e >= max) || (e & 1) }) )
				return false;

			// 方块发生碰撞时
			for(var i = 0, m = this.tile.length; i < m; i++)
				if( (this.tile[i] & (this.layout[i + this.n] || 0)) > 0 )
					return false;
			return true;
		},

		_rotate: function() {
			var rotatedTile = this.tiles[this.row][++this.col] || (this.col = 0, this.tiles[this.row][0]);
			var self = this;
			this.tile = rotatedTile.map(function(e) {
				return self.delta > 0 ? e >> self.delta : e << -self.delta;
			});
		}

	}

	window.Tetris = Tetris;

	function fill(arr, p) {
		for(var i = 0; i < arr.length; i++) arr[i] = p;
		return arr;
	}

	// 将二进制数两边去掉一位, 得到10bit的数
	function trim(num) {
		var max = (1 << (num.toString(2).length - 1) ) - 1;
		return (num >> 1) & max;
	}

	function pad(str, n) {
		var len = str.length;
		return len < n ? fill(new Array(n - len), '0').join('') + str : str.substring(len - n);
	}

	function rand(a, b) {
		if(a == null) a = 0;
		if(b == null) b = 8;	// 不能用 b = b || 8, 因为b可以为0
		return Math.round(a + Math.random()*(b - a));
	}

	function bind(obj, type, fn) {
		return obj.addEventListener(type, fn, false);
	}

})();