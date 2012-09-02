var Game, Player, World, game,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Game = (function(_super) {

  __extends(Game, _super);

  function Game() {
    Game.__super__.constructor.apply(this, arguments);
    this.sprites = [];
    this.ctx = atom.context;
    this.world = new World();
    this.player = new Player(v(atom.width / 2, 0));
    this.debug = false;
    this.camera = v(this.player.pos.x - atom.width / 2, 0);
    this.lookahead = 0;
    this.cameraPeriod = 0.001;
    this.cameraTime = 0;
    this.cameraSpeed = 0.1;
    this.backgroundSpeed = 0.1;
    this.verticalMargin = 64;
    this.height = 500;
    this.width = 1024;
  }

  Game.prototype.isCollided = function(aObject, bObject) {
    var a, b, isCollided;
    a = this.getCollision(aObject);
    b = this.getCollision(bObject);
    isCollided = false;
    if ((a.shape === 'rect') && (b.shape === 'rect')) {
      return (a.x <= b.x + b.width) && (a.x + a.width >= b.x) && (a.y <= b.y + b.height) && (a.y + a.height >= b.y);
    }
    return false;
  };

  Game.prototype.getCollision = function(object) {
    if (typeof object.collision === 'function') {
      return object.collision();
    } else {
      return object.collision;
    }
  };

  Game.prototype.update = function(dt) {
    var object, playerCollisions;
    playerCollisions = (function() {
      var _i, _len, _ref, _results;
      _ref = this.world.collisionObjects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        if (this.isCollided(this.player, object)) {
          _results.push(this.getCollision(object));
        }
      }
      return _results;
    }).call(this);
    this.player.update(dt, playerCollisions);
    if (this.cameraTime <= 0) {
      this.cameraTime = this.cameraPeriod;
      this.camera.x = lerp(this.cameraSpeed, this.camera.x, this.player.pos.x + this.player.width / 2 + this.lookahead - atom.width / 2);
      this.lookahead = lerp(0.01, this.lookahead, this.player.velocity.x * atom.width / 16);
    }
    return this.cameraTime -= dt;
  };

  Game.prototype.draw = function() {
    var i, layer, leftGrad, numLayers, object, rightGrad, sideMargin, _i, _j, _len, _ref;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, atom.width, atom.height);
    this.ctx.save();
    this.ctx.translate((atom.width - this.width) / 2, this.verticalMargin);
    numLayers = this.world.backgroundLayers.length;
    for (i = _i = 0; 0 <= numLayers ? _i < numLayers : _i > numLayers; i = 0 <= numLayers ? ++_i : --_i) {
      layer = this.world.backgroundLayers[i];
      this.ctx.save();
      this.ctx.translate(-this.camera.x / (8 * (numLayers - i + 1)), 0);
      this.ctx.drawImage(layer, layer.width - 1, 0, layer.width, layer.height);
      this.ctx.drawImage(layer, 0, 0, layer.width, layer.height);
      this.ctx.drawImage(layer, -layer.width + 1, 0, layer.width, layer.height);
      this.ctx.restore();
    }
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    _ref = this.world.collisionObjects;
    for (_j = 0, _len = _ref.length; _j < _len; _j++) {
      object = _ref[_j];
      this.ctx.save();
      this.ctx.translate(object.collision.x, object.collision.y);
      this.ctx.fillStyle = '#1c1915';
      this.ctx.fillRect(0, 0, object.collision.width, object.collision.height);
      this.ctx.restore();
    }
    if (this.debug) {
      this.ctx.save();
      this.ctx.translate(this.player.collision().x, this.player.collision().y);
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(0, 0, this.player.collision().width, this.player.collision().height);
      this.ctx.restore();
    }
    this.ctx.save();
    this.ctx.translate(this.player.pos.x, this.player.pos.y);
    this.player.draw(this.ctx);
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, atom.height - this.verticalMargin, atom.width, atom.height - (atom.height - this.verticalMargin));
    sideMargin = (atom.width - this.width) / 2;
    leftGrad = this.ctx.createLinearGradient(0, 0, sideMargin, 0);
    rightGrad = this.ctx.createLinearGradient(atom.width - sideMargin, 0, sideMargin + (atom.width - sideMargin), 0);
    leftGrad.addColorStop(0, 'rgba(0,0,0,1)');
    leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
    rightGrad.addColorStop(0, 'rgba(0,0,0,0)');
    rightGrad.addColorStop(1, 'rgba(0,0,0,1)');
    this.ctx.fillStyle = leftGrad;
    this.ctx.fillRect(0, 0, sideMargin, atom.height);
    this.ctx.fillStyle = rightGrad;
    return this.ctx.fillRect(atom.width - sideMargin, 0, sideMargin, atom.height);
  };

  return Game;

})(atom.Game);

