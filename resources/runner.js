let canvas; //the canvas
let ctx; //canvas context
let halfHeight; //quick window size reference
let halfWidth;


function setup(){ //gets executed by index.html when it's done loading
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');


    //keep screen size correct
    updateScreenSize();
    window.addEventListener('resize',()=>{updateScreenSize()});

    preload(); //load images
    
    listenForInputs();
    setInterval(processMenus,1000/30);
}
//"Pro Controller Extended Gamepad": 1}

function updateScreenSize(){
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    halfWidth = window.innerWidth / 2;
    halfHeight = window.innerHeight / 2;
}
