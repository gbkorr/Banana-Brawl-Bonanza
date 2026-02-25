

// This file contains all the game code for each character in the original Alpha version of BBB



//https://www.desmos.com/calculator/ecswnz8qb3

const actionData = {
    default: {
        constant: self=>{

            //high damage smoke. you could add '&& !self.status.invisible', but letting you see high-damage invis opponents is pretty balanced
            if (self.damage >= 100 && self.actionTimer % 30 == 0 && self.action !== 'hitstun') newParticle('knockback',self,self.x,self.y,3 * (Math.random() - 0.5),1 + 2 * Math.random(),Math.sign(Math.random() - 0.5)); 

            //refill jumps
            if (self.grounded) {
                self.jumps = charData[self.char].jumps;
                self.usedRecovery = false;
            }

            //remove meteor
            if (self.meteor && !self.hitstun) self.meteor = false;

            //fall off ledge
            if (!self.grounded && ['idle','skid','run'].indexOf(self.action) != -1) changeAction(self,'fallNeutral');

            //land
            if (self.grounded && ['jumpForward','jumpBackward','jumpNeutral','doubleJumpForward','doubleJumpBackward','doubleJumpNeutral','fallForward','fallBackward','fallNeutral'].indexOf(self.action) != -1) {
                changeAction(self,'emptyLand');
            }
            //putting this before jump allows for bhops! normally, emptyland hurts your momentum, but immediately cancelling into jumpsquat removes that

            //jump
            if (self.jump == 1 && ['emptyland','idle','skid','run'].indexOf(self.action) != -1) {
                changeAction(self,'jumpsquat');
                self.jump = 0.5; //depleted, but held
            } //being able to cancel landing lag into jumpsquat could be interesting. it also lets bhops work

            //doublejump
            if (!self.grounded && self.jump == 1 && self.jumps && ['jumpForward','jumpBackward','jumpNeutral','doubleJumpForward','doubleJumpBackward','doubleJumpNeutral','fallForward','fallBackward','fallNeutral'].indexOf(self.action) != -1) {
                changeAction(self,'doubleJumpStart');
                self.jumps --;
                self.jump = 0.5; //depleted, but held
            }
            
            //air drift
            if (!self.grounded && self.drift && self.action != 'stun' && self.action != 'hitstun') {
                let data = charData[self.char];

                if (self.drift == -Math.sign(self.vx) || Math.abs(self.vx + self.drift * data.airAcceleration) <= data.airSpeed) self.vx += self.drift * data.airAcceleration;
                else if (Math.abs(self.vx) < data.airSpeed) self.vx = self.drift * data.airSpeed; //adding this if here (it's missing in this expression in run) means higher speeds aren't capped
            }

            //attack
            if ((self.attack == 1 || self.cstick != 'neutral') && ['idle','skid','run','jumpForward','jumpBackward','jumpNeutral','doubleJumpForward','doubleJumpBackward','doubleJumpNeutral','fallForward','fallBackward','fallNeutral'].indexOf(self.action) != -1){
                if (self.cstick != 'neutral') {
                    if (self.grounded) {
                        self.facing = self.drift || self.facing;
                        if (self.cstick == 'up') changeAction(self,'high');
                        else if (self.cstick == 'down') changeAction(self,'special');
                        else if (self.cstick == 'right') {
                            self.facing = 1;
                            changeAction(self,'side');
                        }
                        else if (self.cstick == 'left') {
                            self.facing = -1;
                            changeAction(self,'side');
                        }
                        //else changeAction(self,'jab'); you can't jab with the cstick!
                    }
                    else {
                        if (self.cstick == 'up') changeAction(self,'uair');
                        else if (self.cstick == 'down') changeAction(self,'dair');
                        else if (self.cstick == 'right') {
                            if (self.facing == 1) changeAction(self,'fair');
                            else changeAction(self,'bair');
                        }
                        else if (self.cstick == 'left') {
                            if (self.facing == -1) changeAction(self,'fair');
                            else changeAction(self,'bair');
                        }
                    }

                    self.cstick = 'neutral';
                    self.attack = 0.5; //I needed some way to hold attack
                }
                else {
                    self.attack = 0.5; //depleted, but held
                    if (self.grounded) {
                        self.facing = self.drift || self.facing;
                        if (self.vdrift) changeAction(self,self.vdrift == 1 ? 'high' : 'special');
                        else if (self.drift) changeAction(self,'side');
                        else changeAction(self,'jab');
                    }
                    else {
                        if (self.vdrift) changeAction(self,self.vdrift == 1 ? 'uair' : 'dair');
                        else if (self.drift) changeAction(self,self.facing == self.drift ? 'fair' : 'bair');
                        else changeAction(self,'nair');
                    }
                }
            }

            //die. can't die after the game ends!
            if (gameState == 'game' && (Math.abs(self.x) >  stageData[stage].blastX || self.y < 0 || (self.y > stageData[stage].blastY && self.action == 'hitstun'))){
                if (Math.abs(self.x) >  stageData[stage].blastX) directionalBurst('KOExplosion',self,30,self.x,self.y,16,Math.atan(-(self.y - stageData[stage].blastY/2)/Math.abs(self.x)),-Math.sign(self.vx),0.2);
                else directionalBurst('KOExplosion',self,30,self.x,self.y,16,Math.PI + Math.PI/2 * Math.sign(self.y - stageData[stage].blastY/2),1,0.2);

                self.stocks --;
                checkGameEnd();
                changeAction(self,'respawning');
            }
        }, //always runs. different from passive; this is purely to control what actions you can cancel out of what

        hitlag: self=>{
            //THIS IS A GREAT PlacE TO PUT SDI: hold direction to move there slightly
            changeAction(self,'hitstun');
        }, //also used for defender hitlag! I'll need to work out player.special when I want to use this for actual stun and not just hitlag
        hitstun: self=>{
            if (Math.sign(self.drift) != Math.sign(self.vx) || Math.abs(self.vx + self.drift * hitstunDriftConstant) < maxHitstunDrift) self.vx += self.drift * hitstunDriftConstant;
            if (Math.sign(self.vdrift) != Math.sign(self.vy) || Math.abs(self.vy + self.vdrift * hitstunDriftConstant/2) < maxHitstunDrift) self.vy += self.vdrift * hitstunDriftConstant/2; //less drift vertically!! half as much! full upwards drift lets you escape any combo

            //hitstun gravity instead of gravity
            self.vy += charData[self.char].gravity; //negates normal gravity
            self.vy -= hitstunGravity;

            //console.log(self.hitstun);

            //particle trail
            let inter =  Math.floor(16 - 0.02 * self.dustKB * self.dustKB);
            if (inter < 5) inter = 5; //TEST THIS
            if (self.dustKB > 5 && self.actionTimer % inter == 0) newParticle('knockback',self,self.x,self.y,0,0,Math.sign(Math.random() - 0.5)); 
            //we want more for horizontal and less for vertical

            if (self.hitstun <= 0) endAction(self);
            else self.hitstun --;
        },
        respawning: self=>{
            self.damage = 0;
            self.x = 0;
            self.vx = 0;
            self.vy = 0;
            self.grounded = true;
            self.usedRecovery = false;
            self.hitPlayers = [];
            self.jumps = charData[self.char].jumps;
            self.status.intangible = true;

            if (self.stocks <= 0) self.y = 10000; //you're out!
            else if ((self.actionTimer > 120 && (self.drift || self.vdrift || self.attack || self.jump)) || self.actionTimer > 360) { //pressing down works! (because vdrift is included)
                self.vx = self.drift * charData[self.char].airSpeed; //cool boost out of respawning— why? I dunno, seems fun.
                changeAction(self,'fallNeutral');
                self.status.intangible = false;
            }
            else if (self.actionTimer > 100) {
                self.y = stageData[stage].respawnY;
            }
            else self.y = 10000;

            //make it frop in from the top!
        },

        idle: self=>{
            if (self.drift) changeAction(self,'run');
            else if (self.vx) changeAction(self,'skid');
        },
        run: self=>{
            if (!self.drift) changeAction(self,'skid');
            else {
                self.facing = self.drift;

                let data = charData[self.char];

                if (Math.sign(self.drift) != Math.sign(self.vx) || Math.abs(self.vx + self.drift * data.groundAcceleration) <= data.groundSpeed) self.vx += self.drift * data.groundAcceleration;
                else self.vx = self.drift * data.groundSpeed;
            }
        },
        skid: self=>{
            let data = charData[self.char];

            if (self.drift) changeAction(self,'run');
            else if (Math.abs(self.vx) - data.friction > 0) self.vx -= Math.sign(self.vx) * data.friction;
            else {
                self.vx = 0;
                changeAction(self,'idle');
            }
        },

        jumpsquat: self=>{
            if (self.actionTimer == 0 && self.drift) self.facing = self.drift;
            else if (self.actionTimer == 2) {
                self.grounded = false; //should be unecessary, but you immediately emptyland if this isn't here :/
                self.vy = charData[self.char].jumpStrength;
                if (self.facing == self.drift) changeAction(self,'jumpForward');
                else if (self.drift == 0) changeAction(self,'jumpNeutral');
                else changeAction(self,'jumpBackward');

                //changeAction(self,{0:'jumpForward',1:'jumpNeutral',2:'jumpBackward'}[Math.abs(self.drift - self.facing)]); //crazy if avoidance instead of the triple if clause; just for funsies (probably worse than using ifs in speed and readability)
            } //2 frames of jumpsquat
        },
        doubleJumpStart: self=>{
            particleBurst('doubleJumpDust',self,10,self.x,self.y,3,0.4);

            self.vy = charData[self.char].doubleJumpStrength;
            self.vx = self.drift * charData[self.char].airSpeed; //this feels bad for characters with high airspeeds! but there isn't much to do...
            if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
            else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
            else changeAction(self,'doubleJumpBackward');
        },

        jumpForward: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallForward');
        },
        jumpBackward: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallBackward');
        },
        jumpNeutral: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallNeutral');
        },
        doubleJumpForward: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallForward');
        },
        doubleJumpBackward: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallBackward');
        },
        doubleJumpNeutral: self=>{
            if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallNeutral');
        },
        fallForward: self=>{
            if (!self.drift) changeAction(self,'fallNeutral');
            else if (self.actionTimer > 6 && self.drift == -self.facing) changeAction(self,'fallBackward');
        },
        fallBackward: self=>{
            if (!self.drift) changeAction(self,'fallNeutral');
            else if (self.actionTimer > 6 && self.drift == self.facing) changeAction(self,'fallForward');
        },
        fallNeutral: self=>{
            if (self.drift == self.facing) changeAction(self,'fallForward');
            else if (self.actionTimer > 6 && self.drift == -self.facing) changeAction(self,'fallBackward');
        },

        emptyLand: self=>{

            //if (self.actionTimer == 0) particleBurst('trackingTest',self,1000,self.x,self.y,1,4); //just a fun test

            endAction(self,3);
        },
    },
    
    bandana: {
        passive: self=>{
        },

        bair: self=>{
            hitbox(self,8,12,-25,0,30,10,5,10,4 * Math.PI/5,8,0.008,30);
            hitbox(self,12,20,-25,-5,30,15,5,7,4 * Math.PI/5,8,0.006,30);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        nair: self=>{
            hitbox(self,4,16,20,8,10,25,3,6,Math.PI/3,7,0.006,30);
            hitbox(self,4,16,-15,8,15,25,3,6,2 * Math.PI/3,7,0.006,30);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,30);
        },
        fair: self=>{
            hitbox(self,6,14,25,25,15,15,4,7,Math.PI/3,8,0.005,30);
            hitbox(self,14,20,30,0,20,15,6,8,Math.PI/4,8,0.006,30);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,30);
        },
        dair: self=>{
            hitbox(self,8,10,0,-20,10,25,8,8,3*Math.PI/2,8,0.004,30,'hit_meteor_strong',(atk,def)=>{if (def.grounded) def.vy *= -1;}); //sweetspot! this one takes priority, so it's easier to hit; having a non-priority sweetspot at the tip of something makes it very difficult to hit (this is how marth's tippers work)
            hitbox(self,8,20,0,-20,10,25,5,6,Math.PI/5,4,0.008,20);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        }, //sweetspot!
        uair: self=>{
            if (self.actionTimer == 0){
                if (!self.usedRecovery) self.usedRecovery = true;
                else endAction(self);
            }
            else {
                if (self.actionTimer < 3) {
                    self.facing = self.drift || 1;
                }

                self.vy = -0.6;
                self.vx *= 0.8;
            }    

            if (self.actionTimer > 30) changeAction(self,'uairFinish');
        },
        //instead of making a move unusable when usedRecovery, give it a crappy version to discourage using it

        jab: self=>{
            self.vx *= 0.9;
            hitbox(self,6,10,10,15,15,20,3,8,Math.PI/2 - 0.02,7,0.005,40);
            //hitbox(self,120,160,0,0,1000,1000,30,8,Math.PI/4,15,0.001,60);

            endAction(self,20);
        },
        side: self=>{
            self.vx *= 0.9;
            hitbox(self,7,12,30,0,20,15,3,8,Math.PI/4,8,0.008,30);

            endAction(self,25);
        },
        high: self=>{
            self.vx *= 0.95;

            if (self.actionTimer < 16) self.charge = 0;
            else self.charge ++;

            if (((self.actionTimer >= 16 && !self.attack) || self.charge == 120)) changeAction(self,'highFinish'); //needs this so you don't get weird stuff online
        },
        special: self=>{
            if (self.actionTimer == 0) self.chargeHealth = self.damage;

            self.vx = 0;

            if (self.actionTimer < 30) self.charge = 0;
            else self.charge ++;
            
            if (self.actionTimer == 60 || (self.actionTimer > 30 && !self.attack)) {
                changeAction(self,'specialPunch');
            }
            else if (self.actionTimer > 5 && (self.drift)) {
                self.vx = 10 * self.drift;
                changeAction(self,'specialDodge');
            }

            if (self.chargeHealth != self.damage) self.armor = 0;
            //get hit
        },

        uairFinish: self=>{
            if (self.actionTimer == 0) self.vy = 20;
            hitbox(self,0,4,15,35,10,20,6,6,Math.PI/2 - 0.1,10,0.01,30);
            hitbox(self,6,30,10,36,20,20,6,6,Math.PI/2 - 0.3,11,0.005,20);

            if (self.actionTimer > 10 && self.grounded) changeAction(self,'hardLand');

            endAction(self,90);
        },
        highFinish: self=>{
            self.vx = 0;
            hitbox(self,6,10,5,20,30,25,6,12 + Math.round(self.charge/10),Math.PI/2 - 0.1,8 + self.charge/100,0.01,40);

            endAction(self,30);
        },
        specialPunch: self=>{
            hitbox(self,2,6,15,10,20,15,12,12,Math.PI/2 - 0.3,12,0.0005,20,'hit_physical_strong',(atk,def)=>{if (atk.charge > 20) def.hitlag = 90});

            endAction(self,30);
        },
        specialDodge: self=>{
            self.vx *= 0.95;

            endAction(self,10);
        },


        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    }, //this is a very simple character that demonstrates a lot of the mechanics.
    demonana: {
        passive: self=>{
            if (self.grounded) {
                self.jumps = charData[self.char].jumps;
                self.usedRecovery = false;
            }

            if (self.action == 'respawning' || self.hitstun) self.special.boost = 0;

            //double jump and canceling
            let attackList = ['nair','fair','bair','dair','uair'];
            if (self.special.boost){
                if ((attackList.indexOf(self.action) != -1 && !self.attack) || self.grounded || self.hitstun) {
                    self.special.boost = 0;
                    self.vy *= 0.5;
                    console.log('boostend');
                } else {
                    self.vy += 0.5;
                    self.special.boost--;
                }
            }
            else self.special.boost = 0;

            //inputs
            if (!self.special.inputs) self.special.inputs = [0,1,2,3,4];

            if (self.drift && self.vdrift) {
                if (self.vdrift == -1) self.special.inputs.push(self.drift == 1 ? 'dright' : 'dleft');
                else self.special.inputs.push(self.drift == 1 ? 'uright' : 'uleft');
            }
            else if (self.drift) self.special.inputs.push(self.drift == 1 ? 'right' : 'left');
            else if (self.vdrift) self.special.inputs.push(self.vdrift == 1 ? 'up' : 'down');
            //bad solution to prevent repeatedly getting the same input
            if (self.special.inputs[self.special.inputs.length - 1] == self.special.inputs[self.special.inputs.length - 2]) self.special.inputs.splice(self.special.inputs.length - 1,1);

            if (self.special.inputs.length > 4) self.special.inputs = self.special.inputs.slice(-5); //only save last 4 inputs

            //demon punch
            if (self.grounded && self.action != 'demonPunch' && self.attack && !self.hitstun) {
                //console.log(self.special.inputs);
                //623
                if ((self.special.inputs[4] == 'dright' && self.special.inputs[3] == 'down' && self.special.inputs[2] == 'right') ||
                    (self.special.inputs[4] == 'dleft' && self.special.inputs[3] == 'down' && self.special.inputs[2] == 'left') ||
                    //easier input (for controllers): 6323 or 63236
                    (self.special.inputs[4] == 'dright' && self.special.inputs[3] == 'down' && self.special.inputs[2] == 'dright' && self.special.inputs[1] == 'right') ||
                    (self.special.inputs[4] == 'dleft' && self.special.inputs[3] == 'down' && self.special.inputs[2] == 'dleft' && self.special.inputs[1] == 'left') ||
                    (self.special.inputs[4] == 'right' && self.special.inputs[3] == 'dright' && self.special.inputs[2] == 'down' && self.special.inputs[1] == 'dright' && self.special.inputs[0] == 'right') ||
                    (self.special.inputs[4] == 'left' && self.special.inputs[3] == 'dleft' && self.special.inputs[2] == 'down' && self.special.inputs[1] == 'dleft' && self.special.inputs[0] == 'left')
                ) {
                    self.special.inputs = [0,1,2,3,4];
                    changeAction(self,'demonPunch');
                }
            }
        },
        doubleJumpStart: self=>{
            newParticle('demonanaWings',self,0,0,0,0,1,true); //WINGS

            self.vy = -5;
		    self.special.boost = 40;
            if (self.drift) self.vx = self.drift * charData[self.char].airSpeed;

            if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
            else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
            else changeAction(self,'doubleJumpBackward');
        },

        onHit: (attacker,defender,data)=>{
            if (!data.isProjectile){
                if(defender.action == 'demonPunch' && defender.actionTimer < 30) {
                    let scaledKB = data.kbBase * Math.pow(2.72,data.kbScaling * defender.damage); //no rage here!
                    let scaledHitlag = Math.floor(data.hitlag * Math.pow(2.72,data.kbScaling * defender.damage));

                    screenshakeStrength = scaledKB/4;
                    directionalBurst('hit',defender,damage,defender.x,defender.y,scaledKB/2,kbAngle,attacker.facing,Math.PI/8);

                    defender.hitlag = scaledHitlag * 2;
                    attacker.hitlag = scaledHitlag * 2;

                    attacker.hitPlayers.push(defender.id);
                } //full invincibility lmao
                else {
                    if (data.damage > 0){ //you can apply effects without putting the opponent in hitstun by using a hitbox with 0 damage. The effect could include adding damage to the opponent!
                        defender.damage += data.damage;
                        if (defender.action == 'special') {//counter
                            //attacker.damage += Math.floor(data.damage/2); //it's a counter because why not
                            hitbox(defender,0,65535,0,0,40,40,4,Math.floor(data.damage/2),1.5-0.4*Math.sign(attacker.x-defender.x),6,0.004,30);
                            newParticle('demonanaEnergy',defender,attacker.x,attacker.y - attacker.height + 20);
                        }
                        let scaledKB = data.kbBase * Math.pow(2.72,data.kbScaling * defender.damage); //no rage here!
                        let scaledHitstun = Math.floor(data.hitstun * Math.pow(2.72,data.kbScaling * defender.damage)); //definitely up for change, and the math could be bad on data one!
                        let scaledHitlag = Math.floor(data.hitlag * Math.pow(2.72,data.kbScaling * defender.damage)); //ditto
            
                        screenshakeStrength = scaledKB/4;
                        directionalBurst('hit',defender,damage,defender.x,defender.y,scaledKB/2,kbAngle,attacker.facing,Math.PI/8);
            
                        changeAction(defender,'stun');
                        defender.actionTimer = 0; //changeAction sets actionTimer to -1, and hitlag prevents that from increasing; thus, it needs to be set here
                        defender.hitstun = scaledHitstun;
                        if (kbAngle > 3.14) defender.meteor = true; //if you want a move to send down and not meteor, use a negative angle
                        defender.facing = Math.sign(attacker.x - defender.x) || 1;
            
                        defender.vx = attacker.facing * scaledKB * Math.cos(data.kbAngle);
                        defender.vy = scaledKB * Math.sin(data.kbAngle);
            
                        defender.hitlag = scaledHitlag;
                        attacker.hitlag = scaledHitlag;
                    }
            
                    attacker.hitPlayers.push(defender.id);
            
                }
            }
            //CRASHES ON PROJECITLE
        },

        bair: self=>{
            hitbox(self,10,16,-35,15,25,25,6,8,2.56,10,0.01,30);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30);
        },
        nair: self=>{
            hitbox(self,4,5,35,-15,10,10,5,6,5.9,5,0.003,30,'hit_physical_strong',()=>{},'aerial'); //this can only be hit directly; you can't drift into it
			hitbox(self,4,20,25,-5,20,20,3,4,1.2,6,0.005,40);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,40);
        },
        fair: self=>{
            hitbox(self,7,10,30,-5,30,20,3,6,0.9,6,0.008,20);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,20);
        },
        dair: self=>{
            hitbox(self,6,12,10,-10,30,20,3,4,1.5 - (0.05 * self.vx * self.facing),7,0.002,30);
            if (self.actionTimer == 20) {
                newParticle('demonanaStomp',self);
                self.hitPlayers = [];
            }
            hitbox(self,22,30,-5,-10,12,40,8,6,4.6,4,0.006,20);

            if (self.grounded) changeAction(self,'softLand');
            endAction(self,50);
        }, //sweetspot!
        uair: self=>{
            if (self.grounded) changeAction(self,'hardLand');

            if (self.actionTimer > 15) changeAction(self,'uairFinish');
        },
        //instead of making a move unusable when usedRecovery, give it a crappy version to discourage using it

        jab: self=>{
            self.vx = 0;

            hitbox(self,20,22,30,0,25,15,16,12,1.4,8,0,20,'hit_physical_strong',()=>{},'onlyStun');
            hitbox(self,20,22,30,0,25,15,4,12,1.4,8,0,20,'hit_physical_strong',(atk,def)=>{def.hitlag = 120});

            endAction(self,60);
        },
        side: self=>{
            if (self.actionTimer == 0) self.vx = self.facing * 7;
			else if (self.actionTimer > 12) self.vx *= 0.9;

            hitbox(self,6,12,15,10,25,30,4,7,0.9,10,0.005,30);

            endAction(self,40);
        },
        high: self=>{
            if (self.actionTimer < 8);
			else if (self.actionTimer < 20) self.vy = 8;
			else if (self.actionTimer == 20) self.vy = 2;

            hitbox(self,8,15,0,25,25,30,3,8,1.57,8,0.005,30);
            endAction(self,30);   
        },
        special: self=>{
            self.vx *= 0.9;
            if (!self.attack) endAction(self);
        },

        uairFinish: self=>{
            if (!self.usedRecovery){
                self.usedRecovery = true;
                if (self.actionTimer == 0) {
                    if (self.vy < 0) {
                        self.vy = 12;
                    }
                    else self.vy += 8;

                    newParticle('demonanaEnergy',self,self.x,self.y - self.height + 40);
                }
                if (self.vy > 12) hitbox(self,0,4,15,35,10,20,6,14,1.5,11,0.01,30);
                hitbox(self,6,30,10,36,20,20,3,8,1.3,10,0.006,30);

                if (self.grounded) changeAction(self,'hardLand');

                endAction(self,40);
            }
            else {
                if (self.actionTimer == 0) self.vy = 6;
        
                hitbox(self,6,30,10,36,20,20,3,8,1.3,10,0.006,30);

                if (self.grounded) changeAction(self,'hardLand');

                endAction(self,30);
            }
        },
        demonPunch: self=>{
            if (self.actionTimer == 0) {
                self.facing = self.drift || self.facing;
                self.vx = self.facing;
            }
            else if (self.actionTimer < 18) {
                if (Math.abs(self.vx + 0.4) < 5 && self.drift == self.facing) self.vx += self.facing * 0.4;
            }
			else if (self.actionTimer == 18) {
				self.vy = 7;
			}
            else if (self.actionTimer > 18) {
                if (self.drift == self.facing) self.vx = self.facing * 3;
                else self.vx = self.facing * 2;
            }

            hitbox(self,16,26,20,25,20,30,8,14,1,16,0.0065,30,'hit_physical_strong',(atk)=>{newParticle('demonanaEnergy',atk,atk.x + atk.facing * 40,atk.y);});

            endAction(self,60);
        },
        missileRecovery: self=> {
			endAction(self,40);
		},


        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    }, //a character ported from the original. this and bandana won't go in the final cast
    goose: {
        passive: self=>{
            if (self.grounded) self.meter = charData[self.char].baseMeter;
        },

        bair: self=>{
            hitbox(self,10,16,-60,10,30,20,8,12,2.3,10,0.01,30); //sweetspot
            hitbox(self,10,16,-20,10,30,20,5,8,2.3,10,0.008,30); //sour

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30);
        },
        nair: self=>{
            hitbox(self,6,14,40,0,20,25,3,8,1.1,7,0.008,26);
            hitbox(self,14,18,10,-20,40,20,3,8,2.6,7,0.008,26);
            hitbox(self,20,26,-40,0,20,25,3,8,2,7,0.006,32);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        fair: self=>{
            if (self.grounded) changeAction(self,'hardLand');

            if (self.actionTimer > 12) changeAction(self,'fairFinish');
        },
        dair: self=>{

            if (self.meter > 0) { //around 1 second of boost, or 3 dairs
                self.meter --;
                    
                let boost = 1;
                let min = -5;
                let max = 2;

                if (self.vy < min) self.vy = min;
                if (self.vy + boost < max) self.vy += boost;
                else if (self.vy < max) self.vy = max;
            }

            self.facing = Math.sign(self.vx) || self.facing;
            
            if (self.meter > 0) self.meter --;
            else endAction(self);

            if (self.grounded) changeAction(self,'hardLand');

            if (!self.attack && self.actionTimer > 10) endAction(self);
        },
        uair: self=>{
            self.facing = self.drift || self.facing;

            if (self.meter > 0){
                if (self.vy < -5) self.vy *= 0.5;
                self.vy += 0.5;

                if (self.drift){
                    if (Math.abs(self.vx + 0.2 * self.drift) < 4) self.vx += self.drift * 0.2;
                    else self.vx = Math.sign(self.vx) * 4;
                }
                else if (Math.abs(self.vx) > 0.2) self.vx -= Math.sign(self.vx) * 0.2;
                else self.vx = 0;

                if (self.vdrift){
                    if (Math.abs(self.vy + 0.2 * self.vdrift) < 4) self.vy += self.vdrift * 0.2;
                    else self.vy = Math.sign(self.vy) * 4;
                }
                else if (Math.abs(self.vy) > 0.2) self.vy -= Math.sign(self.vy) * 0.2;
                else self.vy = 0;
            
                self.meter --;
            }
            else self.vy = -2;

            if (self.grounded) changeAction(self,'softLand');
            if (!self.attack) endAction(self);
        },
        //instead of making a move unusable (which gives you a weird visual) when usedRecovery, give it a crappy version to discourage using it

        jab: self=>{
            self.vx *= 0.9;
            hitbox(self,6,10,20,0,30,20,3,8,0.8,10,0.005,30);

            endAction(self,30);
        },
        side: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 4) changeAction(self,'sideCharge');
        }, //this is just to get the intro animation before it loops
        high: self=>{
            self.vx *= 0.8;
            hitbox(self,10,20,40,50,30,40,4,10,1.4,8,0.008,30);

            endAction(self,40);
        },
        special: self=>{
            self.vx *= 0.9;
            hitbox(self,7,12,20,20,10,10,4,12,-Math.PI/5,6,0.006,20,'hit_physical_strong',(atk,def)=>{
                changeAction(atk,'throw'); 
                def.hitlag = 10;
                def.vx = 0;
                def.vy = 0;
                atk.special.grabTarget = def;
            }); //overhead (spikes aerial opponents)

            endAction(self,40);
        },
        throw: self=>{
            if (self.actionTimer < 10){
                self.special.grabTarget.hitlag = 2;
                self.special.grabTarget.x = self.x + self.facing * 40;
                self.special.grabTarget.y = self.y;
            }
            else if (self.actionTimer < 20){
                self.special.grabTarget.x = self.x + Math.cos(Math.PI * (self.actionTimer - 10)/10) * self.facing * 40;
                self.special.grabTarget.y = self.y + Math.sin(Math.PI * (self.actionTimer - 10)/10) * 40;
            }
            self.vx *= 0.8;

            if (self.actionTimer == 20){
                self.special.grabTarget = undefined;
                hitbox(self,20,21,-40,0,10,10,4,20,2,6,0.008,30,'hit_meteor_strong',(atk,def)=>{def.hitlag += 10;});
            }

            endAction(self,30);
        },
        

        fairFinish: self=>{
            hitbox(self,0,6,20,20,30,20,10,12,1.2,8,0.01,30); //weaker early hit
            hitbox(self,6,25,25,0,30,40,10,16,1,8,0.012,30); //stronger late hit

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30)
        },
        uairFinish: self=>{
            if (self.actionTimer == 0) {
                self.vy = 18;
                newParticle('TEMPExplosion',self,self.x,self.y - 20);
            }

            //the added hitlag helps the strong second hit hit
            hitbox(self,0,4,0,-20,30,20,16,6,3 * Math.PI/2,10,0.01,30,(atk,def)=>{atk.hitlag += 2; if (def.grounded) def.vy *= -1;}); //bounce up if grounded
            if (self.actionTimer == 5) self.hitPlayers = []; //allows a double-hit
            hitbox(self,6,8,10,0,30,50,8,12,1.5,12,0.008,30); //strong starting hit
            hitbox(self,6,30,10,30,30,30,4,6,1.4,8,0.004,30); //weak later hit

            if (self.actionTimer > 10 && self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        sideCharge: self=>{
            self.vx *= 0.9;

            if (self.actionTimer < 16) self.charge = 0;
            else self.charge ++;

            if (((self.actionTimer >= 16 && !self.attack) || self.charge == 120)) changeAction(self,'sideFinish'); //needs this so you don't get weird stuff online
        
        },
        sideFinish: self=>{
            //base damage should be high, and charge shouldn't change it much <<<<<<<<<

            self.vx = 0;
            hitbox(self,6,10,25,0,40,20,6,20,0.7,12,0.012,30);

            endAction(self,30);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    }, //this is a goose

    fist: {
        passive: self=>{
            if (self.grounded) self.meter = charData[self.char].baseMeter;
        },

        vaultsquat: self=>{
            self.jump = 0;
            if (self.actionTimer == 4) { //remember this is already after 10 frames of special
                self.grounded = false; //should be unecessary, but you immediately emptyland if this isn't here :/
                changeAction(self,'vault');
                if (self.facing == self.drift) {
                    self.vy = 10;
                    self.vx = 10 * self.facing;   
                }
                else {
                    self.vy = 13;
                    self.vx = 5 * self.facing;
                }

            }
        },
        vault: self=>{
            if (self.attack) {
                if (self.vdrift) changeAction(self,self.vdrift == 1 ? 'uair' : 'dair');
                else if (self.drift) changeAction(self,self.facing == self.drift ? 'fair' : 'bair');
                else changeAction(self,'nair');
            }
            else if (self.jump) {
                changeAction(self,'doubleJumpStart'); //double jump???
                self.jump = 0;
            }
            else if (self.vy < charData[self.char].fallthreshold) changeAction(self,'fallForward');
        },

        bair: self=>{
            hitbox(self,10,16,-60,10,30,20,8,12,2.3,10,0.01,30); //sweetspot
            hitbox(self,10,16,-20,10,30,20,5,8,2.3,10,0.008,30); //sour

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30);
        },
        nair: self=>{
            hitbox(self,6,14,40,0,20,25,3,8,1.1,7,0.008,26);
            hitbox(self,14,18,10,-20,40,20,3,8,2.6,7,0.008,26);
            hitbox(self,20,26,-40,0,20,25,3,8,2,7,0.006,32);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        fair: self=>{
            if (self.grounded) changeAction(self,'hardLand');

            if (self.actionTimer > 12) changeAction(self,'fairFinish');
        },
        dair: self=>{

            if (self.meter > 0) { //around 1 second of boost, or 3 dairs
                self.meter --;
                    
                let boost = 1;
                let min = -5;
                let max = 2;

                if (self.vy < min) self.vy = min;
                if (self.vy + boost < max) self.vy += boost;
                else if (self.vy < max) self.vy = max;
            }

            self.facing = Math.sign(self.vx) || self.facing;
            
            if (self.meter > 0) self.meter --;
            else endAction(self);

            if (self.grounded) changeAction(self,'hardLand');

            if (!self.attack && self.actionTimer > 10) endAction(self);
        },
        uair: self=>{
            if (self.actionTimer == 0){
                if (!self.usedRecovery) {
                    self.usedRecovery = true;
                    if (Math.abs(self.vx) > 5) self.vx = Math.sign(self.vx) * 5;
                }
                else changeAction(self,'dair'); //in this case, it puts you into dair
            }
            else {
                if (self.actionTimer < 2) {
                    self.facing = self.drift || self.facing;
                    if (self.drift) self.vx = Math.abs(self.vx) * self.facing;
                }

                self.vy *= 0.6;
                //lock drift
                //self.vx += -self.drift * charData[self.char].airAcceleration;
            }    

            if (self.actionTimer > 20) changeAction(self,'uairFinish');
        },
        //instead of making a move unusable (which gives you a weird visual) when usedRecovery, give it a crappy version to discourage using it

        jab: self=>{
            self.vx *= 0.9;
            hitbox(self,6,10,20,0,30,20,3,8,0.8,10,0.005,30);

            endAction(self,30);
        },
        side: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 4) changeAction(self,'sideCharge');
        }, //this is just to get the intro animation before it loops
        high: self=>{
            self.vx *= 0.8;
            hitbox(self,10,20,40,50,30,40,4,10,1.4,8,0.008,30);

            endAction(self,40);
        },
        special: self=>{

            self.vx *= 0.9;
            hitbox(self,7,12,20,20,30,20,4,12,-Math.PI/5,6,0.006,20,'hit_physical_strong',()=>{},'aerial'); //overhead (spikes aerial opponents)
            if (self.grounded) hitbox(self,12,20,30,0,50,25,4,8,1.4,8,0.005,35); //ground smash (popup)

            if (self.actionTimer == 10) self.attack = 0;

            if (self.grounded){
                if (self.actionTimer == 12) directionalBurst('fistSmash',self,10,self.x + 45 * self.facing,self.y - 20,6,Math.PI/2 - 0.3,self.facing,1); //particleBurst('fistSmash',self,10,self.x + 45 * self.facing,self.y - 20,3,2); //ground particles
                else if (self.actionTimer > 12 && self.actionTimer < 30 && self.up && self.attack == 1) {
                    self.x += self.facing * 30;
                    changeAction(self,'high'); //into high
                }
                else if (self.actionTimer > 12 && self.actionTimer < 30 && self.jump == 1) changeAction(self,'vaultsquat'); //can cancel into jump! great for combos
            }

            endAction(self,40);
        },
//ADD BACKRATIO PARTICLES TO THIS SPLASH

        fairFinish: self=>{
            hitbox(self,0,6,20,20,30,20,10,12,1.2,8,0.01,30); //weaker early hit
            hitbox(self,6,25,25,0,30,40,10,16,1,8,0.012,30); //stronger late hit

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30)
        },
        uairFinish: self=>{
            if (self.actionTimer == 0) {
                self.vy = 18;
                newParticle('TEMPExplosion',self,self.x + self.facing * 20,self.y - 20,0,0,self.facing);
            }

            //the added hitlag helps the strong second hit hit
            hitbox(self,0,4,0,-20,30,20,16,6,3 * Math.PI/2,10,0.01,30,'hit_physical_strong',(atk,def)=>{atk.hitlag += 2; if (def.grounded) def.vy *= -1;}); //bounce up if grounded
            if (self.actionTimer == 5) self.hitPlayers = []; //allows a double-hit
            hitbox(self,6,8,10,0,30,50,8,12,1.5,12,0.008,30); //strong starting hit
            hitbox(self,6,30,10,30,30,30,4,6,1.4,8,0.004,30); //weak later hit

            if (self.actionTimer > 10 && self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        sideCharge: self=>{
            self.vx *= 0.9;

            if (self.actionTimer < 16) self.charge = 0;
            else self.charge ++;

            if (((self.actionTimer >= 16 && !self.attack) || self.charge == 120)) changeAction(self,'sideFinish'); //needs this so you don't get weird stuff online
        
        },
        sideFinish: self=>{
            //base damage should be high, and charge shouldn't change it much <<<<<<<<<

            self.vx = 0;
            hitbox(self,6,10,25,0,40,20,6,20,0.7,12,0.012,30);

            endAction(self,30);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    },
    mantis: {
        passive: self=>{
            if (self.grounded || self.vy < 0) self.special.wings = false;
            if (self.action == 'respawning') {
                self.meter = 0;
                self.boost = 0;
                self.special.grabTarget = undefined;
            }

            if (!self.special.spawnedWings) {
                self.special.spawnedWings = true;
                newParticle('mantisWingFront',self);
                newParticle('mantisWingBack',self,0,0,0,0,1,true);
            } //spawn wings

            if (self.grounded) {
                self.meter = charData[self.char].baseMeter;
            }
            else if (!self.grounded && self.jump && self.meter && (self.vy <= 0 || self.down) && (['respawning','high','hitlag','hitstun','specialFinish','grab','nthrow','fthrow','bthrow','uthrow','dthrow'].indexOf(self.action) == -1)){
                self.special.wings = true; //show wings
                if (self.actionTimer > 0 && ['jumpForward','jumpBackward','jumpNeutral','doubleJumpForward','doubleJumpBackward','doubleJumpNeutral'].indexOf(self.action) != -1) changeAction(self,self.vx * self.facing > 3 ? 'fallForward' : 'fallNeutral'); //switch to falling animation
                if (self.vy <= 0) {
                    self.vy = 0;
                }
                else if (self.down) self.vy *= 0.9;
                self.meter --;
            }

            if (self.special.boost && ['hitlag','hitstun'].indexOf(self.action) == -1) {
                self.vy += 0.6;
                self.special.boost --;
            } //for floaty double jump
            else self.special.boost = 0;
            
            if (['hitstun','hitlag','special','uairDash','doubleJumpStart','doubleJumpForward','doubleJumpBackward','doubleJumpNeutral'].indexOf(self.action) != -1 || 
                self.action == 'uthrow' && self.actionTimer < 67    
            ) self.special.wings = true;

            if (self.action == 'nair' && (self.actionTimer > 4 && self.actionTimer < 16)) self.special.wings = false;

            //double jump -> attack eats the wings and looks bad; maybe have a little time before hiding wings (but only when !grounded) to make things smoother?
        },

        doubleJumpStart: self=>{
            if (self.down){ //down + jump = hover
                self.jumps = 1;
                endAction(self);
            }
            else {
                self.vy = 0;
                if (self.drift && self.drift != Math.sign(self.vx)) self.vx = 0;
                self.special.boost = 15;
                if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
                else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
                else changeAction(self,'doubleJumpBackward');
            }
        },
        fallForward: self=>{
            if (!self.drift) changeAction(self,'fallNeutral');
            else if (self.actionTimer > 6 && self.drift == -self.facing) changeAction(self,'fallBackward');
        },
        fallBackward: self=>{
            if (!self.drift) changeAction(self,'fallNeutral');
            else if (self.actionTimer > 6 && self.drift == self.facing && self.vx * self.facing > 3) changeAction(self,'fallForward');
        },
        fallNeutral: self=>{
            if (self.actionTimer > 6 && self.drift == self.facing && self.vx * self.facing > 3) changeAction(self,'fallForward');
            else if (self.actionTimer > 6 && self.drift == -self.facing) changeAction(self,'fallBackward');
        },

        bair: self=>{
            if (self.actionTimer == 9) self.facing *= -1;

            hitbox(self,9,16,40,20,24,40,4,8,1.1,7,0.008,26);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30);
        },
        nair: self=>{
            hitbox(self,6,14,-40,0,20,25,3,8,2.6,7,0.008,26);
            hitbox(self,14,18,-10,-20,40,20,3,8,1.1,7,0.008,26);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        fair: self=>{
            hitbox(self,9,16,40,20,24,40,4,8,1.1,7,0.008,26);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,30);
        },
        dair: self=>{
            hitbox(self,12,18,20,-20,30,20,6,8,5,7,0.008,26);

            if (self.grounded) changeAction(self,'medLand');

            endAction(self,40);
        },
        uair: self=>{
            if (self.actionTimer == 0) {
                self.charge = 0;
                self.facing = self.drift || self.facing;
            }
            self.charge ++;
            
            if (self.actionTimer == 8 && (!self.attack || self.usedRecovery)) changeAction(self,'uairCharge');
            else if (self.actionTimer > 12 && (!self.attack || self.actionTimer > 20)) {
                self.charge = Math.floor(self.charge/20); //turns charge into 0 or 1
                self.usedRecovery = true;
                changeAction(self,'uairDash');
            }

            if (self.grounded) changeAction(self,'medLand');
        },

        jab: self=>{
            self.vx *= 0.9;

            hitbox(self,16,24,30,-10,20,20,4,10,1.4,8,0.008,30,'none',(atk,def)=>{
                changeAction(atk,'grab');
                atk.actionTimer = 20; 
                def.hitlag = 10;
                def.vx = 0;
                def.vy = 0;
                atk.special.grabTarget = def;
            });

            endAction(self,38);
        },
        side: self=>{
            self.vx *= 0.9;
            
            hitbox(self,9,16,40,20,24,40,4,8,1.1,7,0.008,26);

            endAction(self,30);
        },
        special: self=>{
            if (self.actionTimer == 0) {
                self.facing = self.drift || self.facing;
                self.grounded = false;
                self.vy = 10;
            }
            else {
                if (self.vy > 0) self.vy -= 0.4;
                else self.vy = 0;
            }

            if (self.actionTimer > 26) {
                if (self.actionTimer > 32 && self.jump) changeAction(self,'fallNeutral')
                else if (!self.attack || self.actionTimer > 40) changeAction(self,'specialFinish');
            }
        },
        high: self=>{
            if (self.actionTimer < 20) {
                self.vx *= 0.6;
            }
            else if (self.actionTimer == 20) {
                self.grounded = false;
                self.vy = 5;
                self.vx = self.facing * 8;
            }
            else {
                if (self.grounded) self.vx *= 0.6;
                else {
                    self.vy -= 0.2; //increased gravity
                    self.vx = self.facing * 8;
                }

                if (self.grounded) changeAction(self,'hardLand');
            }

            hitbox(self,22,28,50,35,20,20,4,10,1.4,8,0.008,30,'none',(atk,def)=>{
                changeAction(atk,'grab'); 
                def.hitlag = 10;
                def.vx = 0;
                def.vy = 0;
                atk.special.grabTarget = def;
            });

            endAction(self,40);
        },

        grab: self=>{
            self.special.grabTarget.hitlag = 2;
            self.special.grabTarget.x = self.x + self.facing * 40;
            self.special.grabTarget.y = self.y;
            if (self.grounded) self.vx *= 0.8;
            else self.vx = self.facing * 8;

            if (self.actionTimer == 40){
                if (self.vdrift == 1) changeAction(self,'uthrow');
                else if (self.vdrift == -1) changeAction(self,'dthrow');
                else if (self.drift == self.facing) changeAction(self,'fthrow');
                else if (self.drift == -self.facing) {changeAction(self,'bthrow'); self.facing *= -1;}
                else changeAction(self,'nthrow');
            }
        },
        nthrow: self=>{
            self.special.grabTarget = undefined;
            hitbox(self,0,2,40,0,10,10,12,20,1,6,0.008,30); //immediately hits
            
            endAction(self,30);
        },
        uthrow: self=>{
            self.special.grabTarget.hitlag = 2;
            self.special.grabTarget.x = self.x + self.facing * 40;
            self.special.grabTarget.y = self.y + 40;

            if (Math.abs(self.vx) > charData[self.char].airSpeed/2) self.vx = Math.sign(self.vx) * charData[self.char].airSpeed/2;

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
                self.special.grabTarget.x = self.x + self.facing * 30;
                self.special.grabTarget.y = self.y - 30;
                self.vy -= 0.8;
                if (self.grounded) {
                    self.special.grabTarget.x = self.x + self.facing * 30;
                    self.special.grabTarget.y = self.y;
                    self.special.grabTarget = undefined;
                    hitbox(self,0,1000,30,0,10,10,12,20,1,6,0.008,30); //immediately hits
                    changeAction(self,'hardLand');
                    //currently I'm grounded during hitlag, but I want to be in the slam during hitlag
                }
            }
        },
        fthrow: self=>{
            self.special.grabTarget = undefined;
            hitbox(self,0,2,40,0,10,10,12,20,1,6,0.008,30); //immediately hits
            
            endAction(self,20);
        },
        bthrow: self=>{
            if (self.actionTimer < 4){
                self.special.grabTarget.hitlag = 2;
                self.special.grabTarget.x = self.x + self.facing * 40;
                self.special.grabTarget.y = self.y;
            }
            else self.special.grabTarget = undefined;
            
            hitbox(self,4,6,40,0,10,10,12,20,1,6,0.008,30); //immediately hits
            
            endAction(self,30);
        },
        dthrow: self=>{
            if (self.actionTimer < 10){
                self.special.grabTarget.hitlag = 2;
                self.special.grabTarget.x = self.x + self.facing * 40;
                self.special.grabTarget.y = self.y;
            }
            else self.special.grabTarget = undefined;
            hitbox(self,10,12,40,0,10,10,12,20,1.3,6,0.008,30); //immediately hits
            
            endAction(self,20);
        },

        uairDash: self=>{console.log(self.charge);
            if (self.actionTimer > self.charge * 8 + 14) changeAction(self,'uairFinish');
            else if (self.actionTimer > self.charge * 8 + 4) {
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
            self.vx -= self.drift * charData[self.char].airAcceleration; //cancel air drift
        }, 
        uairCharge: self=>{
            if (self.grounded) changeAction(self,'medLand');
            if (self.actionTimer > 8) changeAction(self,'uairFinish');
        }, //just to give uncharged uair a startup animation
        uairFinish: self=>{
            hitbox(self,0,6,25,30,25,30,6,14,0.9,8,0.01,30,'hit_physical_strong',atk=>{atk.usedRecovery = false}); //if you hit this, you can recover again!

            if (self.grounded) changeAction(self,'medLand');

            endAction(self,40);
        },

        specialFinish: self=>{
            //base damage should be high, and charge shouldn't change it much <<<<<<<<<

            if (self.actionTimer == 0){
                self.vx = self.facing * (self.facing == self.drift ? 10 : (self.facing == -self.drift ? 1 : 5));
            }

            if (!self.grounded){
                self.vy = -8;
                hitbox(self,0,8,30,0,40,20,12,16,0.7,12,0.008,30);
            }
            else self.vx *= 0.9;
            
            endAction(self,20);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        medLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 20) endAction(self);
        },

    },
    ballistic: {
        passive: self=>{
            if (!self.special.spawnedBackpack) {
                self.special.spawnedBackpack = true;
                newParticle('backpackICBM',self,0,0,0,0,1,true);
                newParticle('backpackLauncher',self,0,0,0,0,1,true);
                newParticle('backpackRack',self,0,0,0,0,1,true);
                newParticle('rackMissile1',self,0,0,0,0,1,true);
                newParticle('rackMissile2',self,0,0,0,0,1,true);
                newParticle('rackMissile3',self,0,0,0,0,1,true);

                self.special.ICBM = {
                    timer: 0,
                    location: [0,0],
                };

                self.special.backpack = {
                    ICBM: true,
                    bazooka: 0,
                    javelin: 0,
                    seeking1: 0,
                    seeking2: 0,
                    seeking3: 0,
                }
            } //spawn backpacks

            if (self.special.backpack.bazooka) self.special.backpack.bazooka --;
            if (self.special.backpack.javelin) self.special.backpack.javelin --;
            if (self.special.backpack.seeking1) self.special.backpack.seeking1 --;
            if (self.special.backpack.seeking2) self.special.backpack.seeking2 --;
            if (self.special.backpack.seeking3) self.special.backpack.seeking3 --;

            if (self.special.ICBM.timer) {
                self.special.ICBM.timer --;
                if (!self.special.ICBM.timer) {
                    //slam hitbox
                    newProjectile('invisible',self,self.special.ICBM.location[0],self.special.ICBM.location[1] + 1070,50,1000,0,0,1,2,()=>{},()=>{},
                        (proj,defender)=>{
                            projectileHitPlayer(proj,defender,0,10,4.71,20,0,30);
                            proj.timer = proj.age;
                        }); //2 frames. particle here!
                    
                    //slam
                    newParticle('ICBMBlur',self,self.special.ICBM.location[0],self.special.ICBM.location[1] + 370,0,0,self.facing);

                    //explosion hitbox
                    newProjectile('invisible',self,self.special.ICBM.location[0],self.special.ICBM.location[1],100,140,0,0,1,20,()=>{},()=>{},
                        (proj,defender)=>{
                            projectileHitPlayer(proj,defender,10,30,1.5,12,0.006,30,()=>{screenshakeStrength = 30});
                            proj.timer = proj.age;
                        });

                    //explosion
                    newParticle('ballisticExplosionLarge',self,self.special.ICBM.location[0],self.special.ICBM.location[1] + 70,0,0,self.facing);
                    

                    screenshakeStrength = 30;
                }
            }

            if (self.action == 'respawning') self.special.backpack = {
                ICBM: true,
                bazooka: 0,
                javelin: 0,
                seeking1: 0,
                seeking2: 0,
                seeking3: 0,
            }
        },



        bair: self=>{
            hitbox(self,10,16,-60,10,30,20,8,12,2.3,10,0.01,30); //sweetspot
            hitbox(self,10,16,-20,10,30,20,5,8,2.3,10,0.008,30); //sour

            if (self.actionTimer == 16) {
                newParticle('ballisticExplosionSmall',self,self.x + self.facing * 10,self.y + 10,-self.facing); //update this!
                self.vx = self.facing * 8;
                self.vy = 6;
            }

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,24);
        },
        nair: self=>{
            hitbox(self,6,14,40,0,20,25,3,8,1.1,7,0.008,26);
            hitbox(self,14,18,10,-20,40,20,3,8,2.6,7,0.008,26);
            hitbox(self,20,26,-40,0,20,25,3,8,2,7,0.006,32);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        fair: self=>{
            if (self.grounded) changeAction(self,'hardLand');

            if (self.actionTimer > 12) changeAction(self,'fairFinish');
        },
        dair: self=>{
            if (self.actionTimer < 14);
            else if (self.actionTimer == 14) {
                if (self.vy < -1) self.vy = 0;
            }
            else if (self.actionTimer < 36) {
                //if (self.vy < -1) self.vy = -1;
                if (self.vy < -1) self.vy += 0.3;
            }
            else {}

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,60);
        },
        uair: self=>{

            if (self.special.backpack.ICBM){
                if (self.actionTimer > 0 || !self.usedRecovery){
                    if (self.actionTimer == 0) {
                        self.vy = 0;
                        self.usedRecovery = true;
                    }

                    self.vx *= 0.9;
                    self.vy += 0.45;

                    if (self.actionTimer % 10 == 0) newParticle('bigTrail',self,self.x,self.y - 30,(Math.random() - 0.5),-Math.random(),self.facing); 

                    if ((self.actionTimer > 60 && !self.attack) || self.actionTimer > 120) {
                        self.facing = self.drift || self.facing;
                        endAction(self);
                    }
                }
                else changeAction(self,'weakUair')
            }
            else endAction(self);
        },
        weakUair: self=>{
            self.vx *= 0.9;
            if (self.vy < 0) self.vy = -2;

            if (self.actionTimer % 16 == 0) newParticle('bigTrail',self,self.x,self.y - 30,(Math.random() - 0.5),-Math.random(),self.facing); 

            if (self.grounded) changeAction(self,'hardLand')

            if ((self.actionTimer > 60 && !self.attack) || self.actionTimer > 120) {
                self.facing = self.drift || self.facing;
                endAction(self);
            }
        },

        jab: self=>{
            self.vx *= 0.9;
            if (self.actionTimer >= 2 && !self.attack){
                if (self.drift && (!self.special.backpack.seeking1 || !self.special.backpack.seeking2 || !self.special.backpack.seeking3)) changeAction(self,'seekingLaunch');
                else if (self.down && !self.special.backpack.javelin) changeAction(self,'javelinLaunch');
                else if (self.up && !self.special.backpack.ICBM) changeAction(self,'ICBMBuild');
                else if (self.up && self.special.backpack.ICBM && !self.special.ICBM.timer) changeAction(self,'ICBMLaunch');
                else if (!self.drift && !self.vdrift && !self.special.backpack.bazooka) changeAction(self,'bazookaLaunch');
                else endAction(self);
            }
        },
        side: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 20) changeAction(self,'sideCharge');
        }, //this is just to get the intro animation before it loops
        high: self=>{
            self.vx *= 0.8;
            hitbox(self,10,20,40,50,30,40,4,10,1.4,8,0.008,30);

            endAction(self,40);
        },
        special: self=>{

            self.vx *= 0.9;
            hitbox(self,7,12,20,20,30,20,4,12,-Math.PI/5,6,0.006,20,()=>{},'aerial'); //overhead (spikes aerial opponents)
            if (self.grounded) hitbox(self,12,20,30,0,50,25,4,8,1.4,8,0.005,35); //ground smash (popup)

            if (self.actionTimer == 10) self.attack = 0;

            if (self.grounded){
                if (self.actionTimer == 12) directionalBurst('fistSmash',self,10,self.x + 45 * self.facing,self.y - 20,6,Math.PI/2 - 0.3,self.facing,1); //particleBurst('fistSmash',self,10,self.x + 45 * self.facing,self.y - 20,3,2); //ground particles
                else if (self.actionTimer > 12 && self.actionTimer < 30 && self.up && self.attack == 1) {
                    self.x += self.facing * 30;
                    changeAction(self,'high'); //into high
                }
                else if (self.actionTimer > 12 && self.actionTimer < 30 && self.jump == 1) changeAction(self,'vaultsquat'); //can cancel into jump! great for combos
            }

            endAction(self,40);
        },


        //improve missile storage: all in one backpack object, and ICBM is a data projectile
        ICBMLaunch: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 30) {
                newParticle('ICBMLaunch',self,self.x - self.facing * 8,self.y + 12,0,0,self.facing,true);
                self.special.backpack.ICBM = false;
                self.special.ICBM.timer = 1800; //30 seconds! also spawn the particle (or do that when the rocket hits the top?)
                self.special.ICBM.location = [self.x - self.facing * 8,self.y];
            }

            endAction(self,60);
        },
        ICBMBuild: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 70) {
                self.special.backpack.ICBM = true;
                endAction(self);
            }
        },
        bazookaLaunch: self=>{
                self.vx *= 0.9;
                if (self.actionTimer == 20) {
                    self.special.backpack.bazooka = 600;
                    newParticle('launcherBackblast',self,self.x - self.facing * 80,self.y + 14,-self.facing * 4,0,self.facing);
                    newParticle('blowback',self,self.x - self.facing * 140,self.y - self.height,-self.facing * 4,0,self.facing);
                    self.vx = -self.facing * 5;
                    
                    newProjectile('ballisticBazooka',self,self.x + self.facing * 20,self.y,10,10,self.facing * 4,0,self.facing,120,
                        proj=>{
                            proj.vx += self.facing * 0.2;
                            if (proj.timer % 10 == 0) newParticle('fastTrail',proj,proj.x,proj.y,0,0,proj.facing); 
                        },
                        proj=>{proj.timer = proj.age; newParticle('ballisticExplosionMedium',proj.owner,proj.x + proj.facing * 20,proj.y + 25,proj.facing * 2,0,proj.facing);},
                        (proj,defender)=>{
                            projectileHitPlayer(proj,defender,8,10,1,8,0.008,30);
                            newParticle('ballisticExplosionMedium',proj.owner,proj.x + proj.facing * 70,proj.y + 25,proj.facing * 2,0,proj.facing);
                            proj.timer = proj.age;
                        }
                    );
                }

                endAction(self,60);
        }, //no AOE?
        javelinLaunch: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 20) {
                self.special.backpack.javelin = 1200;
                self.vx = -self.facing * 2;
                
                newProjectile('ballisticJavelin',self,self.x + self.facing * 20,self.y + 10,20,20,self.facing*4,2,self.facing,65535,
                    proj=>{
                        if (!proj.special.phase) {
                            proj.special.turn = Math.PI/2 - self.facing * 1;
                            proj.special.secondaryTimer = 0;
                            proj.special.phase = 'launch'; //launch,ascent,hover,descent
                            proj.special.hoverSide = Math.sign(proj.vx); //first shows direction, then shows side of stage
                        }


                        if (proj.special.phase == 'launch'){
                            proj.vy -= 0.1; //this one's affected by gravity!

                            if (proj.special.secondaryTimer >= 15) proj.special.phase = 'ascent';
                        }
                        else if (proj.special.phase == 'ascent'){
                            proj.vy -= 0.1;

                            if (proj.special.secondaryTimer < 46) proj.special.turn = mirrorAngle(1.4,proj.special.hoverSide);
                            else if (proj.special.secondaryTimer < 83) {proj.special.turn -= proj.special.hoverSide * 0.12;}
                            else if (proj.special.secondaryTimer < 86) {proj.special.turn -= proj.special.hoverSide * 0.16;} //leaves it at a = 2.79
                            else {
                                proj.special.vy = 0;
                                proj.special.turn = mirrorAngle(0.35,-Math.sign(proj.x));
                                proj.special.hoverSide = Math.sign(proj.x) || 1;
                                proj.special.phase = 'hover';
                            }        

                            proj.vx += 0.3 * Math.cos(proj.special.turn);
                            proj.vy += 0.3 * Math.sin(proj.special.turn);

                            //visual
                            if (proj.special.secondaryTimer < 30) proj.special.turn = mirrorAngle(1,proj.special.hoverSide);
                        }
                        else if (proj.special.phase == 'hover'){
                            
                            if (Math.abs(proj.x) < 10) proj.vy = -1.5;
                            if (proj.special.hoverSide !== Math.sign(proj.x)){
                                if (Math.abs(proj.special.turn - mirrorAngle(0.2,proj.special.hoverSide)) > 0.4) proj.special.turn -= proj.special.hoverSide * 0.1;
                                else {
                                    proj.special.turn = mirrorAngle(0.2,proj.special.hoverSide);
                                    proj.special.hoverSide = Math.sign(proj.x);
                                }
                            }

                            proj.vy -= 0.1;

                            if (Math.abs(proj.vx + 0.3 * Math.cos(proj.special.turn)) < 10) proj.vx += 0.3 * Math.cos(proj.special.turn);
                            else proj.vx = Math.sign(proj.vx) * 10;
                            proj.vy += 0.3 * Math.sin(proj.special.turn);

                            //look for players
                            if (proj.special.secondaryTimer > 400 && Math.abs(proj.vx) > 4 && Math.sign(proj.vx) == -Math.sign(proj.x) && proj.special.hoverSide == Math.sign(proj.x)) {
                                for (let index = 0; index < playerList.length; index ++){
                                    if (proj.owner.id !== playerList[index].id && Math.abs(-proj.facing * 0.5 * (playerList[index].x - proj.x) - (playerList[index].y - proj.y)) < 10) {
                                        proj.special.targetID = index;
                                        proj.special.target = playerList[proj.special.targetID];
                                        proj.special.phase = 'descent';
                                    }
                                }
                            }  
                        }
                        else if (proj.special.phase == 'descent'){
                            proj.special.target = playerList[proj.special.targetID];

                            proj.special.turn = angleTo(
                                proj.x,
                                proj.y,
                                proj.special.target.x + 50 * proj.special.target.vx,
                                proj.special.target.y + 20 * proj.special.target.vy - 20 * Math.abs(proj.vx)
                            );

                            proj.vx += 0.3 * Math.cos(proj.special.turn);
                            proj.vy += 0.3 * Math.sin(proj.special.turn);

                            if (Math.abs(proj.x) > stageData[stage].blastX * 1.5 || proj.y < 0 || proj.y > stageData[stage].blastY * 1.5) proj.timer = proj.age;
                        }

                        //trail
                        if (proj.special.phase != 'launch' && proj.special.secondaryTimer % 8 == 0) newParticle('fastTrail',proj,proj.x,proj.y,-Math.cos(proj.special.turn),-Math.sin(proj.special.turn),proj.facing); //-Math.cos(proj.special.turn),-Math.sin(proj.special.turn)
                           
                        proj.special.secondaryTimer ++;



                        let angleLookup = {
                            0: [1,2],
                            1: [1,1],
                            2: [1,0],
                            3: [1,6],
                            4: [-1,0],
                            5: [-1,1],
                            6: [-1,2],
                            7: [-1,3],
                            8: [-1,4],
                            9: [1,5],
                            10: [1,4],
                            11: [1,3],
                            12: [1,2],
                            13: [1,1],
                        } //floor(turn*2)

                        //rotation using one animation
                        proj.special.turn = ((proj.special.turn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                        proj.facing = angleLookup[Math.round(2*proj.special.turn)][0];
                        proj.timer = angleLookup[Math.round(2*proj.special.turn)][1];
                    },
                    proj=>{
                        proj.timer = proj.age;
                        newParticle('ballisticExplosionSmall',proj.owner,proj.x + proj.facing * 70,proj.y + 25,0,0,proj.facing);
                        //explosion hitbox
                        newProjectile('invisible',proj.owner,proj.x,proj.y + 20,40,40,0,0,1,10,()=>{},()=>{},
                            (proj,defender)=>{
                                projectileHitPlayer(proj,defender,6,10,1.3,8,0.006,30);
                                proj.timer = proj.age;
                        });
                    },
                    (proj,defender)=>{
                        if (proj.special.phase == 'descent'){
                            proj.timer = proj.age;
                            newParticle('ballisticExplosionMedium',proj.owner,proj.x + proj.facing * 70,proj.y + 25,0,0,proj.facing);
                            //explosion hitbox
                            newProjectile('invisible',proj.owner,proj.x,proj.y,40,40,0,0,1,10,()=>{},()=>{},
                                (proj,defender)=>{
                                    projectileHitPlayer(proj,defender,6,10,1.3,8,0.006,30);
                                    proj.timer = proj.age;
                            });
                        }
                        //else projectileHitPlayer(proj,defender,8,10,1,8,0.008,30); pierce not yet implemented! needs a hitPlayers[]
                    }
                );
            }

            endAction(self,30);
        },
        seekingLaunch: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 20) {
                if (self.drift && self.drift !== self.facing) {
                    self.facing = self.drift;
                    self.actionTimer = 10;
                }
                else {
                    newParticle('seekingBlowback',self,self.x - self.facing * 20,self.y + 20,0,0,self.facing,true);

                    self.attack = 0;
                    self.vx = -self.facing * 3;
                    
                    //should have something random at the start! or perhaps each of three missiles shoots at a different angle (THIS IS BETTER)
                    newProjectile('ballisticSeeking',self,self.x,self.y,10,10,self.facing * 3,!self.special.backpack.seeking1 ? 5 : (!self.special.backpack.seeking2 ? 7 : 5),self.facing,65535,
                        proj=>{
                            if (proj.special.secondaryTimer == undefined) {
                                proj.special.secondaryTimer = 0;
                                proj.special.turn = Math.PI/2 - self.facing * 0.5;
                            } //normal timer is being used to show angle
                            else {
                                
                                if (proj.special.secondaryTimer > 10) {
                                    if (!proj.special.targetID) { //targets closest enemy
                                        let closest = [-1,1000]; //player index, distance
                                        for (let index = 0; index < playerList.length; index ++){
                                            let dist = trilength(proj.x-playerList[index].x,proj.y-playerList[index].y);
                                            if (playerList[index].id !== proj.owner.id && dist < closest[1]) closest = [index,dist];
                                        }
                                        if (closest[0] != -1) proj.special.targetID = closest[0]; //like particles and projectiles, I need to indentify index to avoid getting eaten by rollback clones
                                    }
                                    else {
                                        proj.special.target = playerList[proj.special.targetID];

                                        let maxSpeed = 6; //eventually remove this
                                        let accel = 0.3;

                                        if (trilength(proj.x - proj.special.target.x,proj.y - proj.special.target.y) > 100) 
                                            proj.special.turn = angleTo(
                                                proj.x,
                                                proj.y,
                                                (proj.special.target.x + proj.special.target.vx) - 100 * (proj.vx/maxSpeed),
                                                (proj.special.target.y + proj.special.target.vy) - 100 * (proj.vy/maxSpeed)
                                            );
                                        
                                        if (Math.sign(Math.cos(proj.special.turn)) * proj.vx < maxSpeed) proj.vx += accel * Math.cos(proj.special.turn);
                                        if (Math.sign(Math.sin(proj.special.turn)) * proj.vy < maxSpeed) proj.vy += accel * Math.sin(proj.special.turn);
                                    }

                                    
                                }

                                //trail
                                if (proj.special.secondaryTimer % 8 == 0) newParticle('slowTrail',proj,proj.x,proj.y,-Math.cos(proj.special.turn),-Math.sin(proj.special.turn),proj.facing); //-Math.cos(proj.special.turn),-Math.sin(proj.special.turn)

                                proj.special.secondaryTimer ++;
                            }

                            let angleLookup = {
                                0: [1,2],
                                1: [1,1],
                                2: [1,0],
                                3: [1,6],
                                4: [-1,0],
                                5: [-1,1],
                                6: [-1,2],
                                7: [-1,3],
                                8: [-1,4],
                                9: [1,5],
                                10: [1,4],
                                11: [1,3],
                                12: [1,2],
                            } //floor(turn*2)

                            //rotation using one animation
                            proj.special.turn = ((proj.special.turn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                            proj.facing = angleLookup[Math.floor(2*proj.special.turn)][0];
                            proj.timer = angleLookup[Math.floor(2*proj.special.turn)][1];
                        },
                        proj=>{
                            proj.timer = proj.age;
                            newParticle('ballisticExplosionSmall',proj.owner,proj.x + proj.vx*2,proj.y+proj.vy*2,0,0,proj.facing);
                        },
                        (proj,defender)=>{
                            projectileHitPlayer(proj,defender,8,10,1.4,6,0.004,30);
                            newParticle('ballisticExplosionSmall',proj.owner,proj.x + proj.vx*2,proj.y+proj.vy*2,0,0,proj.facing);
                            proj.timer = proj.age;
                        }
                    );

                    if (!self.special.backpack.seeking1) self.special.backpack.seeking1 = 1800;
                    else if (!self.special.backpack.seeking2) self.special.backpack.seeking2 = 1800;
                    else self.special.backpack.seeking3 = 1800;
                }
            }
            else if (self.actionTimer > 30 && self.attack && (!self.special.backpack.seeking1 || !self.special.backpack.seeking2 || !self.special.backpack.seeking3)) {
                changeAction(self,'seekingLaunch');
                self.actionTimer = 19;
            }

            endAction(self,50);
        },

        fairFinish: self=>{
            hitbox(self,0,6,20,20,30,20,10,12,1.2,8,0.01,30); //weaker early hit
            hitbox(self,6,25,25,0,30,40,10,16,1,8,0.012,30); //stronger late hit

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30)
        },
        sideCharge: self=>{
            self.vx *= 0.9;

            if (self.actionTimer < 16) self.charge = 0;
            else self.charge ++;

            if (((self.actionTimer >= 16 && !self.attack) || self.charge == 120)) changeAction(self,'sideFinish'); //needs this so you don't get weird stuff online
        
        },
        sideFinish: self=>{
            //base damage should be high, and charge shouldn't change it much <<<<<<<<<

            self.vx = 0;
            hitbox(self,6,10,25,0,40,20,6,20,0.7,12,0.012,30);

            endAction(self,30);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    },
    flamingo: {
        passive: self=>{
            if (self.special.boost) {
                if (self.action == 'hitlag' || self.action == 'hitstun' || self.grounded) self.special.boost = false;
                else if (self.vy < charData[self.char].doubleJumpStrength) self.vy += 2;
                else self.special.boost = false;
            } //floaty-ish double jump

            if (self.status.intangible && ['special','dair','dairFinish'].indexOf(self.action) == -1) self.status.intangible = false;
        },

        doubleJumpStart: self=>{
            if (self.down && self.drift) self.facing *= -1; //hold down to change direction. weird?

            self.vy = 0;
            self.special.boost = true;
            if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
            else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
            else changeAction(self,'doubleJumpBackward');
        },
        //jumps need more work to be smooth! and how do I turn around?

        bair: self=>{
            self.vx *= 0.9;

            if (self.actionTimer <= 10) self.charge = 0;
            else self.charge ++;

            if (self.grounded) changeAction(self,'hardLand');

            if (((self.actionTimer >= 10 && !self.attack) || self.charge == 40)) changeAction(self,'bairFinish');

        },
        nair: self=>{
            hitbox(self,4,10,20,0,30,20,3,8,1.1,7,0.006,26);
            hitbox(self,10,20,-30,0,20,20,3,8,2,7,0.006,32);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40);
        },
        fair: self=>{
            hitbox(self,6,10,15,10,25,40,3,5,1.4,7,0.008,26);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,30);
        },
        dair: self=>{
            if (self.actionTimer == 4) self.status.intangible = true;
            else if (self.actionTimer == 26) self.status.intangible = false;

            if (self.actionTimer > 20 && self.actionTimer < 40 && self.attack) {
                self.hitPlayers = [];
                changeAction(self,'dairFinish');
            }

            if (self.grounded) changeAction(self,'hardLand');
            
            endAction(self,60);
        },
        uair: self=>{
            self.vx *= 0.9;

            if (self.actionTimer <= 10) self.charge = 0;
            else self.charge ++;

            if (self.grounded) changeAction(self,'hardLand');

            if (((self.actionTimer >= 10 && !self.attack) || self.charge == 30)) changeAction(self,'uairFinish');

        },

        jab: self=>{
            self.vx *= 0.9;
            hitbox(self,6,10,20,0,16,20,3,4,1.4,5,0.005,30);

           // if (self.actionTimer > 8 && self.actionTimer < 20 && self.attack) {
                //self.hitPlayers = [];
                //changeAction(self,'jab2');
            //} //dunno how I feel about the kick
            
            endAction(self,20);
        },
        side: self=>{
            if (self.actionTimer == 0) {
                self.facing = self.drift || self.facing;
                if (Math.abs(self.vx) < 0.8 * charData[self.char].groundSpeed) self.vx = 0.8 * charData[self.char].groundSpeed * self.facing;
            }
            self.vx *= 0.95;

            hitbox(self,4,10,20,-14,30,16,3,5,1.4,8,0.005,30,'hit_physical');

            endAction(self,30);
        },
        high: self=>{
            self.vx *= 0.8;
            hitbox(self,14,20,26,36,30,24,6,4,1.7,6,0,30,'hit_physical_weak',()=>{},'grounded');
            hitbox(self,22,30,-10,36,30,18,6,4,1.4,6,0,30,'hit_physical_weak',()=>{},'grounded');
            hitbox(self,14,20,26,36,30,24,6,4,1.7,2,0,30,'hit_physical_weak',()=>{},'aerial');
            hitbox(self,22,30,-10,36,30,18,6,4,1.4,2,0,30,'hit_physical_weak',()=>{},'aerial');
            if (self.actionTimer == 30) self.hitPlayers = [];
            hitbox(self,31,36,0,36,40,20,8,6,1.5,8,0.008,30,'hit_physical_strong');

            endAction(self,50);
        },
        special: self=>{
            if (self.actionTimer == 4) self.status.intangible = true;
            else if (self.actionTimer == 26) self.status.intangible = false;

            self.vx *= 0.9;
            endAction(self,40);
        },

        jab2: self=>{
            self.vx *= 0.9;
            hitbox(self,10,14,20,0,30,20,3,8,0.8,10,0.005,30);
            
            endAction(self,30);
        },
        bairFinish: self=>{
            if (self.charge) {
                if (self.actionTimer == 0) self.vy = 3;
                else if (self.actionTimer < 10) self.vy += 0.4;
            }

            hitbox(self,7,12,-25,0,35,20,8,12 + Math.floor(self.charge/4),2.5,8,0.009,30,'hit_physical_strong');

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30)
        },
        uairFinish: self=>{
            if (self.charge) {
                if (self.actionTimer == 0) self.vy = 6;
                else if (self.actionTimer < 10) self.vy += 0.3;
            }

            hitbox(self,8,12,20,0,20,25,8,12 + Math.floor(self.charge/4),1.4,8,0.008,30,'hit_physical_strong');
            hitbox(self,12,18,10,40,30,20,6,12 + Math.floor(self.charge/4),1.6,8,0.008,30,'hit_physical_strong');
            hitbox(self,16,22,-30,30,20,20,4,8,2,8,0.006,30,'hit_physical_weak'); //sourspot

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,40)
        },
        dairFinish: self=>{
            hitbox(self,6,10,20,0,30,20,10,8,4.7,10,0.005,30,'hit_meteor_strong');

            if (self.actionTimer > 8) self.status.intangible = false;
            
            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,30);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    },
    demon: {
        passive: self=>{
            if (self.grounded) {
                self.jumps = charData[self.char].jumps;
                self.usedRecovery = false;
            }

            if (self.special.boost){
                if (self.grounded || self.hitstun || (['nair','fair','bair','dair','uair'].indexOf(self.action) !== -1 && !self.attack)) self.special.boost = 0;
                else {
                    self.vy += 0.5;
                    self.special.boost --;
                }
            }

            if (self.status.invincible && self.action !== 'demonPunch') self.status.invincible = false;

            //demon punch input
            if (!self.special.inputs) {
                self.special.inputs = {right: 0, left: 0, down: 0},
                self.special.queue = [0,0,0];
                self.special.queueTimer = 0; //used to limit the time window for inputting
            }
                if (self.right) {
                    if (self.special.inputs.right) {
                        self.special.inputs.right = 0.5;
                    }
                    else {
                        self.special.queue = self.special.queue.slice(1);
                        self.special.queue.push('right');
                        self.special.queueTimer = 30;
                        self.special.inputs.right = 1;
                    }
                }
                else self.special.inputs.right = 0;
                if (self.left) {
                    if (self.special.inputs.left) self.special.inputs.left = 0.5;
                    else {
                        self.special.queue = self.special.queue.slice(1);
                        self.special.queue.push('left');
                        self.special.queueTimer = 30;
                        self.special.inputs.left = 1;
                    }
                }
                else self.special.inputs.left = 0;
                if (self.down) {
                    if (self.special.inputs.down) self.special.inputs.down = 0.5;
                    else {
                        self.special.queue = self.special.queue.slice(1);
                        self.special.queue.push('down');
                        self.special.queueTimer = 30;
                        self.special.inputs.down = 1;
                    }
                    
                }
                else self.special.inputs.down = 0;

            if (self.special.queueTimer <= 0 && self.special.queue[2]) {
                //console.log(self.special.queue);
                self.special.queue = [0,0,0];
            }
            else self.special.queueTimer --;

            //activating demon punch
            if (self.grounded && ['hitlag','hitstun','demonPunch'].indexOf(self.action) == -1 && self.attack){ //I wish I could use self.attack == 1, but it never is due to attacks setting it to 0.5
                let queue = self.special.queue;
                if ((queue[0] == 'right' && queue[1] == 'down' && queue[2] == 'right') || (queue[0] == 'left' && queue[1] == 'down' && queue[2] == 'left')) {
                    self.facing = queue[2] == 'right' ? 1 : -1;
                    changeAction(self,'demonPunch');
                    self.actionTimer ++; //changeAction sets it to -1
                }
            }
        },
        doubleJumpStart: self=>{
            newParticle('demonWings',self,0,0,0,0,1,true); //WINGS

            self.vy = -5;
		    self.special.boost = 40;
         
            if (self.drift) self.vx = self.drift * charData[self.char].airSpeed;

            if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
            else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
            else changeAction(self,'doubleJumpBackward');
        },

        bair: self=>{
            hitbox(self,14,22,-15,0,25,20,6,8,2.56,10,0.009,30);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,50);
        },
        nair: self=>{
            hitbox(self,4,5,22,36,20,2,5,6,-0.8,5,0.003,30,'hit_meteor_weak',()=>{},'aerial'); //this can only be hit directly; you can't drift into it
			hitbox(self,6,16,30,5,20,30,3,4,1.2,6,0.005,40,'hit_physical');

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,30);
        },
        fair: self=>{
            hitbox(self,7,10,30,-5,30,20,3,6,0.9,6,0.008,20);

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,20);
        },
        dair: self=>{
            hitbox(self,18,22,0,10,20,40,8,6,4.8,8,0.006,20,'hit_meteor_strong');

            if (self.grounded) changeAction(self,'hardLand');
            endAction(self,50);
        }, //sweetspot!
        uair: self=>{
            if (self.actionTimer == 15) {
                if (self.vy < 0) {
                    self.vy = self.usedRecovery ? 6 : 12;
                }
                else self.vy += self.usedRecovery ? 6 : 8;

                if (!self.usedRecovery) newParticle('demonEnergy',self,self.x,self.y - self.height + 40);

                self.usedRecovery = true;
            }
            if (self.vy > 6) hitbox(self,12,16,15,35,10,20,6,14,1.5,11,0.01,30);
            hitbox(self,16,30,10,36,20,20,3,8,1.3,10,0.006,30);

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,55);
        },
        //instead of making a move unusable when usedRecovery, give it a crappy version to discourage using it

        jab: self=>{
            self.vx *= 0.9;

            hitbox(self,4,10,30,-10,25,15,3,6,1.4,8,0,20);

            endAction(self,25);
        },
        side: self=>{
            if (self.actionTimer == 0) self.vx = self.facing * 7;
			else if (self.actionTimer > 12) self.vx *= 0.9;

            hitbox(self,6,12,15,10,25,30,4,7,0.9,10,0.005,30);

            endAction(self,40);
        },
        high: self=>{
            if (self.actionTimer < 8);
			else if (self.actionTimer < 20) self.vy = 8;
			else if (self.actionTimer == 20) self.vy = 2;

            hitbox(self,8,15,0,25,25,30,3,8,1.57,8,0.005,30);
            endAction(self,30);   
        },
        special: self=>{
            self.vx *= 0.9;

            if (self.actionTimer == 0) self.charge = 0;
            self.charge ++;



            if (self.actionTimer > 60 || (self.actionTimer > 20 && !self.attack)) changeAction(self,'specialFinish');
        },

        specialFinish: self=>{
            if (self.actionTimer == 0) newParticle('demonStrike',self,self.x + self.facing * 30,self.y - 4,0,0,self.facing);
            else if (self.actionTimer == 5) self.vx = self.facing * 15;
			else if (self.actionTimer > 5 + self.charge/4) self.vx *= 0.8;

            hitbox(self,5,5 + Math.floor(self.charge/4),30,0,25,15,4,12,1.4,8,0,20,'none',()=>{},'onlyStun'); //weak knockaway if opponent already stunned
            hitbox(self,5,5 + Math.floor(self.charge/4),30,0,25,15,4,12,1.4,8,0,20,'none',(atk,def)=>{def.hitlag = 120; newParticle('demonEnergy',atk,atk.x + atk.facing * 40,atk.y + 20);});

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
            else if (self.actionTimer > 18) {
                if (self.drift == self.facing) self.vx = self.facing * 3;
                else self.vx = self.facing * 2;
            }

            //end invinc
            if (self.actionTimer == 30) {
                self.status.invincible = false;
            }

            hitbox(self,16,26,20,20,20,30,8,14,1,16,0.0065,30,'none',(atk)=>{newParticle('demonEnergy',atk,atk.x + atk.facing * 40,atk.y + 20);});

            endAction(self,60);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    },
    crocodile: {
        //super armor on lotsa stuff

        passive: self=>{
            if (self.special.cloakTimer == undefined) {
                self.special.cloakTimer = 0;
                self.special.cloaked = false;
                self.special.nairCancel = false;
            }

            if (self.grounded) {
                self.usedRecovery = false;
                self.special.usedDair = false;
            }

            if (self.status.intangible && ['dair'].indexOf(self.action) == -1) self.status.intangible = false;

            if (self.special.cloakTimer == 1){
                self.special.cloakTimer --;
                self.special.cloaked = false;
                if (!self.grounded) changeAction(self,'decloak');
                else changeAction(self,'hardLand');
            } //meter to show this!

            if (self.special.cloaked){
                if (['hitlag','hitstun','jab','side','high','nair','fair','bair','uair'].indexOf(self.action) !== -1) {
                    self.special.cloaked = false;
                }
                else {
                    if (self.special.cloakTimer % 20 == 0) self.damage ++;
                    self.special.cloakTimer --;
                    self.status.armor = 0;
                    self.status.invisible = true;
                }
                self.meter = self.special.cloakTimer;
            }
            else {
                self.status.armor = 8; //tough guy. needs tweaking!
                self.status.invisible = false;
                self.meter = charData[self.char].baseMeter;
            }
        },

        run: self=>{
            if (!self.drift) changeAction(self,'skid');
            else {
                self.facing = self.drift;

                let data = self.special.cloaked ? {groundSpeed: 8, groundAcceleration: 2} : charData[self.char];

                if (Math.sign(self.drift) != Math.sign(self.vx) || Math.abs(self.vx + self.drift * data.groundAcceleration) <= data.groundSpeed) self.vx += self.drift * data.groundAcceleration;
                else self.vx = self.drift * data.groundSpeed;
            }
        },
        jumpsquat: self=>{
            if (self.actionTimer == 0 && self.drift) self.facing = self.drift;
            else if (self.actionTimer == 12) {
                self.grounded = false;
                self.vy = charData[self.char].jumpStrength;
                if (self.facing == self.drift) changeAction(self,'jumpForward');
                else if (self.drift == 0) changeAction(self,'jumpNeutral');
                else changeAction(self,'jumpBackward');

            } 
        }, //long jumpsquat
        doubleJumpStart: self=>{
            if (!self.special.cloaked) particleBurst('doubleJumpDust',self,10,self.x,self.y,3,0.4); //no particles if cloaked!

            self.vy = charData[self.char].doubleJumpStrength;
            self.vx = self.drift * charData[self.char].airSpeed; //this feels bad for characters with high airspeeds! but there isn't much to do...
            if (self.facing == self.drift) changeAction(self,'doubleJumpForward');
            else if (self.drift == 0) changeAction(self,'doubleJumpNeutral');
            else changeAction(self,'doubleJumpBackward');
        },

        bair: self=>{
            hitbox(self,24,30,-35,20,25,25,8,16,2.2,8,0.008,30,'hit_crush');

            if (self.grounded) changeAction(self,'hardLand');

            endAction(self,50);
        },
        nair: self=>{
            if (self.actionTimer == 0) self.special.nairCancel = false;

            hitbox(self,8,18,-14,16,24,30,5,10,1.5,10,0.006,30,'hit_physical',(atk)=>{atk.special.nairCancel = true});

            if (self.grounded) changeAction(self,'softLand');

            //on hit, can cancel into uair for a hot di read at some percents
            if (self.special.nairCancel && self.up && self.attack == 1) {
                self.hitPlayers = [];
                self.usedRecovery = false;
                changeAction(self,'uair');
            } 

            endAction(self,40);
        },
        fair: self=>{
            hitbox(self,20,30,12,16,26,30,6,12,1.3,8,0.008,20); //high but slow scaling

            if (self.grounded) changeAction(self,'softLand');

            endAction(self,40);
        },
        dair: self=>{
            if (!self.special.cloaked){
                if (!self.special.usedDair) {
                    self.vx *= 0.9;

                    if (self.actionTimer == 10) self.status.intangible = true;

                    if (self.grounded && self.actionTimer < 15) changeAction(self,'hardLand');

                    if (self.actionTimer == 35) {
                        self.special.cloakTimer = 300;
                        self.status.intangible = false;
                        self.special.usedDair = true;
                        self.special.cloaked = true;
                        endAction(self);
                    }
                }
                else endAction(self);
            }
            else changeAction(self,'decloak');
        },
        uair: self=>{
            if (self.grounded) changeAction(self,'hardLand'); //having and else after this prevents the bouncy bananimal glitch
            else if (self.actionTimer == 0) {
                if (!self.usedRecovery){
                    self.vx = 0;
                    self.vy = 15;

                    self.usedRecovery = true;
                }
                else endAction(self);
            }
            else if (self.actionTimer < 20) {
                self.vy -= 0.15;
            }

            hitbox(self,36,42,0,50,20,30,10,20,1.57,10,0.008,30,'hit_crush');

            endAction(self,60);
        },

        jab: self=>{
            self.vx *= 0.9;

            hitbox(self,6,16,-32,6,24,28,4,10,1.4,8,0.005,20);

            endAction(self,30);
        },
        side: self=>{
            if (self.actionTimer == 2) self.vx = self.drift * 5; //lets you do funky movement
            else self.vx *= 0.9;

            hitbox(self,20,30,40,0,24,26,8,16,0.9,10,0.008,30,'hit_crush');

            endAction(self,50);
        },
        high: self=>{
            self.vx *= 0.9;

            hitbox(self,22,30,0,36,32,28,10,20,1.57,8,0.008,30,'hit_crush');
            endAction(self,60);   
        },
        special: self=>{
            if (!self.special.cloaked){
                self.vx *= 0.9;
                if (self.actionTimer == 50) {
                    self.special.cloakTimer = 300; //8 seconds. longer than dair!
                    self.special.cloaked = true;
                    endAction(self);
                }
            }
            else endAction(self);
        },

        decloak: self=>{
            if (self.actionTimer == 0){
                self.special.cloaked = false;
                self.jumps = 1;
                self.vy = 10;
            }

            endAction(self,20);
        },

        softLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 6) endAction(self);
        },
        hardLand: self=>{
            self.vx *= 0.9;
            if (self.actionTimer == 12) endAction(self);
        },

    },
}; 

