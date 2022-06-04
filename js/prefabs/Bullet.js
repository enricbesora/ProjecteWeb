var Game = Game || {};

Game.Bullet = function(state, x, y) {
    Phaser.Sprite.call(this, state.game, x, y, 'bullet');

    this.state = state;
    this.game = state.game;

    this.game.physics.arcade.enable(this);
    this.body.velocity.x = 100;
};

Game.Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Game.Bullet.prototype.construtor = Game.Bullet;

Game.Bullet.prototype.update = function() {
    //kill bullets that leave the screen
    if(this.x >= this.game.width) {
        this.kill();
    }
}
