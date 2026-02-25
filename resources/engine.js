function boxCollide(object1, object2) {
	if (object1.x + object1.width > object2.x - object2.width &&
		object1.x - object1.width < object2.x + object2.width &&
		object1.y + object1.height > object2.y - object2.height &&
		object1.y - object1.height < object2.y + object2.height
	) return (true);
} //widths and heights should always be HALF






//  ~~-- N O T E S --~~
/*
    - if characters want fallForward, jumpBackward, etc., they can just add that with their own actions
    - particles are updated when they're drawn, since they don't have a gameplay effect. this means that rolling forward will leave particles in an older state, but who cares
*/



function processCollision(){
    let newList = [];
    for (let index = 0; index < collisionList.length; index++){
        let entry = collisionList[index];

        if (entry.behavior) entry.behavior(entry);
        if (!entry.dead) newList.push(entry);

        entry.x += entry.vx;
        entry.y += entry.vy;
    }
    collisionList = newList;
}
function checkCollision(object,callback){ //callback(collision, direction); direction = up/dowm/left/right
    for (let index = 0; index < collisionList.length; index++){
        let entry = collisionList[index];

        if (entry.active){
            //horizontal collision
            if (object.y + object.vy + object.height > entry.y + entry.vy - entry.height && //top of object above bottom of collision
                object.y + object.vy - object.height < entry.y + entry.vy + entry.height) { //bottom of object below top of collision
                    //left wall
                    if (object.x + object.width <= entry.x - entry.width && //rightmost part of object is not currently past wall
                        object.x + object.vx + object.width > entry.x + entry.vx - entry.width) //rightmost part of object will be past wall after moving
                        callback(entry,'left');
                    
                    //right wall
                    else if (object.x - object.width >= entry.x + entry.width && //leftmost part of object is not currently past wall
                        object.x + object.vx - object.width < entry.x + entry.vx + entry.width) //leftmost part of object will be past wall after moving
                        callback(entry,'right');
            }

            //vertical collision
            if (object.x + object.vx + object.width > entry.x + entry.vx - entry.width && //right side of object past left side of collision
                object.x + object.vx - object.width < entry.x + entry.vx + entry.width) { //left side of object past right side of collison
                    
                    //floor
                    if (object.y - object.height >= entry.y + entry.height && //bottom of object currently above floor
                        object.y + object.vy - object.height < entry.y + entry.vy + entry.height) //bottom of object will be under floor after moving
                        callback(entry,'floor');

                    //ceiling
                    else if (object.y + object.height <= entry.y - entry.height && //top of object currently below ceiling
                        object.y + object.vy + object.height > entry.y + entry.vy - entry.height) //top of object currently below ceiling
                        callback(entry,'ceiling');
            }
        }

    }
}


