const spritesToLoad = {
    char: ['satellite','demon','mantis','pterosaur'],
    particle: ['example','square','knockback','hitEffects',
        'demon', 'mantis'
    ],
    projectile: ['example'],
    stage: ['buddha','buddhaBackground','buddhaPillar',
        'DOCTOR',
    ],
    hud: ['hudRed','hudBlue','capitalDamage','capitalDamageRed','capitalDamageBlue','damage','damageRed','damageBlue',
        'demon','demonStock','mantis','mantisStock'],
    menu: ['charselect','charselectbutton1','charselectbutton2','charselectbutton3','charselectbutton4',
            'backActive','back','smallBackActive','smallBack','bg_empty','bg_white','bg_black','bg_grey','bg_lightgrey','bg_medgrey','bg_darkgrey', 'bg_transDark', 'bg_transMed','bg_transLight',
            'numpadDelete','numpadEnter','activeNumpadDelete','activeNumpadEnter',
            'bigBanana', 'bigBananaActive',
            'smallBanana', 'smallBananaActive',
            'barDark', 'barLight', 'barRed',
            'bananaLoading1', 'bananaLoading2',
            'rebindLeft', 'rebindRight', 'rebindSelection', 'reset', 'resetActive',
            'thumbs',
    ],
    fonts: ['original','medium','small'],
} //it's necessary to hard-code this, since javascript can't/doesn't like to scan folders
function loadMore(name,number){
    for (let c = 0; c < number; c++) spritesToLoad.menu.push(name + c);
}
loadMore('numpad0',10);
loadMore('activeNumpad0',10);


function anim(index,frames,framesPerFrame,nextAnimation,widthOverride){
    //index
    //frames
    //framesPerFrame
    //nextAnimation. omit to loop. set to 'none' to go invis
    //widthOverride: for animations using wider sprites.

    return({
        index: index,
        frames: frames,
        framesPerFrame: framesPerFrame,
        nextAnimation: nextAnimation,
        widthOverride: widthOverride,
    });
} //for ease of adding

