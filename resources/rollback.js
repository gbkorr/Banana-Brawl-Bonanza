let online;
const bananaURL = 'http://localhost:8000'; //that's this computer


function average(list){
    let sum = 0;
    for (let index = 0; index < list.length; index ++) sum += list[index];
    return((sum/list.length) || 0);
}

function roomURL(){
    return(bananaURL + '/room/' + roomID + '/' + clientID + '/');
}



function bananaRequest(url,callback,timeout,ontimeout,payload){
    const req = new XMLHttpRequest();

    req.addEventListener('load', function(){callback(this)});
    if (timeout) {
        req.timeout = timeout;
        req.ontimeout = ontimeout;
    }
    req.onerror = leaveServer;
    req.open(payload ? 'POST' : 'GET', url);
    req.send(payload);
}


//how long can the timeout on getInputs and getSync be?

function sendInput(input){
    bananaRequest(roomURL() + 'sendInput',res=>{
        //console.log(res.responseText);
    },2000,input=>{sendInput(input)},JSON.stringify(input));
}
function getInputs(numberOfReceivedInputs){
    if (online) 
    bananaRequest(roomURL() + 'getInputs/' + (numberOfReceivedInputs || '0'),res=>{
        
            let data = JSON.parse(res.responseText);
            //console.log(data);

            let receivedInputs = data.length; //this is sent back to the server, which then deletes this number

            let needsRollback = 0;
            for (let index = 0; index < data.length; index ++){    
                if (addInput(data[index])){ //returns true if not a dupe
                    if (data[index].timestamp < gameTime){ //late input
                        let difference = gameTime - data[index].timestamp;
                        console.log('late by ' + difference);
    
                        if (difference < inputTimeout && needsRollback != 2) needsRollback = 1; //short
                        else needsRollback = 2; //long
                    }
                }
            }

            if (needsRollback == 1) {
                //console.log('performing short rollback');

                performShortRollback();
            }
            else if (needsRollback == 2){
                //console.log('LONG ROLLBACK executed');

                performLongRollback();
            }


            getInputs(receivedInputs); //sends the amount received this time to be cut next time
        

    },2000,()=>{getInputs()}); //if timed out, number of received is not sent, as we don't want that to be duped (resulting in uncreceived inputs being cut). Instead, more will just be received next time until they can all get cut
} //occasional drops/issues are caused by an unknown issue in the "wait" requests (i.e. requests that are stored in the server to be responded to later)
//proof: if you create a request like this that doesn't get responded to often (unlike inputs or synccheck), the client will start to lag and send things like inputs in slow, delayed blocks
//~~~~~~~~~~ ideally, FIX THIS SOMETIME to improve the netcode for free

function getSync(){ //gets gametime from other clients
    //if online makes the function stop asking when the game is over
    if (online) bananaRequest(roomURL() + 'getSync',res=>{
        
            let incomingTime = JSON.parse(res.responseText) - Math.floor(gamePing/2); //PLUS YOUR PING/2
            
            if (incomingTime - gameTime > 60) {
                gameTime = incomingTime;
                performLongRollback(); //do a rollback to jump to the present. Then, the game will receive inputs and realize it needs a longRollback, which will apply the necessary inputs
            } //if over a second behind, jump to present
            
            if (gameTime - incomingTime > 6) {
                clientSlow = 6;
                slowTimer = 60;
            } //if over 6 frames ahead, slow down

            getSync();
        
    },2000,()=>{getSync()});
}
function sendGameTime(){ //do this every second or two
    let adjustedTime = gameTime + Math.ceil(gamePing/2); //gameTime + ping/2;

    bananaRequest(roomURL() + 'sendGameTime/' + adjustedTime,res=>{
        //console.log(res.responseText);

    });
}
//the time to sync two clients separated by D frames is equal to D/(fps - fps * (s-1)/s) where s is the value for clientSlow
//for example, a 60 frame difference can be resolved in 2 seconds with aggressive skip-every-third-frame
//in the future, I could use some math to make this better, but I'll currently just have it set to 6



function confirmGameEnd(reason){
    bananaRequest(roomURL() + 'confirmGameEnd/' + reason,res=>{
    },2000,()=>{confirmGameEnd(reason)}); //this one is important to resend
}


let talkServerInterval;
function talkServer(){
    openPing();

    bananaRequest(roomURL() + 'talk/' + ping,res=>{
        closePing();

        let data = JSON.parse(res.responseText);

        opponentPing = data.opponentPing;

        if (data.startGame && gameState == 'none') {
            controllers = {defaultKeyboard: data.startGame.index}; //TEMPORARY
            startOnlineGame(data.startGame.players,controllers,{stocks:3},data.startGame.stage); //everything but controllers SHOULD BE serverside
        }

        if (data.gameEndReason && gameState !== 'end' && gameState !== 'none') endGame(data.gameEndReason); //if the game was ended prematurely, the client will exit to the online menu, and the room closes automatically 

    }, 2000, ()=>{closePing()});
}
let ping; //ping in ms
let pingList; //last 4 pings
let gamePing; //frames before response
let gamePingList; //last 4
let pingInterval;
let pingTimer;
let pingGT;
let opponentPing;
function openPing(){
    pingTimer = 0;
    pingInterval = setInterval(()=>{pingTimer++},1);
    pingGT = gameTime;
}
function closePing(){
    clearInterval(pingInterval);

    pingList.push(pingTimer);
    pingList = pingList.slice(-4); //remove first entry if over 4
    ping = Math.floor(average(pingList));

    let gameTimeDifference = gameTime - pingGT;
    gamePingList.push(gameTimeDifference);
    gamePingList = gamePingList.slice(-4);
    gamePing = Math.floor(average(gamePingList));

    //console.log('Ping: ' + ping);
    //console.log('gamePing: ' + gamePing);
}
function clearPing(){
    ping = 0;
    pingList = [];
    gamePing = 0;
    gamePingList = [];
}