//#region Player
const defaultActions = {
    respawning: self=>{
        self.status.intangible = true;
        self.status.invincible = false;
        self.status.armor = 0;
        self.y = 10000;
        self.x = 0; 
        self.vx = 0;
        self.vy = 0;

        if (self.stocks > 0) {
            if (self.actionTimer > 60) self.y = 600;
            if (self.actionTimer > 120) {
                if (self.actionTimer > 300 || 
                    self.inputs.attack || self.inputs.jump || self.inputs.left || self.inputs.right || self.inputs.up || self.inputs.down || self.inputs.cup || self.inputs.cdown || self.inputs.cleft || self.inputs.cright
                ){
                    endAction(self);
                    self.status.intangible = false;
                }
            }
        }
    }, 

    hitlag: self=>{
        changeAction(self,'hitstun')
    },
    hitstun: self=>{
        //hitstun smoke
        let interval =  Math.floor(16 - 0.02 * self.kb * self.kb);
        if (interval < 3) interval = 3;
        if (self.kb > 10 && self.actionTimer % interval == 0) particle({
            owner: self.id,
            x: self.x,
            y: self.y + self.height * 2,
            
            age: 60,
            back: true,

            animation: {
                spritesheet: 'knockback',
                size: 50,
                spriteSize: 32,
                animation: anim(0,6,5,'none'),
            },
        });

        //hitstun drift. copied from playerConstant
        if (self.drift){
            if (self.drift == -Math.sign(self.vx) ||  //if drifting opposite the current direction, or
                Math.abs(self.vx + self.drift * hitstunDrift) <= maxHitstunDrift) //current speed is under the max
                    self.vx += self.drift * hitstunDrift;
            else if (Math.abs(self.vx) < maxHitstunDrift) self.vx = self.drift * maxHitstunDrift; //unlike running, this doesn't cap your speed
        }

        landPlayer(self);

        if (!self.hitstun) endAction(self);
        else self.hitstun --;
    },

    idle: self=>{
        if (!self.grounded) changeAction(self,'fall');
        else if (self.vx) changeAction(self,'skid');

        cancelAction(self);
    },
    run: self=>{
        if (!self.grounded) changeAction(self,'fall');
        else if (!self.drift) changeAction(self,'skid');
        
        else self.facing = self.drift;
        
        if (Math.sign(self.drift) != Math.sign(self.vx)) self.vx += self.drift * (charData[self.char].info.groundAcceleration + charData[self.char].info.friction); //if running in the opposite direction, add friction to turn around even faster
        else if (Math.abs(self.vx + self.drift * charData[self.char].info.groundAcceleration) <= charData[self.char].info.groundSpeed) self.vx += self.drift * charData[self.char].info.groundAcceleration; //if running in the same direction and under the max speed
        else self.vx = self.drift * charData[self.char].info.groundSpeed; //otherwise cap at max speed

        cancelAction(self);
    },
    skid: self=>{
        if (!self.grounded) changeAction(self,'fall');
        else if (!self.vx) changeAction(self,'idle');

        if (Math.abs(self.vx) - charData[self.char].info.friction > 0) self.vx -= Math.sign(self.vx) * charData[self.char].info.friction;
        else self.vx = 0; //otherwise stop

        cancelAction(self);
    },

    jumpsquat: self=>{
        self.facing = self.drift || self.facing; //simple face change
        if (self.actionTimer == 1) {//2-frame near-universal jumpsquat
            self.inputs.jump = 0.5;
            self.vy = charData[self.char].info.jumpStrength;
            changeAction(self,'jump');
        }
    }, //the RAR window is equal to the jumpsquat. 1 is kinda tough!
    //the next three are identical, but are differentiated since they're usually visually distinct
    jump: self=>{
        if (self.vy < 2) changeAction(self,'fall');
        
        landPlayer(self);

        cancelAction(self);
    },
    doubleJump: self=>{
        if (self.vy < 2) changeAction(self,'fall');
        
        landPlayer(self);

        cancelAction(self);
    },
    fall: self=>{
        landPlayer(self);

        cancelAction(self);
    },

    emptyLand: self=>{
        self.vx *= 0.8; //slow vx a lot
        endAction(self,2);
    },

    nair: self=>{
        landPlayer(self); 
        endAction(self,30);
    },
    fair: self=>{
        landPlayer(self); 
        endAction(self,30);
    },
    bair: self=>{
        landPlayer(self); 
        endAction(self,30);
    },
    dair: self=>{
        landPlayer(self); 
        endAction(self,30);
    },
    uair: self=>{
        landPlayer(self); 
        endAction(self,30);
    },

    jab: self=>{
        self.vx *= 0.8;
        endAction(self,30);
    },
    side: self=>{
        self.vx *= 0.8;
        endAction(self,30);
    },
    high: self=>{
        self.vx *= 0.8;
        endAction(self,30);
    },
    special: self=>{
        self.vx *= 0.8;
        endAction(self,30);
    },
}
function playerConstant(player){
    if (charData[player.char].actions.constantOverride) charData[player.char].actions.constantOverride(player); //utilizing this is VERY rare, and is only possible to allow for strange shenanigans
    else {

        //high-damage smoke. Needs a new sprite!
        if (player.damage >= 80 && player.actionTimer % 30 == 10 && ['hitstun','hitlag'].indexOf(player.action) == -1) particle({
            owner: player.id,
            x: player.x,
            y: player.y + player.height * 2,
            vy: 1,
            vx: 2 * (Math.random() - 0.5),
            
            age: 60,
            back: true,

            animation: {
                spritesheet: 'knockback',
                size: 50,
                spriteSize: 32,
                animation: anim(0,6,5,'none'),
            },
        });

        //refill jumps upon landing
        if (player.grounded) {
            player.jumps = charData[player.char].info.jumps;
            player.recoveries = charData[player.char].info.recoveries;
        }
        else if (!player.hitstun && player.drift) { //midair drift. This could be implemented in the aerial actions, but that would be highly inconvenient
            if (player.drift == -Math.sign(player.vx) ||  //if drifting opposite the current direction, or
                Math.abs(player.vx + player.drift * charData[player.char].info.airAcceleration) <= charData[player.char].info.airSpeed) //current speed is under the max
                    player.vx += player.drift * charData[player.char].info.airAcceleration;
            else if (Math.abs(player.vx) < charData[player.char].info.airSpeed) player.vx = player.drift * charData[player.char].info.airSpeed; //unlike running, this doesn't cap your speed
            //no friction!
        } 

        if (player.action != 'hitstun' && player.hitstun) player.hitstun = 0; //fixes a bug that locks midair drift
    }
}
function actionPlayer(player){
    if (charData[player.char].actions[player.action]) charData[player.char].actions[player.action](player); //run current action, if there is a character-specific one
    else defaultActions[player.action](player); //otherwise, do the default one. this is common for run, jump, etc.

    playerConstant(player); //run near-universal passive code, like midair drift and death

    if (charData[player.char].actions.passive) charData[player.char].actions.passive(player); //run character-specific passive code (non-action-specific, like keeping track of meter)

    player.actionTimer ++; //increment action timer
}
function cancelAction(player,time){
    if (!time || player.actionTimer >= time) { //if actionTimer is over the time, end the action
        if (player.grounded){
            if (player.inputs.jump == 1 && player.action !== 'jumpsquat') changeAction(player,'jumpsquat'); //jump
            else if (player.drift && player.action !== 'run') changeAction(player,'run'); //run
        }
        else {
            if (player.inputs.jump == 1 && player.jumps) {
                player.inputs.jump = 0.5;
                player.jumps --;
                player.vy = charData[player.char].info.doubleJumpStrength;
                changeAction(player,'doubleJump');
            } //jump
        }

        if (player.actionTimer >= 0) playerAttack(player); //prevents you from attacking the same frame you jump
    }
}
function changeAction(player,newAction){
    //old issue: hitbox would hit again when landing, since changeAction clears hitPlayers
    //solution: player.disableHitboxes is set until the beginning of the next frame. this skips the hitbox check, and the new action only gets run next frame anyway
    //player.disableHitboxes = true;

    if (charData[player.char].info.recovery.indexOf(newAction) == -1) {//if the new action isn't a recovery more
        player.disableHitboxes = true;
        player.action = newAction;
        player.hitPlayers = []; //clear hit player list, so the new move can hit the opponent!
        player.actionTimer = -1; //1 gets added immediately after this in actionPlayer, so the actionTimer is at 0 when the next frame starts
    }
    else if (player.recoveries){
        player.recoveries --;

        player.disableHitboxes = true;
        player.action = newAction;
        player.hitPlayers = [];
        player.actionTimer = -1;
    } //kinda annoying to have the code written twice, but this function is tiny so it's fine
}
function endAction(player,time){
    if (!time || player.actionTimer >= time) { //if actionTimer is over the time, end the action
        player.hitPlayers = []; //clear hit player list

        //change action to basic actions
        if (player.grounded) changeAction(player,'idle');
        else changeAction(player,'fall');
    }
}
function landPlayer(player,action){
    if (player.grounded) changeAction(player,action || 'emptyLand');
} //makes coding aerials faster
function playerAttack(player){
    let g = player.grounded;

    //cstick. left and right are prioritized, since otherwise it becomes very easy to misinput recover
    if (player.inputs.cleft == 1) {
        player.inputs.cleft = 0.5;
        if (g) player.facing = -1;
        changeAction(player, g ? 'side' : (-1 == player.facing ? 'fair' : 'bair'));
    }
    else if (player.inputs.cright == 1) {
        player.inputs.cright = 0.5;
        if (g) player.facing = 1;
        changeAction(player, g ? 'side' : (1 == player.facing ? 'fair' : 'bair'));
    }
    else if (player.inputs.cup == 1) {
        player.inputs.cup = 0.5;
        changeAction(player, g ? 'high' : 'uair');
    }
    else if (player.inputs.cdown == 1) {
        player.inputs.cdown = 0.5;
        changeAction(player, g ? 'special' : 'dair');
    }

    //normal attack input. up and down are prioritized
    else if (player.inputs.attack == 1){
        player.inputs.attack = 0.5;

        if (player.inputs.up) {
            changeAction(player, g ? 'high' : 'uair');
        }
        else if (player.inputs.down) {
            changeAction(player, g ? 'special' : 'dair');
        }
        else if (player.inputs.left) {
            if (g) player.facing = -1;
            changeAction(player, g ? 'side' : (-1 == player.facing ? 'fair' : 'bair'));
        }
        else if (player.inputs.right) {
            if (g) player.facing = 1;
            changeAction(player, g ? 'side' : (1 == player.facing ? 'fair' : 'bair'));
        }
        else changeAction(player,g ? 'jab' : 'nair');
    }

    else return(false); //old issue: putting this together with stuff in cancelAction allowed both to happen at the same time, which we don't want
    //changeAction takes care of checking recoveries
}
function killPlayer(player,instant){
    //instant makes the player die instantly, and is only executed by a few actions

    if (gameState == 'mid' && player.action != 'respawning' && (instant || (player.y > stage.blastY && player.hitstun) || Math.abs(player.x) > stage.blastX || player.y < 0)){ //check if player is within the stage bounds
        if (player.stocks <= 0) console.log('THIS PLAYER HAS NEGATIVE STOCKS. WHY??');
        
        player.deathCoords = [player.x,player.y];

        player.action = 'respawning';
        player.actionTimer = 0;
        player.stocks --;
        player.damage = 0;

        checkGameEnd(); //while it's possible for two characters to die on one frame, the game will end before the second can die. This is really unimportant port priority
        
        //instant
        if (instant){

        }
        //top
        else if (player.y > stage.blastY && player.hitstun || player.y < 0){

        }
        //sides
        else if (Math.abs(player.x) > stage.blastX) {

        }
    }
}

let hitboxList; //gets reset every frame
function hitbox(data){

    /*
        owner,

        start, //frame hitbox activates
        end, //frame hitbox deactivates
        x, //x position relative to player. gets updated to be an absolute position
        y,
        width, //remember, these are always half the real value!
        height,


        damage,
        hitstun,
        hitlag,
        knockback,
        scaling, 0-10
        angle,


        projectile, //is it a projectile hitbox?

        meteor, //some attacks trigger "meteor", which causes a ground bounce

        effect, //function to execute on hit

        filter, //some attacks only hit the opponent under certain circumstances
        particle,
        flipParticle,
    */

    let scale = data.projectile ? 1 : charData[data.owner.char].info.scale;

    data.x = data.owner.x + data.owner.vx + data.owner.facing * data.x * scale;
    data.y = data.owner.y + data.owner.vy + data.y * scale;

    data.width *= scale;
    data.height *= scale;

    if ((!data.end && (data.owner.actionTimer >= data.start || !data.start)) || (data.owner.actionTimer >= data.start && data.owner.actionTimer < data.end)) hitboxList.push(data);
}
const clankThreshold = 2;
const clankScaling = 1;
const clankHitlag = 2; //factor
function checkHitboxes(){
    for (let index = 0; index < hitboxList.length; index ++){
        let entry = hitboxList[index];

        if (!entry.owner.disableHitboxes){
            //check clank
            for (let index2 = 0; index2 < hitboxList.length; index2 ++){
                let entry2 = hitboxList[index2];
                if (!entry.projectile && //not a projectile hitbox
                    entry.owner.id !== entry2.owner.id && //different player
                    boxCollide(entry,entry2) && //hitboxes touch
                    Math.abs(entry.knockback * (clankScaling * entry.scaling + 1) - entry2.knockback * (clankScaling * entry2.scaling + 1)) > clankThreshold //knockbacks factored with scaling are close enough
                        ){
                    entry.owner.hitPlayers.push(entry2.owner.id); //disable both hitboxes
                    entry2.owner.hitPlayers.push(entry.owner.id);

                    let avg = (entry.knockback * (clankScaling * entry.scaling + 1) + entry2.knockback * (clankScaling * entry2.scaling + 1))/2;
                    entry.owner.hitlag = clankHitlag * avg;
                    entry2.owner.hitlag = clankHitlag * avg;

                    console.log('TWO ATTACKS CLANKED. you need to implement a particle for this occurence!');
                }
            }

            //check player hit
            for (let index2 = 0; index2 < playerList.length; index2 ++){
                let player = playerList[index2];

                if (entry.owner.id !== player.id && //not the owner's hitbox
                    (!entry.projectile || entry.owner.owner.id !== player.id) && //not the owner's projectile. if owner undefined (explosion, etc.) this still passes
                    entry.owner.hitPlayers.indexOf(player.id) == -1 && //not already hit
                    boxCollide(entry,player) //hitbox touches opponent
                        ){
                    hitPlayer(entry,player);
                }
            }
        }
    }
} //currently, players can clank with a hitbox that has already hit them. this could be disabled if desired.
const hitParticles = {
    omniLarge: {
        spritesheet: 'hitEffects',
        size: 50,
        spriteSize: 32,
        animation: anim(1,6,5,'none'),
    },
    omniSmall: {
        spritesheet: 'hitEffects',
        size: 40,
        spriteSize: 32,
        animation: anim(2,5,5,'none'),
    },
    sideLarge: {
        spritesheet: 'hitEffects',
        size: 50,
        spriteSize: 32,
        animation: anim(3,5,5,'none'),
    },
    sideSmall: {
        spritesheet: 'hitEffects',
        size: 50,
        spriteSize: 32,
        animation: anim(4,5,5,'none'),
    },
    meteor: {
        spritesheet: 'hitEffects',
        size: 50,
        spriteSize: 32,
        animation: anim(0,6,5,'none'),
    },
}