Player = (function() {

  function Player(pos) {
    var animation,
      _this = this;
    this.pos = pos;
    this.animations = {
      walking: {
        src: './img/walking.png',
        frames: 8,
        frameSpeed: function(v) {
          return Math.abs(v.x) * 0.3;
        },
        repeat: 'loop',
        offset: 3
      },
      standing: {
        src: './img/standing.png',
        frames: 1,
        frameSpeed: function(v) {
          return 0;
        },
        repeat: 'once',
        offset: 0
      },
      jumping: {
        src: './img/jumping.png',
        frames: 6,
        frameSpeed: function(v) {
          return 3;
        },
        repeat: 'once',
        offset: 0
      },
      landing: {
        src: './img/landing.png',
        frames: 2,
        frameSpeed: function(v) {
          return 2;
        },
        repeat: 'continue',
        next: 'walking',
        offset: 0
      }
    };
    for (animation in this.animations) {
      this.animations[animation].img = new Image();
      this.animations[animation].img.src = this.animations[animation].src;
    }
    this.currentSequence = 'walking';
    this.frameHeight = 64;
    this.frameWidth = 64;
    this.frameOffset = 64;
    this.framePeriod = 0.1;
    this.frameTime = 0;
    this.currentFrame = 0;
    this.updatePeriod = 0.01;
    this.updateTime = 0;
    this.friction = 0.1;
    this.gravity = 0.7;
    this.jumpImpulse = 16;
    this.moveAccel = 0.5;
    this.blocked = false;
    this.maxSpeed = 4;
    this.width = 192;
    this.height = 192;
    this.collision = function() {
      return {
        shape: 'rect',
        width: _this.width / 4,
        height: _this.height,
        x: _this.pos.x - _this.width / 8,
        y: _this.pos.y - _this.height
      };
    };
    this.velocity = v(0, 0);
    this.direction = 1;
    this.inAir = false;
  }

  Player.prototype.drawFrame = function(ctx, frameNum) {
    var posX, posY;
    posX = -this.width / 2;
    posY = -this.height;
    return ctx.drawImage(this.animations[this.currentSequence].img, this.frameOffset * frameNum, 0, this.frameWidth, this.frameHeight, posX + this.width / 10, posY, this.width, this.height);
  };

  Player.prototype.draw = function(ctx) {
    ctx.scale(this.direction, 1);
    return this.drawFrame(ctx, this.currentFrame);
  };

  Player.prototype.changeSequence = function(sequence) {
    this.currentSequence = sequence;
    this.currentFrame = this.animations[sequence].offset;
    return this.frameTime = this.framePeriod;
  };

  Player.prototype.handleAnimation = function() {
    switch (this.animations[this.currentSequence].repeat) {
      case 'loop':
        return this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentSequence].frames;
      case 'once':
        return this.currentFrame = Math.min(this.currentFrame + 1, this.animations[this.currentSequence].frames - 1);
      case 'pingpong':
        if (this.currentFrame <= 0) {
          this.frameDir = 1;
        } else if (this.currentFrame >= this.animations[this.currentSequence].frames - 1) {
          this.frameDir = -1;
        } else {
          this.frameDir = this.frameDir || 1;
        }
        return this.currentFrame += this.frameDir;
      case 'pingpong once':
        if ((this.currentFrame <= 0) && (this.frameDir === -1)) {
          this.currentFrame = 0;
          this.frameDir = 0;
        } else if (this.currentFrame >= this.animations[this.currentSequence].frames - 1) {
          this.frameDir = -1;
        } else {
          this.frameDir = this.frameDir || 1;
        }
        return this.currentFrame += this.frameDir;
      case 'continue':
        this.currentFrame += 1;
        if (this.currentFrame >= this.animations[this.currentSequence].frames) {
          return this.changeSequence(this.animations[this.currentSequence].next);
        }
    }
  };

  Player.prototype.handleCollisions = function(collisions) {
    var boxBottom, boxLeft, boxRight, boxTop, collision, ground, grounded, playerBottom, playerBox, playerLeft, playerRight, playerTop, _i, _len;
    playerBox = this.collision();
    playerTop = playerBox.y;
    playerBottom = playerBox.y + playerBox.height;
    playerLeft = playerBox.x;
    playerRight = playerBox.x + playerBox.width;
    ground = playerBottom;
    grounded = false;
    this.blocked = false;
    for (_i = 0, _len = collisions.length; _i < _len; _i++) {
      collision = collisions[_i];
      boxTop = collision.y;
      boxBottom = boxTop + collision.height;
      boxLeft = collision.x;
      boxRight = boxLeft + collision.width;
      if ((playerBottom >= boxTop) && (playerBottom < boxBottom) && this.velocity.y >= 0) {
        ground = Math.min(boxTop, ground);
        grounded = true;
      } else if (collision.type === 'obstacle' && (playerBottom >= boxTop + 0.1)) {
        if ((playerRight >= boxLeft) && (playerRight < boxRight)) {
          this.pos.x -= playerRight - boxLeft;
          this.blocked = true;
        } else if ((playerLeft <= boxRight) && (playerLeft > boxLeft)) {
          this.pos.x += boxRight - playerLeft;
          this.blocked = true;
        }
      }
    }
    if (this.blocked) {
      this.velocity.x = 0;
      if (!this.inAir) {
        this.changeSequence('standing');
      }
    }
    if (grounded) {
      if (this.inAir) {
        this.inAir = false;
        this.changeSequence('landing');
      }
      if (Math.abs(this.velocity.x) > this.maxSpeed) {
        this.velocity.x = (this.velocity.x / Math.abs(this.velocity.x)) * this.maxSpeed;
      }
      this.velocity.y = 0;
      return this.pos.y = ground;
    } else {
      return this.inAir = true;
    }
  };

  Player.prototype.update = function(dt, collisions) {
    var collided;
    collided = collisions.length !== 0;
    if ((atom.input.pressed('jump')) && !this.inAir) {
      this.inAir = true;
      this.changeSequence('jumping');
      this.velocity.y = -this.jumpImpulse + (Math.abs(this.velocity.x));
      this.velocity.x *= 1.5;
    }
    if (this.frameTime <= 0) {
      this.frameTime = this.framePeriod;
      this.handleAnimation();
    }
    if (this.updateTime <= 0) {
      this.updateTime = this.updatePeriod;
      if ((atom.input.down('left')) || (atom.input.down('right'))) {
        if ((this.currentSequence !== 'walking') && (this.currentSequence !== 'landing') && !(this.inAir || this.blocked)) {
          this.changeSequence('walking');
        }
        if (atom.input.down('left')) {
          if (this.velocity.x > -this.maxSpeed) {
            this.velocity.x -= this.moveAccel;
          }
        }
        if (atom.input.down('right')) {
          if (this.velocity.x < this.maxSpeed) {
            this.velocity.x += this.moveAccel;
          }
        }
      } else {
        if (aboutZero(this.velocity.x, this.moveAccel)) {
          if (!this.inAir && this.currentSequence !== 'landing') {
            this.changeSequence('standing');
          }
          this.velocity.x = 0;
        } else {
          this.velocity.x = lerp(this.friction, this.velocity.x, 0);
        }
      }
      if (this.velocity.x !== 0) {
        this.direction = this.velocity.x / Math.abs(this.velocity.x);
      }
      this.velocity.y += this.gravity;
      this.pos = v.add(this.pos, this.velocity);
      this.handleCollisions(collisions);
    }
    this.updateTime -= dt;
    return this.frameTime -= this.animations[this.currentSequence].frameSpeed(this.velocity) * dt;
  };

  return Player;

})();

