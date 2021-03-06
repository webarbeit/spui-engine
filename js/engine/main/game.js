/*
    ------------------------------------------------------
    GameEngine Object

    Todo:
        * Strategy pattern also for graphic.update method
        * Collision detection
*/
GameEngine = {

    canvas : null,
    ctx : null,

    cameraX : 0,
    cameraY : 0,
    scale : 1,

    requestAnimationId : null,

    doClear : false,

    ENV : {
        speed : 2,
        maxSpeed: 2,
        gravity : 0
    },

    objectToFollow : null,

    objectManager : null,
    debug : true,

    isRunning : false,

    init : function(canvasId, isDebug) {

        this.debug = isDebug || false;

        this.canvas = document.getElementById(canvasId);
        this.ctx    = this.canvas.getContext('2d');

        this.world = World;
        World.init(canvasId, this.ctx);

        this.objectManager = ObjectManager;
        this.objectManager.init(this);
        this.objectManager.debug = this.debug;

        this.cameraX = (World.centerX - (World.centerX * this.scale));
        this.cameraY = (World.centerY - (World.centerY * this.scale));
        this.followOffsetX = 0;

        this.maxFollowY = 0;

        return this;
    },

    start : function() {
        this.isRunning = true;
        this.draw();
    },

    stop : function() {
        this.isRunning = false;
    },

    reset : function() {
        this.isRunning = false;
    },

    lose : function() {
        this.canvasToBW();
        this.onLose();
    },

    onLose : function() {
        return;
    },

    draw : function() {

        if (!GameEngine.isRunning) return;

        var ctx = GameEngine.ctx;

        if (GameEngine.doClear) {
            ctx.clearRect(0, 0, World.width, World.height);
        }

        ctx.save();
        
        ctx.translate(GameEngine.cameraX, GameEngine.cameraY);

        ctx.scale(GameEngine.scale, GameEngine.scale);

        GameEngine.objectManager.draw();

        if (GameEngine.debug) {
            World.draw();
        }

        if (GameEngine.objectToFollow) {
            GameEngine.translateToFollowObject.call(GameEngine);
        }

        ctx.restore();
        
        GameEngine.requestAnimationId = requestAnimationFrame(GameEngine.draw);
    },

    followObject : function(object, axis) {

        this.objectToFollow = { 
            object: object,
            axis : axis
        };

        if (!object) {
            this.cameraX = (World.centerX - (World.centerX * this.scale));
            this.cameraY = (World.centerY - (World.centerY * this.scale));
        }
    },

    translateToFollowObject : function() {

        if (this.objectToFollow.object) {

            var object = this.objectToFollow.object,
                axis = this.objectToFollow.axis;

            if (axis === 'x' || !axis) {
                this.cameraX = (object.x + this.followOffsetX + object.width / 2) * -this.scale + object.initX;
            }

            if (axis === 'y' || !axis) {
                this.cameraY = ((object.y + object.height / 2) * -this.scale) + World.centerY;

                if (this.cameraY <= this.maxFollowY * this.scale)
                    this.cameraY = this.maxFollowY * this.scale;
            }
            
        } else {
            console.warn('There is no object to follow!');
        }
    },

    canvasToBW : function() {

        try {
            var ctx = World.ctx;
            var canvas = World.canvas;
            var imgd = ctx.getImageData(0, 0, World.width, World.height);

            var pix = imgd.data;
            
            for (var i = 0, n = pix.length; i < n; i += 4) {
              var grayscale = pix[i  ] * .3 + pix[i+1] * .59 + pix[i+2] * .11;
              pix[i  ] = grayscale;   // r
              pix[i+1] = grayscale;   // g
              pix[i+2] = grayscale;   // b
              // alpha
            }
            
            // Draw Background Rect
            ctx.fillStyle = 'rgb(0,0,0)';
            ctx.fillRect(0, 0, World.width, World.height);
                
            ctx.putImageData(imgd, 0, 0);
            ctx.drawImage(canvas, 0, 0);

        } catch(e) {
            console.warn(e.name + ': canvasToBW must be executed on a host (e.g. localhost) to work');
        }
    }

};