let hitstunFallspeed = 10;
let hitstunGravity = 0.4;
let hitstunDrift = 0.1;
let maxHitstunDrift = 10;
const hitFilter = {
    aerial: def=>{if (!def.grounded) return true;},
    grounded: def=>{if (def.grounded) return true;},
    noStun: def=>{if (!def.hitlag) return true;},
    onlyStun: def=>{if (def.hitlag) return true;},
    facing: (def,atk)=>{if (def.facing != atk.facing) return true;},
    backstab: (def,atk)=>{if (def.facing == atk.facing && Math.sign(def.x - atk.x) == atk.facing) return true;},    
} //COPY AND USE IN CODE
function hitPlayer(hitbox,player){
    let intangible = player.status.intangible ||(hitbox.projectile && player.status.projectileIntangible);
    let invincible = player.status.invincible ||(hitbox.projectile && player.status.projectileInvincible);

    if (!intangible && (hitbox.filter ? hitbox.filter(player,hitbox.owner) : true)) { //don't hit intangible players, nor if the hit is filtered
        if (charData[player.char].actions.onHit) charData[player.char].actions.onHit(hitbox,player); //override if you want to do nonsense with getting hit. This is also rare.
        else {
            if (hitbox.damage > 0){ //don't do hitlag and stuff for 0 damage attacks. you can use this to apply debuffs, check areas without hitting a player, etc.

                //scale values
                let scalar = scaleKnockback(hitbox.scaling,player.damage);
                let scaledKnockback = hitbox.knockback * scalar; //currently these all use the same scalar. Should this be the case?
                let scaledHitstun = Math.floor(hitbox.hitstun * scalar);
                let scaledHitlag = Math.floor(hitbox.hitlag * scalar);

                if (scaledHitlag > 120) scaledHitlag = 120; //cap hitlag at 2 seconds

                if (showHitboxes) {
                    trackHit(player,hitbox.owner.facing,hitbox.angle,hitbox.knockback,hitbox.hitstun,hitbox.scaling,0);
                    trackHit(player,hitbox.owner.facing,hitbox.angle,hitbox.knockback,hitbox.hitstun,hitbox.scaling,50);
                    trackHit(player,hitbox.owner.facing,hitbox.angle,hitbox.knockback,hitbox.hitstun,hitbox.scaling,100);
                    //trackHit(player,hitbox.owner.facing,hitbox.angle,hitbox.knockback,hitbox.hitstun,hitbox.scaling,player.damage);
                }

                //hit effect
                if (hitbox.particle) {
                    particle({
                        owner: player.id,
                        x: (player.x + hitbox.x)/2,
                        y: (player.y + player.height * 2 + hitbox.y)/2,
                        facing: hitbox.owner.facing * -(hitbox.flipParticle || -1),
                        

                        animation: typeof hitbox.particle == 'string' ? //omit "large" or "small" to get a variable particle based on kb
                            hitParticles[hitbox.particle] :
                            (
                                scaledKnockback < 14 ? 
                                hitParticles[hitbox.particle[0]] :
                                hitParticles[hitbox.particle[1]]
                            )
                        ,
                    });
                    
                }
                shakeCamera(scaledKnockback);

                //deal damage if not invincible
                if (!invincible) player.damage += hitbox.damage;

                //deal hitstun if not armored
                if (!invincible && player.armor < scaledKnockback && !(hitbox.projectile && player.status.projectileArmored)) {
                    player.hitstun = scaledHitstun;
                    player.action = 'hitlag';
                    player.actionTimer = 0;

                    //turn around to face hit
                    player.facing = Math.sign(hitbox.owner.x - player.x) || player.facing;

                    //deal knockback
                    player.vx = hitbox.owner.facing * scaledKnockback * Math.cos(hitbox.angle);
                    player.vy = scaledKnockback * Math.sin(hitbox.angle);
                    player.grounded = false;


                    player.kb = scaledKnockback; //this is just visual
                    if (hitbox.meteor) player.meteor = true;
                }

                //deal hitlag
                player.hitlag = scaledHitlag;
                hitbox.owner.hitlag = scaledHitlag;
            }

            //disable hitbox
            hitbox.owner.hitPlayers.push(player.id);

            if (hitbox.effect) hitbox.effect(hitbox.owner,player); //hit effect
        }
    }
}
function scaleKnockback(scaling,damage){
    //in the old banana brawl bonanza, scaling ranged between 0.001 (very low scaling) and 0.01 (very high scaling), usually falling between 0.005 and 0.008
    //0.001 = near-linear, 0.01 = very low, suddenly spikes
    //anyway, scaling is now set between 0 and 10, so the valye is simply divided by 1000

    //CREATE A TOOL/DESMOS TO GENERATE SCALING GIVEN ENDPOINTS AND TIME - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    
    return(Math.pow(2.72,scaling/1000 * damage));
}

function movePlayer(player){
    collidePlayer(player);
    if (!player.hitlag){ //we never want the player moving in hitlag, and collideplayer adds hitlag on bounces
        player.x += player.vx;
        player.y += player.vy;
    }
}
let bounceFactor = 0.8;
let bounceThreshold = 5;
function collidePlayer(player){
    player.grounded = false;
    checkCollision({x: player.x, y: player.y - player.height + player.hullHeight, vx: player.vx, vy: player.vy, width: player.hullWidth, height: player.hullHeight},
            (collision,direction)=>{
                switch (collision.type){
                    case 'solid': switch (direction){
                        case 'floor':

                            if (player.hitstun && player.meteor){
                                player.hitlag = Math.abs(Math.floor(player.vy/3));
                                player.meteor = false;
                                player.vy = Math.abs(player.vy * bounceFactor);
                            }
                            else {
                                player.grounded = true;
                                player.vy = 0;
                                player.x += collision.vx; //if the platform is moving, move along with it!
                            }

                            player.y = collision.y + collision.vy + collision.height + player.height;

                            break;

                        case 'left':
                            if (player.hitstun && Math.abs(player.vx) > bounceThreshold){
                                player.hitlag = Math.abs(Math.floor(player.vx/3));
                                player.vx = -Math.abs(player.vx * bounceFactor);
                            }
                            else player.vx = 0;

                            player.x = collision.x + collision.vx - collision.width - player.hullWidth;
                            break;

                        case 'right':
                            if (player.hitstun && Math.abs(player.vx) > bounceThreshold){
                                player.hitlag = Math.abs(Math.floor(player.vx/3));
                                player.vx = Math.abs(player.vx * bounceFactor);
                            }
                            else player.vx = 0;

                            player.x = collision.x + collision.vx + collision.width + player.hullWidth;
                            break;

                        case 'ceiling':
                            if (player.hitstun && Math.abs(player.vy) > bounceThreshold){
                                player.hitlag = Math.abs(Math.floor(player.vy/3));
                                player.vy = -Math.abs(player.vy * bounceFactor);
                            }
                            else player.vy = 0;

                            player.y = collision.y + collision.vy - collision.height + player.height - 2 * player.hullHeight;
                            break;

                        default:
                        }
                        break;

                    case 'semisolid': 
                        if (direction == 'floor') {
                            
                            if (player.hitstun && player.meteor){
                                player.hitlag = Math.abs(Math.floor(player.vy/3));
                                player.meteor = false;
                                player.vy = Math.abs(player.vy * bounceFactor);
                                player.y = collision.y + collision.vy + collision.height + player.height;
                            }
                            else if (!player.inputs.down || ['idle','run'].indexOf(player.action) == -1){
                                player.grounded = true;
                                player.vy = 0;
                                player.x += collision.vx; //if the platform is moving, move along with it!
                                player.y = collision.y + collision.vy + collision.height + player.height;
                            }

                        } //only check for floor collisions
                        break;

                    default: 
                }
            }
        );
} //knockback bounces and anything with hitstun NOT YET IMPLEMENTED


