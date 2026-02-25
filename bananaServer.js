const http = require("http");
const fs = require('fs').promises;

function parseURL(url){ //separates url into nice blocks
    let output = [];

    let section = url.slice(1);
    if (url[url.length] != '/') section += '/'; //for urls not ending in '/'. Also makes things nice

    while (section){ //we can safely while here because urls are capped at a certain amount of spots
        let entry = section.slice(0,section.indexOf('/'));
        output.push(entry); //always strings. "isNaN(Number(entry)) ? entry : Number(entry)" was used to get numbers, but it messes with when you want to send actual strings of numbers
        section = section.slice(section.indexOf('/') + 1);
    }
    return(output);
}
function randomID(){return(Math.random().toString().slice(2,8));} //generates random 6-digit id
function respond(res,response,error){
    res.writeHead(error || 200);
    res.end(response);
}


//TODO ~~ ~~ ~~~~ ~ ~ ~ ~ ~~  serverside inputqueue ISN'T EVER PRUNED and just keeps adding up

let openRoom;
let rooms = {};
function room(id){
    this.id = id; //id of room
    this.clients = {}; //contains the clients
    this.clientIDList = []; //list of all the clients; makes things easy

    this.state = 'menu';
    this.gameEndReason = false;

    ongoingGames++;
    rooms[id] = this;
}
function client(clientID){
    this.id = clientID;
    this.char;

    this.ready = false;

    this.inputQueue = [];
    this.getInput; //an xml response, to be fulfilled when new inputs are added

    this.getSync; //same thing, used for syncing the clients

    this.winner;

    this.timeout; //if the client doesn't send anything for 30 seconds, the room closes
}
function addInput(room,inputClient,input){ //puts an input into all the input queues except for the client that sent it
    for (let index = 0; index < room.clientIDList.length; index ++){
        let client = room.clients[room.clientIDList[index]];
        if (room.clientIDList[index] !== inputClient.id) {
            client.inputQueue.push(input);
            if (client.getInput) sendInput(client);
        }
    }
}
function sendInput(client){
    respond(client.getInput,JSON.stringify(client.inputQueue));
    client.getInput = undefined;
}
function distributeGameTime(room,inputClient,gameTime){ //sends a gametime to all the clients
    for (let index = 0; index < room.clientIDList.length; index ++){
        let client = room.clients[room.clientIDList[index]];
        if (room.clientIDList[index] !== inputClient.id) {
            if (client.getSync) sendTime(client,gameTime);
        }
    }
}
function sendTime(client,gameTime){
    respond(client.getSync,JSON.stringify(gameTime));
    client.getSync = undefined;
}

function endRoom(room,reason){
    console.log('Ending room ' + room.id + ' for reason: player ' + reason.player + ' ' + reason.type + '.');
    room.state = 'menu';
    room.gameEndReason = reason;

    room.clients = {}; //clear clients (inputqueue, etc.)
    for (let i = 0; i < room.clientIDList.length; i++) room.clients[room.clientIDList[i]] = new client(room.clientIDList[i]);
}
function checkTimeout(room,client){
    clearInterval(client.timeout);
    client.timeout = setTimeout(()=>{
        console.log('Player ' + client.id + ' timed out.');
        endRoom(room,{type: 'disconnect', player: room.clientIDList.indexOf(client.id)});
        setTimeout(()=>{killRoom(room)},30000); //delete room in 30 seconds
    },room.state == 'start' ? 30000 : 120000);
}

//for closing rooms: tell clients to quit (client will exit to online menu) and set a timeout of 30 seconds to delete the room

function talkClient(req,res,room,client){
    let data = {};

    if (room.state == 'start') {
        data.startGame = {
            players: getPlayers(room),
            stage: 'buddha',
            index: room.clientIDList.indexOf(client.id), //of the player asking in the list
        }
    }

    data.opponentPing = getOpponentPing(room,client);
    if (room.gameEndReason) data.gameEndReason = room.gameEndReason;

    respond(res,JSON.stringify(data))
}
function getPlayers(room){
    let players = [];
    for (let index = 0; index < room.clientIDList.length; index ++){
        players.push(room.clients[room.clientIDList[index]].char);
    }
    return(players);
}
function checkGameStart(room){
    room.gameEndReason = false; //resets stuff
    
    if (room.clientIDList.length > 1 && !function (){ //don't start with only one person in the room
        for (let index = 0; index < room.clientIDList.length; index ++){
            if (!room.clients[room.clientIDList[index]].ready) return true;
        }
    }()) {
        //console.log('Starting room ' + room.id + '.');
        room.state = 'start';
    }
} //if all clients are ready
function checkGameEnd(room,winner){
    if (!function(){
        for (let index = 0; index < room.clientIDList.length; index ++){
            if (room.clients[room.clientIDList[index]].winner == undefined) return true;
            else if (room.clients[room.clientIDList[index]].winner != winner) {
                console.log('Room ' + room.id + ':\nWinner discrepancy: ' + winner.toString() + ' received instead of ' + room.clients[room.clientIDList[index]].winner.toString() + '.');
                return true;
            }
        }
    }()) {
        endRoom(room,{type: 'win', player: winner})
    }
    //console.log(winner);
}
function getOpponentPing(room,client){
    for (let index = 0; index < room.clientIDList.length; index ++){
        if (client.id != room.clients[room.clientIDList[index]].id) return(room.clients[room.clientIDList[index]].ping);
    }
}