const charData = {
    example: {
        info: {
            scale: 1,

            baseWidth: 20,
            baseHeight: 20,

            hullWidth: 8,
            hullHeight: 10,

            friction: 2,
            groundAcceleration: 1,
            groundSpeed: 10,
            airAcceleration: 0.5,
            airSpeed: 6,

            gravity: 0.5,
            fallSpeed: 8,
            jumpStrength: 15,
            doubleJumpStrength: 12,

            jumps: 1,
            recoveries: 1,

            recovery: ['uair'],
        },

        actions: {
            nair: self=>{
                hitbox({
                    owner: self,
                    start: 5,
                    end: 20,
                    x: 0,
                    y: 0,
                    width: 30,
                    height: 30,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: 1.3,
                });

                landPlayer(self); 
                endAction(self,30);
            },
            fair: self=>{
                hitbox({
                    owner: self,
                    start: 5,
                    end: 20,
                    x: 10,
                    y: 0,
                    width: 20,
                    height: 20,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: 1.3,
                });

                self.vx = self.facing * 16;
                self.vy = 0;
                if (self.actionTimer == 10) {
                    self.vx = self.drift * 6;
                    endAction(self,10);
                }
            },
            bair: self=>{
                hitbox({
                    owner: self,
                    start: 5,
                    end: 20,
                    x: -10,
                    y: 0,
                    width: 20,
                    height: 20,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: 2,
                });

                self.vx = -self.facing * 16;
                self.vy = 0;
                if (self.actionTimer == 10) {
                    self.vx = self.drift * 6;
                    endAction(self,10);
                }
            },
            uair: self=>{
                if (self.actionTimer == 20) self.vy = 20;
                endAction(self,60);
            },
            dair: self=>{
                hitbox({
                    owner: self,
                    start: 10,
                    end: 20,
                    x: 0,
                    y: -20,
                    width: 15,
                    height: 30,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: -1.56,

                    meteor: true,
                });

                landPlayer(self); 
                endAction(self,30);
            },

            jab: self=>{
                self.vx *= 0.8;
                
                if (self.actionTimer == 10){
                    self.vx = -self.facing * 10;
                    projectile({
                        owner: self,
                        x: self.x,
                        y: self.y,
                        vx: 6 * self.facing,
                        vy: 0,
                        width: 10,
                        height: 10,

                        behavior: proj=>{
                            hitbox({
                                owner: proj,
                                start: 10, 
                                x: 0,
                                y: 0,
                                width: 12,
                                height: 12,

                                damage: 10,
                                hitstun: 30,
                                hitlag: 4,
                                knockback: 10,
                                scaling: 8,
                                angle: 1.3,

                                projectile: true,
                            });
                        },

                        animation: {
                            spritesheet: 'example',
                            size: 50,
                            spriteSize: 32,
                            animation: anim(0,8,3),
                        },
                    });
                }

                endAction(self,30);
            },
            side: self=>{
                if (self.actionTimer == 1) particle({
                    owner: self.id,
                    x: self.x,
                    y: self.y,
                    vy: 5,
                    
                    age: 60,

                    animation: {
                        spritesheet: 'example',
                        size: 50,
                        spriteSize: 32,
                        animation: anim(0,8,3),
                    },
                });

                endAction(self,30);
            },
        },

        animation: {
            //spritesheet : 'example',
            size: 40,
            spriteSize: 48,
            feet: 4, //pixels to the ground

            //nair: anim(),
        },
    },

    satellite: {
        info: {
            scale: 1,

            baseWidth: 20,
            baseHeight: 20,

            hullWidth: 5,
            hullHeight: 5,

            friction: 0.5,
            groundAcceleration: 1,
            groundSpeed: 6,
            airAcceleration: 0.5,
            airSpeed: 5,

            gravity: 0.2,
            fallSpeed: 4,
            jumpStrength: 8,
            doubleJumpStrength: 12,

            jumps: 0,
            recoveries: 1,

            recovery: [],
        },

        actions: {
            passive: self=>{
                if (self.special.monopropellant == undefined) {
                    self.special.monopropellant = 0;
                    self.special.monopropellantTimer = 0;
                }

                if (self.grounded) {
                    self.special.monopropellant = 3;
                    self.special.monopropellantTimer = 0;
                }
                else if (self.special.monopropellant) {
                    if (self.inputs.jump == 1 && !self.special.monopropellantTimer) {
                        self.inputs.jump = 0.5;

                        self.vy = 0;
                        
                        if (self.vdrift) {
                            self.vy += 6 * self.vdrift;
                            if (self.vy > 8) self.vy = 8;
                        }
                        else if (self.drift) {
                            //if (Math.sign(self.vy) != Math.sign(self.vdrift)) self.vy = 0;
                            
                            self.vy = 4;
                            self.vx = self.drift * 8;
                        }
                        else self.vy = 10;

                        self.special.monopropellant --;
                        self.special.monopropellantTimer = 10;
                    }
                    else if (self.special.monopropellantTimer) self.special.monopropellantTimer--;
                }
            },

            nair: self=>{
                hitbox({
                    owner: self,
                    start: 5,
                    end: 20,
                    x: 0,
                    y: 0,
                    width: 30,
                    height: 30,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: 1.3,
                });

                landPlayer(self); 
                endAction(self,30);
            },
            fair: self=>{
                landPlayer(self);
                endAction(self,40);
            },
            bair: self=>{
                hitbox({
                    owner: self,
                    start: 5,
                    end: 20,
                    x: -10,
                    y: 0,
                    width: 20,
                    height: 20,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 10,
                    scaling: 8,
                    angle: 2,
                });

                self.vx = -self.facing * 16;
                self.vy = 0;
                if (self.actionTimer == 10) {
                    self.vx = self.drift * 6;
                    endAction(self,10);
                }
            },
            uair: self=>{
                landPlayer(self);
                endAction(self,40);
            },

            jab: self=>{
                self.vx *= 0.8;
                
                if (self.actionTimer == 10){
                    self.vx = -self.facing * 10;
                    projectile({
                        owner: self,
                        x: self.x,
                        y: self.y,
                        vx: 6 * self.facing,
                        vy: 0,
                        width: 10,
                        height: 10,

                        behavior: proj=>{
                            hitbox({
                                owner: proj,
                                start: 10, 
                                x: 0,
                                y: 0,
                                width: 12,
                                height: 12,

                                damage: 10,
                                hitstun: 30,
                                hitlag: 4,
                                knockback: 10,
                                scaling: 8,
                                angle: 1.3,

                                projectile: true,
                            });
                        },
                    });
                }

                endAction(self,30);
            },

            emptyLand: self=>{
                endAction(self,10);
            },
        },

        animation: {
            spritesheet: 'satellite',
            size: 60,
            spriteSize: 32,
            feet: 4, //pixels to the ground

            idle: anim(2,2,30,'idle'),
            run: anim(3,2,4,'run'),
            skid: anim(4,2,4,'skid'),
            fall: anim(7,1,60,'fall'),
            jumpsquat: anim(0,0,0,'idle'),
            jump: anim(6,6,4,'fall'),
            emptyLand: anim(8,3,4,'fall'),

            fair: anim(12,6,4,'fall',64),
            uair: anim(16,7,5,'fall'),
        },
    },
    
    demon: {
        info: {
            scale: 1,

            baseWidth: 20,
            baseHeight: 26,

            hullWidth: 8,
            hullHeight: 10,

            friction: 2,
            groundAcceleration: 1,
            groundSpeed: 6,
            airAcceleration: 0.3,
            airSpeed: 5,

            gravity: 0.4,
            fallSpeed: 8,
            jumpStrength: 7,
            doubleJumpStrength: -5,

            jumps: 2,
            recoveries: 1,

            recovery: ['uair'],

            init: self=>{
                self.special = {
                    boost: 0, //for double jumps
                    commandInputs: {right: 0, left: 0, down: 0},
                    inputQueue: [0,0,0],
                    queueTimer: 0, //limits the window for inputs
                    charge: 0, //for special

                    spawnWings: true, //this can't be done in init; must be in passive
                    wings: false,
                }
            }
        },

        actions: {
            passive: self=>{
                //double jump stuff
                if (self.grounded || //grounded
                    self.hitstun || //hit
                    (['nair','fair','bair','dair','uair'].indexOf(self.action) !== -1 && //djc-able action
                    !self.inputs.attack && !self.inputs.cup && !self.inputs.cdown && !self.inputs.cleft && !self.inputs.cright) //attack not held
                ) self.special.boost = 0;

                if (self.special.boost) {
                    self.vy += 1;
                    self.special.boost--;
                }

                //demon punch inputs
                let inputs = ['right','left','down'];
                for (let i = 0; i < 3; i++){
                    if (self.inputs[inputs[i]]) { //if this key is pressed
                        if (!self.special.commandInputs[inputs[i]]){ //only first frame
                            self.special.inputQueue = self.special.inputQueue.slice(1); //cut off oldest entry
                            self.special.inputQueue.push(inputs[i]);
                            self.special.queueTimer = 32; //in half a second, the queue will be wiped
                            self.special.commandInputs[inputs[i]] = 1;
                        } 
                    }
                    else self.special.commandInputs[inputs[i]] = 0;
                }

                //wipe queue
                if (self.special.queueTimer) self.special.queueTimer--;
                if (self.special.queueTimer == 1) {
                    self.special.inputQueue = [0,0,0];
                }

                //activate punch
                if (self.grounded && ['omnilag','omnistun','demonPunch'].indexOf(self.action) == -1 && self.inputs.attack){
                    let queue = self.special.inputQueue;
                    if (
                        (queue[0] == 'right' && queue[1] == 'down' && queue[2] == 'right') || 
                        (queue[0] == 'left' && queue[1] == 'down' && queue[2] == 'left')
                    ) {
                        self.facing = queue[2] == 'right' ? 1 : -1;
                        changeAction(self,'demonPunch');
                        self.actionTimer ++; //changeAction sets it to -1, which isn't drawn until it reaches 0
                    }
                }

                //wings stuff
                if (self.special.spawnWings) {
                    self.special.spawnWings = false;
                    particle({
                        owner: self.id,
                        x: 0,
                        y: -10000,
    
                        behavior: particle=>{
                            let owner = playerList[particle.owner];

                            if (owner.special.wings){
                                if (owner.special.wings == 1) {
                                    owner.special.wings = 0.5;
                                    particle.timer = 0;
                                }

                                particle.facing = owner.facing;
                                particle.x = owner.x - owner.facing * 5;
                                particle.y = owner.y + 33;
                            }
                            else {
                                particle.x = 0;
                                particle.y = -10000;
                            }
                        },
    
                        animation: {
                            spritesheet: 'demon',
                            size: 50,
                            spriteSize: 48,
                            animation: anim(0,6,5,'none'),
                        },
    
                        back: true,
                    });
                }
                if (!self.special.boost || 
                        (self.action == 'bair' && self.actionTimer > 12) ||
                        self.action == 'uair'
                    ) self.special.wings = false;
            },
            doubleJump: self=>{
                if (self.actionTimer == 0) {
                    self.special.boost = 20;
                    self.special.wings = 1;
                    if (self.drift == -Math.sign(self.vx)) self.vx = 0;
                }
                
                cancelAction(self); //if cancel is before land, it overrides it
                landPlayer(self,'hardLand'); //no NILs for you!

                endAction(self,30);
            },

            nair: self=>{
                hitbox({
                    owner: self,
                    start: 4,
                    end: 5,
                    x: 22,
                    y: 36,
                    width: 20,
                    height: 2,

                    damage: 5,
                    hitstun: 30,
                    hitlag: 6,
                    knockback: 5,
                    scaling: 3,
                    angle: 5.9,

                    filter: def=>{if (!def.grounded) return true;},
                });

                hitbox({
                    owner: self,
                    start: 6,
                    end: 16,
                    x: 30,
                    y: 5,
                    width: 20,
                    height: 30,

                    damage: 3,
                    hitstun: 40,
                    hitlag: 5,
                    knockback: 6,
                    scaling: 5,
                    angle: 1.2,

                    particle: 'sideSmall',
                });


                landPlayer(self,'softLand'); 
                endAction(self,30);
            },
            fair: self=>{
                hitbox({
                    owner: self,
                    start: 7,
                    end: 10,
                    x: 30,
                    y: -5,
                    width: 30,
                    height: 20,

                    damage: 6,
                    hitstun: 20,
                    hitlag: 5,
                    knockback: 6,
                    scaling: 8,
                    angle: 1,

                    particle: ['sideSmall','omniLarge'],
                });

                landPlayer(self,'softLand');
                endAction(self,20);
            },
            bair: self=>{
                hitbox({
                    owner: self,
                    start: 14,
                    end: 20,
                    x: -15,
                    y: 0,
                    width: 25,
                    height: 20,

                    damage: 8,
                    hitstun: 30,
                    hitlag: 10,
                    knockback: 10,
                    scaling: 8,
                    angle: 2.56,

                    particle: 'sideLarge',
                    flipParticle: true, 
                });

                landPlayer(self,'hardLand');
                endAction(self,50);
            },
            uair: self=>{
                hitbox({
                    owner: self,
                    start: 18,
                    end: 22,
                    x: 0,
                    y: 35,
                    width: 10,
                    height: 20,

                    damage: 14,
                    hitstun: 30,
                    hitlag: 8,
                    knockback: 11,
                    scaling: 9,
                    angle: 1.5,

                    particle: 'omniLarge',
                });
                hitbox({
                    owner: self,
                    start: 22,
                    end: 30,
                    x: 0,
                    y: 36,
                    width: 20,
                    height: 20,

                    damage: 8,
                    hitstun: 30,
                    hitlag: 5,
                    knockback: 10,
                    scaling: 6,
                    angle: 1.3,

                    particle: 'omniSmall',
                });


                if (self.actionTimer < 16);
                else if (self.actionTimer == 16 && self.vy < 0) self.vy = 0; //if this put you into freefall, it might be more balanced
                else if (self.actionTimer < 22 && self.vy < 9.2) self.vy += 2.8;

                endAction(self,50);
            },
            dair: self=>{
                hitbox({
                    owner: self,
                    start: 18,
                    end: 22,
                    x: 0,
                    y: 10,
                    width: 20,
                    height: 40,

                    damage: 14,
                    hitstun: 20,
                    hitlag: 6,
                    knockback: 8,
                    scaling: 6,
                    angle: 4.8,

                    meteor: true,
                    particle: 'meteor',
                });

                landPlayer(self,'hardLand'); 
                endAction(self,50);
            },

            jab: self=>{
                self.vx *= 0.9;

                hitbox({
                    owner: self,
                    start: 4,
                    end: 10,
                    x: 30,
                    y: -10,
                    width: 25,
                    height: 15,
                    
                    damage: 3,
                    hitlag: 5,
                    angle: 1.4,
                    knockback: 7,
                    scaling: 2,
                    hitstun: 20,

                    particle: 'sideSmall',
                });

                endAction(self,25);
            },
            side: self=>{
                if (self.actionTimer == 0) self.vx = self.facing * 7;
			    else if (self.actionTimer > 12) self.vx *= 0.9;

                hitbox({
                    owner: self,
                    start: 6,
                    end: 12,
                    x: 15,
                    y: 10,
                    width: 25,
                    height: 30,
                    
                    damage: 7,
                    hitlag: 7,
                    angle: 0.9,
                    knockback: 10,
                    scaling: 5,
                    hitstun: 30,

                    particle: ['omniSmall','omniLarge'],
                });

                endAction(self,40);
            },
            high: self=>{
                if (self.actionTimer < 8);
                else if (self.actionTimer < 20) self.vy = 8;
                else if (self.actionTimer == 20) self.vy = 2;

                hitbox({
                    owner: self,
                    start: 8,
                    end: 15,
                    x: 0,
                    y: 25,
                    width: 25,
                    height: 25,
                    
                    damage: 8,
                    hitlag: 7,
                    angle: 1.58,
                    knockback: 8,
                    scaling: 5,
                    hitstun: 30,

                    particle: 'omniSmall',
                });
                
                endAction(self,30);   
            },
            special: self=>{
                self.vx *= 0.9;
    
                if (self.actionTimer == 0) self.special.charge = 0;
                self.special.charge ++;
    
                if (self.actionTimer > 60 || (self.actionTimer > 20 && (!self.inputs.attack && !self.inputs.cdown))) changeAction(self,'specialFinish');
            },
    
            specialFinish: self=>{
                if (self.actionTimer == 0);
                else if (self.actionTimer == 5) self.vx = self.facing * 15;
                else if (self.actionTimer > 5 + self.special.charge/4) self.vx *= 0.8;
    
                hitbox({
                    owner: self,
                    start: 5,
                    end: 5 + Math.floor(self.special.charge/4),
                    x: 20,
                    y: 0,
                    width: 25,
                    height: 15,
                    
                    damage: 4,
                    hitlag: 12,
                    angle: 1.4,
                    knockback: 8,
                    scaling: 0,
                    hitstun: 20,

                    filter: def=>{if (def.hitstun) return true;},
                });
                hitbox({
                    owner: self,
                    start: 5,
                    end: 5 + Math.floor(self.special.charge/4),
                    x: 20,
                    y: 0,
                    width: 25,
                    height: 15,
                    
                    damage: 4,
                    hitlag: 12,
                    angle: 1.4,
                    knockback: 8,
                    scaling: 0,
                    hitstun: 20,

                    effect: (atk,def)=>{
                        def.hitlag = 120;
                    }
                });

                endAction(self,40);
            },
            demonPunch: self=>{
                if (self.actionTimer == 1) {
                    self.status.invincible = true;
                    self.vx = self.facing;
                }
                else if (self.actionTimer < 18) {
                    if (Math.abs(self.vx + 0.4) < 5) self.vx += self.drift * 0.4;
                }
                else if (self.actionTimer == 18) {
                    self.vy = 7;
                }
                
                //end invinc
                else if (self.actionTimer == 30) {
                    self.status.invincible = false;
                }
    
                hitbox({
                    owner: self,
                    start: 16,
                    end: 26,

                    x: 20,
                    y: 20,
                    width: 20,
                    height: 20,

                    hitlag: 10,
                    damage: 14,
                    angle: 1,
                    knockback: 12,
                    scaling: 10,
                    hitstun: 30,

                    particle: 'omniLarge',
                });

                endAction(self,60);
            },

            softLand: self=>{
                self.vx *= 0.8;
                endAction(self,6);
            },
            hardLand: self=>{
                self.vx *= 0.8;
                endAction(self,12);
            },
        },

        animation: {
            spritesheet : 'demon',
            size: 58,
            spriteSize: 48,

            respawning: anim(0,1,60),
            hitlag: anim(0,1,60),
            hitstun: anim(1,1,60),

            idle: anim(2,2,30),
            run: anim(3,4,8),
            skid: anim(4,1,60),

            jumpsquat: anim(5,1,60),
            fall: anim(7,1,60),
            jump: anim(6,1,60),
            doubleJump: anim(8,1,60),

            emptyLand: anim(4,1,60),
            softLand: anim(4,1,60),
            hardLand: anim(4,1,60),

            nair: anim(10,5,5,'fall'),
            fair: anim(12,4,7,'fall'),
            bair: anim(13,6,7,'fall'),
            dair: anim(17,6,6,'fall'), //or 7?
            uair: anim(15,5,8,'fall'),

            jab: anim(9,3,5,'idle'),
            side: anim(11,1,60),
            high: anim(14,3,8,'fall'),
            special: anim(16,3,8),

            specialFinish: anim(18,2,10,'idle'),
            demonPunch: anim(19,6,8,'fall'),
        },
    },

    mantis: {
        info: {
            scale: 1,

            baseWidth: 30,
            baseHeight: 30,

            hullWidth: 8,
            hullHeight: 10,

            friction: 4,
            groundAcceleration: 0.5,
            groundSpeed: 3,
            airAcceleration: 0.3,
            airSpeed: 5,

            gravity: 0.4,
            fallSpeed: 6,
            jumpStrength: 8,
            doubleJumpStrength: 0,

            jumps: 1,
            recoveries: 2,

            recovery: [],

            init: self=>{
                self.special = {
                    spawnWings: true, //this can't be done in init; must be in passive
                    wings: false,
                }
            }
        },

        actions: {
            passive: self=>{
                //console.log(self.action);

                //init
                if (!self.special.init) {
                    self.special.init = true;
                    self.special.hover = 60;
                    self.special.hovering = false;
                }

                //hover
                if (self.grounded) self.special.hover = 60;
                if (self.action != 'uthrow') self.fallSpeedOverride = 0;

                if (
                    !self.grounded && //not on the ground
                    !self.hitstun && //not in hitstun
                    !self.hitlag && //this shouldn't be possible anyway
                    (self.action != 'doubleJump' || self.inputs.down) &&
                    ['uairDash','high','grab','nthrow','fthrow','bthrow','dthrow','uthrow'].indexOf(self.action) == -1 &&
                    self.special.hover && //has hover juice
                        (
                            ((self.inputs.up || self.inputs.jump) && self.vy < 1) ||
                            (self.inputs.jump && self.inputs.down)
                        ) 
                ) {
                    self.special.hovering = true;
                }
                else {
                    self.special.hovering = false;
                    if (self.special.hover < 60) self.special.hover = 0;
                }
                    

                if (self.special.hovering) {
                    self.vy = 0;
                    self.special.hover--;
                }

                //boost (floaty double jump)
                if (
                    !self.grounded &&
                    !self.hitstun &&
                    !self.hitlag &&
                    self.special.boost
                ) {
                    self.vy += 0.8;
                    self.special.boost --;
                }
                else self.special.boost = 0;

                //wings
                if ((
                        self.special.boost || 
                        self.special.hovering ||
                        self.action == 'uairDash' ||
                        self.action == 'doubleJump' ||
                        (self.action == 'uthrow' && self.actionTimer < 51) 
                    ) && (
                        (self.action != 'nair' || self.actionTimer > 15) &&
                        self.action !== 'dair'
                    )
                ) 
                    self.special.wings = true;
                else self.special.wings = false;
                
                if (self.special.spawnWings) {
                    self.special.spawnWings = false;
                    particle({
                        owner: self.id,
                        x: 0,
                        y: -10000,
    
                        behavior: particle=>{
                            let owner = playerList[particle.owner];

                            if (owner.special.wings){
                                particle.facing = owner.facing;
                                particle.x = owner.x - owner.facing * 15;
                                particle.y = owner.y + 40;
                            }
                            else {
                                particle.x = 0;
                                particle.y = -10000;
                            }
                        },
    
                        animation: {
                            spritesheet: 'mantis',
                            size: 70,
                            spriteSize: 48,
                            animation: anim(0,4,2),
                        },
                    });
                    particle({
                        owner: self.id,
                        x: 0,
                        y: -10000,
    
                        behavior: particle=>{
                            let owner = playerList[particle.owner];

                            if (owner.special.wings){
                                particle.facing = owner.facing;
                                particle.x = owner.x - owner.facing * 5;
                                particle.y = owner.y + 40;
                            }
                            else {
                                particle.x = 0;
                                particle.y = -10000;
                            }
                        },
    
                        animation: {
                            spritesheet: 'mantis',
                            size: 70,
                            spriteSize: 48,
                            animation: anim(0,4,2),
                        },
    
                        back: true,
                    });
                }
            },
            doubleJump: self=>{
                if (self.actionTimer == 0) {
                    if (self.inputs.down) {
                        self.jumps ++;
                        endAction(self);
                    }
                    else self.special.boost = 20;
                }
                else if (self.special.hovering){
                    self.special.boost = 0;
                    endAction(self);
                }
                else {
                    cancelAction(self);
                    landPlayer(self);

                    endAction(self,30);
                }
            },


            nair: self=>{
                hitbox({
                    owner: self,
                    start: 6,
                    end: 14,
                    x: -30,
                    y: 10,
                    width: 30,
                    height: 20,

                    damage: 12,
                    hitstun: 30,
                    hitlag: 5,
                    knockback: 7,
                    scaling: 8,
                    angle: 2.6,

                    particle: ['sideSmall','omniLarge'],
                    flipParticle: true,
                });
                hitbox({
                    owner: self,
                    start: 14,
                    end: 18,
                    x: 30,
                    y: 0,
                    width: 40,
                    height: 20,

                    damage: 10,
                    hitstun: 30,
                    hitlag: 5,
                    knockback: 7,
                    scaling: 8,
                    angle: 1.1,

                    particle: ['sideSmall','omniLarge'],
                });

                landPlayer(self,'medLand'); 
                endAction(self,30);
            },
            fair: self=>{
                hitbox({
                    owner: self,
                    start: 9,
                    end: 16,
                    x: 40,
                    y: 20,
                    width: 24,
                    height: 40,

                    damage: 8,
                    hitstun: 30,
                    hitlag: 5,
                    knockback: 7,
                    scaling: 8,
                    angle: 1.1,

                    particle: ['sideSmall','omniLarge'],
                });

                landPlayer(self,'softLand');
                endAction(self,30);
            },
            bair: self=>{
                if (self.actionTimer == 9) self.facing *= -1;

                hitbox({
                    owner: self,
                    start: 9,
                    end: 12,
                    x: 30,
                    y: 0,
                    width: 40,
                    height: 20,

                    damage: 14,
                    hitstun: 30,
                    hitlag: 6,
                    knockback: 10,
                    scaling: 8,
                    angle: 0.8,

                    particle: ['sideSmall','omniLarge'],
                });

                landPlayer(self,'medLand');
                endAction(self,30);
            },
            dair: self=>{
                hitbox({
                    owner: self,
                    start: 9,
                    end: 16,
                    x: 16,
                    y: -16,
                    width: 30,
                    height: 30,

                    damage: 4,
                    hitstun: 20,
                    hitlag: 4,
                    knockback: 6,
                    scaling: 5,
                    angle: 5,

                    meteor: true,

                    particle: ['omniSmall','meteor'],
                });

                landPlayer(self,'medLand'); 
                endAction(self,40);
            },
            uair: self=>{
                if (self.actionTimer == 0) {
                    self.special.uairStrength = 0;
                    self.facing = self.drift || self.facing;
                }
                
                if (self.actionTimer == 8 && ((!self.inputs.attack && !self.inputs.cup) || !self.recoveries)) changeAction(self,'uairCharge');
                else if (self.actionTimer > 12 && ((!self.inputs.attack && !self.inputs.cup) || self.actionTimer > 20)) {
                    self.special.uairStrength = (self.actionTimer >= 18);

                    self.recoveries --;
                    changeAction(self,'uairDash');
                }
    
                landPlayer(self,'medLand');
            },

            uairDash: self=>{
                if (self.actionTimer > self.special.uairStrength * 8 + 14) changeAction(self,'uairFinish');
                else if (self.actionTimer > self.special.uairStrength * 8 + 4) {
                    self.vy *= 0.8;
                    self.vx *= 0.8;
                }
    
                if (self.actionTimer == 0) {
                    if (self.drift == self.facing) {
                        self.vy = 5;
                        self.vx = self.facing * 16;
                    }
                    else if (self.drift == -self.facing) {
                        self.vy = 12;
                        self.vx = self.facing * 2;
                    }
                    else if (!self.drift) {
                        self.vy = 7;
                        self.vx = self.facing * 7;
                    }
                }
                self.vy += 0.4; //cancel gravity
                self.vx -= self.drift * charData[self.char].info.airAcceleration; //cancel air drift
            }, 
            uairCharge: self=>{
                landPlayer(self,'medLand');
                if (self.actionTimer > 8) changeAction(self,'uairFinish');
            }, //just to give uncharged uair a startup animation
            uairFinish: self=>{
                hitbox({
                    owner: self,
                    start: 0,
                    end: 6,
                    x: 25,
                    y: 30,
                    width: 25,
                    height: 30,

                    damage: 12,
                    hitstun: 30,
                    hitlag: 8,
                    knockback: 8,
                    scaling: 10,
                    angle: 0.9,

                    particle: 'omniLarge',
                });

                landPlayer(self,'medLand');
                endAction(self,40);
            },

            jab: self=>{
                self.vx *= 0.8;

                endAction(self,30);
            }, //what should this move be?
            side: self=>{
                self.vx *= 0.9;
            
                hitbox({
                    owner: self,
                    start: 9,
                    end: 16,
                    x: 40,
                    y: 10,
                    width: 24,
                    height: 40,

                    damage: 8,
                    hitstun: 30,
                    hitlag: 6,
                    knockback: 9,
                    scaling: 7,
                    angle: 0.9,

                    particle: ['sideSmall','omniLarge'],
                });

                endAction(self,30);
            },
            special: self=>{
                self.vx *= 0.8;

                endAction(self,30);
            }, //pop-up sweep
            high: self=>{
                if (self.actionTimer < 20) {
                    self.vx *= 0.6;
                }
                else if (self.actionTimer == 20) {
                    self.vy = 5;
                    self.vx = self.facing * 8;
                }
                else {
                    if (self.grounded) self.vx *= 0.6;
                    else {
                        self.vy -= 0.2; //increased gravity
                        self.vx = self.facing * 8;
                    }
    
                    landPlayer(self,'hardLand');
                }
    
                hitbox({
                    owner: self,
                    start: 22,
                    end: 28,
                    x: 50,
                    y: 25,
                    width: 20,
                    height: 40,
                    
                    damage: 4,
                    hitlag: 10,
                    angle: 0,
                    knockback: 0,
                    scaling: 0,
                    hitstun: 10,

                    effect: (atk,def)=>{
                        changeAction(atk,'grab'); 
                        self.actionTimer = 0;

                        def.hitlag = 10;
                        def.vx = 0;
                        def.vy = 0;
                        atk.special.grabTarget = def.id;
                    },
                });
    
                endAction(self,40);
            },

            grab: self=>{
                if (self.special.grabTarget != undefined){
                    let target = playerList[self.special.grabTarget];
                    target.action = 'hitstun';
                    target.hitstun = 60;
                    target.hitlag = 2;
                    target.x = self.x + self.facing * 40;
                    target.y = self.y;
                    if (self.grounded) self.vx *= 0.8;
                    else self.vx = self.facing * 8;
        
                    if (self.actionTimer == 40){
                        if (self.vdrift == 1) changeAction(self,'uthrow');
                        else if (self.vdrift == -1) changeAction(self,'dthrow');
                        else if (self.drift == self.facing) changeAction(self,'fthrow');
                        else if (self.drift == -self.facing) {changeAction(self,'bthrow'); self.facing *= -1;}
                        else changeAction(self,'nthrow');
                    }
                } else changeAction(self,'hardLand')
            },
            nthrow: self=>{
                self.special.grabTarget = undefined;
                hitbox({
                    owner: self,
                    start: 0,
                    end: 2,
                    x: 40,
                    y: 10,
                    width: 20,
                    height: 20,

                    damage: 20,
                    hitstun: 40,
                    hitlag: 14,
                    knockback: 8,
                    scaling: 4,
                    angle: 1,

                    particle: ['sideSmall','omniLarge'],
                });
                
                endAction(self,30);
            },
            uthrow: self=>{
                let target = playerList[self.special.grabTarget];
                target.hitlag = 2;
                target.x = self.x + self.facing * 40;
                target.y = self.y + 40;
    
                if (Math.abs(self.vx) > charData[self.char].info.airSpeed/2) self.vx = Math.sign(self.vx) * charData[self.char].info.airSpeed/2;
    
                if (self.actionTimer == 0) self.facing = self.drift || self.facing;
                if (self.actionTimer < 7){
                    self.vy = 10;
                }
                else if (self.actionTimer < 25){
                   self.vy -= 0.8 - 0.4;
                }
                else if (self.actionTimer < 51){
                    self.vy += 0.8;
                }
                else if (self.actionTimer < 67){
                
                }
                else {
                    self.fallSpeedOverride = 16;
                    target.x = self.x + self.facing * 30;
                    target.y = self.y - 30;
                    self.vy -= 0.8;
                    if (self.grounded) {
                        self.fallSpeedOverride = 0;
                        target.x = self.x + self.facing * 30;
                        target.y = self.y;
                        self.special.grabTarget = undefined;
                        
                        hitbox({
                            owner: self,
                            start: 0,
                            end: 1000,
                            x: 40,
                            y: 10,
                            width: 20,
                            height: 20,
        
                            damage: 16,
                            hitstun: 30,
                            hitlag: 14,
                            knockback: 10,
                            scaling: 8,
                            angle: 1.5,
        
                            particle: 'omniLarge',
                            
                            effect: (atk,def)=>{
                                changeAction(atk,'hardLand');
                                atk.actionTimer = 0;
                            },
                        });
                    }
                }
            },
            fthrow: self=>{
                self.special.grabTarget = undefined;
                
                hitbox({
                    owner: self,
                    start: 0,
                    end: 2,
                    x: 40,
                    y: 10,
                    width: 20,
                    height: 20,

                    damage: 12,
                    hitstun: 30,
                    hitlag: 14,
                    knockback: 10,
                    scaling: 8,
                    angle: 0.8,

                    particle: ['sideSmall','omniLarge'],
                });
                
                endAction(self,20);
            },
            bthrow: self=>{
                let target = playerList[self.special.grabTarget];
                if (self.actionTimer < 4){
                    target.hitlag = 2;
                    target.x = self.x + self.facing * 40;
                    target.y = self.y;
                }
                else {
                    self.special.grabTarget = undefined;
                    hitbox({
                        owner: self,
                        start: 4,
                        end: 6,
                        x: 40,
                        y: 10,
                        width: 20,
                        height: 20,

                        damage: 14,
                        hitstun: 30,
                        hitlag: 14,
                        knockback: 10,
                        scaling: 10,
                        angle: 0.8,

                        particle: ['sideSmall','omniLarge'],
                    });
                }
                
                endAction(self,30);
            },
            dthrow: self=>{
                let target = playerList[self.special.grabTarget];
                if (self.actionTimer < 10){
                    target.hitlag = 2;
                    target.x = self.x + self.facing * 40;
                    target.y = self.y;
                }
                else {
                    self.special.grabTarget = undefined;
                    hitbox({
                        owner: self,
                        start: 10,
                        end: 12,
                        x: 40,
                        y: 10,
                        width: 20,
                        height: 20,

                        damage: 8,
                        hitstun: 30,
                        hitlag: 12,
                        knockback: 8,
                        scaling: 2,
                        angle: 1.4,

                        particle: ['sideSmall','omniLarge'],
                    });
                }

                endAction(self,20);
            },

            softLand: self=>{
                self.vx *= 0.9;
                endAction(self,6);
            },
            medLand: self=>{
                self.vx *= 0.9;
                endAction(self,12);
            },
            hardLand: self=>{
                self.vx *= 0.9;
                endAction(self,20);
            },
        },

        animation: {
            spritesheet : 'mantis',
            size: 70,
            spriteSize: 48,

            respawning: anim(0,1,60),
            hitlag: anim(0,1,60),
            hitstun: anim(1,1,60),

            idle: anim(2,2,30),
            run: anim(3,4,8),
            skid: anim(4,1,60),

            jumpsquat: anim(5,1,60),
            doubleJumpStart: anim(6,1,60),
            fall: anim(6,1,60),
            jump: anim(6,1,60),
            doubleJump: anim(6,1,60),

            emptyLand: anim(5,1,60),
            softLand: anim(5,1,60),
            medLand: anim(5,1,60),
            hardLand: anim(5,1,60),

            nair: anim(9,6,5,'fall'),
            fair: anim(11,7,5,'fall'),
            bair: anim(12,6,5,'fall'),
            dair: anim(14,8,4,'fall'),
            uair: anim(16,1,60),

            jab: anim(8,3,15,'idle'),
            side: anim(10,5,5,'idle'),
            high: anim(15,8,6),
            special: anim(17,1,60),

            grab: anim(19,1,60),
            nthrow: anim(20,1,60),
            uthrow: anim(21,2,54),
            fthrow: anim(22,4,5,'idle'),
            bthrow: anim(23,5,5,'idle'),
            dthrow: anim(10,5,5,'idle'),

            uairDash: anim(17,1,60),
            uairCharge: anim(17,1,60),
            uairFinish: anim(18,3,7.5,'fall'),
            highFinish: anim(27,3,7.5,'idle'),
            specialFinish: anim(13,5,7.5,'idle'),
        },
    },

    pterosaur: {
        info: {
            scale: 1,

            baseWidth: 24,
            baseHeight: 20,

            hullWidth: 10,
            hullHeight: 10,

            friction: 0.5,
            groundAcceleration: 1,
            groundSpeed: 6,
            airAcceleration: 0.25,
            airSpeed: 6,

            gravity: 0.5,
            fallSpeed: 7,
            jumpStrength: 7,
            doubleJumpStrength: 0,

            jumps: 0,

            recovery: [],

            init: self=>{
                self.special = {
                }
            }
        },

        actions: {
            passive: self=>{

            },

            jump: self=>{
                if (self.inputs.jump && self.actionTimer > 10) changeAction(self,'fly');
                
                landPlayer(self);
        
                cancelAction(self);
            },
            fall: self=>{

                landPlayer(self);

                if (self.inputs.jump) changeAction(self,'fly');
                else cancelAction(self);
            },

            fly: self=>{
                if (self.inputs.up) { //hold up to change direction
                    if (self.inputs.left && !self.inputs.right) self.facing = -1;
                    if (!self.inputs.left && self.inputs.right) self.facing = 1;
                }

                if (self.inputs.jump) {
			        if (self.vy < 3) self.vy += 1;
                    else self.vy = 3;
                } else endAction(self);

                if (!self.grounded) cancelAction(self);
            },

            nair: self=>{
                if (self.vy < 2) self.vy += 0.1;
                if (self.grounded) self.vx *= 0.95;
                if (self.inputs.jump && self.actionTimer > 35) changeAction(self,'fly');

                if (self.actionTimer < 3 && self.drift == -self.facing) {
                    self.facing = self.drift || self.facing;
                    self.vx *= -0.8;
                }
                else if (self.actionTimer == 13) self.facing = self.drift || self.facing;

                hitbox({
                    owner: self,
                    start: 14,
                    end: 18,
                    x: 20,
                    y: 0,
                    width: 40,
                    height: 20,

                    damage: 12,
                    hitstun: 30,
                    hitlag: 8,
                    knockback: 10,
                    scaling: 8,
                    angle: 1,

                    particle: 'omniLarge',
                });

                
                if (self.actionTimer < 13 || self.actionTimer > 35) landPlayer(self,'hardLand')
                endAction(self,40);
            },
            fair: self=>{
                if (self.vy < 3) self.vy += 0.2;
                if (self.inputs.jump && self.actionTimer > 20) changeAction(self,'fly');

                hitbox({
                    owner: self,
                    start: 4,
                    end: 9,
                    x: 30,
                    y: 0,
                    width: 20,
                    height: 20,

                    damage: 4,
                    hitstun: 30,
                    hitlag: 4,
                    knockback: 8,
                    scaling: 6,
                    angle: 1,

                    particle: ['sideSmall','omniLarge'],
                });

                landPlayer(self,'softLand');
                endAction(self,25);
            },
            bair: self=>{
                hitbox({
                    owner: self,
                    start: 14,
                    end: 20,
                    x: -15,
                    y: 0,
                    width: 25,
                    height: 20,

                    damage: 8,
                    hitstun: 30,
                    hitlag: 10,
                    knockback: 10,
                    scaling: 8,
                    angle: 2.56,

                    particle: 'sideLarge',
                    flipParticle: true, 
                });

                landPlayer(self,'hardLand');
                endAction(self,50);
            },
            uair: self=>{
                if (self.inputs.cup) {
                    self.vy = 0.5;
                } else endAction(self);
            },
            dair: self=>{
                if (self.vy < 3) self.vy += 0.2;
                if (self.inputs.jump && self.actionTimer > 28) changeAction(self,'fly');

                /* //I don't like having this be a multihit
                for (let c = 0; c < 4; c++){
                    hitbox({
                        owner: self,
                        start: 4 + c * 4,
                        end: 5 + c * 4,
                        x: 5,
                        y: 5,
                        width: 28,
                        height: 34,

                        damage: 2,
                        hitstun: 10,
                        hitlag: 2,
                        knockback: 4,
                        scaling: 0,
                        angle: 1.6 - 0.3 * Math.sign(self.vx),
                        
                        particle: 'omniSmall', //needs its own multihit particle
                    });
                    if (self.actionTimer % 4 == 0) self.hitPlayers = [];
                }
                hitbox({
                    owner: self,
                    start: 20,
                    end: 24,
                    x: 5,
                    y: 5,
                    width: 28,
                    height: 34,

                    damage: 6,
                    hitstun: 30,
                    hitlag: 6,
                    knockback: 8,
                    scaling: 6,
                    angle: 1,
                    
                    particle: 'omniLarge',
                });
                */
                
                
                hitbox({
                    owner: self,
                    start: 4,
                    end: 8,
                    x: 5,
                    y: 5,
                    width: 28,
                    height: 34,

                    damage: 6,
                    hitstun: 30,
                    hitlag: 8,
                    knockback: 10,
                    scaling: 6,
                    angle: 1,
                    
                    particle: 'omniLarge',
                });

                hitbox({
                    owner: self,
                    start: 10,
                    end: 16,
                    x: 5,
                    y: 5,
                    width: 24,
                    height: 30,

                    damage: 6,
                    hitstun: 30,
                    hitlag: 6,
                    knockback: 8,
                    scaling: 6,
                    angle: 1,
                    
                    particle: 'omniSmall',
                });
                

                landPlayer(self,'hardLand'); 
                endAction(self,36);
            },

            jab: self=>{
                self.vx *= 0.9;

                hitbox({
                    owner: self,
                    start: 4,
                    end: 10,
                    x: 30,
                    y: -10,
                    width: 25,
                    height: 15,
                    
                    damage: 3,
                    hitlag: 5,
                    angle: 1.4,
                    knockback: 7,
                    scaling: 2,
                    hitstun: 20,

                    particle: 'sideSmall',
                });

                endAction(self,25);
            },
            side: self=>{
                if (self.actionTimer < 10) self.vx *= 0.8;
			    else if (self.actionTimer == 10) {
                    self.vx = 7 * self.facing;
                    self.vy = 4;
                }
                else if (self.grounded) {
                    self.vx *= 0.8;
                }

                hitbox({
                    owner: self,
                    start: 29,
                    end: 32,
                    x: 15,
                    y: 10,
                    width: 25,
                    height: 30,
                    
                    damage: 7,
                    hitlag: 7,
                    angle: 0.9,
                    knockback: 10,
                    scaling: 5,
                    hitstun: 30,

                    particle: ['omniSmall','omniLarge'],
                });

                endAction(self,40);
            },
            high: self=>{
                if (self.actionTimer < 8);
                else if (self.actionTimer < 20) self.vy = 8;
                else if (self.actionTimer == 20) self.vy = 2;

                hitbox({
                    owner: self,
                    start: 8,
                    end: 15,
                    x: 0,
                    y: 25,
                    width: 25,
                    height: 25,
                    
                    damage: 8,
                    hitlag: 7,
                    angle: 1.58,
                    knockback: 8,
                    scaling: 5,
                    hitstun: 30,

                    particle: 'omniSmall',
                });
                
                endAction(self,30);   
            },
            special: self=>{
                self.vx *= 0.9;
    
                if (self.actionTimer == 0) self.special.charge = 0;
                self.special.charge ++;
    
                if (self.actionTimer > 60 || (self.actionTimer > 20 && (!self.inputs.attack && !self.inputs.cdown))) changeAction(self,'specialFinish');
            },
    
            specialFinish: self=>{
                if (self.actionTimer == 0);
                else if (self.actionTimer == 5) self.vx = self.facing * 15;
                else if (self.actionTimer > 5 + self.special.charge/4) self.vx *= 0.8;
    
                hitbox({
                    owner: self,
                    start: 5,
                    end: 5 + Math.floor(self.special.charge/4),
                    x: 20,
                    y: 0,
                    width: 25,
                    height: 15,
                    
                    damage: 4,
                    hitlag: 12,
                    angle: 1.4,
                    knockback: 8,
                    scaling: 0,
                    hitstun: 20,

                    filter: def=>{if (def.hitstun) return true;},
                });
                hitbox({
                    owner: self,
                    start: 5,
                    end: 5 + Math.floor(self.special.charge/4),
                    x: 20,
                    y: 0,
                    width: 25,
                    height: 15,
                    
                    damage: 4,
                    hitlag: 12,
                    angle: 1.4,
                    knockback: 8,
                    scaling: 0,
                    hitstun: 20,

                    effect: (atk,def)=>{
                        def.hitlag = 120;
                    }
                });

                endAction(self,40);
            },
            demonPunch: self=>{
                if (self.actionTimer == 1) {
                    self.status.invincible = true;
                    self.vx = self.facing;
                }
                else if (self.actionTimer < 18) {
                    if (Math.abs(self.vx + 0.4) < 5) self.vx += self.drift * 0.4;
                }
                else if (self.actionTimer == 18) {
                    self.vy = 7;
                }
                
                //end invinc
                else if (self.actionTimer == 30) {
                    self.status.invincible = false;
                }
    
                hitbox({
                    owner: self,
                    start: 16,
                    end: 26,

                    x: 20,
                    y: 20,
                    width: 20,
                    height: 20,

                    hitlag: 10,
                    damage: 14,
                    angle: 1,
                    knockback: 12,
                    scaling: 10,
                    hitstun: 30,

                    particle: 'omniLarge',
                });

                endAction(self,60);
            },

            softLand: self=>{
                self.vx *= 0.8;
                endAction(self,6);
            },
            hardLand: self=>{
                self.vx *= 0.8;
                endAction(self,12);
            },
        },

        animation: {
            spritesheet : 'pterosaur',
            size: 58,
            spriteSize: 48,
            feet: 12,

            respawning: anim(0,1,60),
            hitlag: anim(0,1,60),
            hitstun: anim(1,1,60),

            idle: anim(2,1,60),
            run: anim(3,6,5),
            skid: anim(4,1,60),

            jumpsquat: anim(5,1,60),
            fall: anim(10,1,60),
            jump: anim(8,1,15,'fallWingless'),
            fallWingless: anim(9,1,60),

            emptyLand: anim(6,1,5,'landEnd'),
            softLand: anim(6,1,5,'landEnd'),
            hardLand: anim(6,1,5,'landEnd'),
            landEnd: anim(7,1,60),

            fly: anim(11,5,8),

            //!!SPIN ATTACK!! should be a barrel-roll, not a frontflip
            nair: anim(13,7,5,'fall'),
            fair: anim(15,5,5,'fall'),
            bair: anim(13,6,7,'fall'),
            dair: anim(18,9,4,'fall'),
            uair: anim(10,5,6),

            jab: anim(9,3,5,'idle'),
            side: anim(14,4,10),
            high: anim(14,3,8,'fall'),
            special: anim(16,3,8),

            specialFinish: anim(18,2,10,'idle'),
            demonPunch: anim(19,6,8,'fall'),
        },
    },
}