function processPlayers(){
    for (let index = 0; index < playerList.length; index++) {
        let player = playerList[index];

        if (player.disableHitboxes) player.disableHitboxes = false; //see changeAction() note
        if (!player.hitlag){ //skip all this if in hitlag
            
            let fallspeed = player.hitstun ? hitstunFallspeed : (player.fallSpeedOverride || charData[player.char].info.fallSpeed);
            let grav = player.hitstun ? hitstunGravity : charData[player.char].info.gravity;
            if (player.vy - grav > -fallspeed) player.vy -= grav; //apply gravity if terminal velocity not reached
            else if (!player.hitstun) player.vy = -fallspeed; //hit terminal velocity
             //if gravity is applied after actionPlayer, it becomes a lot more cumbersome to implement actions
    
            actionPlayer(player); //make the player do the stuff
    
            movePlayer(player);
        } else player.hitlag --;
    
        killPlayer(player); //check if player should die

    }
}

function player(character,id){
    //this object contains all NON-STATIC variables for the player.
    //static variables can be found in charData
    
    this.id = id; //index in playerList. used for checking if two players are the same
    this.char = character;

    this.x; //horizontal position. set at game start
    this.y; //vertical position
    this.vx = 0; //horizontal velocity
    this.vy = 0; //vertical velocity

    this.width = charData[character].info.baseWidth * charData[character].info.scale; //ALL WIDTHS AND HEIGHTS ARE HALF THEIR REAL VALUE
    this.height = charData[character].info.baseHeight * charData[character].info.scale;

    this.hullWidth = charData[character].info.hullWidth; //for collision
    this.hullHeight = charData[character].info.hullHeight; 

    this.jumps = 0;
    this.recoveries = 0; //recoveries are limited like jumps, but they get restored upon getting hit. this makes recovering easier
    this.stocks;


    this.facing = 1; //1 or -1; right or left
    this.drift = 0; //held direction. easier for math than using inputs.left/right
    this.vdrift = 0; //vertical drift. Usually only relevant for hitstun drift
    this.grounded = false;
    
    
    this.action = 'idle'; //tells you what the heck the player is doing
    this.actionTimer = 0; //important for timing hitboxes, animations, etc.

    this.meter = 0; //purely visual
    this.special = {}; //ANY character-specific variables
    if (charData[character].info.init) charData[character].info.init(this); //load these variables
    this.disableHitboxes = false; //see note in changeAction. fixes a bug, but should never be active for a whole frame

    this.hitPlayers = []; //a list of the players (ids) you've recently hit. prevents hitboxes from hitting every frame
    this.damage = 0;
    this.hitlag = 0; //skips all player functions while it counts down
    this.hitstun = 0; //forced tumble while it counts down
    this.meteored = false; //if true, bounce off ground in hitstun. otherwise, your hitstun is canceled upon landing
    this.kb = 0; //KB of most recent attack that hit the player. used for knockback dust visual
    this.deathCoords = [0,0]; //location of last death. used for camera
    this.armor = 0; //if the knockback received from an attack is less than this, no knockback is taken
    this.status = {
        //invincible: false, //attacks hit, but do no damage or knockback
        //intangible: false, //attacks cannot hit
        //invisible: false, //player isn't drawn
        //projectileInvincible: false, //projectiles do no damage or knockback
        //projectileIntangible: false, //projectile cannot hit
        //projectileArmored: false, //projectiles do damage but don't do knockback
    };

    
    this.inputs = {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
        jump: 0,
        attack: 0,
        cleft: 0,
        cright: 0,
        cup: 0,
        cdown: 0,
    } //1 = first frame, 0.5 = held, 0 = not pressed
}
//#endregion

//#region Projectile
function processProjectiles(){
    let newList = [];
    for (let index = 0; index < projectileList.length; index++){
        let projectile = projectileList[index];

        if (!projectile.hitlag) {
            projectile.behavior(projectile);

            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

            projectile.actionTimer ++;
        } else projectile.hitlag --;

        if (!projectile.dead) newList.push(projectile);
    }
    projectileList = newList;
}
function projectile(data){
    /*
        owner,

        x,
        y,
        vx,
        vy,
        width,
        height,

        facing,

        action, //if projectiles want to use multiple animations
        actionTimer,

        hitPlayers,
        hitlag,

        dead, //removes from projectileList. make sure to have this!

        behavior, //function that defines what it does
    */


    if (!data.facing) data.facing = data.owner.facing;

    if (!data.vx) data.vx = 0;
    if (!data.vy) data.vy = 0;

    if (!data.action) data.action = 'animation';

    data.actionTimer = 0;
    data.hitPlayers = [];
    data.hitlag = 0;
    data.dead = false;

    projectileList.push(data);
}
//#endregion

//#region Particle
function processParticles(particleList){
    let newList = [];
    for (let index = 0; index < particleList.length; index ++){
        let entry = particleList[index];
        
        entry.behavior(entry);
        entry.x += entry.vx;
        entry.y += entry.vy;

        drawParticle(entry);

        if (!entry.dead && (!entry.age || entry.timer < entry.age)) {
            entry.timer ++;
            newList.push(entry);
        }
    }
    return(newList);
}
function particle(data){
    /*
        owner, (id)

        x,
        y,
        vx,
        vy,

        facing,

        timer,
        age, //if set, particle will be removed when this ends
        dead, //removes from projectileList. make sure to have this!

        behavior, //function that defines what it does

        //sprite details
        spriteSheet,
        size,
        spriteSize,
        animation: anim(),

        back, //if true, sent to back
    */

    if (!rollingBack){ //don't spawn these while rolling back.
        if (!data.facing) data.facing = playerList[data.owner].facing;

        if (!data.vx) data.vx = 0;
        if (!data.vy) data.vy = 0;

        if (!data.behavior) data.behavior = ()=>{}; //not mandatory

        data.timer = 0;
        data.dead = false;

        if (data.back) backParticles.push(data);
        else frontParticles.push(data);
    }
}
//#endregion