const charData = {
    bandana: {
        gravity: 0.6,
        terminalVelocity: 8,
        width: 20,
        height: 25,

        friction: 2,
        groundSpeed: 8,
        groundAcceleration: 1,
        airSpeed: 6,
        airAcceleration: 0.6,
            
        jumps: 2,
        jumpStrength: 10,
        doubleJumpStrength: 8,

        fallthreshold: -5, //vy must be below this for the jump animation to end and turn into the freefall animation
    },
    demonana: {
        gravity: 0.4,
        terminalVelocity: 8,
        width: 20,
        height: 30,

        friction: 2,
        groundSpeed: 4, //4
        groundAcceleration: 0.8, //0.8
        airSpeed: 5,
        airAcceleration: 0.3,
            
        jumps: 2,
        jumpStrength: 7,
        doubleJumpStrength: 0,

        fallthreshold: -5, //vy must be below this for the jump animation to end and turn into the freefall animation
    },
    goose: {
        gravity: 0.5,
        terminalVelocity: 6,
        width: 20,
        height: 25,

        friction: 2,
        groundSpeed: 6,
        groundAcceleration: 0.5,
        airSpeed: 6,
        airAcceleration: 0.6,
            
        jumps: 0,
        jumpStrength: 8,
        doubleJumpStrength: 0,

        baseMeter: 180,

        fallthreshold: -5, //vy must be below this for the jump animation to end and turn into the freefall animation
    },

    fist: {
        gravity: 0.6,
        terminalVelocity: 10,
        width: 26,
        height: 30,

        friction: 2,
        groundSpeed: 5,
        groundAcceleration: 1,
        airSpeed: 5,
        airAcceleration: 0.5,
            
        jumps: 1,
        jumpStrength: 9,
        doubleJumpStrength: 10,

        baseMeter: 180, //frames of dair before having to land

        fallthreshold: -5,
    },
    mantis: {
        gravity: 0.4,
        terminalVelocity: 6,
        width: 30,
        height: 30,

        friction: 4,
        groundSpeed: 3,
        groundAcceleration: 0.5,
        airSpeed: 5,
        airAcceleration: 0.3,
            
        jumps: 1,
        jumpStrength: 8,
        doubleJumpStrength: 8,

        baseMeter: 180,

        fallthreshold: -1, //this is quite low for this character so wings go away faster
    },
    ballistic: {
        gravity: 0.4,
        terminalVelocity: 8,
        width: 20,
        height: 30,

        friction: 2,
        groundSpeed: 5,
        groundAcceleration: 1,
        airSpeed: 3,
        airAcceleration: 0.4,
            
        jumps: 1,
        jumpStrength: 8, //for whatever reason, jumpStrength gets an extra frame
        doubleJumpStrength: 9,

        fallthreshold: -2,
    },
    flamingo: {
        gravity: 0.5,
        terminalVelocity: 8,
        width: 26,
        height: 30,

        friction: 0.6,
        groundSpeed: 8,
        groundAcceleration: 0.6,
        airSpeed: 4,
        airAcceleration: 0.5,
            
        jumps: 4,
        jumpStrength: 9, //for whatever reason, jumpStrength gets an extra frame
        doubleJumpStrength: 10,

        fallthreshold: -2,
    },
    demon: {
        gravity: 0.4,
        terminalVelocity: 8,
        width: 20,
        height: 26,

        friction: 2,
        groundSpeed: 6,
        groundAcceleration: 1,
        airSpeed: 5,
        airAcceleration: 0.3,
            
        jumps: 2,
        jumpStrength: 7,
        doubleJumpStrength: 0,

        fallthreshold: -5, //vy must be below this for the jump animation to end and turn into the freefall animation
    },
    crocodile: {
        gravity: 0.4,
        terminalVelocity: 8,
        width: 30,
        height: 24,

        friction: 4,
        groundSpeed: 4,
        groundAcceleration: 1,
        airSpeed: 5,
        airAcceleration: 0.6,
            
        jumps: 1,
        jumpStrength: 11, //for whatever reason, jumpStrength gets an extra frame
        doubleJumpStrength: 9,

        baseMeter: 300,

        fallthreshold: 4,
    },
};

