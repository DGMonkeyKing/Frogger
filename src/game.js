var sprites = {
  frog: { sx: 0, sy: 0, w: 48, h: 48, frames: 1 },
  bg: { sx: 433, sy: 0, w: 320, h: 480, frames: 1 },
  car1: { sx: 143, sy: 0, w: 48, h: 48, frames: 1 },
  car2: { sx: 191, sy: 0, w: 48, h: 48, frames: 1 },  
  car3: { sx: 239, sy: 0, w: 96, h: 48, frames: 1 },
  car4: { sx: 335, sy: 0, w: 48, h: 48, frames: 1 },
  car5: { sx: 383, sy: 0, w: 48, h: 48, frames: 1 },
  trunk: { sx: 288, sy: 383, w: 142, h: 48, frames: 1 },
  death: { sx: 0, sy: 143, w: 48, h: 48, frames: 4 }
};

var NF = 480 / 48;
var NC = 320 / 32;

var cars = {
  car1: {},
  car2: { dir: 1, row: 2, speed: 40, skin:'car2'},
  car3: { dir: -1, row: 3, speed: 30, skin:'car3'},
  car4: { dir: -1, row: 4, speed: 50, skin:'car4'},
  car5: { dir: 1, row: 2, speed: 40, skin:'car5'}
};

var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

var startGame = function() {
  var ua = navigator.userAgent.toLowerCase();

  // Only 1 row of stars
  if(ua.match(/android/)) {
//    Game.setBoard(0,new Starfield(50,0.6,100,true));
  } else {
//    Game.setBoard(0,new Starfield(20,0.4,100,true));
//    Game.setBoard(1,new Starfield(50,0.6,100));
//    Game.setBoard(2,new Starfield(100,1.0,50));
  }  
  Game.setBoard(1,new TitleScreen("Frogger", 
                                  "Press space to start playing",
                                  playGame));
};

var level1 = [
 // Start,   End, Gap,  Type,   Override
  [ 0,      4000,  500, 'step' ],
  [ 6000,   13000, 800, 'ltr' ],
  [ 10000,  16000, 400, 'circle' ],
  [ 17800,  20000, 500, 'straight', { x: 50 } ],
  [ 18200,  20000, 500, 'straight', { x: 90 } ],
  [ 18200,  20000, 500, 'straight', { x: 10 } ],
  [ 22000,  25000, 400, 'wiggle', { x: 150 }],
  [ 22000,  25000, 400, 'wiggle', { x: 100 }]
];



var playGame = function() {
  var board = new GameBoard();
  var play = new GameBoard();
  board.add(new backGround());
  play.add(new Log({speed: 50}));
  play.add(new Log({dir: -1, row: 2, speed: 60}));
  play.add(new Log({row: 3}));
  play.add(new Spawner(new Log({speed: 50}), 30));
  play.add(new Spawner(new Log({dir: -1, row: 2, speed: 60}), 30));
  play.add(new Spawner(new Log({row: 3}), 60));
  play.add(new Water());
  play.add(new Home());
  play.add(new Frog());
  play.add(new Car('car1'));
  play.add(new Car('car2', cars['car2']));
  play.add(new Car('car3',cars['car3']));
  play.add(new Car('car4',cars['car4']));
  play.add(new Spawner(new Car('car1'), 30));
  play.add(new Spawner(new Car('car2', cars['car2']), 30));
  play.add(new Spawner(new Car('car3',cars['car3']), 60));
  play.add(new Spawner(new Car('car4',cars['car4']), 30));
  //board.add(new Level(level1,winGame));
  Game.setBoard(1,play);
  Game.setBoard(0,board);
  //Game.setBoard(5,new GamePoints(0));
};

var Death = function(centerX, centerY) {
  this.setup('death', { frame: 4 });
  this.x = centerX - this.w/2;
  this.y = centerY - this.h/2;
  this.time = 0;
}

Death.prototype = new Sprite();
Death.prototype.step = function(dt) {
  if(this.time > 1){
    this.frame--;
    if(this.frame < 0) {
      this.board.remove(this);
      loseGame();
    }
    this.time = 0;
  } else this.time+=dt*8;
};

var Home = function() {
  this.x = 0;
  this.y = 0;

  this.h = 48;
  this.w = Game.width;

  this.step = function(){
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      winGame();
    }
  }
  this.draw = function(){}
}

Home.prototype = new Sprite();

var Water = function() {
  this.x = 0;
  this.y = 48;

  this.zIndex = 2;

  this.h = 48*3;

  this.step = function(){
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision && !collision.isOnLog()) {
      collision.hit(this);
    }
  }
  this.draw = function(){}
}

Water.prototype = new Sprite();

