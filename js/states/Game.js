var Veggies = Veggies || {};

Veggies.GameState = {

  init: function(currentLevel) {
    //keep track of the current level
    this.currentLevel = currentLevel ? currentLevel : 'level1';

    //constants
    this.HOUSE_X = 60;
    this.SUN_FREQUENCY = 5;
    this.SUN_VELOCITY = 50;

    //no gravity in a top-down game
    this.game.physics.arcade.gravity.y = 0;
  },
  create: function() {
    this.background = this.add.sprite(0, 0, 'background');
    this.createLandPatches();

    this.hitSound = this.add.audio('hit');

    //group for game objects
    this.bullets = this.add.group();
    this.plants = this.add.group();
    this.zombies = this.add.group();
    this.suns = this.add.group();

    this.numSuns = 100;

    this.createGui();

    var zombieData = {
      asset: 'zombie',
      health: 2,
      animationFrames: [0, 1, 2, 1],
      attack: 0.1,
      velocity: -40
    };

    this.zombie = new Veggies.Zombie(this, 300, 100, zombieData);
    this.zombies.add(this.zombie);


    var plantData = {
      plantAsset: 'plant',
      health: 10,
      isShooter: true,
      //isSunProducer: true,
      animationFrames: [1, 2, 1, 0]
    };

    this.plant = new Veggies.Plant(this, 100, 100, plantData);
    this.plants.add(this.plant);

    this.sunGenerationTimer = this.game.time.create(false);
    this.sunGenerationTimer.start();
    this.scheduleSunGeneration();
  },
  update: function() {
    this.game.physics.arcade.collide(this.plants, this.zombies, this.attackPlant, null, this);
    this.game.physics.arcade.collide(this.bullets, this.zombies, this.hitZombie, null, this);

    this.zombies.forEachAlive(function(zombie){
      //zombies need to keep their speed
      zombie.body.velocity.x = zombie.defaultVelocity;

      //if one of them reaches the house, it's game over
      if(zombie.x <= this.HOUSE_X) {
        this.gameOver();
      }
    }, this);
  },
  gameOver: function() {
    this.game.state.start('Game');
  },
  attackPlant: function(plant, zombie) {
    plant.damage(zombie.attack);
},
createZombie: function(x, y, data) {
    var newElement = this.zombies.getFirstDead();

    if(!newElement) {
        newElement = new Veggies.Zombie(this, x, y, data);
        this.zombies.add(newElement);
    }
    else {
        newElement.reset(x ,y , data);
    }

    return newElement;
},
createPlant: function(x, y, data) {
    var newElement = this.zombies.getFirstDead();

    if(!newElement) {
        newElement = new Veggies.Plant(this, x, y, data);
        this.plants.add(newElement);
    }
    else {
        newElement.reset(x ,y , data);
    }

    return newElement;
},
createGui: function() {
    var sun = this.add.sprite(10, this.game.height - 20, 'sun');
    sun.anchor.setTo(0.5);
    sun.scale.setTo(0.5);

    var style = {font: '14px Arial', fill: '#fff'};
    this.sunLabel = this.add.text(22, this.game.height - 28, '', style);

    this.updateStats();

    //show button bar
    this.buttonData = JSON.parse(this.game.cache.getText('buttonData'));

    //buttons
    this.buttons = this.add.group();

    var button;
    this.buttonData.forEach(function(element, index) {
        button = new Phaser.Button(this.game, 80 + index * 40, this.game.height - 35, element.btnAsset, this.clickButton, this);
        this.buttons.add(button);

        //pass the data to the button
        button.plantData = element;
    }, this);

    this.plantLabel = this.add.text(300, this.game.height - 28, '', style);
},
updateStats: function() {
    this.sunLabel.text = this.numSuns;
},
increaseSun: function(amount) {
    this.numSuns += amount;
    this.updateStats();
},
scheduleSunGeneration: function() {
    this.sunGenerationTimer.add(Phaser.Timer.SECOND * this.SUN_FREQUENCY, function() {
        this.generateRandomSun();
        this.scheduleSunGeneration();
    }, this);
},
generateRandomSun: function() {
    var y = -20;
    var x = 40 + 420 * Math.random();

    var sun = this.createSun(x, y);

    sun.body.velocity.y = this.SUN_VELOCITY;
},
createSun: function(x, y) {
    var newElement = this.suns.getFirstDead();

    if(!newElement) {
        newElement = new Veggies.Sun(this, x, y);
        this.suns.add(newElement);
    }
    else {
        newElement.reset(x ,y);
    }

    return newElement;
},
hitZombie: function(bullet, zombie) {
    bullet.kill();
    zombie.damage(1);
    this.hitSound.play();
},
clickButton: function(button) {
    if(!button.selected) {
        this.clearSelection();
        this.plantLabel.text = 'Cost: ' + button.plantData.cost;
        button.selected = true;
        button.alpha = 0.5;

        //check if you can afford the plant
        if(this.numSuns >= button.plantData.cost) {
            this.plantLabel.fill = "white";

            this.currentSelection = button.plantData;
        }
        else {
            this.plantLabel.fill = "red";
        }
    }
    else {
        this.clearSelection();
    }
},
clearSelection: function() {
    this.plantLabel.text = '';
    this.currentSelection = null;

    this.buttons.forEach(function(button){
        button.alpha = 1;
        button.selected = false;
    }, this);
},
createLandPatches: function() {
    this.patches = this.add.group();

    //rectangle to be used
    var rectangle = this.add.bitmapData(40, 50);
    rectangle.ctx.fillStyle = '#000';
    rectangle.ctx.fillRect(0, 0, 40, 50);

    var j, patch;
    var dark = false;

    for(var i = 0; i < 10; i++) {
        for(j = 0; j < 5; j++) {
            patch = new Phaser.Sprite(this.game, 64 + i * 40, 24 + j * 50, rectangle);
            this.patches.add(patch);
            alpha = dark ? 0.2 : 0.1;
            dark = !dark;

            patch.alpha = alpha;
            patch.posX = 64 + i * 40;
            patch.posY = 24 + j * 50;

            //plant something if the patch is available and a plant is selected
            patch.inputEnabled = true;
            patch.events.onInputDown.add(this.plantPlant, this);
        }
    }
},
plantPlant: function(patch) {
    console.log('Plnat!' + patch.posX + " " + patch.posY)
}
};