function receivePOST(req,res,callback){
    let body = '';
    req.on('data',data=>{
        body += data;
    });
    req.on('end',()=>{callback(body);
    });
}



function roomListener(req,res,url){

    
    if (rooms[url[1]]){
        let currentRoom = rooms[url[1]];

        if (currentRoom.clients[url[2]]){
            let currentClient = currentRoom.clients[url[2]];
            checkTimeout(currentRoom,currentClient);

            switch (url[3]){
                case 'sendInput': 
                    receivePOST(req,res,data=>{
                        addInput(currentRoom,currentClient,JSON.parse(data));
                        respond(res,'Input Received');
                    });
                    break;

                case 'sendGameTime':
                    distributeGameTime(currentRoom,currentClient,url[4]);
                    respond(res,'gameTime received');
                    break;

                case 'getInputs':
                    if (currentClient.getInput) respond(currentClient.getInput,'request resent');
                    currentClient.getInput = res;
                    currentClient.inputQueue = currentClient.inputQueue.slice(url[4]); //clears inputs that have been received
                    //console.log(currentClient.inputQueue.length);
                    break;

                case 'getSync':
                    if (currentClient.getSync) respond(currentClient.getSync,'request resent');
                    currentClient.getSync = res; //apparently this causes issues if these don't get responded to
                    break;

                case 'talk':
                    currentClient.ping = url[4];
                    talkClient(req,res,currentRoom,currentClient);
                    break;

                case 'confirmGameEnd':
                    if (url[4] == 'cancel') currentClient.winner = undefined;
                    else {
                        currentClient.winner = url[4];
                        checkGameEnd(currentRoom,url[4]);
                    }
                    respond(res);
                    break;

                case 'character':
                    currentClient.char = url[4];
                    respond(res,'');
                    break;
                    
                case 'ready':
                    currentClient.ready = true;
                    checkGameStart(currentRoom);
                    respond(res,'');
                    break;

                case 'unready':
                    currentClient.ready = false;
                    respond(res,'');
                    break;

                case 'leave':
                    leaveRoom(currentRoom,currentClient);
                    respond(res,'');
                    break;

                default: 
                    respond(res,'What are you looking for?',400);
            }
        }
        else {
            respond(res,"That's not a client!",400);
        }
    } 
    else {
        respond(res,"That's not a room!",400);
    }
}

function quickmatch(res){
    if (!openRoom) {
        openRoom = new room(randomID());
        joinRoom(res,openRoom.id);
    }
    else {
        joinRoom(res,openRoom.id);
        openRoom = false; //closes the open room
    }
}
function createPrivateRoom(res){
    privateRoom = new room(randomID());
    joinRoom(res,privateRoom.id);
}
function joinRoom(res,roomID){
    let room = rooms[roomID];

    if (room && room.state == 'menu'){
        let newClient = new client(randomID());
        room.clients[newClient.id] = newClient;
        room.clientIDList.push(newClient.id);

        respondRoom(res,roomID,newClient.id)
    } else respond(res, room ? 'game is in progress' : "room does not exist");
}
function leaveRoom(room,client){
    room.clientIDList.splice(room.clientIDList.indexOf(client.id),1); //remove from id list
    delete room.clients[client.id]; //remove from clients
    
    //removed  && openRoom
    if (room.clientIDList.length == 0) killRoom(room);
}
function killRoom(room){
    //console.log('killing room ' + room.id);
    ongoingGames--;
    delete rooms[room.id]; //delete room if it's empty
    if (openRoom.id == room.id) openRoom = false; //delete openRoom if this is the one
    //console.log(rooms);
}
let ongoingGames = 0;

function respondRoom(res,roomID,clientID){
    let data = {
        roomID: roomID,
        clientID: clientID,
    }
    respond(res,JSON.stringify(data));
}



function bananaListener(req,res){
    //console.log(req.url);
    let url = parseURL(req.url);

   

    switch (url[0]) {
        case 'check': 
            respond(res,ongoingGames.toString());
            break;

        case 'room':
            roomListener(req,res,url);
            break;

        case 'quickmatch':
            quickmatch(res)
            break;

        case 'joinRoom':
            joinRoom(res,url[1]);
            break;

        case 'privateRoom':
            createPrivateRoom(res);
            break;
    
        case '': //no url. serve html to main page
            fs.readFile(__dirname + '/index.html')
            .then(contents=>{
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(contents);
            });
            break;

        case 'resources':
            fs.readFile(__dirname + req.url)
            .then(contents=>{
                res.setHeader("Content-Type", "text/javascript");
                res.writeHead(200);
                res.end(contents);
            })
            .catch(err => {
                console.error(`Error reading file: ${err}`);
                res.writeHead(400);
                res.end("I don't have that file!");
            });    
            break;

        default:
            respond(res,'What are you looking for?',404);
    }
}


const server = http.createServer(bananaListener);
server.listen(8000);