//#region Draw
/*
function anim(index,frames,framesPerFrame,nextAnimation,widthOverride){
    return({
        index: index,
        frames: frames,
        framesPerFrame: framesPerFrame,
        nextAnimation: nextAnimation,
        widthOverride: widthOverride,
    });
} //for ease of adding
*/
function animatedSprite(type,timer,data,animation,charScale){
    let anim = data[animation];
    let frame = Math.floor(timer / anim.framesPerFrame);

    if (frame >= anim.frames && anim.nextAnimation !== 'none') {
        frame = timer - anim.frames * anim.framesPerFrame; //zero frame
        anim = data[anim.nextAnimation || animation]; //if the animation has finished, go to the next one
        frame = Math.floor(frame/anim.framesPerFrame) % anim.frames; //reset frame
    } //sprite will disappear if not given nextAnimation. this can be good for particles
    let spriteWidth = data.spriteSize; 
    let size = data.size;

    if (anim.widthOverride) {//this lets you have extra wide sprites for big disjoints
        size *= anim.widthOverride/data.spriteSize;
        spriteWidth = anim.widthOverride;
    }

    let scale = charScale || 1;

    if (type == 'background') {
        ctx.drawImage(sprites.stage[data.spritesheet],
            spriteWidth * frame, //x in image
            data.spriteSize * anim.index, //y in image
            spriteWidth, //width in image
            spriteWidth * data.heightScale, //height in image
            -stage.blastX, //real x
            0, //real y
            stage.blastX * 2, //real width
            stage.blastX * data.heightScale * 2, //real height
        );
    }

    else ctx.drawImage(sprites[type][data.spritesheet],
        spriteWidth * frame, //x in image
        data.spriteSize * anim.index, //y in image
        spriteWidth, //width in image
        data.spriteSize, //height in image
        -size * scale, //real x
        scale * (data.feet ? -data.size * 2 + 2 * data.size * data.feet/data.spriteSize : -2 * size), //real y
        scale * size * 2, //real width
        scale * size * 2, //real height
    );

}


function drawCollision(collision){
    ctx.save();
    ctx.translate(collision.x,collision.y);
    ctx.scale(1,-1);

    if (collision.animation) {
        ctx.translate(0,collision.animation.size);
        animatedSprite('stage',gameTime,collision.animation,'default');
    }
    else {
        ctx.fillStyle = '#555';
        ctx.fillRect(-collision.width, -collision.height, collision.width * 2, collision.height * 2);
    }

    ctx.restore();
}
function drawHitbox(hitbox){
    ctx.save();
    ctx.translate(hitbox.x,hitbox.y);

    ctx.fillStyle = '#b66';
    ctx.fillRect(-hitbox.width, -hitbox.height, hitbox.width * 2, hitbox.height * 2);

    //now draw a line in the direction of knockback

    ctx.restore();
}
function trackHit(player,direction,angle,baseKnockback,baseHitstun,scaling,damage){
    let scalar = scaleKnockback(scaling,damage);
    let knockback = baseKnockback * scalar;
    let hitstun = Math.floor(baseHitstun * scalar);

    let x = 0;
    let y = 0;
    let vx = direction * Math.cos(angle) * knockback;
    let vy = Math.sin(angle) * knockback;

    //for (let t = 0; t < hitstun; t++){
    //    if (t % 5 == 0) particle({owner: player.id,x: player.x + x,y: player.y + y,age: 60,animation:{spritesheet: 'square',size: 5,spriteSize: 1,animation: anim(0,1,1000),}});

    //    if (vy - hitstunGravity > -hitstunFallspeed) vy -= hitstunGravity;
    //    else vy = hitstunFallspeed;

    //    x += vx;
    //    y += vy;
    //}

    let finalX = player.x + hitstun * direction * Math.cos(angle) * knockback;
    let finalY = player.y + hitstun * Math.sin(angle) * knockback - 0.5 * hitstun * hitstun * hitstunGravity;
    let bounds = 0.5 * hitstun * hitstun * hitstunDrift;

    //bounds
    particle({
        owner: player.id,
        
        x: finalX,
        y: finalY,

        age: 60,

        animation: {
            size: bounds * 2,
        },

        back: true,
    });
}
function drawPlayer(player){
    ctx.save();
    ctx.translate(player.x,player.y);
    ctx.scale(player.facing,-1); //facing in player direction

    if (showHitboxes){
        ctx.strokeStyle = '#eee';
        //hitbox
        ctx.strokeRect(-player.width, -player.height, player.width * 2, player.height * 2);
        ctx.strokeRect(player.width, 0, -player.height, 0);
        //collision hull
        ctx.strokeRect(-player.hullWidth, player.height - 2 * player.hullHeight, player.hullWidth * 2, player.hullHeight * 2);
    }

    ctx.translate(0,player.height);
    if (charData[player.char].animation.spritesheet) animatedSprite('char',player.actionTimer,charData[player.char].animation,player.action,charData[player.char].info.scale);

    ctx.restore();
  
    //damage text
    ctx.save();
    ctx.scale(1,-1);
    ctx.translate(player.x,-player.y - player.height - 20);

    damageText(player.damage,(player.status.invincible || player.status.intangible) ? 'white' : (player.id == 0 ? 'blue' : 'red'),6 + 2/camera.zoom);

    ctx.restore();
}
function drawProjectile(projectile){
    ctx.save();
    ctx.translate(projectile.x,projectile.y);

    ctx.strokeStyle = '#eee';
    ctx.strokeRect(-projectile.width, -projectile.height, projectile.width * 2, projectile.height * 2);
    ctx.strokeRect(projectile.facing * projectile.width, 0, -projectile.facing * projectile.width, 0);

    if (projectile.animation) animatedSprite('projectile',projectile.actionTimer,projectile.animation,projectile.action);

    ctx.restore();
}
function drawParticle(particle){
    ctx.save();
    ctx.translate(particle.x,particle.y);
    ctx.scale(particle.facing,-1);

    if (particle.animation.spritesheet) {
        ctx.translate(0, 3/2*particle.animation.size); //ew
        animatedSprite('particle',particle.timer,particle.animation,'animation');
    }
    else {
        ctx.strokeStyle = '#eee';
        ctx.strokeRect(-particle.animation.size, -particle.animation.size, particle.animation.size * 2, particle.animation.size * 2);
    }

    ctx.restore();
}
function damageText(damage,type,size){ //type: blue, red, white, etc.
    let text = damage.toString();
    let damageSprite = []; //which capital and
    switch (type){
        case 'blue': 
            damageSprite[0] = sprites.hud.damageBlue;
            damageSprite[1] = sprites.hud.capitalDamageBlue;
            break;

        case 'red':
            damageSprite[0] = sprites.hud.damageRed;
            damageSprite[1] = sprites.hud.capitalDamageRed;
            break;

        case 'white':
            damageSprite[0] = sprites.hud.damage;
            damageSprite[1] = sprites.hud.capitalDamage;
            break;
            
        default:
            damageSprite[0] = sprites.hud.damageRed;
            damageSprite[1] = sprites.hud.capitalDamageRed;
            break;
    }

    ctx.drawImage(damageSprite[0],6 * text[text.length - 1],0,6,8,-size + size * (text.length - 1),-size*2,size*2,size*2); //first digit
    for (let index = 1; index < text.length - 1; index ++){
        ctx.drawImage(damageSprite[0],6 * text[index],0,6,8,2 * size * index - size * (text.length),-size*2,size*2,size*2); //middle digits
    }
    if (text.length > 1) ctx.drawImage(damageSprite[1],6 * text[0],0,6,12,-2 * size * (text.length - 1) + size * (text.length - 2),-size*3,size*2,size*3); //leading digit
}
let alphabetIndex = {
	" ": 0,
	a: 1,
	b: 2,
	c: 3,
	d: 4,
	e: 5,
	f: 6,
	g: 7,
	h: 8,
	i: 9,
	j: 10,
	k: 11,
	l: 12,
	m: 13,
	n: 14,
	o: 15,
	p: 16,
	q: 17,
	r: 18,
	s: 19,
	t: 20,
	u: 21,
	v: 22,
	w: 23,
	x: 24,
	y: 25,
	z: 26,
	0: 27,
	1: 28,
	2: 29,
	3: 30,
	4: 31,
	5: 32,
	6: 33,
	7: 34,
	8: 35,
	9: 36,

    A: 1,
	B: 2,
	C: 3,
	D: 4,
	E: 5,
	F: 6,
	G: 7,
	H: 8,
	I: 9,
	J: 10,
	K: 11,
	L: 12,
	M: 13,
	N: 14,
	O: 15,
	P: 16,
	Q: 17,
	R: 18,
	S: 19,
	T: 20,
	U: 21,
	V: 22,
	W: 23,
	X: 24,
	Y: 25,
	Z: 26,
}
function bananaText(text,fontName,x,y,size,center){
    //text: [line1,line2,line3]
    let font = fontData[fontName];
    let h = Math.hypot(font.width,font.height);

    if (!center){
        for (let Y = 0; Y < text.length; Y++){
            for (let i = 0; i < text[Y].length; i++) {
                ctx.drawImage(sprites.fonts[font.sprite],
                    font.width * alphabetIndex[text[Y][i]],
                    0,
                    font.width,
                    font.height,
                    x + size * font.width / h * i,
                    y + size * font.height / h * Y,
                    size * font.width / h,
                    size * font.height / h
                );
            }
        }
    }
    else if (center == 'right') {
        for (let Y = 0; Y < text.length; Y++){
            let lineWidth = text[Y].length * size * font.width/h;
            for (let i = 0; i < text[Y].length; i++) {
                ctx.drawImage(sprites.fonts[font.sprite],
                    font.width * alphabetIndex[text[Y][i]],
                    0,
                    font.width,
                    font.height,
                    x - lineWidth + size * font.width / h * i,
                    y + size * font.height / h * Y,
                    size * font.width / h,
                    size * font.height / h
                );
            }
        }
    }
    else for (let Y = 0; Y < text.length; Y++){
        let lineWidth = text[Y].length * size * font.width/h;
        for (let i = 0; i < text[Y].length; i++) {
            ctx.drawImage(sprites.fonts[font.sprite],
                font.width * alphabetIndex[text[Y][i]],
                0,
                font.width,
                font.height,
                x - lineWidth/2 + size * font.width / h * i,
                y + size * font.height / h * Y,
                size * font.width / h,
                size * font.height / h
            );
        }
    }
}