const particleData = {
    knockback: {
        size: 30,
        age: 100,
        spriteSheet: 'knockback',
    },
    hit_physical_weak: {
        size: 16,
        age: 60,
        spriteSheet: 'hitEffects',
    },
    hit_physical: {
        size: 20,
        age: 60,
        spriteSheet: 'hitEffects',
    },
    hit_meteor_weak: {
        size: 24,
        age: 60,
        spriteSheet: 'hitEffects',
    },
    hit_meteor: {
        size: 24,
        age: 60,
        spriteSheet: 'hitEffects',
    },
    hit_blob_1: {
        size: 16,
        age: 35,
        ageVariation: 10,
        spriteSheet: 'hitEffects',
        behavior: self=>{self.vy -= 0.1}
    },
    hit_blob_2: {
        size: 16,
        age: 40,
        ageVariation: 10,
        spriteSheet: 'hitEffects',
        behavior: self=>{self.vy -= 0.1}
    },
    hit_blob_3: {
        size: 16,
        age: 30,
        ageVariation: 10,
        spriteSheet: 'hitEffects',
        behavior: self=>{self.vy -= 0.1}
    },
    hit_spray: {
        size: 10,
        age: 30,
        ageVariation: 10,
        spriteSheet: 'hitEffects',
    },

    doubleJumpDust: {
        size: 2,
        age: 10,
        ageVariation: 8,
    },
    fistSmash: {
        size: 5,
        age: 15,
        ageVariation: 5,
    },
    KOExplosion: {
        size: 5,
        age: 40,
        ageVariation: 20,
    },
    hit: {
        size: 2,
        age: 20,
        ageVariation: 4,
    },
    trackingTest: {
        size: 2,
        age: 600,
        behavior: self=>{
            self.vx += 0.001 * (self.owner.x - self.x);
            self.vy += 0.001 * (self.owner.y - self.y);

            //in a burst, this creates a highly interesting behavior: the whole burst will touch iself at one point each time it switches directions
        },
    },
    demonanaWings: {
        size: 20,
        age: 20,
        spriteSheet: 'demonana',
        behavior: self=>{
            self.facing = self.owner.facing;
            if (self.owner.grounded || self.owner.action == 'uair') self.timer = self.age;
            self.x = self.owner.x - (self.owner.action == 'fair' ? self.owner.facing * 15 : self.owner.facing * 5);
            self.y = self.owner.y + 10;
        },
    },
    demonanaEnergy: {
        size: 30,
        age: 30,
        spriteSheet: 'demonana',
    },
    TEMPExplosion: {
        size: 30,
        age: 60,
        spriteSheet: 'explosions',
    },
   
    demonanaStomp: {
        size: 24,
        age: 20,
        spriteSheet: 'demonana',
        behavior: self=>{
            if (self.owner.grounded) self.timer = self.age;
            self.x = self.owner.x - self.owner.facing * 8;
            self.y = self.owner.y + 20 - 0.8 * self.timer * (12 - 0.4*self.timer);
        },
    },

    mantisWingFront: {
        size: 40,
        age: 65536,
        spriteSheet: 'mantis',
        behavior: self=>{
            self.facing = self.owner.facing;
            if (self.owner.special.wings){
                if (self.owner.action == 'dair'){
                    self.x = self.owner.x - self.owner.facing * 8;
                    self.y = self.owner.y + 22;
                } //dair is too high up so it needs the wings in a different spot
                else {
                    self.x = self.owner.x - self.owner.facing * 15;
                    self.y = self.owner.y + 6;
                }
            }
            else {
                self.y = 10000;
            }
        }, //I want a "deploy/retract" animation for wings
    },
    mantisWingBack: {
        size: 40,
        age: 65536,
        spriteSheet: 'mantis',
        behavior: self=>{
            self.facing = self.owner.facing;
            if (self.owner.special.wings){
                if (self.owner.action == 'dair'){
                    self.x = self.owner.x + self.owner.facing * 2;
                    self.y = self.owner.y + 22;
                } //dair is too high up so it needs the wings in a different spot
                else {
                    self.x = self.owner.x - self.owner.facing * 5;
                    self.y = self.owner.y + 6;
                }
            }
            else {
                self.y = 10000;
            }
        },
    },

    backpackLauncher: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (['nair','bair','dair','side','sideCharge','sideFinish','bazookaLaunch','javelinLaunch'].indexOf(self.owner.action) != -1) self.y = 10000;
            else {
                self.facing = self.owner.facing;
                self.x = self.owner.x - self.owner.facing * 12;
                self.y = self.owner.y;
            }
        },
    },
    backpackICBM: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (self.owner.special.backpack.ICBM){
                self.facing = self.owner.facing;
                self.x = self.owner.x - self.owner.facing * 8;
                self.y = self.owner.y + 12;
            }
            else self.y = 10000;
        },
    },
    backpackRack: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            self.facing = self.owner.facing;
            self.x = self.owner.x + self.owner.facing * 12;
            self.y = self.owner.y + 4;
        },
    },
    rackMissile1: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (!self.owner.special.backpack.seeking1){
                self.facing = self.owner.facing;
                self.x = self.owner.x + self.owner.facing * 12;
                self.y = self.owner.y + 4;
            }
            else self.y = 10000;
        },
    },
    rackMissile2: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (!self.owner.special.backpack.seeking2){
                self.facing = self.owner.facing;
                self.x = self.owner.x + self.owner.facing * 12;
                self.y = self.owner.y + 4;
            }
            else self.y = 10000;
        },
    },
    rackMissile3: {
        size: 30,
        age: 65536,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (!self.owner.special.backpack.seeking3){
                self.facing = self.owner.facing;
                self.x = self.owner.x + self.owner.facing * 12;
                self.y = self.owner.y + 4;
            }
            else self.y = 10000;
        },
    },
    ICBMLaunch: {
        size: 30,
        age: 180,
        spriteSheet: 'ballistic',
        behavior: self=>{
            if (self.timer == 10) {
                newParticle('blowback',self,self.x + 100,self.y - 42,0,0,-1);
                newParticle('blowback',self,self.x - 100,self.y - 42,0,0,1);
            }
            else if (self.timer == 25) {
                newParticle('blowback',self,self.x + 80,self.y - 47,0,0,-1);
                newParticle('blowback',self,self.x - 80,self.y - 47,0,0,1);
            }
            else if (self.timer == 40) {
                newParticle('blowback',self,self.x + 60,self.y - 66,0,0,-1);
                newParticle('blowback',self,self.x - 60,self.y - 66,0,0,1);
            }

            if (self.timer % 6 == 0) {
                if (self.timer < 30) newParticle('bigTrail',self,self.x,self.y - 30,2 * (Math.random() - 0.5),0,self.facing);
                else newParticle('bigTrail',self,self.x,self.y - 30,(Math.random() - 0.5),-Math.random(),self.facing); 
            }
            
            if (self.timer > 10) self.vy += 0.05 + self.timer/2000;
        },
    },

    ballisticExplosionSmall: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    ballisticExplosionMedium: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    ballisticExplosionLarge: {
        size: 50,
        age: 300,
        spriteSheet: 'ballisticExplosions',
    },
    launcherBackblast: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    fastTrail: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    slowTrail: {
        size: 20,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    bigTrail: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    blowback: {
        size: 30,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },
    seekingBlowback: {
        size: 25,
        age: 100,
        spriteSheet: 'ballisticExplosions',
    },

    ICBMBlur: {
        size: 200,
        age: 60,
        spriteSheet: 'ICBMBlur',
    },

    demonWings: {
        size: 30,
        age: 200,
        spriteSheet: 'demon',
        behavior: self=>{
            self.facing = self.owner.facing;
            self.x = self.owner.x - self.owner.facing * 0;
            self.y = self.owner.y + 6;
            
            if (self.owner.grounded || (self.owner.action == 'doubleJumpStart' && self.timer > 1)) self.timer = self.age; //die if you doublejump, land, 
            if (self.owner.action == 'uair') self.timer = self.age;
        },
    },
    demonEnergy: {
        size: 30,
        age: 30,
        spriteSheet: 'demon',
    },
    demonStrike: {
        size: 40,
        age: 120,
        spriteSheet: 'demon',
    },
};

