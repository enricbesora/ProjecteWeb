var Game = Game || {};

Game.game = new Phaser.Game(480, 320, Phaser.AUTO);

Game.game.state.add('Boot', Game.BootState);
Game.game.state.add('Preload', Game.PreloadState);
Game.game.state.add('Game', Game.GameState);

Game.game.state.start('Boot');