function drawBackground(){
    if (stage.animation) {
        animatedSprite('background',0,stage.animation,'default');
        //ctx.drawImage(sprites.stage[stage.animation.spritesheet],-stage.blastX,0,stage.blastX * 2,stage.blastY);
    }
    else {
        ctx.fillStyle = slowTimer ? '#fff' : '#111';
        ctx.fillRect(-stage.blastX,0,stage.blastX * 2,stage.blastY);
    }
}
let HUDscale = 1; //can be changed by player
function drawHUD(){
    let scale = halfHeight/600 * HUDscale;
    
    //p2
    //ctx.fillRect(halfWidth * 2 - 180 * scale,0,180 * scale,180 * scale);
    if (playerList[1]){
        ctx.drawImage(sprites.hud.hudRed,halfWidth * 2 - 540 * scale,0,540 * scale,180 * scale);
        ctx.save(); ctx.scale(-1,1);
        if (sprites.hud[playerList[1].char]) ctx.drawImage(sprites.hud[playerList[1].char],-halfWidth * 2,0,180 * scale,180 * scale);
        if (sprites.hud[playerList[1].char + 'Stock']) {
            for (let c = 0; c < playerList[1].stocks; c++) ctx.drawImage(sprites.hud[playerList[1].char + 'Stock'],-halfWidth * 2 + (180 + 60 * c) * scale,120 * scale,60 * scale,60 * scale);
        }
        ctx.restore();
        ctx.save(); ctx.translate(halfWidth * 2 - (180 + 40 * playerList[1].damage.toString().length) * scale, 120 * scale);
        damageText(playerList[1].damage, 'red', 40 * scale); //this should get its own sprite instead of using the player damage display
        ctx.restore();
        bananaText(['ping ' + ping],'small',halfWidth * 2 - 20 * scale,170 * scale,60 * scale,'right');
    }

    //p1 (overlaps p2 if it ever has to)
    //ctx.fillRect(0,0,180 * scale,180 * scale);
    if (playerList[0]){
        ctx.drawImage(sprites.hud.hudBlue,0,0,540 * scale,180 * scale);
        if (sprites.hud[playerList[0].char]) ctx.drawImage(sprites.hud[playerList[0].char],0,0,180 * scale,180 * scale);
        if (sprites.hud[playerList[0].char + 'Stock']) {
            for (let c = 0; c < playerList[0].stocks; c++) ctx.drawImage(sprites.hud[playerList[0].char + 'Stock'],(180 + 60 * c) * scale,120 * scale,60 * scale,60 * scale);
        }
        ctx.save(); ctx.translate((360 - 40 * playerList[0].damage.toString().length) * scale, 120 * scale);
        damageText(playerList[0].damage, 'blue', 40 * scale); //this should get its own sprite instead of using the player damage display
        ctx.restore();
        bananaText(['ping ' + (opponentPing || '0')],'small',20 * scale,170 * scale,60 * scale);
    }

   

} //should also include start and stop text


function drawScene(){
    ctx.imageSmoothingEnabled = false; //makes sprites nice and crisp

    ctx.save();
    ctx.translate(halfWidth,halfHeight);
    ctx.scale(camera.zoom * halfWidth/600,-camera.zoom * halfWidth/600); //invert so up is +y
    ctx.translate(-camera.x,-camera.y);

        //background
        drawBackground();

        ctx.translate((2 * Math.random() - 1) * camera.shake,(2 * Math.random() - 1) * camera.shake); //V I B R A T E

        //collision
        for (let index = 0; index < collisionList.length; index++) drawCollision(collisionList[index]);

        //back particles
        backParticles = processParticles(backParticles);

        //players
        for (let index = 0; index < playerList.length; index++) drawPlayer(playerList[index]);

        //projectiles
        for (let index = 0; index < projectileList.length; index++) drawProjectile(projectileList[index]);

        //front particles
        frontParticles = processParticles(frontParticles);

        if (showHitboxes) for (let index = 0; index < hitboxList.length; index++) drawHitbox(hitboxList[index]);

    ctx.restore();


    drawHUD();
}
//#endregion

//needs work! tracking, zoom, etc.
const edgeOffset = 0; //how far away from the blast zone the camera stops.
let camera = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    zoom: 1.3,
    shake: 0,
}
function shakeCamera(amount){
    if (!rollingBack){ //please don't shake the camera during a rollback!
        camera.shake = Math.floor(amount);
        if (camera.shake > 80) camera.shake = 80; //cap shake
    }
}
function meanPlayerPos(){
    let output = {x: 0, y: 0, Mx: 1000, Px: -1000, My: 1000, Py: -1000}; //center and bounds
    for (let i = 0; i < playerList.length; i++){
        let x;
        let y;

        if (playerList[i].action == 'respawning' && playerList[i].actionTimer < 60) {
            x = playerList[i].deathCoords[0];
            y = playerList[i].deathCoords[1];
        }
        else {
            x = playerList[i].x;
            y = playerList[i].y;
        }

        if (x < output.Mx) output.Mx = x;
        if (x > output.Px) output.Px = x;
        if (y < output.My) output.My = y;
        if (y > output.Py) output.Py = y;

        output.x += x;
        output.y += y;
    }
    output.x /= playerList.length;
    output.y /= playerList.length;

    return(output)
}
function processCamera(){
    if (camera.shake) camera.shake --;

    //get data for average player position and player bounds
    let playerCenter = meanPlayerPos();

    //zoom camera
    let xRange = halfWidth/(Math.abs(playerCenter.Px - playerCenter.Mx) || 1);
    let yRange = halfWidth/(Math.abs(playerCenter.Py - playerCenter.My) || 1);
    let desiredZoom = 0.8 * (xRange < yRange ? xRange : yRange);

    if (desiredZoom > 1.5) desiredZoom = 1.5;
    else if (desiredZoom < 1.3) desiredZoom = 1.3;
    
    camera.zoom += (desiredZoom - camera.zoom)/100;

    //move camera
    camera.vx += 0.9 * Math.sign(playerCenter.x - camera.x - camera.vx * 10); //when did I come up with this equation? I don't understand it
    camera.vy += 0.9 * Math.sign(playerCenter.y - camera.y - camera.vy * 10);
    if (Math.abs(camera.vx) >= 1) camera.x += camera.vx; //prevents jittering
    if (Math.abs(camera.vy) >= 1) camera.y += camera.vy;

    //stop at edges
    if (camera.x + 2 * halfWidth / camera.zoom + edgeOffset > stage.blastX) {
        camera.x = stage.blastX - 2 * halfWidth / camera.zoom - edgeOffset;
        camera.vx = 0;
    }
    if (camera.x - 2 * halfWidth / camera.zoom - edgeOffset < -stage.blastX) {
        camera.x = -stage.blastX + 2 * halfWidth / camera.zoom + edgeOffset;
        camera.vx = 0;
    }
    if (camera.y - 2 * halfHeight / camera.zoom - edgeOffset < 0) {
        camera.y = 2 * halfHeight / camera.zoom + edgeOffset;
        camera.vy = 0;
    }
    if (camera.y + 2 * halfHeight / camera.zoom + edgeOffset > stage.blastY) {
        camera.y = stage.blastY - 2 * halfHeight / camera.zoom - edgeOffset;
        camera.vy = 0;
    }
}



