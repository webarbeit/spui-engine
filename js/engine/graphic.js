// ----------------------------------
// Graphic Base Object
Graphic = function(_options) {

    this.ctx = World.ctx;

    this.id = null;
    this.type = null;

    this.directionLineColor = "#FF0000";
    this.color = getRandomColor();
    this.isVisible = true;
    this.doUpdate = true;
    this.selectColor = '#D98E1A';

    this.scaleX = 1;
    this.scaleY = 1;

    this.width = 10;
    this.height = 10;

    this.x = 0;
    this.y = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.doClearLastPosition = false;
    this.vx = 0;
    this.vy = 0;
    this.rotateToDirection = false;
    this.balancePointX = null;
    this.balancePointY = null;

    this.angle = 0;
    this.speedMultiplikator = 6;
    this.speed = GameEngine.ENV.speed * this.speedMultiplikator;
    this.gravity = GameEngine.ENV.gravity;
    this.maxAcceleration = 2;
    this.acceleration = 0.04;
    this.opacity = 1;

    this.img = null;
    this.currentFrame = 0;
    this.frames = 0;
    this.interval = 0;
    this.playSprite = false;
    this.startFrame = 0;
    this.endFrame = this.frames;
    this.playFrameLock = null;
    this.frameInterval = 60;

    this.boundingBox = {
        offsetX : 0,
        offsetY : 0,
        color : '#00FF00'
    }
    this.isCollidable = true;
    this.canCollideWithSameType = false;

    this.debug = GameEngine.debug;
    this.isObservable = true;

    this.lifeBar = {
        show : false,
        totalLifes : 1,
        lifes : 1,
        offsetX : 0,
        offsetY : -10,
        width : this.width,
        height : 5,
        
        draw : function(ctx, x, y) {

            var posX = x + this.offsetX,
                posY = y + this.offsetY;

            // RedBar
            drawFilledRectangle(ctx, posX, posY, this.width, this.height, '#FF0000');
            
            // GreenBar
            var oneLifeInPixel = this.width / this.totalLifes,
                greenWidth = oneLifeInPixel * this.lifes;

            drawFilledRectangle(ctx, posX, posY, greenWidth, this.height, '#00FF00');
        }
    };

    this.stateManager = null;

    // Overwrite default attributes
    jQuery.extend(this, _options);

    if (_options && _options.hasOwnProperty('img')) {

        this.img = new Image();
        this.img.src = _options.img.src;
        this.drawFunction = this.drawImage;
        
        this.isLoaded = false;

        this.img.onLoad = function() {
            this.isLoaded = true;
        }

    } else {
        this.drawFunction = this.drawShape;
    }

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

        drawRectangle(ctx, x, y, this.boundingBox.width, this.boundingBox.height, this.boundingBox.color);
    },

    // Draw the graphic as a rectangle
    drawShape : function(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    // For visual-debugging: draw the vector
    drawDirectionLine : function(ctx, centerX, centerY) {
        
        // Y-Axis
        //drawLine(ctx, centerX, centerY, centerX, centerY - this.height / 2, '#FFBB00', 1);

        // X-Axis
        drawLine(ctx, centerX, centerY, centerX + this.width / 2, centerY, this.directionLineColor, 1);

        // Draw arrow
        ctx.save();
        ctx.translate( this.x + this.width, centerY );
        ctx.scale(0.4, 0.4);

        ctx.beginPath();

        ctx.moveTo( -20, 0 );
        ctx.lineTo( -25, -12 );
        ctx.lineTo( 1, 0 );
        ctx.lineTo( -25, 12 );
        ctx.closePath();

        ctx.fillStyle = '#111';
        ctx.fill();

        ctx.restore();        
    },

    // Draw when graphic is selected
    drawSelectBox : function(ctx) {
        ctx.strokeStyle = this.selectColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    },

    playFrames : function() {

        var self = this;

        setInterval(function() {

            if (self.interval === self.endFrame ) {

                if (self.currentFrame === self.endFrame) {
                   self.currentFrame = self.startFrame;
                } else {
                   self.currentFrame++;
                }

                self.interval = 0;
            }

            self.interval++;

        }, this.frameInterval);
        
    },

    drawImage : function() {

        if (this.img) {

            var currentFrame = 0;
            
            if (this.playSprite) {
                
                if (this.playFrameLock === null) {
                    this.playFrameLock = 1;
                    this.playFrames();
                }

                currentFrame = this.currentFrame;
            
            // Only show certain frame
            } else {

                if (this.stateManager) {

                    if (this.stateManager.currentState.hasOwnProperty('sprite')) {
                        currentFrame = this.stateManager.currentState.sprite.frame;    
                    } else {
                        currentFrame = this.currentFrame
                    }

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
            
            if (this.doClearLastPosition) {
                this.clearLastPosition();
            }

            var ctx = this.ctx,
                centerX = this.balancePointX || this.x + (this.width / 2),
                centerY = this.balancePointY || this.y + (this.height / 2);            


            ctx.save();

                // Translate to center point       
                ctx.translate(centerX, centerY);

                // Rotate
                ctx.rotate(this.angle);

                // Scale
                ctx.scale(this.scaleX, this.scaleY);

                // Translate back
                ctx.translate(-centerX, -centerY);

                if (this.doClearLastPosition) {
                    //this.clearLastPosition();
                }

                if (this.opacity !== 1) {
                    ctx.globalAlpha = this.opacity;
                }

                // Draw object
                this.drawFunction(ctx);

                // Draw select stroke
                if (this.isSelected) {
                   this.drawSelectBox(ctx);
                }
                
                // Draw Debug stuff
                if (debug || this.debug) {
                    this.drawBoundingBox(ctx);
                    this.drawDirectionLine(ctx, centerX, centerY);
                }

                // Draw lifeBar
                if (this.lifeBar.show) {
                    this.lifeBar.draw(ctx, this.x, this.y);
                }

            ctx.restore();


        }
    },

    // ---------------------------------

    clearLastPosition : function() {

        if (this.lastX !== this.x || this.lastY !== this.y) {

            // added offsets to clear tidbits
            var lastX = this.lastX + (this.vx * -1 - 2),
                lastY = this.lastY + (this.vy * -1 - 2),
                w = this.width + 2,
                h = this.height + 4;

            // Consider lifeBar if shown
            if (this.lifeBar.show) {
                lastY = this.lastY + this.lifeBar.offsetY - 2;
                w = Math.max(this.width, this.lifeBar.width) + 6;
                h = Math.abs(this.lifeBar.offsetY) + this.height + 4;
            }

            this.ctx.clearRect(lastX, lastY, w, h);
            
            /*this.ctx.strokeStyle = this.selectColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(lastX, lastY, w, h);*/
        }

    },

    setLastPosition : function() {
        this.lastX = this.x;
        this.lastY = this.y;
    },

    // ---------------------------------

    // Set the current state
    setState : function(stateName) {
        if (this.stateManager) {

            this.stateManager.change(stateName);

            // Bind updateFn
            this.updateFn = this.stateManager.currentState['updateFn'];

            // Execute state's before method if exists
            if (this.stateManager.currentState.hasOwnProperty('beforeFn')) {
                this.beforeFn = this.stateManager.currentState.beforeFn;
                this[this.beforeFn]();
            }
        }
    },

    // ---------------------------------

    attachTo : function(object, offset) {

        this.attachedTo = {
            obj : object,
            offset : offset
        };

        this.updateFn = this.stateManager ? 'updateAttached' : this.updateAttached;

    },

    detach : function() {
        this.attachedTo = null;
    },

    updateAttached : function() {

        if (this.attachedTo) {

            var attachedObject = this.attachedTo.obj,
                offset = this.attachedTo.offset;

            this.x = attachedObject.x + offset.x;
            this.y = attachedObject.y + offset.y;
            this.angle = attachedObject.angle;

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