var Log = function(props) {
  this.merge(this.baseParameters);
  this.setup('trunk');
  this.merge(props);
  this.zIndex = 1;

  if (this.dir == -1) {this.x = Game.width}
  else this.x = -this.w;
  this.y = (this.row)*48; 

  this.step = function(dt){
    if (this.dir == 1){
      this.x += this.speed * dt;  
    }
    else this.x -= this.speed * dt;

    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      collision.onLog(this);
    }
  
    if(this.x > Game.width || this.x < -this.w){
      this.board.remove(this);
    }
  }

  this.clone = function(){
    return new Log(props);
  }
}

Log.prototype = new Sprite();
Log.prototype.baseParameters = { dir: 1, row: 1, speed: 40}

var Car = function(skin, props) {
  this.merge(this.baseParameters);
  this.setup(skin);
  this.merge(props);
  this.zIndex = 1;

  if (this.dir == -1) {this.x = Game.width}
  else this.x = -48;
  this.y = (NF-1-this.row)*48;

  this.time = 0;

  this.step = function(dt) { 
  
    if (this.dir == 1){
      this.x += this.speed * dt;  
    }
    else this.x -= this.speed * dt;
    


    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      collision.hit();
      //this.board.remove();
    }
  }

  this.clone = function(){
    return new Car(skin, props);
  }

}

Car.prototype = new Sprite();
Car.prototype.type = OBJECT_ENEMY;
Car.prototype.baseParameters = { dir: -1, row: 1, speed: 60, skin:'car1'};

var Spawner = function(obj, frec){
  this.x = 0;
  this.y = 0;
  this.time = 0;
  this.obj = obj;
  this.f = frec;

  this.draw = function(){}
}

Spawner.prototype = new Sprite();
Spawner.prototype.step = function(dt){
  if(this.time > this.f){
    this.o = this.obj.clone();
    this.board.addFirst(this.o);
    this.time = 0;
  } else this.time += dt*8;
}
/*var Spawner = function(proto, frec) {
  var obj = Object.create(proto.prototype);
  obj.
  this.f = frec;
  this.time = 0;

  this.draw = function(){}
}

//Spawner.prototype.baseParameters = {skin:'car1', dir: 1, row: 1, speed: 40, f: 40};
Spawner.prototype.step = function(dt){
  if(this.time > this.f){
    this.board.add(new Log({speed: 50}));
    this.time = 0;
  } else this.time += dt*8;
}*/

var Frog = function() {
  this.setup('frog');
  this.x = (((NC/2)-1)*32)+16;
  this.y = (NF*48)-48;

  this.zIndex = 2;

  this.vx = 0;
  this.dir = 1;

  this.time = 0;

  this.step = function(dt) { 
    if(this.time > 1){
      if(Game.keys['left']) { if (this.x > 0){ this.x -= 48;} }
      else if(Game.keys['right']) { if (this.x < (NC-1)*32-32){ this.x += 48;} }
      else if(Game.keys['up']) { if (this.y > 0){ this.y -= 48;} }
      else if(Game.keys['down']) { if (this.y < (NF-1)*48){ this.y += 48;} }
      this.time = 0;
    }else{
      this.time+=dt*11;
    };
    if (this.x < (NC-1)*32 && this.x >= 0){this.x+=this.vx*dt*this.dir;}
    this.vx = 0;
  }

}

Frog.prototype = new Sprite();
Frog.prototype.type = OBJECT_PLAYER;
Frog.prototype.onLog = function(vLog){
  this.vx = vLog.speed;
  this.dir = vLog.dir;
}
Frog.prototype.isOnLog = function(){
  if(this.vx) return true;
  return false;
}
Frog.prototype.hit = function(damage){
  this.board.remove(this);
  this.board.add(new Death(this.x + this.w/2, 
                                 this.y + this.h/2));
}

var backGround = function() {
  this.setup('bg', {x: 0, y:0});
  this.zIndex = 0;

  this.step = function() {
   // Sprite.draw(ctx);
  };
}

backGround.prototype = new Sprite();

var winGame = function() {
  Game.setBoard(1,new TitleScreen("You win!", 
                                  "Press fire to play again",
                                  playGame));
};

var loseGame = function() {
  Game.setBoard(1,new TitleScreen("You lose!", 
                                  "Press fire to play again",
                                  playGame));
};

