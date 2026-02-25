let clientID;
let roomID;


//#region lobbies
function connectToServer(){
    bananaRequest(bananaURL + '/check',res=>{
        ongoingGames = res.responseText;
        clearPing();
        changeMenu('online');
    }, 2000, ()=>{
        changeMenu('main'); //on timeout, go back to main menu
    }); //HOW DO I CHECK IF THIS THROWS AN ERROR so I can go back to the main menu
}
function leaveServer(){
    changeMenu('onlineTimeout');
}

function quickmatch(callback){
    bananaRequest(bananaURL + '/quickmatch',res=>{
        if (res.responseText != 'error') {
            setData(res.responseText);
            callback();
        }
    });
} //goes into charselect when returned
function setData(unparsedData){
    let data = JSON.parse(unparsedData);
    roomID = data.roomID;
    clientID = data.clientID;
} //sets data for a newly connected room


/* deprecated?
function joinRoom(room){
    bananaRequest(bananaURL + '/joinRoom/' + room,res=>{
        if (res.responseText != 'error') {
            let data = res.responseText;
            roomID = data.roomID;
            clientID = data.clientID;
            return true;
        }
        else return(false);
    }, 2000, ()=>{joinRoom(room)});
}
*/
function createRoom(){
    bananaRequest(bananaURL + '/privateRoom',res=>{
            setData(res.responseText);
            changeMenu('privateRoom','empty');
            talkServerInterval = setInterval(()=>{talkServer()},1000);
    }, 2000, ()=>{createRoom()});
}
function joinPrivateRoom(room){
    bananaRequest(bananaURL + '/joinRoom/' + room,res=>{
            if (res.responseText[0] == '{') {
                setData(res.responseText);
                changeMenu('onlineCharselect','char1');
                talkServerInterval = setInterval(()=>{talkServer()},1000);
            }
            else {
                privateRoomError = res.responseText;
                changeMenu('cannotJoinPrivateRoom');
            }
    }, 2000, ()=>{joinRoom(room)});
}
function changeCharacter(character){
    menuCharacter = false;
    bananaRequest(roomURL() + 'character/' + character,res=>{
        menuCharacter = character; //only set when it's confirmed by the server
        changeMenu('onlineCharselectStart','start');
    }, 2000, ()=>{changeCharacter(character)});
}
function queueReady(){
    bananaRequest(roomURL() + 'ready',res=>{}, 2000, ()=>{queueReady()});
} //starts clientside game when returned
function unqueueReady(callback){
    bananaRequest(roomURL() + 'unready',res=>{callback()}, 2000, ()=>{unqueueReady()});
}

function leaveRoom(){
    bananaRequest(roomURL() + 'leave',res=>{}, 2000, ()=>{leaveRoom()});
} //goes back to online menu when returned

