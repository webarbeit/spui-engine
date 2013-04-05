// ----------------------------------
// Graphic Base Object
var Graphic = function(_options) {

    this.ctx = World.ctx;

    this.id = null;
    this.type = null;

    this.directionLineColor = "#FF0000";
    this.color = getRandomColor();
    this.isVisible = true;
    this.selectColor = '#D98E1A';

    this.width = 10;
    this.height = 10;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.rotateToDirection = false;
    this.balancePointX = null;
    this.balancePointY = null;

    this.angle = 0;
    this.speed = GameEngine.ENV.speed;
    this.gravity = GameEngine.ENV.gravity;
    this.maxAcceleration = 2;
    this.acceleration = 0.04;

    this.img = null;
    this.currentFrame = 0;
    this.frames = 0;
    this.interval = 0;
    this.playSprite = false;
    this.startFrame = 0;
    this.endFrame = this.frames;

    this.drawFunction = this.drawShape;

    this.boundingBox = {
        offsetX : 0,
        offsetY : 0,
        color : '#00FF00'
    }
    this.isCollidable = true;

    this.debug = GameEngine.debug;
    this.isObservable = true;

    this.stateManager = null;

    // Overwrite default attributes
    jQuery.extend(this, _options);

    this.initX = this.x;
    this.initY = this.y;
    this.initSpeed = this.speed;
};

Graphic.prototype = {

    // Draw the bounding box of the graphic
    drawBoundingBox : function(ctx) {

        this.boundingBox.width  = this.width - this.boundingBox.offsetX * 2;
        this.boundingBox.height = this.height - this.boundingBox.offsetX * 2;

        var x = this.x + this.boundingBox.offsetX,
            y = this.y + this.boundingBox.offsetY;

        drawRectangle(ctx, x, y, this.boundingBox.width, this.boundingBox.height, this.boundingBox.color, 1);
    },

    // Draw the graphic as a rectangle
    drawShape : function(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    drawDirectionLine : function(ctx, centerX, centerY) {
        ctx.fillStyle = this.directionLineColor;
        ctx.fillRect(centerX, centerY, this.width / 2, 1);
    },

    // Draw when graphic is selected
    drawSelectBox : function(ctx) {
        ctx.strokeStyle = this.selectColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    },

    playFrames : function() {

        if (this.interval === this.endFrame ) {

            if (this.currentFrame === this.endFrame) {
               this.currentFrame = this.startFrame;
            } else {
               this.currentFrame++;
            }

            this.interval = 0;
        }

        this.interval++;
    },

    drawImage : function() {

        if (this.img) {

            var currentFrame = 0;
            
            if (this.playSprite) {
            
                this.playFrames();
                currentFrame = this.currentFrame;
            
            // Only show certain frame
            } else {

                if (this.stateManager) {
                    currentFrame = this.stateManager.currentState.sprite.frame;
                } else {
                    currentFrame = this.currentFrame;
                }
            }

            this.ctx.drawImage(this.img, this.width * currentFrame, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        
        } else {
            throw "Object has no image";
        }
    },

    draw : function(debug) {

        if (this.isVisible && !this.leftWorldOnLeft() && !this.leftIsGreaterThanWorldWidth()) {
            
            if (this.rotateToDirection) {
                this.setRotateToDirectionAngle();
            }

            var ctx = this.ctx,
            centerX = this.balancePointX || this.x + (this.width / 2),
            centerY = this.balancePointY || this.y + (this.height / 2);

            ctx.save();

                // Translate to center point       
                ctx.translate(centerX, centerY);
                // Rotate
                ctx.rotate(this.angle);
                // Translate back
                ctx.translate(-centerX, -centerY);

                this.drawFunction(ctx);

                // Draw select stroke
                if (this.isSelected) {
                   this.drawSelectBox(ctx);
                }
            
                if(debug || this.debug) {
                    this.drawBoundingBox(ctx);
                    this.drawDirectionLine(ctx, centerX, centerY);
                }

            ctx.restore();
        }
    },

    // ---------------------------------    

    // Set the current state
    setState : function(stateName) {
        if (this.stateManager) {
            this.stateManager.change(stateName);
        }
    },

    // ---------------------------------

    inverseDirection : function() {
        this.setVector(-this.vx, -this.vy);
    },

    getRandomDirection : function() {
        var x = getRandomInt(-10, 10),
            y = getRandomInt(-10, 10);

        return { vx: x, vy: y };
    },

    setRandomDirection : function() {

        var self = this;

        setInterval(function() {

            self.changeToRandomDirection.apply(self);

        }, getRandomInt(1000, 10000));

    },

    changeToRandomDirection : function () {
        var newPos = this.getRandomDirection();
        this.setVector(newPos.vx, newPos.vy);
    },

    setVector : function(vx, vy) {
        this.vx = vx;
        this.vy = vy;

        this.adaptAngle();
    },

    adaptAngle : function() {
        this.angle = getAngleBetweenTwoVectors({x: this.vx, y: this.vy});
    },

    setRotateToDirectionAngle : function() {
        this.angle = getAngleBetweenTwoVectors({ x: this.vx, y: this.vy });
    },

    getCenter : function() {
        var centerX = this.x + (this.width / 2),
            centerY = this.y + (this.height / 2);

        return { x: centerX, y: centerY };
    },

    // ---------------------------------

    // Returns true if obj is within the game board borders
    isWithinBoard : function() {
        return World.positionIsWithinWorld(this);
    },

    leftWorldOnLeft : function() {
        return (this.x + this.width < World.borderOffset);
    },

    leftIsGreaterThanWorldWidth : function() {
        return (this.x > World.width - World.borderOffset);
    },

    collideWithBottom : function() {
        return (this.y + this.height >= World.height - World.borderOffset);
    },

    collideWithTop : function() {
        return (this.y < World.borderOffset);
    },

    // ---------------------------------
    // Default methods

    update : function() {
        return;
    },

    hasCollidedWith : function(object) {
        return;
    },

    reset : function() {
        return;
    },

    update : function() {
        return;
    },

    selected : function() {
        return;
    },

    deselect : function() {
        return;
    },

    getInfoText : function() {
        return '';
    }
};