var Starfield = function(speed,opacity,numStars,clear) {

  // Set up the offscreen canvas
  var stars = document.createElement("canvas");
  stars.width = Game.width; 
  stars.height = Game.height;
  var starCtx = stars.getContext("2d");

  var offset = 0;

  // If the clear option is set, 
  // make the background black instead of transparent
  if(clear) {
    starCtx.fillStyle = "#000";
    starCtx.fillRect(0,0,stars.width,stars.height);
  }

  // Now draw a bunch of random 2 pixel
  // rectangles onto the offscreen canvas
  starCtx.fillStyle = "#FFF";
  starCtx.globalAlpha = opacity;
  for(var i=0;i<numStars;i++) {
    starCtx.fillRect(Math.floor(Math.random()*stars.width),
                     Math.floor(Math.random()*stars.height),
                     2,
                     2);
  }

  // This method is called every frame
  // to draw the starfield onto the canvas
  this.draw = function(ctx) {
    var intOffset = Math.floor(offset);
    var remaining = stars.height - intOffset;

    // Draw the top half of the starfield
    if(intOffset > 0) {
      ctx.drawImage(stars,
                0, remaining,
                stars.width, intOffset,
                0, 0,
                stars.width, intOffset);
    }

    // Draw the bottom half of the starfield
    if(remaining > 0) {
      ctx.drawImage(stars,
              0, 0,
              stars.width, remaining,
              0, intOffset,
              stars.width, remaining);
    }
  };

  // This method is called to update
  // the starfield
  this.step = function(dt) {
    offset += dt * speed;
    offset = offset % stars.height;
  };
};

var PlayerShip = function() { 
  this.setup('ship', { vx: 0, reloadTime: 0.25, maxVel: 200 });

  this.reload = this.reloadTime;
  this.x = Game.width/2 - this.w / 2;
  this.y = Game.height - Game.playerOffset - this.h;

  this.step = function(dt) {
    if(Game.keys['left']) { this.vx = -this.maxVel; }
    else if(Game.keys['right']) { this.vx = this.maxVel; }
    else { this.vx = 0; }

    this.x += this.vx * dt;

    if(this.x < 0) { this.x = 0; }
    else if(this.x > Game.width - this.w) { 
      this.x = Game.width - this.w;
    }

    this.reload-=dt;
    if(Game.keys['fire'] && this.reload < 0) {
      Game.keys['fire'] = false;
      this.reload = this.reloadTime;

      this.board.add(new PlayerMissile(this.x,this.y+this.h/2));
      this.board.add(new PlayerMissile(this.x+this.w,this.y+this.h/2));
    }
  };
};

PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function(damage) {
  if(this.board.remove(this)) {
    loseGame();
  }
};


var PlayerMissile = function(x,y) {
  this.setup('missile',{ vy: -700, damage: 10 });
  this.x = x - this.w/2;
  this.y = y - this.h; 
};

PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt)  {
  this.y += this.vy * dt;
  var collision = this.board.collide(this,OBJECT_ENEMY);
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  } else if(this.y < -this.h) { 
      this.board.remove(this); 
  }
};


var Enemy = function(blueprint,override) {
  this.merge(this.baseParameters);
  this.setup(blueprint.sprite,blueprint);
  this.merge(override);
};

Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;

Enemy.prototype.baseParameters = { A: 0, B: 0, C: 0, D: 0, 
                                   E: 0, F: 0, G: 0, H: 0,
                                   t: 0, reloadTime: 0.75, 
                                   reload: 0 };

Enemy.prototype.step = function(dt) {
  this.t += dt;

  this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
  this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);

  this.x += this.vx * dt;
  this.y += this.vy * dt;

  var collision = this.board.collide(this,OBJECT_PLAYER);
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  }

  if(Math.random() < 0.01 && this.reload <= 0) {
    this.reload = this.reloadTime;
    if(this.missiles == 2) {
      this.board.add(new EnemyMissile(this.x+this.w-2,this.y+this.h));
      this.board.add(new EnemyMissile(this.x+2,this.y+this.h));
    } else {
      this.board.add(new EnemyMissile(this.x+this.w/2,this.y+this.h));
    }

  }
  this.reload-=dt;

  if(this.y > Game.height ||
     this.x < -this.w ||
     this.x > Game.width) {
       this.board.remove(this);
  }
};

Enemy.prototype.hit = function(damage) {
  this.health -= damage;
  if(this.health <=0) {
    if(this.board.remove(this)) {
      Game.points += this.points || 100;
      this.board.add(new Explosion(this.x + this.w/2, 
                                   this.y + this.h/2));
    }
  }
};

var EnemyMissile = function(x,y) {
  this.setup('enemy_missile',{ vy: 200, damage: 10 });
  this.x = x - this.w/2;
  this.y = y;
};

EnemyMissile.prototype = new Sprite();
EnemyMissile.prototype.type = OBJECT_ENEMY_PROJECTILE;

EnemyMissile.prototype.step = function(dt)  {
  this.y += this.vy * dt;
  var collision = this.board.collide(this,OBJECT_PLAYER)
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  } else if(this.y > Game.height) {
      this.board.remove(this); 
  }
};



var Explosion = function(centerX,centerY) {
  this.setup('explosion', { frame: 0 });
  this.x = centerX - this.w/2;
  this.y = centerY - this.h/2;
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
  this.frame++;
  if(this.frame >= 12) {
    this.board.remove(this);
  }
};

window.addEventListener("load", function() {
  Game.initialize("game",sprites,startGame);
});