let clientSlow = 0; //skip every this many frames. used for syncing clients online
let clientSync = 0; //counter
let slowTimer = 0;
function processScene(){
            checkRollback(); //rollback returns to the current frame, which is then run here in processScene. Putting this function anywhere below will result in functions being skipped or run twice in a frame

            //inputs 
            //checkGamepads();
            if (gameState !== 'start') applyInputQueue(); //don't apply inputs during the beginning of the games

            //collision
            processCollision();

            //players
            hitboxList = [];
            processPlayers();

            //projectiles
            processProjectiles();

            checkHitboxes(); //hit players

            checkGameState();

            gameTime ++;
} //run during the game

function runGame(){
    if (!paused) {
        if (clientSync != 1) processScene();

        if (clientSync > 0) clientSync--;
        else if (clientSlow && slowTimer) clientSync = clientSlow; //when unused, clientSync = -1

        if (slowTimer) slowTimer --;
    }
    processCamera(); //putting this in processScene would add a tiny bit of clutter (lag) to the rollback
    drawScene();
}






//#region inputs
let inputQueue;
let inputLog; //record of every input during the game
let inputDelay = 6;
let inputTimeout = 300; //removed from queue 5 seconds after being activated
let inputCount;
function newInput(type,value,playerID){
    let input = {
        timestamp: gameTime + inputDelay,
        player: playerID,
        type: type,
        value: value,
        id: inputCount,
    };
    inputQueue.push(input);
    inputLog.push(input);
    if (online) sendInput(input);
    inputCount ++;
}
function addInput(input){
    //check order
    /*  Example of why this is important:
            client sends opponent left then right at the same gameTime
            internet lag results in the right packet arriving before the left
            opponent adds right then left to their inputqueue
            on opponent's screen, client moves the wrong way
            unresolvable desync; they inputqueue is forever ruined
    */
    
    let cancelled = false;

    if (!function(){

        for (let index = 0; index < inputQueue.length; index ++){
            let entry = inputQueue[index];

            //check for misordered entries
            if (input.timestamp == entry.timestamp && //same time
                input.player == entry.player //same player
                ) {
                    if (input.id == entry.id){
                        cancelled = true;
                        //console.log('duplicate input');
                        return(true); //don't add dupes!
                    }
                    else if (input.id < entry.id){ //input was actually from before the entry{
                        console.log('REORDERED SAME-FRAME INPUT (type ' + input.type + ')');
                        inputQueue.splice(index,0,input); //this part is fine

                        for (let i2 = 0; i2 < inputLog.length; i2 ++) {
                            let e2 = inputLog[i2];
                            //console.log('Inputlog: ' + inputLog.length + ' entries and looking at ' + i2);
                            if (e2.player == entry.player && e2.id == entry.id) {
                                inputLog.splice(i2,0,input); //puts the input in the same spot as with inputQueue. there may be a more efficient way to do this.
                                break;
                            }
                        } //this is super inefficient! I don't want to look through all of inputLog to put it in the right spot
                        return (true); //this should only happen VERY rarely.
                    }
            }
        }
    }()) { //flag hack; execute the for loop, and if it never returns, do the if. If it did return, the for found what it was looking for
        inputQueue.push(input); 
        inputLog.push(input);
    }

    return !cancelled;

} //for if you already have a full input (like from another player)
function applyInputQueue(){
    let newList = [];
    for (let index = 0; index < inputQueue.length; index ++){
        let input = inputQueue[index];
        if (input.timestamp == gameTime) {

            let player = playerList[input.player];
            player.inputs[input.type] = input.value;

            //set drift
            switch (input.type){
                case 'left': 
                    if (input.value == 1) player.drift = -1; //drift left
                    else if (player.inputs.right) player.drift = 1; //if releasing left while still holding right, drift right
                    else player.drift = 0;
                    break;

                case 'right': 
                    if (input.value == 1) player.drift = 1; //drift right
                    else if (player.inputs.left) player.drift = -1; //if releasing right while still holding right, drift left
                    else player.drift = 0;
                    break;

                case 'up':
                    if (input.value == 1) player.vdrift = 1;
                    else if (player.inputs.down) player.vdrift = -1;
                    else player.vdrift = 0;
                    break;

                case 'down':
                    if (input.value == 1) player.vdrift = -1;
                    else if (player.inputs.up) player.vdrift = 1;
                    else player.vdrift = 0;
                    break;

                default:
            }
        }
       
        if (gameTime - input.timestamp < inputTimeout) newList.push(inputQueue[index]); //get rid of old inputs
    }
    inputQueue = newList;
}
function applyAllInputs(){
    for (let index = 0; index < inputQueue.length; index ++){
        let input = inputQueue[index];

        if (input.timestamp <= gameTime) { //don't apply queued ones!
                let player = playerList[input.player];
                player.inputs[input.type] = input.value;

                //set drift
                switch (input.type){
                    case 'left': 
                        if (input.value == 1) player.drift = -1; //drift left
                        else if (player.inputs.right) player.drift = 1; //if releasing left while still holding right, drift right
                        else player.drift = 0;
                        break;

                    case 'right': 
                        if (input.value == 1) player.drift = 1; //drift right
                        else if (player.inputs.left) player.drift = -1; //if releasing right while still holding right, drift left
                        else player.drift = 0;
                        break;

                    case 'up':
                        if (input.value == 1) player.vdrift = 1;
                        else if (player.inputs.down) player.vdrift = -1;
                        else player.vdrift = 0;
                        break;

                    case 'down':
                        if (input.value == 1) player.vdrift = -1;
                        else if (player.inputs.up) player.vdrift = 1;
                        else player.vdrift = 0;
                        break;

                    default:
                }
            }
    }
} //used when the game starts. NEEDS UPDATE

const keyActions = ['left','right','up','down','jump','attack','cleft','cright','cup','cdown'];
let keyCodes = ['KeyA','KeyD','KeyW','KeyS','Space','KeyO','KeyJ','KeyL','KeyI','KeyK'];
//key.code is used to avoid irritations with shift

//document.onkeydown also works, and only matters in terms of event listener orders (which we don't care about)
function keyDown(key){
    //console.log(key.code + ' down');

    if (rebinding != undefined) {
        keyCodes[rebinding] = key.code;
        rebinding = undefined;
    }
    else if (gameState == 'none') menuKeyDown(key);
    else {
        //make sure the keyboard is actually being used
        if (controllers.defaultKeyboard < playerList.length)
            if (keyCodes.indexOf(key.code) != -1) { //if it's a valid key
                newInput(keyActions[keyCodes.indexOf(key.code)],1,controllers.defaultKeyboard); //make a new input for it
        }
    }
}
function keyUp(key){
    if (gameState !== 'none'){ //not in menus
        //console.log(key.code + ' up');
        if (controllers.defaultKeyboard < playerList.length)
            if (keyCodes.indexOf(key.code) != -1) {
                newInput(keyActions[keyCodes.indexOf(key.code)],0,controllers.defaultKeyboard);
        }
    }
}
function listenForInputs(){
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    //controller listeners go here too
}
//function clearInputListeners(){
    //window.removeEventListener('keydown', keyDown);
    //window.removeEventListener('keyup', keyUp);
//} //unnecessary
function getBindName(bind){
    let pos = keyActions.indexOf(bind);
    let txt = {
        K: keyCodes[pos][3],
        D: keyCodes[pos][5],
        A: keyCodes[pos].slice(5)
    }[keyCodes[pos][0]] || keyCodes[pos];
    return(txt);
}
let rebinding;
function rebindAction(action){
    rebinding = keyActions.indexOf(action);
}


