
let rebindGap = 180;
const menus = {
    debug: {
        special: ()=>{
            ctx.save(); ctx.translate(500, 100);
            bananaText(['abcdefghijklm','nopqrstuvwxyz','0123456789'],'small',100,true);
            ctx.restore();
        },
        buttons: ['online','closeBound','farBound'],
        online: {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            color: '#aaa',
            activeColor: '#ddd',

            left: 0,
            right: 2,
            down: 1,
            up: 0,

            function: ()=>{
            },
        }, 
        closeBound: {
            x: 0,
            y: 0,
            width: 600,
            height: 600,
            color: '#0001',
        },
        farBound: {
            x: 0,
            y: 0,
            width: 1200,
            height: 1200,
            color: '#bbb1',
        },
    },

    wait: {
        special: ()=>{
            bananaText(['waitscreen text'],'medium',600,300,100,true);

            drawRandomLoadingBar();

            //loading 1 (long)
            ctx.save(); ctx.translate(600,460);
                animatedSprite('menu',menuTimer,{
                    spritesheet: 'bananaLoading1',
                    size: 60,
                    spriteSize: 16,
                    anim: anim(0,10,4),
                },'anim');
                ctx.restore();

            //loading 2 (short)
                ctx.save(); ctx.translate(600,460);
                animatedSprite('menu',menuTimer,{
                    spritesheet: 'bananaLoading2',
                    size: 60,
                    spriteSize: 18,
                    anim: anim(0,16,3),
                },'anim');
                ctx.restore();

            //loading bar. not for use on normal server waitscreens
            for (let c = 0; c < 10; c++){
                ctx.save(); ctx.translate(100 * (c+1),460);
                animatedSprite('menu',(menuTimer - c * 4) % 120 < 40 ? menuTimer - c * 4 : 0,{
                    spritesheet: 'bananaLoading1',
                    size: 60,
                    spriteSize: 16,
                    anim: anim(0,10,4),
                },'anim');
                ctx.restore();
            }
        },
        base: 'bar',
        backgroundMenus: [''],
        escape: 'back',
        buttons: ['back','bar'],
        back: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 0,
            right: 1,
            up: 0,
            down: 1,

            function: ()=>{
                changeMenu('');
            },
        },
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            left: 0,
            right: 0,
            up: 0,
            down: 0,

            function: ()=>{},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_transMed',
        },
    },
    error: {
        special: ()=>{
            bananaText(['error'],'medium',600,300,100,true);

            for (let c = 0; c < 6; c++){
                ctx.save(); ctx.translate(150 * (c+1),460);
                animatedSprite('menu',menuTimer,{
                    spritesheet: 'bananaLoading1',
                    size: 60,
                    spriteSize: 16,
                    anim: anim(0,10,4),
                },'anim');
                ctx.restore();
            }
        },
        base: 'bar',
        escape: 'bar',
        buttons: ['bar'],
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',
            function: ()=>{changeMenu('main')},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_black',
        },
    },

    main: {
        special: ()=>{
            bananaText(['banana brawl'],'original',50,50,100);
            bananaText(['online'],'original',260,420,60,true);
            bananaText(['local'],'original',580,240,50,true);
            bananaText(['options'],'original',580,420,50,true);
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
        base: 'empty',
        buttons: ['online','local','options','empty'],
        empty: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            sprite: 'bg_empty',
            activeSprite: 'bg_empty',

            left: 0,
            right: 0,
            down: 0,
            up: 0,

            function: ()=>{currentButton = 'online'},
        },
        online: {
            x: 100,
            y: 150,
            width: 400,
            height: 400,
            sprite: 'bigBanana',
            activeSprite: 'bigBananaActive',

            left: 0,
            right: 1,
            down: 0,
            up: 0,

            function: ()=>{
                connectToServer();
                changeMenu('connectToServer');
            },
        }, 
        local: {
            x: 450,
            y: 75,
            width: 300,
            height: 300,
            sprite: 'smallBanana',
            activeSprite: 'smallBananaActive',

            left: 0,
            right: 1,
            down: 2,
            up: 1,

            function: ()=>{
                startGame(['demon','mantis'],{defaultKeyboard: 0, "Pro Controller Extended Gamepad": 1},{stocks:3},'buddha');
            },
        },
        options: {
            x: 450,
            y: 250,
            width: 300,
            height: 300,
            sprite: 'smallBanana',
            activeSprite: 'smallBananaActive',

            left: 0,
            right: 2,
            down: 2,
            up: 1,

            function: ()=>{changeMenu('rebind')},
        },
    },

    online: {
        special: ()=>{
            bananaText([ongoingGames.toString(),'active',ongoingGames == 1 ? 'game' : 'games'],'small',50,220,50);
            bananaText(['quickmatch'],'original',260,420,60,true);
            bananaText(['join'],'original',580,240,50,true);
            bananaText(['host'],'original',580,420,50,true);
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
        base: 'quickmatch',
        escape: 'back',
        buttons: ['quickmatch','join','host','back'],
        quickmatch: {
            x: 100,
            y: 150,
            width: 400,
            height: 400,
            sprite: 'bigBanana',
            activeSprite: 'bigBananaActive',

            left: 0,
            right: 1,
            down: 0,
            up: 3,

            function: ()=>{
                changeMenu('quickmatch');
                quickmatch(()=>{
                    talkServerInterval = setInterval(()=>{talkServer()},1000);
                    changeMenu('onlineCharselect');
                });
            },
        }, 
        join: {
            x: 450,
            y: 75,
            width: 300,
            height: 300,
            sprite: 'smallBanana',
            activeSprite: 'smallBananaActive',

            left: 0,
            right: 1,
            down: 2,
            up: 3,

            function: ()=>{
                privateRoomCode = '';
                changeMenu('joinPrivateRoom');
            },
        },
        host: {
            x: 450,
            y: 250,
            width: 300,
            height: 300,
            sprite: 'smallBanana',
            activeSprite: 'smallBananaActive',

            left: 0,
            right: 2,
            down: 2,
            up: 1,

            function: ()=>{
                createRoom();
            },
        },
        back: {
            x: 0,
            y: 0,
            width: 34 * 6,
            height: 13 * 6,
            sprite: 'back',
            activeSprite: 'backActive',

            left: 3,
            right: 0,
            down: 0,
            up: 3,

            function: ()=>{
                changeMenu('main')
            },
        },
    },

    onlineCharselect: {
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
        escape: 'leave',
        base: 'char1',
        buttons: ['leave','leaf','char1','char2','char3','char4','char5','char6','char7','char8','char9','char10','char11','char12','char13'],
        leave: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 0,
            right: 2,
            up: 0,
            down: 2,

            function: ()=>{
                clearInterval(talkServerInterval);
                changeMenu('online');
                leaveRoom();
            },
        },
        leaf: {
            x: 0,
            y: 100,
            width: 1200,
            height: 1200,
            sprite: 'charselect',
        },
        char1: {
            x: 1 * 37.5,
            y: 100 + 2 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 7,
            right: 3,
            down: 8,
            up: 0,

            function: ()=>{
                changeCharacter('demon');
            },
        },
        char2: {
            x: 5 * 37.5,
            y: 100 + 2 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton3',

            left: 2,
            right: 4,
            down: 9,
            up: 0,

            function: ()=>{
                changeCharacter('mantis');
            },
        },
        char3: {
            x: 9 * 37.5,
            y: 100 + 1 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 3,
            right: 5,
            down: 10,
            up: 0,

            function: ()=>{
                changeCharacter('pterosaur');
            },
        },
        char4: {
            x: 13 * 37.5,
            y: 100 + 1 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton3',

            left: 4,
            right: 6,
            down: 11,
            up: 0,

            function: ()=>{
                
            },
        },
        char5: {
            x: 17 * 37.5,
            y: 100 + 2 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton2',

            left: 5,
            right: 7,
            down: 12,
            up: 0,

            function: ()=>{
                
            },
        },
        char6: {
            x: 21 * 37.5,
            y: 100 + 2 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 6,
            right: 2,
            down: 13,
            up: 0,

            function: ()=>{
                
            },
        },
        char7: {
            x: 1 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 14,
            right: 9,
            down: 7,
            up: 2,

            function: ()=>{
               
            },
        },
        char8: {
            x: 5 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 8,
            right: 10,
            down: 9,
            up: 3,

            function: ()=>{
               
            },
        },
        char9: {
            x: 9 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton2',

            left: 9,
            right: 11,
            down: 10,
            up: 4,

            function: ()=>{
               
            },
        },
        char10: {
            x: 13 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton2',

            left: 10,
            right: 12,
            down: 11,
            up: 5,

            function: ()=>{
               
            },
        },
        char11: {
            x: 17 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 11,
            right: 13,
            down: 12,
            up: 6,

            function: ()=>{
               
            },
        },
        char12: {
            x: 21 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton1',

            left: 12,
            right: 14,
            down: 13,
            up: 7,

            function: ()=>{
               
            },
        },
        char13: {
            x: 25 * 37.5,
            y: 100 + 7 * 37.5,
            width: 112,
            height: 186,
            sprite: 'bg_empty',
            activeSprite: 'charselectbutton4',

            left: 13,
            right: 8,
            down: 14,
            up: 7,

            function: ()=>{
               
            },
        },

    },
    onlineCharselectStart: {
        base: 'start',
        backgroundMenus: ['onlineCharselect'],
        escape: 'back',
        buttons: ['dim','back','start'],
        back: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 1,
            right: 2,
            up: 1,
            down: 2,

            function: ()=>{
                changeMenu('onlineCharselect');
            },
        },
        start: {
            x: 0,
            y: 200,
            width: 1200,
            height: 400,
            color: '#a66a',
            activeColor: '#a66d',

            left: 2,
            right: 2,
            up: 1,
            down: 2,

            function: ()=>{
                if (menuCharacter) { //when changeCharacter is successful, this gets updated
                    changeMenu('onlineReady'); //immediately takes you to queue screen, even if you haven't successfully queued yet. this feels good.
                    queueReady();
                }
            },
        },
        dim: {
            x: 0,
            y: 0,
            width: 1200,
            height: 1200,
            color: '#0005',
        },
    },
    onlineReady: {
        special: ()=>{
            bananaText(['waiting for opponent'],'medium',600,240,80,true);
            drawRandomLoadingBar();
        },
        base: 'bar',
        backgroundMenus: ['onlineCharselect','onlineCharselectStart'],
        escape: 'back',
        buttons: ['back','bar'],
        back: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 0,
            right: 1,
            up: 0,
            down: 1,

            function: ()=>{
                unqueueReady(()=>{changeMenu('onlineCharselect');}); //only takes you out of the screen once you successfully cancel the unqueue
            },
        },
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            left: 0,
            right: 0,
            up: 0,
            down: 0,

            function: ()=>{},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_transLight',
        },
    }, //essentially an idling menu. When the server is ready, it will tell you to start via talkServer and the game will automatically start

    onlineWinscreen1: {
        special: ()=>{
            ctx.fillText('THIS IS THE WINSCREEN', 300, 100);
        }, 
        base: 'empty',
        escape: 'empty',
        buttons: ['empty'],
        empty: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: '#000',
            activeColor: '#000',

            function: ()=>{changeMenu('onlineWinscreen2');},
        },
        //press to advance
    },
    onlineWinscreen2: {
        special: ()=>{
            ctx.fillText('match stats (like damage dealt) here', 300, 100);
        }, //display match stats (damage dealt, etc. here) using a stats variable tracked in engine.js
        base: 'empty',
        escape: 'empty',
        buttons: ['empty'],
        empty: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: '#000',
            activeColor: '#000',

            function: ()=>{changeMenu('onlineCharselect','char1');},
        },
    },
    onlineDisconnect: {
        special: ()=>{
            bananaText(['opponent disconnected'],'medium',600,300,60,true);
        },
        base: 'bar',
        escape: 'bar',
        buttons: ['bar'],
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            function: ()=>{changeMenu('main')},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
    },
    onlineTimeout: {
        special: ()=>{
            bananaText(['lost connection','to server'],'medium',600,300,60,true);
        },
        base: 'bar',
        escape: 'bar',
        buttons: ['bar'],
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            function: ()=>{changeMenu('main')},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
    },

    privateRoom: {
        special: ()=>{
            bananaText([roomID],'medium',200,200,100);
        }, 
        escape: 'empty',
        buttons: ['empty'],
        empty: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: '#000',
            activeColor: '#000',

            function: ()=>{changeMenu('onlineCharselect','char1');},
        },
        //press to advance
    },
    joinPrivateRoom: {
        special: ()=>{
            if (privateRoomCode.length > 6) privateRoomCode = privateRoomCode.slice(1); //awful solution lmao
            bananaText([privateRoomCode],'medium',100,100,80);
        },
        base: '1',
        escape: 'back',
        buttons: ['0','1','2','3','4','5','6','7','8','9','backspace','enter','back'],
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_lightgrey',
        },
        back: {
            x: 0,
            y: 0,
            width: 34 * 6,
            height: 13 * 6,
            sprite: 'back',
            activeSprite: 'backActive',

            left: 12,
            right: 1,
            up: 12,
            down: 1,

            function: ()=>{
                changeMenu('online','join');    
            },
        },
        1: {
            x: 100,
            y: 200,
            width: 90,
            height: 90,
            sprite: 'numpad01',
            activeSprite: 'activeNumpad01',

            left: 3,
            right: 2,
            up: 12,
            down: 4,

            function: ()=>{privateRoomCode += '1'},
        },
        2: {
            x: 200,
            y: 200,
            width: 90,
            height: 90,
            sprite: 'numpad02',
            activeSprite: 'activeNumpad02',

            left: 1,
            right: 3,
            up: 12,
            down: 5,

            function: ()=>{privateRoomCode += '2'},
        },
        3: {
            x: 300,
            y: 200,
            width: 90,
            height: 90,
            sprite: 'numpad03',
            activeSprite: 'activeNumpad03',

            left: 2,
            right: 1,
            up: 12,
            down: 6,

            function: ()=>{privateRoomCode += '3'},
        },
        4: {
            x: 100,
            y: 300,
            width: 90,
            height: 90,
            sprite: 'numpad04',
            activeSprite: 'activeNumpad04',

            left: 6,
            right: 5,
            up: 1,
            down: 7,

            function: ()=>{privateRoomCode += '4'},
        },
        5: {
            x: 200,
            y: 300,
            width: 100,
            height: 100,
            width: 90,
            height: 90,
            sprite: 'numpad05',
            activeSprite: 'activeNumpad05',

            left: 4,
            right: 6,
            up: 2,
            down: 8,

            function: ()=>{privateRoomCode += '5'},
        },
        6: {
            x: 300,
            y: 300,
            width: 90,
            height: 90,
            sprite: 'numpad06',
            activeSprite: 'activeNumpad06',

            left: 5,
            right: 4,
            up: 3,
            down: 9,

            function: ()=>{privateRoomCode += '6'},
        },
        7: {
            x: 100,
            y: 400,
            width: 90,
            height: 90,
            sprite: 'numpad07',
            activeSprite: 'activeNumpad07',
            
            left: 9,
            right: 8,
            up: 4,
            down: 11,

            function: ()=>{privateRoomCode += '7'},
        },
        8: {
            x: 200,
            y: 400,
            width: 90,
            height: 90,
            sprite: 'numpad08',
            activeSprite: 'activeNumpad08',

            left: 7,
            right: 9,
            up: 5,
            down: 0,

            function: ()=>{privateRoomCode += '8'},
        },
        9: {
            x: 300,
            y: 400,
            width: 90,
            height: 90,
            sprite: 'numpad09',
            activeSprite: 'activeNumpad09',

            left: 8,
            right: 7,
            up: 6,
            down: 10,

            function: ()=>{privateRoomCode += '9'},
        },
        0: {
            x: 200,
            y: 500,
            width: 90,
            height: 90,
            sprite: 'numpad00',
            activeSprite: 'activeNumpad00',

            left: 11,
            right: 10,
            up: 8,
            down: 0,

            function: ()=>{privateRoomCode += '0'},
        },
        backspace: {
            x: 300,
            y: 500,
            width: 90,
            height: 90,
            sprite: 'numpadDelete',
            activeSprite: 'activeNumpadDelete',

            left: 0,
            right: 11,
            up: 9,
            down: 10,

            function: ()=>{privateRoomCode = privateRoomCode.slice(0,-1);},
        },
        enter: {
            x: 100,
            y: 500,
            width: 90,
            height: 90,
            sprite: 'numpadEnter',
            activeSprite: 'activeNumpadEnter',

            left: 10,
            right: 0,
            up: 7,
            down: 11,

            function: ()=>{
                if (privateRoomCode.length == 6) {
                    joinPrivateRoom(privateRoomCode);
                }
            },
        },
    },
    cannotJoinPrivateRoom: {
        special: ()=>{
            bananaText(['unable to join room because',privateRoomError],'medium',600,300,60,true);
        },
        base: 'bar',
        backgroundMenus: ['joinPrivateRoom'],
        escape: 'bar',
        buttons: ['bar'],
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            left: 0,
            right: 0,
            up: 0,
            down: 0,

            function: ()=>{changeMenu('joinPrivateRoom')},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_transMed',
        },
    },

    rebind: {
        special: ()=>{
            bananaText([getBindName('up')],'medium',250,140,80);
            bananaText([getBindName('left')],'medium',200,240,80);
            bananaText([getBindName('down')],'medium',250,340,80);
            bananaText([getBindName('right')],'medium',300,440,80);
            bananaText([getBindName('jump')],'medium',250,540,80);

            bananaText([getBindName('cup')],'medium',580 + rebindGap,140,80);
            bananaText([getBindName('cleft')],'medium',530 + rebindGap,240,80);
            bananaText([getBindName('cdown')],'medium',580 + rebindGap,340,80);
            bananaText([getBindName('cright')],'medium',630 + rebindGap,440,80);
            bananaText([getBindName('attack')],'medium',580 + rebindGap,540,80);

            if (rebinding != undefined){
                ctx.fillStyle = '#00000040';
                ctx.fillRect(0,0,2000,2000);
                ctx.fillStyle = '#666';
                ctx.fillRect(300,150,300,300);
                bananaText(['press a', 'button'],'small',450,170,50,true);
                ctx.drawImage(sprites.menu.thumbs,400,240,200,200);
            }
        },
        bg: {
            x: 0,
            y: 0,
            width: 1800,
            height: 1800,
            sprite: 'bg_medgrey',
        },
        buttons: ['back','reset','up','left','down','right','jump','cup','cleft','cdown','cright','attack','rebindLeft','rebindRight'],
        base: 'back',
        
        rebindLeft: {
            x: 3.1 * 24,
            y: 3.1 * 33,
            width: 3.1 * 66,
            height: 3.1 * 160,
            sprite: 'rebindLeft',
        },
        rebindRight: {
            x: 3.1 * 124 + rebindGap,
            y: 3.1 * 34,
            width: 3.1 * 66,
            height: 3.1 * 160,
            sprite: 'rebindRight',
        },

        back: {
            x: 0,
            y: 0,
            width: 34 * 6,
            height: 13 * 6,
            sprite: 'back',
            activeSprite: 'backActive',

            left: 0,
            right: 1,
            down: 2,
            up: 0,

            function: ()=>{
                changeMenu('main')
            },
        },
        reset: {
            x: 34 * 6,
            y: 0,
            width: 34 * 6,
            height: 13 * 6,
            sprite: 'reset',
            activeSprite: 'resetActive',

            left: 0,
            right: 1,
            down: 2,
            up: 1,

            function: ()=>{
                keyCodes = ['KeyA','KeyD','KeyW','KeyS','Space','KeyO','KeyJ','KeyL','KeyI','KeyK'];
            },
        },

        up: {
            x: 3.1 * 38,
            y: 3.1 * 34,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 2,
            right: 7,
            down: 3,
            up: 1,

            function: ()=>{rebindAction('up')},
        },
        left: {
            x: 3.1 * 22,
            y: 3.1 * 66,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 3,
            right: 8,
            down: 4,
            up: 2,

            function: ()=>{rebindAction('left')},
        },
        down: {
            x: 3.1 * 38,
            y: 3.1 * 98,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 4,
            right: 9,
            down: 5,
            up: 3,

            function: ()=>{rebindAction('down')},
        },
        right: {
            x: 3.1 * 54,
            y: 3.1 * 130,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 5,
            right: 10,
            down: 6,
            up: 4,

            function: ()=>{rebindAction('right')},
        },
        jump: {
            x: 3.1 * 38,
            y: 3.1 * 162,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',
            
            left: 6,
            right: 11,
            down: 6,
            up: 5,

            function: ()=>{rebindAction('jump')},
        },

        cup: {
            x: 3.1 * 38 + 315 + rebindGap,
            y: 3.1 * 34,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 2,
            right: 7,
            down: 8,
            up: 1,

            function: ()=>{rebindAction('cup')},
        },
        cleft: {
            x: 3.1 * 22 + 315 + rebindGap,
            y: 3.1 * 66,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 3,
            right: 8,
            down: 9,
            up: 7,

            function: ()=>{rebindAction('cleft')},
        },
        cdown: {
            x: 3.1 * 38 + 315 + rebindGap,
            y: 3.1 * 98,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 4,
            right: 9,
            down: 10,
            up: 8,

            function: ()=>{rebindAction('cdown')},
        },
        cright: {
            x: 3.1 * 54 + 315 + rebindGap,
            y: 3.1 * 130,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 5,
            right: 10,
            down: 11,
            up: 9,

            function: ()=>{rebindAction('cright')},
        },
        attack: {
            x: 3.1 * 38 + 315 + rebindGap,
            y: 3.1 * 162,
            width: 3.1 * 32,
            height: 3.1 * 32,
            sprite: 'bg_empty',
            activeSprite: 'rebindSelection',

            left: 6,
            right: 11,
            down: 11,
            up: 10,

            function: ()=>{rebindAction('attack')},
        },
    },

    //these ones shouldn't really ever stay up long if connected to internet
    connectToServer: {
        special: ()=>{
            bananaText(['connecting to server'],'medium',600,240,80,true);

            drawRandomLoadingBar();
        },
        base: 'bar',
        backgroundMenus: ['main'],
        escape: 'back',
        buttons: ['back','bar'],
        back: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 0,
            right: 1,
            up: 0,
            down: 1,

            function: ()=>{
                changeMenu('main');
            },
        },
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            left: 0,
            right: 0,
            up: 0,
            down: 0,

            function: ()=>{},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_transMed',
        },
    },
    quickmatch: {
        special: ()=>{
            bananaText(['joining match'],'medium',600,240,80,true);

            drawRandomLoadingBar();
        },
        base: 'bar',
        backgroundMenus: ['online'],
        escape: 'back',
        buttons: ['back','bar'],
        back: {
            x: 0,
            y: 0,
            width: 13 * 6,
            height: 13 * 6,
            sprite: 'smallBack',
            activeSprite: 'smallBackActive',

            left: 0,
            right: 1,
            up: 0,
            down: 1,

            function: ()=>{
                changeMenu('online');
            },
        },
        bar: {
            x: 0,
            y: 200,
            width: 2000,
            height: 300,
            sprite: 'barDark',
            activeSprite: 'barDark',

            left: 0,
            right: 0,
            up: 0,
            down: 0,

            function: ()=>{},
        },
        bg: {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            sprite: 'bg_transMed',
        },
    },
}