let intervalTimer = 0;
let gameTimeInterval;

function startOnlineGame(players,controls,rules,stageName){
    online = true;

    startGame(players,controls,rules,stageName,onlineGameEndCallback);

    shortRollback = [gameStateBackup(),gameStateBackup()];
    longRollback = [gameStateBackup(),gameStateBackup()];

    getInputs();
    getSync();

    gameTimeInterval = setInterval(()=>{
        
        sendGameTime(); //every second

        //if (intervalTimer % 5 == 0) //every 5 seconds

        intervalTimer++;
    },1000); //every second?
}






//#region Rollback
function JSONClone(object){ //fully clones an object, but removes undefined and METHODS
    return(JSON.parse(JSON.stringify(object)));
}
function assignClone(object){ //properties that are objects aren't cloned and still reference the original. This is FINE if they're static
    let objectClone = {};
    Object.assign(objectClone,object);
    return(objectClone);
}
function gameStateBackup(){
    let backup = {};

    //variables (cloned automatically)
    backup.gameTime = gameTime;
    backup.secondaryTimer = secondaryTimer;
    backup.gameState = gameState;

    //objects (require explicit cloning)
    backup.collisionList = [];
    for (let index = 0; index < collisionList.length; index++){
        backup.collisionList.push(assignClone(collisionList[index])); //methods + static objects: assignClone
    }
    backup.projectileList = [];
    for (let index = 0; index < projectileList.length; index++){
        backup.projectileList.push(assignClone(projectileList[index]));
    } //ditto
    backup.playerList = JSONClone(playerList); //no methods, active objects: JSONClone

    return(backup);
}
function restoreGameState(backup){

    gameTime = backup.gameTime;
    secondaryTimer = backup.secondaryTimer;
    gameState = backup.gameState;
    winner = backup.winner;

     //if we didn't clone these again, they would suddenly change the backup!
    collisionList = [];
    for (let index = 0; index < backup.collisionList.length; index++){
        collisionList.push(assignClone(backup.collisionList[index])); //methods + static objects: assignClone
    }
    projectileList = [];
    for (let index = 0; index < backup.projectileList.length; index++){
        projectileList.push(assignClone(backup.projectileList[index])); //methods + static objects: assignClone
    }

    playerList = [];
    for (let index = 0; index < backup.playerList.length; index++){
        let playerClone = new player('example',0); //makes it so the clone is also a 'player'. Otherwise, the JSON would cause things to be 'Object's
        Object.assign(playerClone,JSONClone(backup.playerList[index])); //the player needs to be JSON cloned; otherwise, its inputs would not be cloned by the assign
        playerList.push(playerClone);
    }
}
let shortRollback; //shorter than inputqueue killtime. [inuse backup, queued backup]
let longRollback; //around 20 seconds; only for big packet loss
let rollingBack = false;
function checkRollback(){ //backs up rollback
    if (online){
        //repeatedly save gameState. Timing it with inputTimeout ensures that a shortRollback will always restore a state with the proper inputs (if anything earlier were restored, some inputs would have been killed)
        if (gameTime % Math.floor(inputTimeout/2) == 0) {
            if (!rollingBack) shortRollback[0] = shortRollback[1]; //can't overwrite the inuse backup while rolling back. Otherwise, it becomes very easy to ruin the system!
            shortRollback[1] = gameStateBackup();
        }

        //longRollback
        if (gameTime % 1200 == 0) {
            if (!rollingBack) longRollback[0] = longRollback[1]; //can't overwrite the inuse backup while rolling back. Otherwise, it becomes very easy to ruin the system!
            longRollback[1] = gameStateBackup();
        }
    }
}
function rollback(backup){
    if (gameState !== 'end'){ //can't rollback when the game is guaranteed ended
        let oldWinner = gameEndReason.player;

        let duration = gameTime - backup.gameTime;
        restoreGameState(backup);

        rollingBack = true;
        for (let count = 0; count < duration ; count ++) {
            processScene();
        }
        rollingBack = false;

        if (gameEndReason.player !== oldWinner) {
            console.log('Old winner: ' + oldWinner + '; New: ' + gameEndReason.player);
            confirmGameEnd('cancel');
        }
    }
};
function performShortRollback(){
    rollback(shortRollback[0]);
}
function performLongRollback(){
    for (let index = 0; index < inputLog.length; index ++) if (inputLog[index].timestamp >= longRollback[0].gameTime) {
        inputQueue = inputLog.slice(index); //cuts off inputs from before the rollback
        break;
    } //add part of inputLog to inputQueue; otherwise, a lot of old inputs would be missing

    rollback(longRollback[0]);
}
//#endregion




