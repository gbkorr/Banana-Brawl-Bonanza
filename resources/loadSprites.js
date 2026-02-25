//https://www.piskelapp.com/terms
//"You can use the sprites you created using the service for any purpose, commercial or not. piskelapp.com does not hold any right on the content created on the website."

let sprites = {
	char: {},
	particle: {},
	projectile: {},
	stage: {},
	hud: {},
	menu: {},
	fonts: {},
};

function loadImage(source){
	let img = new Image();
	img.src = source;
	return img;
}


function loadFolder(category){
	for (let index = 0; index < spritesToLoad[category].length; index ++) {
		let imgName = spritesToLoad[category][index];
		sprites[category][imgName] = loadImage('resources/sprites/' + category + '/' + imgName + '.png');
	}
}
function preload() {
	loadFolder('char');
	loadFolder('projectile');
	loadFolder('particle');
	loadFolder('stage');
	loadFolder('hud');
	loadFolder('menu');
	loadFolder('fonts');
}