let currentMenu = 'main';
let currentButton = 'empty';
let menuCharacter;

function changeMenu(menu, button, popup){
    currentMenu = menu;
    currentButton = button ? button : menus[menu].base;
    if (!popup) ctx.clearRect(0,0,halfWidth * 2, halfHeight * 2); //clear background, unless popup menu

    randomLoadingBar = Math.floor(Math.random()*3);
}

let menuScale = 600;
function drawMenu(menuName){
    ctx.imageSmoothingEnabled = false; //makes sprites nice and crisp

    let menu = menus[menuName];

    if (menu.backgroundMenus) for (let i = 0; i < menu.backgroundMenus.length; i++) drawMenu(menu.backgroundMenus[i]);

    ctx.save();
    let windowSize = halfWidth/2 > halfHeight ? halfHeight : halfWidth/2;
    ctx.scale(2 * windowSize / menuScale, 2 * windowSize / menuScale);
    if (menu.bg) ctx.drawImage(sprites.menu[menu.bg.sprite],menu.bg.x,menu.bg.y,menu.bg.width,menu.bg.height);
    for (let index = 0; index < menu.buttons.length; index++){
        let button = menu[menu.buttons[index]];

        if (button.sprite) {
            ctx.drawImage(sprites.menu[currentButton == menu.buttons[index] && button.activeSprite ? button.activeSprite : button.sprite],button.x,button.y,button.width,button.height);
        }
        else {
            ctx.fillStyle = currentButton == menu.buttons[index] ? button.activeColor : button.color;
            ctx.fillRect(button.x,button.y,button.width,button.height);
            ctx.fillStyle = '#000';
            ctx.fillText(menu.buttons[index],button.x + 10,button.y + 20);
        }
    }
    if (menu.special) menu.special();
    ctx.restore();
}