const projectileSprites = {
    invisible: {
        size: 0,
        spriteSheet: 'invisible',
    },
    ballisticBazooka: {
        size: 16,
        spriteSheet: 'ballisticMissiles',
    },
    ballisticJavelin: {
        size: 16,
        spriteSheet: 'ballisticMissiles',
    },
    ballisticSeeking: {
        size: 16,
        spriteSheet: 'ballisticMissiles',
    },
};

//CHANGE: make undefined loop = true so I don't need a million trues
function anim(index,frames,frameRate,loop){
    return ({index: index, frames: frames, frameRate: frameRate, loop: loop});
} //makes implementing these faster
const animationData = {
    char: {
        bandana: {
            size: 30,
            spriteSize: 32,

            respawning: anim(0,1,1,true),
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,2,6,true), //flip this!

            idle: anim(2,2,2,true),
            run: anim(3,4,8,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            doubleJumpStart: anim(5,1,1,true),
            fallNeutral: anim(7,1,1,true),
            fallForward: anim(8,1,1,true),
            fallBackward: anim(9,1,1,true),
            jumpNeutral: anim(10,1,1,true),
            jumpForward: anim(11,1,1,true),
            jumpBackward: anim(12,3,8,'fallBackward'),
            doubleJumpNeutral: anim(13,1,1,true),
            doubleJumpForward: anim(14,3,8,'fallForward'),
            doubleJumpBackward: anim(15,1,1,true),

            emptyLand: anim(6,1,1,true),
            softLand: anim(6,1,1,true),
            hardLand: anim(6,1,1,true),

            nair: anim(17,1,1,true),
            fair: anim(19,4,6,'fallForward'),
            bair: anim(20,3,8,'fallBackward'),
            dair: anim(22,1,1,true),
            uair: anim(24,1,1,true),

            jab: anim(16,2,8,'idle'),
            side: anim(18,1,1,true),
            high: anim(23,1,1,true),
            special: anim(21,1,1,true),

            uairFinish: anim(28,1,1,true),
            highFinish: anim(27,3,8,'idle'),
            specialPunch: anim(26,4,6,'idle'),
            specialDodge: anim(25,1,1,true),
        },
        demonana: {
            size: 35,
            spriteSize: 32,

            respawning: anim(0,1,1,true),
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true), //flip this!

            idle: anim(2,2,2,true),
            run: anim(3,9,8,true),
            skid: anim(3,1,1,true),

            jumpsquat: anim(4,1,1,true),
            doubleJumpStart: anim(5,1,1,true),
            fallNeutral: anim(5,1,1,true),
            fallForward: anim(5,1,1,true),
            fallBackward: anim(5,1,1,true),
            jumpNeutral: anim(5,1,1,true),
            jumpForward: anim(5,1,1,true),
            jumpBackward: anim(5,1,1,true),
            doubleJumpNeutral: anim(5,1,1,true),
            doubleJumpForward: anim(5,1,1,true),
            doubleJumpBackward: anim(5,1,1,true),

            emptyLand: anim(4,1,1,true),
            softLand: anim(4,1,1,true),
            hardLand: anim(4,1,1,true),

            nair: anim(12,5,8,true),
            fair: anim(14,7,8,'fallForward'),
            bair: anim(15,4,8,'fallBackward'),
            dair: anim(22,9,12,'fallNeutral'),
            uair: anim(18,1,1,true),

            jab: anim(11,2,3,'idle'),
            side: anim(13,1,1,true),
            high: anim(18,4,8,'fallNeutral'),
            special: anim(9,9,8,true),

            demonPunch: anim(23,9,12,'fallNeutral'),
            uairFinish: anim(18,4,8,'fallNeutral'),
            missileRecovery: anim(17,1,1,true),
        },
        goose: {
            size: 36,
            spriteSize: 32,

            respawning: anim(0,1,1,true), //todo
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,2,2,true),
            run: anim(3,2,6,true),
            skid: anim(2,1,1,true),

            jumpsquat: anim(4,1,1,true),
            doubleJumpStart: anim(5,1,1,true),
            fallNeutral: anim(5,1,1,true),
            fallForward: anim(5,1,1,true),
            fallBackward: anim(5,1,1,true),
            jumpNeutral: anim(6,4,12,'fallNeutral'),
            jumpForward: anim(6,4,12,'fallForward'),
            jumpBackward: anim(6,4,12,'fallBackward'),

            emptyLand: anim(4,1,1,true),
            softLand: anim(4,1,1,true),
            hardLand: anim(4,1,1,true),

            nair: anim(12,7,12,'fallNeutral'),
            fair: anim(14,1,1,true),
            bair: anim(15,6,12,'fallBackward'),
            dair: anim(17,3,10,true),
            uair: anim(6,4,12,true),

            jab: anim(7,1,1,true),
            side: anim(13,1,1,true),
            high: anim(18,7,12,'idle'),
            special: anim(8,1,1,true),

            throw: anim(9,8,12,'idle'),

            uairFinish: anim(21,1,1,true),
            fairFinish: anim(20,8,12,'fallForward'),
            sideCharge: anim(23,2,12,true),
            sideFinish: anim(24,8,20,'idle'),
        },

        fist: {
            size: 65,
            spriteSize: 48,

            respawning: anim(0,1,1,true), //todo
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,1,1,true),
            run: anim(3,5,7,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            vaultsquat: anim(5,1,1,true),
            vault: anim(22,6,12,'fallForward'),
            doubleJumpStart: anim(5,1,1,true),
            fallNeutral: anim(6,1,1,true),
            fallForward: anim(7,1,1,true),
            fallBackward: anim(8,1,1,true),
            jumpNeutral: anim(6,1,1,true),
            jumpForward: anim(7,1,1,true),
            jumpBackward: anim(8,1,1,true),
            doubleJumpNeutral: anim(9,4,8,true),
            doubleJumpForward: anim(9,4,8,true),
            doubleJumpBackward: anim(9,4,8,true),

            emptyLand: anim(4,1,1,true),
            hardLand: anim(4,1,1,true),

            nair: anim(12,7,12,'fallNeutral'),
            fair: anim(14,1,1,true),
            bair: anim(15,6,12,'fallBackward'),
            dair: anim(17,3,10,true),
            uair: anim(19,1,1,true),

            jab: anim(11,3,8,'idle'),
            side: anim(13,1,1,true),
            high: anim(18,7,12,'idle'),
            special: anim(16,9,16,'idle'),

            uairFinish: anim(21,1,1,true),
            fairFinish: anim(20,8,12,'fallForward'),
            sideCharge: anim(23,2,12,true),
            sideFinish: anim(24,8,20,'idle'),
        },
        mantis: {
            size: 70,
            spriteSize: 48,

            respawning: anim(0,1,1,true),
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,2,2,true),
            run: anim(3,4,4,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            doubleJumpStart: anim(6,1,1,true),
            fallNeutral: anim(6,1,1,true),
            fallForward: anim(7,1,1,true),
            fallBackward: anim(6,1,1,true),
            jumpNeutral: anim(6,1,1,true),
            jumpForward: anim(7,1,1,true),
            jumpBackward: anim(6,1,1,true),
            doubleJumpNeutral: anim(6,1,1,true),
            doubleJumpForward: anim(7,1,1,true),
            doubleJumpBackward: anim(6,1,1,true),

            emptyLand: anim(5,1,1,true),
            softLand: anim(5,1,1,true),
            medLand: anim(5,1,1,true),
            hardLand: anim(5,1,1,true),

            nair: anim(9,6,12,'fallNeutral'),
            fair: anim(11,7,12,'fallForward'),
            bair: anim(12,6,12,'fallForward'),
            dair: anim(14,8,14,true),
            uair: anim(16,1,1,true),

            jab: anim(8,3,4,'idle'),
            side: anim(10,5,12,'idle'),
            high: anim(15,8,10,true),
            special: anim(17,1,1,true),

            grab: anim(19,1,1,true),
            nthrow: anim(20,1,1,true),
            uthrow: anim(21,2,0.9,true),
            fthrow: anim(22,4,12,'idle'),
            bthrow: anim(23,5,12,'idle'),
            dthrow: anim(10,5,12,'idle'),

            uairDash: anim(17,1,1,true),
            uairCharge: anim(17,1,1,true),
            uairFinish: anim(18,3,8,'fallNeutral'),
            highFinish: anim(27,3,8,'idle'),
            specialFinish: anim(13,5,8,'idle'),
        },
        ballistic: {
            size: 60,
            spriteSize: 48,

            respawning: anim(0,1,1,true), //todo
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,4,4,true),
            run: anim(3,4,10,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            doubleJumpStart: anim(5,1,1,true),
            fallNeutral: anim(6,1,1,true),
            fallForward: anim(7,1,1,true),
            fallBackward: anim(8,1,1,true),
            jumpNeutral: anim(6,1,1,true),
            jumpForward: anim(7,1,1,true),
            jumpBackward: anim(8,1,1,true),
            doubleJumpNeutral: anim(6,1,1,true),
            doubleJumpForward: anim(7,1,1,true),
            doubleJumpBackward: anim(8,1,1,true),

            emptyLand: anim(4,1,1,true),
            hardLand: anim(4,1,1,true),

            nair: anim(10,6,12,'fallNeutral'),
            fair: anim(11,1,1,true),
            bair: anim(13,1,1,true),
            dair: anim(15,10,9,true),
            uair: anim(6,1,1,true),
            weakUair: anim(6,1,1,true),

            jab: anim(9,1,1,true),
            side: anim(11,4,12,'sideCharge'),
            high: anim(18,7,12,'idle'),
            special: anim(16,9,16,'idle'),

            ICBMLaunch: anim(23,1,1,true),
            ICBMBuild: anim(24,7,6,'idle'),
            bazookaLaunch: anim(20,1,1,true),
            javelinLaunch: anim(21,1,1,true),
            seekingLaunch: anim(22,1,1,true),

            fairFinish: anim(20,8,12,'fallForward'),
            sideCharge: anim(18,2,12,true),
            sideFinish: anim(19,8,12,'idle'),
        },
        flamingo: {
            size: 58,
            spriteSize: 48,

            respawning: anim(0,1,1,true), //todo
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,2,1,true),
            run: anim(3,5,10,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            doubleJumpStart: anim(10,1,1,true),
            fallNeutral: anim(10,1,1,true),
            fallForward: anim(11,1,1,true),
            fallBackward: anim(10,1,1,true),
            jumpNeutral: anim(7,1,1,true),
            jumpForward: anim(8,1,1,true),
            jumpBackward: anim(9,1,1,true),
            doubleJumpNeutral: anim(12,4,12,'fallNeutral'),
            doubleJumpForward: anim(13,4,12,'fallForward'),
            doubleJumpBackward: anim(14,4,12,'fallBackward'),

            emptyLand: anim(6,1,1,true),
            softLand: anim(6,1,1,true),
            hardLand: anim(6,1,1,true),

            nair: anim(16,5,12,'fallNeutral'),
            fair: anim(18,6,16,'fallNeutral'),
            bair: anim(19,2,8,true),
            dair: anim(21,7,10,'fallNeutral'),
            uair: anim(23,2,8,true),

            jab: anim(15,4,12,'idle'),
            side: anim(17,3,8,'skid'),
            high: anim(22,6,8,'idle'),
            special: anim(20,5,10,'idle'),

            jab2: anim(26,7,16,'idle'),
            bairFinish: anim(24,5,16,'fallNeutral'),
            uairFinish: anim(25,7,16,'fallNeutral'),
            dairFinish: anim(27,6,8,'fallNeutral'),

            fairFinish: anim(20,8,12,'fallForward'),
        },
        demon: {
            size: 58,
            spriteSize: 48,

            respawning: anim(0,1,1,true),
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,2,2,true),
            run: anim(3,4,8,true),
            skid: anim(4,1,1,true),

            jumpsquat: anim(5,1,1,true),
            doubleJumpStart: anim(8,1,1,true),
            fallNeutral: anim(7,1,1,true),
            fallForward: anim(7,1,1,true),
            fallBackward: anim(7,1,1,true),
            jumpNeutral: anim(6,1,1,true),
            jumpForward: anim(6,1,1,true),
            jumpBackward: anim(6,1,1,true),
            doubleJumpNeutral: anim(8,1,1,true),
            doubleJumpForward: anim(8,1,1,true),
            doubleJumpBackward: anim(8,1,1,true),

            emptyLand: anim(4,1,1,true),
            softLand: anim(4,1,1,true),
            hardLand: anim(4,1,1,true),

            nair: anim(10,5,12,'fallNeutral'),
            fair: anim(12,4,8,'fallForward'),
            bair: anim(13,6,8,'fallBackward'),
            dair: anim(17,6,10,'fallNeutral'),
            uair: anim(15,5,8,'fallNeutral'),

            jab: anim(9,3,12,'idle'),
            side: anim(11,1,1,true),
            high: anim(14,3,8,'fallNeutral'),
            special: anim(16,3,8,true),

            specialFinish: anim(18,2,6,'idle'),
            demonPunch: anim(19,6,8,'fallNeutral'),
        },
        crocodile: {
            size: 80,
            spriteSize: 48,

            respawning: anim(0,1,1,true),
            hitlag: anim(0,1,1,true),
            hitstun: anim(1,1,1,true),

            idle: anim(2,1,1,true),
            run: anim(3,6,8,true),
            skid: anim(2,1,1,true),

            jumpsquat: anim(4,2,10,'jumpNeutral'),
            doubleJumpStart: anim(6,1,1,true),
            fallNeutral: anim(6,1,1,true),
            fallForward: anim(6,1,1,true),
            fallBackward: anim(6,1,1,true),
            jumpNeutral: anim(5,1,1,true),
            jumpForward: anim(5,1,1,true),
            jumpBackward: anim(5,1,1,true),
            doubleJumpNeutral: anim(7,1,1,true),
            doubleJumpForward: anim(7,1,1,true),
            doubleJumpBackward: anim(7,1,1,true),

            emptyLand: anim(2,1,1,true),
            softLand: anim(2,1,1,true),
            hardLand: anim(2,1,1,true),

            nair: anim(9,6,10,'fallNeutral'),
            fair: anim(11,7,10,'fallForward'),
            bair: anim(12,7,10,'fallBackward'),
            dair: anim(14,10,10,'fallNeutral'),
            uair: anim(16,17,20,'fallNeutral'),

            jab: anim(8,3,8,'idle'),
            side: anim(10,4,6,'idle'),
            high: anim(15,7,8,'idle'),
            special: anim(13,12,8,'idle'),

            decloak: anim(17,7,12,'fallNeutral')
        },
    },
    particle: {
        knockback: {
            spriteSize: 32,
            knockback: anim(0,6,8,false),
        },
        hitEffects: {
            spriteSize: 32,
            hit_physical_weak: anim(0,5,16,false),
            hit_physical: anim(2,6,16,false),
            hit_meteor_weak: anim(1,4,10,false),
            hit_meteor: anim(3,6,16,false),
            hit_blob_1: anim(4,8,10,true),
            hit_blob_2: anim(5,8,12,true),
            hit_blob_3: anim(6,8,10,true),
            hit_spray: anim(7,1,1,true),
        },

        explosions: {
            spriteSize: 32,
            TEMPExplosion: anim(0,7,10,false),
        },
        demonana: {
            spriteSize: 32,
            demonanaWings: anim(0,7,8,false),
            demonanaEnergy: anim(1,4,12,true),
            demonanaStomp: anim(3,1,1,true),
        },

        mantis: {
            spriteSize: 48,
            mantisWingFront: anim(0,4,30,true),
            mantisWingBack: anim(0,4,30,true),
        },
        ballistic: {
            spriteSize: 48,
            backpackICBM: anim(0,1,1,true),
            backpackLauncher: anim(1,1,1,true),
            backpackRack: anim(2,1,1,true),
            rackMissile1: anim(3,1,1,true),
            rackMissile2: anim(4,1,1,true),
            rackMissile3: anim(5,1,1,true),
            ICBMLaunch: anim(0,1,1,true),
        },
        ballisticExplosions: {
            spriteSize: 32,
            ballisticExplosionMedium: anim(0,8,8,false),
            ballisticExplosionSmall: anim(1,5,8,false),
            ballisticExplosionLarge: anim(2,7,6,false),
            launcherBackblast: anim(3,6,12,false),
            fastTrail: anim(4,6,8,false),
            slowTrail: anim(5,7,8,false),
            bigTrail: anim(5,7,8,false),
            blowback: anim(6,5,8,false),
            seekingBlowback: anim(7,5,8,false),
        },
        ICBMBlur: {
            spriteSize: 64,
            ICBMBlur: anim(0,3,16,false),
        },

        demon: {
            spriteSize: 48,
            demonWings: anim(0,6,12,false), //SHOULD BE TILTED
            demonEnergy: anim(1,5,8,true),
            demonStrike: anim(2,5,12,false),
        },
    },
    projectile: {
        ballisticMissiles: {
            spriteSize: 32,
            ballisticBazooka: anim(0,1,1,true),
            ballisticJavelin: anim(1,7,60,true),
            ballisticSeeking: anim(2,7,60,true),
        },
        invisible: {
            spriteSize: 1,
            invisible: anim(0,0,0,false),
        },
    },
}

const stageData = {
    test: {
        collision: [{
            x: 0,
            y: 220,
            width: 400,
            height: 220,
        }],
        blastX: 900,
        blastY: 1000,
        respawnY: 600,
        playerPositions: {
            x: [-220,220],
            y: [500,500],
        },
    }
};