const fontData = {
    original: {
        sprite: 'original',
        width: 24,
        height: 32,
    },
    medium: {
        sprite: 'medium',
        width: 16,
        height: 16,
    },
    small: {
        sprite: 'small',
        width: 8,
        height: 9,
    }
}

const stageData = {
    'example': {
        background: '',

        collision: [
            {
                sprite: 'block',
                type: 'solid',
            
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                width: 600,
                height: 400,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},
            },
            {
                sprite: 'block',
                type: 'solid',
            
                x: -500,
                y: 600,
                vx: 0,
                vy: 0,
                width: 100,
                height: 20,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},
            },
            {
                sprite: 'block',
                type: 'semisolid',
            
                x: 200,
                y: 520,
                vx: 0,
                vy: 0,
                width: 100,
                height: 20,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},
            },
            {
                sprite: 'block',
                type: 'solid',
            
                x: -600,
                y: 500,
                vx: 0,
                vy: 0,
                width: 50,
                height: 100,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},
            },
            {
                sprite: 'block',
                type: 'semisolid',
            
                x: 0,
                y: 560,
                vx: 0,
                vy: 0,
                width: 80,
                height: 10,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: collision=>{
                    collision.vx = 6 * Math.cos(0.01 * gameTime);
                },
            },
            {
                type: 'semisolid',
            
                x: -200,
                y: 600,
                vx: 0,
                vy: 0,
                width: 0,
                height: 0,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},

                animation: {
                    spritesheet: 'DOCTOR',
                    size: 400,
                    spriteSize: 180,
                    default: anim(0,161,4,'default',121),
                }
            },
        ],

        blastX: 1000,
        blastY: 1200,

        spawnPositions: [{x: -50, y: 600},{x: 500, y: 600},{x: -200, y: 600},{x: 200, y: 600},{x: 0, y: 600}]
    },

    'buddha': {
        animation: {
            spritesheet: 'buddhaBackground',
            size: 200,
            heightScale: 1,
            spriteSize: 100,
            default: anim(0,1,60),
        },

        collision: [
            {
                type: 'solid',
            
                x: 0,
                y: -120,
                vx: 0,
                vy: 0,
                width: 300,
                height: 300,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},

                animation: {
                    spritesheet: 'buddhaPillar',
                    size: 300,
                    spriteSize: 52,
                    default: anim(0,1,60),
                }
            },
            {
                type: 'semisolid',
            
                x: 0,
                y: 364.6,
                vx: 0,
                vy: 0,
                width: 300,
                height: 0,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},

                animation: {
                    spritesheet: 'buddha',
                    size: 600,
                    spriteSize: 104,
                    default: anim(0,1,60),
                }
            },/*
            {
                type: 'semisolid',
            
                x: 0,
                y: 564.6,
                vx: 0,
                vy: 0,
                width: 0,
                height: 0,
            
                active: true, //visible?
                dead: false, //if true, remove from list
            
                behavior: ()=>{},

                animation: {
                    spritesheet: 'DOCTOR',
                    size: 200,
                    spriteSize: 180,
                    default: anim(0,161,4,'default',121),
                }
            },*/
        ],

        blastX: 750,
        blastY: 800, //based on the image size. could just not show all the image instead

        spawnPositions: [{x: -200, y: 400},{x: 200, y: 400},{x: -80, y: 400},{x: 80, y: 400},{x: 0, y: 400}]
    }
}