function processButton(action){
    if (action == 'confirm') menus[currentMenu][currentButton].function();
    else currentButton = menus[currentMenu].buttons[menus[currentMenu][currentButton][action]] || currentButton; //left/right/up/down
}


let menuTimer = 0;
function processMenus(){
    if (gameState == 'none') {
        drawMenu(currentMenu);
        menuTimer++;
    }
}


let randomLoadingBar = 0;
function drawRandomLoadingBar(){
    ctx.save(); ctx.translate(600,460);
                if (randomLoadingBar) { //more likely
                    animatedSprite('menu',menuTimer,{
                        spritesheet: 'bananaLoading2',
                        size: 60,
                        spriteSize: 18,
                        anim: anim(0,16,3),
                    },'anim');
                }
                else {
                    animatedSprite('menu',menuTimer,{
                        spritesheet: 'bananaLoading1',
                        size: 60,
                        spriteSize: 16,
                        anim: anim(0,10,4),
                    },'anim');
                }
    ctx.restore();
}

function onlineGameEndCallback(reason){
    if (reason.type == 'win') changeMenu('onlineWinscreen1');
    else if (reason.type == 'disconnect') changeMenu('onlineDisconnect');
    else changeMenu('error');
}

let privateRoomCode = '';
let privateRoomError = '';

//inputs
const menuKeyActions = ['left','right','up','down','confirm'];
const menuKeyCodes = ['KeyA','KeyD','KeyW','KeyS','Space'];
function menuKeyDown(key){
    if (menuKeyCodes.indexOf(key.code) != -1) { //if it's a valid key
        let action = menuKeyActions[menuKeyCodes.indexOf(key.code)];
        processButton(action);
    }
}