let gamepads; //list of active gamepad inputs from the previous frame
function cloneGamepadState(gamepad){
    let output = {};

    output.buttons = [];
    for (let i = 0; i < gamepad.buttons.length; i++) output.buttons[i] = gamepad.buttons[i].pressed;
    output.axes = gamepad.axes;

    return(output);
}
function checkGamepads(){
    let allGamepads = navigator.getGamepads(); //get a list of all connected gamepads

    let activeGamepads = []; //assemble a list of gamepads that are mentioned in controllers; the ones actually used by the game
    for (let index = 0; index < allGamepads.length; index ++) if (controllers[allGamepads[index].id]) activeGamepads.push(allGamepads[index]);

    if (!gamepads && activeGamepads.length) {
        gamepads = [];
        for (let index = 0; index < activeGamepads.length; index ++) gamepads[index] = {buttons: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false], axes: [0, 0, 0, 0]};
    }
    else {
        for (let index = 0; index < activeGamepads.length; index ++) {
            inputController(activeGamepads[index],gamepads[index],controllers[activeGamepads[index].id]);
            gamepads[index] = cloneGamepadState(activeGamepads[index]);
        }
    }
} //ISSUE: DISCONNECTING A GAMEPAD MIDGAME WILL MESS EVERYTHING UP * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

const proControllerActions =    ['attack', 'attack',   'jump', 'jump', 'jump', 'attack',   'jump', 'attack',   ];
//const proControllerButtons =  ['A',      'B',        'X',    'Y',    'L',    'R',        'ZL',   'ZR'        ]; //add dpad!
const axisActions = {
    x: {
        0: 'left',
        1: 'left',
        3: 'right',
        4: 'right',
        5: 'right',
        7: 'left',
        8: 'left',
    },
    y: {
        1: 'up',
        2: 'up',
        3: 'up',
        5: 'down',
        6: 'down',
        7: 'down',
    },
}

const deadZone = 0.2;
function inputController(neo,old,player){
    //new is reservered so I'm calling it neo

    //check for new buttons
    for (let index = 0; index < neo.buttons.length; index++){
        if (neo.buttons[index].pressed !== old.buttons[index] && proControllerActions[index]) {
            newInput(proControllerActions[index], +neo.buttons[index].pressed, player);
        }
    }

    //check axes
    checkAxes(neo,old,player);
    checkAxes(neo,old,player,true); //cstick
}
function angle8(x,y){
    return(Math.round(4 * (1 + Math.atan2(y,x) / Math.PI)));
}
function checkAxes(neo,old,player,cstick){
    let xIndex = cstick ? 2 : 0;
    let yIndex = cstick ? 3 : 1;
    let cText = cstick ? 'c' : '';

    let neoAngle = angle8(neo.axes[xIndex],neo.axes[yIndex]);
    let oldAngle = angle8(old.axes[xIndex],old.axes[yIndex]);
    let neoDead = Math.hypot(neo.axes[xIndex],neo.axes[yIndex]) < deadZone;
    let oldDead = Math.hypot(old.axes[xIndex],old.axes[yIndex]) < deadZone;

    if (!neoDead && !oldDead && neoAngle !== oldAngle) { //change angle
        if (axisActions.x[oldAngle] && axisActions.x[oldAngle] !== axisActions.x[neoAngle]) newInput(cText + axisActions.x[oldAngle], 0, player); //clear old input, if it's not the same as the new one
        if (axisActions.y[oldAngle] && axisActions.y[oldAngle] !== axisActions.y[neoAngle]) newInput(cText + axisActions.y[oldAngle], 0, player);

        if (axisActions.x[neoAngle] && axisActions.x[oldAngle] !== axisActions.x[neoAngle]) newInput(cText + axisActions.x[neoAngle], 1, player); //add new ones
        if (axisActions.y[neoAngle] && axisActions.x[oldAngle] !== axisActions.x[neoAngle]) newInput(cText + axisActions.y[neoAngle], 1, player);
    }
    else if (!neoDead && oldDead) { //angle from death
        if (axisActions.x[neoAngle]) newInput(cText + axisActions.x[neoAngle], 1, player);
        if (axisActions.y[neoAngle]) newInput(cText + axisActions.y[neoAngle], 1, player);
    }
    else if (neoDead && !oldDead) { //neutral
        if (axisActions.x[oldAngle]) newInput(cText + axisActions.x[oldAngle], 0, player);
        if (axisActions.y[oldAngle]) newInput(cText + axisActions.y[oldAngle], 0, player);
    }
}
//#endregion






let showHitboxes = 0


let gameState = 'none'; //none/start/mid/end
let secondaryTimer; //pre- and post-game timer
let paused;

let gameEndCallback;
let gameInterval;
let gameTime;

let stage;
/*
    background, //sprite

    collision, //(reference; collisionList is used for actual stuff)
    blastX, //if a player goes past this, they die
    blastY, //if a player goes above this while in hitstun, they die

    spawnPositions, //x and y for each player index
*/

let ruleset;
/*
    stocks,
    time, //unimplemented
*/


let playerList;
let projectileList;
let frontParticles;
let backParticles;
let collisionList;

let controllers; //list of input sources and the players they control
// controllers = {'defaultKeyboard': 0, 'nintendoswitchgamepad': 1}

let frameRate = 60;
function startGame(players,controls,rules,stageName,callback){
    //reset menu stuff
    menuCharacter = false;

    //reset stuff
    gamepads = false;
    inputQueue = [];
    inputLog = [];
    inputCount = 0;
    gameTime = 0;
    projectileList = [];
    frontParticles = [];
    backParticles = [];
    gameEndReason = {
        type: 'error',
        player: 0,
    };
    paused = false;

    //set who and what controls who
    controllers = controls;

    //set ruleset
    ruleset = rules;

    //set stage
    stage = stageData[stageName];
    collisionList = stageData[stageName].collision;

    //create players
    playerList = [];
    for (let index = 0; index < players.length; index ++) {
        //add to list
        playerList.push(new player(players[index],index));

        //set stocks
        playerList[index].stocks = ruleset.stocks;

        //set position
        if (stage.spawnPositions[index]) {
            playerList[index].x = stage.spawnPositions[index].x;
            playerList[index].y = stage.spawnPositions[index].y;
        }
        else { //if there isn't a spawn position, put them at the top. this is just to give them a valid position to spawn if you want a 20-player match
            playerList[index].x = 0;
            playerList[index].y = stage.blastY;
        }
    }
    

    gameEndCallback = callback; //this is the function to be executed when the game ends. This is so, for example, menus.js to be able to go back to the character selection screen.

    //start game
    gameState = 'start';
    secondaryTimer = gameStartDuration;
    listenForInputs();
    gameInterval = setInterval(runGame,1000/frameRate);
}

const gameStartDuration = 18; //should be 180
const gameEndDuration = 180;
function checkGameState(){
    switch (gameState){
        case 'start':
            if (!secondaryTimer) {
                //apply all inputs that happened before the game
                applyAllInputs();

                //start the game
                gameState = 'mid';
            }
            else secondaryTimer --;
            break;

        case 'end':
            if (!secondaryTimer) {
                //exit
                terminateGame(gameEndReason);
            }
            else secondaryTimer --;
            
            break;

        default:
    }
}
let gameEndReason;
function checkGameEnd(){
    let winnerCheck = 'none';
    for (let index = 0; index < playerList.length; index++) {
        if (playerList[index].stocks) {
            if (winnerCheck != 'none') return;
            else winnerCheck = index;
        }
    }
    
    //this part only gets executed if there's a winner
    if (!online) endGame(gameEndReason = {
            type: 'win',
            player: winnerCheck,
        });
    else {
        gameState = 'pending'; //players can't die, but the game still runs and controls
        confirmGameEnd(winnerCheck); //the game will eventually end via talkServer
        console.log('checking win for player ' + winnerCheck);
    }
}


function endGame(reason){
    
        gameEndReason = reason;
        gameState = 'end';
        secondaryTimer = gameEndDuration;

        console.log('Game ending.')
        console.log(gameEndReason);
}
function terminateGame(){
    /*
        reason = {
            type: 'win'/'quit'/'disconnect',
            player: 0/1/2/3/etc, //the player responsible for the type, like the winner, quitter, etc.
        }
    */

        

    //clearInputListeners(); unnecessary

    online = false;
    clearInterval(gameTimeInterval);

    gameState = 'none';
    clearInterval(gameInterval);
    if (gameEndCallback) gameEndCallback(gameEndReason);
}