World = (function() {

  function World(level) {
    var background, foreground, midground;
    background = new Image();
    background.src = './img/background.png';
    midground = new Image();
    midground.src = './img/midground.png';
    foreground = new Image();
    foreground.src = './img/foreground.png';
    this.backgroundLayers = [background, midground, foreground];
    this.collisionObjects = [
      {
        collision: {
          shape: 'rect',
          type: 'platform',
          x: 0,
          y: 500,
          width: 2048,
          height: 100
        }
      }, {
        collision: {
          shape: 'rect',
          type: 'platform',
          x: 600,
          y: 400,
          width: 300,
          height: 40
        }
      }, {
        collision: {
          shape: 'rect',
          type: 'obstacle',
          x: 800,
          y: 480,
          width: 300,
          height: 40
        }
      }, {
        collision: {
          shape: 'rect',
          type: 'obstacle',
          x: 900,
          y: 460,
          width: 300,
          height: 40
        }
      }, {
        collision: {
          shape: 'rect',
          type: 'obstacle',
          x: 1000,
          y: 440,
          width: 300,
          height: 60
        }
      }, {
        collision: {
          shape: 'rect',
          type: 'obstacle',
          x: 100,
          y: 400,
          width: 250,
          height: 40
        }
      }
    ];
  }

  return World;

})();

atom.input.bind(atom.key.LEFT_ARROW, 'left');

atom.input.bind(atom.key.RIGHT_ARROW, 'right');

atom.input.bind(atom.key.SPACE, 'jump');

game = new Game;

window.onblur = function() {
  return game.stop();
};

window.onfocus = function() {
  return game.run();
};

game.run();
