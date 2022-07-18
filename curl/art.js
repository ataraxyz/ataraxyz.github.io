// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// traits.js - convert hash to set of traits
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------


const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
const { Perlin, FBM } = THREE_Noise;
const perlin = new Perlin(Math.random())
const fbm = new FBM({
  seed: Math.random(),
  scale: 0.06,
  octaves: 6,
  persistance: 0.5,
  lacunarity: 2,
  redistribution: 1,
  height: 0,
});
let glitchPass;
/**
 * xoshiro is a variation of the shift-register generator, using rotations in
 *   addition to shifts.
 *
 * Algorithm by [Blackmanand Vigna 2018]
 *   https://prng.di.unimi.it/xoshiro256starstar
 *
 */
const xoshiro256strstr = s => () => {
  const result = u64(rotl(u64(s[1] * 5n), 7n) * 9n);

  let t = u64(s[1] << 17n);

  s[2] ^= s[0];
  s[3] ^= s[1];
  s[1] ^= s[2];
  s[0] ^= s[3];

  s[2] ^= t;

  s[3] = rotl(s[3], 45n);

  return result;
};

//-----------------------------------------------------------------------------

/**
 * Returns a float between [0, 1) (inclusive of 0, exclusive of 1).
 */
const randomDecimal = xss => () => {
  const t = xss();
  return Number(t % 9007199254740991n) / 9007199254740991;
}

//-----------------------------------------------------------------------------

/**
 * Returns a float between a and b.
 */
const randomNumber = r => (a, b) => a + (b - a) * r();

//-----------------------------------------------------------------------------

/**
 * Returns an int between a and b.
 */
const randomInt = rn => (a, b) => Math.floor(rn(a, b + 1));

//-----------------------------------------------------------------------------

/**
 * Seeds the randomization functions.
 */
const mkRandom = hash => {
  const s  = Array(4).fill()
    .map((_,i) => i * 16 + 2)
    .map(idx => u64(`0x${hash.slice(idx, idx + 16)}`));
  const xss = xoshiro256strstr(s);
  const r   = randomDecimal(xss);
  const rn  = randomNumber(r);
  const ri  = randomInt(rn);
  return {r, rn, ri};
};

//-----------------------------------------------------------------------------

/**
 * Randomly shuffle and array of element.
 */
const shuffle = (array, r) => {
  let m = array.length, t, i;

  while (m) {
    i = Math.floor(r() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

//-----------------------------------------------------------------------------

/**
 * Return an array of size n filled with item.
 */
const repeat = (item, n) => Array.from({length:n}).map(_ => item);

//-----------------------------------------------------------------------------

/**
 * Returns a random element from the array.
 */
const selectRandom = (array, r) => array[Math.floor(r() * array.length)];

//-----------------------------------------------------------------------------

/**
 * Randomly select a key from a distribution map of values.
 *
 *  DistMap should be of the form:
 *
 *    const distMap = {
 *      banana .4,
 *      apple: .3,
 *      pear:  .2,
 *      kiwi:  .1
 *    };
 *
 *   The values should add up to 1 (won't fail if it doesn't but selection will
 *     be off from what you expect).  The above should return a distribution of
 *     40% bananas, 30% apples, 20% pears, 10% kiwis.
 *
 */
const selectRandomDist = (distMap, r) => {
  const keys = Object.keys(distMap)
    .reduce((a, k) => a.concat(repeat(k, distMap[k] * 100)), []);
  return selectRandom(shuffle(keys, r), r);
};

//-----------------------------------------------------------------------------

/**
 * Convert from int to padded hex (for colors).
 */
const toHex   = x => x.toString(16).padStart(2, '0');
const fromHex = hex => parseInt(hex, 16);

//-----------------------------------------------------------------------------

const randomColorHex = r => {
  const rc    = () => toHex(Math.floor(r() * 256));
  const red   = rc();
  const green = rc();
  const blue  = rc();
  return `#${red}${green}${blue}`;
};

//-----------------------------------------------------------------------------
// traits
//-----------------------------------------------------------------------------

//- distributions -------------------------------------------------------------

const shapeDist = {
  square: .6,
  circle: .4
};

function onSelectStart(event) {
  // var controller = event.target;

  // var intersections = getIntersections(controller);

  // if (intersections.length > 0) {
  //     var intersection = intersections[0];
  //     var object = intersection.object;
  //     object.material.emissive.b = 1;
  //     controller.attach(object);
  //     controller.userData.selected = object;
  // }
}

function onSelectEnd(event) {
  // var controller = event.target;
  // if (controller.userData.selected !== undefined) {
  //     var object = controller.userData.selected;
  //     object.material.emissive.b = 0;
  //     group.attach(object);
  //     controller.userData.selected = undefined;
  // }
  sceneAssembly()
}


//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------
let particleCount = 50000;
let particles = [];
let velocities = [];
let step = 2000;
let offset = 0.0;
let speed = 0.5;
const hashToTraits = hash => {

  // setup random fns
  const R = mkRandom(hash);
  // const R = mkRandom("0xd2ee806205e8fe94780e8ff40983a7415bd0bcfdf0bfd1209f68aba5268bc3fe");

  // randomize shape
  const shape = selectRandomDist(shapeDist, R.r);

  // and color
  const color = randomColorHex(R.r)

  const seed = R.ri(0, 10000 );

  const colorMode = R.ri(2, 25 );
  
  const wireframe = R.ri(0, 100 );

  // const orbitProb = R.ri(0, 30 );z
  // const twinProb = R.ri(0, 20 );
  // const insideProb = R.ri(0, 20 );
  // const shapesForLayer = R.ri( 1, 4);
  // const layers = R.ri( 2,8 );
  // // const size = R.ri( 50,200 )
  // const size = R.ri( 0,100 )

  // const layers = 1

  return {
    shape,
    color,
    seed,
    colorMode,
    wireframe
  };

};



// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

/**
 * Example of setting up a canvas with three.js.
 */
 generateNoise = function(opacity,canvas) {
  var
  x, y,
  number,
 
  opacity = opacity || .2;
  ctx = canvas.getContext('2d');
  let size = 0.001
  for ( x = 0; x < canvas.width; x++ ) {
     for ( y = 0; y < canvas.height; y++ ) {
        // number = Math.floor( Math.random() * 60 );
        
        const pos = new THREE.Vector2(x, y);
        let n = fbm.get2(pos)
        n = n * 0.5 + 0.5;
        // n*= 2.0
        ctx.fillStyle = "rgba(" + n + "," + n + "," + n + "," + opacity + ")";
        ctx.fillRect(x, y, 1, 1);
     }
  }
}

let sceneScale;
sceneScale = 0.075

const handleGlitchDown = () => {
  glitchPass.isActive = true;
}
const handleGlitchUp = () => {
  glitchPass.isActive = false;
}

 const setupCanvasThreeJs = () => {

  const width  = window.innerWidth;
  const height = window.innerHeight;
  const scale  = window.devicePixelRatio;
  const body = document.querySelector('body > section:nth-child(1) > div > p');



  const renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.autoClear = false;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  document.body.appendChild( renderer.domElement );

  return renderer;

};

function randomVecInCone( refVec, threshold )
{
  while( true )
  {
    let randX = THREE.MathUtils.randFloat( -1.0, 1.0)
    let randY = THREE.MathUtils.randFloat( -1.0, 1.0)
    let randZ = THREE.MathUtils.randFloat( -1.0, 1.0)
    let result = new THREE.Vector3( randX, randY, randZ );

    result.normalize()
    if ( result.dot( refVec) > threshold )
      return result
    // let dirvecNorm = p5.Vector.random3D()// * 100.0
    
  }
}

function randomVecInXZ()
{
  // while( true )
  {
    let randX = THREE.MathUtils.randFloat( -1.0, 1.0)
    // let randY = THREE.MathUtils.randFloat( -1.0, 1.0)
    let randZ = THREE.MathUtils.randFloat( -1.0, 1.0)
    let result = new THREE.Vector3( randX, 0.0, randZ );

    result.normalize()
    // if ( result.dot( refVec) > threshold )
    return result
    // let dirvecNorm = p5.Vector.random3D()// * 100.0
    
  }
}

function randomVecInXYZ(hemispherical = false)
{
  // while( true )
  {
    let ynegRange = -1.0;
    if ( hemispherical )
      ynegRange = 0.7

    let randX = THREE.MathUtils.randFloat( -1.0, 1.0)
    let randY = THREE.MathUtils.randFloat( ynegRange, 1.0)
    let randZ = THREE.MathUtils.randFloat( -1.0, 1.0)
    let result = new THREE.Vector3( randX, randY, randZ );

    result.normalize()
    // if ( result.dot( refVec) > threshold )
    return result
    // let dirvecNorm = p5.Vector.random3D()// * 100.0
    
  }
}


//-----------------------------------------------------------------------------
const doArt = (renderer, hash, state) => {
  const {
    shape,
    color,
    seed,
    colorMode
  } = hashToTraits(hash);
  state.colorMode = colorMode;
  const canvas = document.querySelector('canvas');

  let width = 2000;
  let height = 2000;
  let depth = 2000;

  const uniforms = {
    iT: { value: 0 },
    iV1: { value: 0 },
    iV2: { value: 0 },
    ctex: { type: "t", value: null },
    ttex: { type: "t", value: null },
    iScale: { value: 1.0/sceneScale }
  }

  const clock = new THREE.Clock();

  cleanScene = () => {
    // state.three.meshes = [];
    for (let i = 0; i<tokenState.three.scene.children.length; i++) 
    {
      if ( tokenState.three.scene.children[i].type == "Group" )
      {
        for (let j = 0; j<tokenState.three.scene.children[i].children.length; j++) 
        {
          
          if ( tokenState.three.scene.children[i].children[j].type == "Mesh" )
          {
            tokenState.three.scene.remove(tokenState.three.scene.children[i].children[j]);
          }
        }
        tokenState.three.scene.remove(tokenState.three.scene.children[i]);
      }
    }
  } 

  AddMeshesToState = (meshes) => {
    const group = new THREE.Group();
    for( let i = 0; i < meshes.length; i++ ){
      // state.three.meshes.push( meshes[i] );
      
      group.add( meshes[i] );
    }
    // tokenState.three.scene.add(meshes[i]);
    
    tokenState.three.scene.add(group)
    tokenState.three.scene.scale.set( sceneScale, sceneScale, sceneScale)
  }

  

  sceneAssembly = () =>
  {
    cleanScene()

    try {
      noise.seed(Math.random());
    }
    catch(err) {
      console.log(err.message);
    }
    

    // let allMeshes = []

    

    //Particles
    
    let geometry = new THREE.BufferGeometry();

    //Add texture to particles
    var loader = new THREE.TextureLoader();
    //https://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
    THREE.ImageUtils.crossOrigin = '';
    var texture =  loader.load('https://al-ro.github.io/images/embers/ember_texture.png');

    //Variable size for particle material
    var size = 70;

    var material = new THREE.PointsMaterial({
        color: 0xff6800,
        size: size,
        transparent: true,
        opacity: 1.0,
        map: texture,
        //Other particles show through transparent sections of texture
        depthTest: false,
        //For glow effect
        blending: THREE.AdditiveBlending
    });

    //Generate random particles
    for(i = 0; i < particleCount; i++){

        let x = width/2 - Math.random() * width;
        let y = height/2 - Math.random() * height;
        let z = depth/2 - Math.random() * depth;
        let vel_x = 0.5 - Math.random();
        let vel_y = 0.5 - Math.random();
        let vel_z = 0.5 - Math.random();
      
      particles.push(x,y,z);
      velocities.push(vel_x,vel_y,vel_z);
    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( particles, 3 ) );

    // allMeshes.push( new THREE.Points( geometry, material ) );
    let points  = new THREE.Points( geometry, material )
    scene.add(points)
    // tokenState.three.scene.add(scene)
    tokenState.three.particles = geometry
    // AddMeshesToState(allMeshes)
  }

  function fbm(x, y, z){
    let n = 0;
    let l = 1.0;
    let totalWeight = 0.0;
    let amplitude = 1.0;
    for(let i = 0; i < 1; i++){
      n += amplitude * noise.simplex3(x*l, y*l, z*l);
      totalWeight += amplitude;
      amplitude *= 0.5;
      l *= 2.0;
    }
    n /= totalWeight;
    return n;
  }
  
  
  //Find the curl of the noise field based on on the noise value at the location of a particle
  function computeCurl(x, y, z){
    var eps = 0.0001;
  
    x += 1000.0*offset;
    y -= 1000.0*offset;
  
    var curl = new THREE.Vector3();
  
    //Find rate of change in YZ plane
    var n1 = fbm(x, y + eps, z); 
    var n2 = fbm(x, y - eps, z); 
    //Average to find approximate derivative
    var a = (n1 - n2)/(2 * eps);
    var n1 = fbm(x, y, z + eps); 
    var n2 = fbm(x, y, z - eps); 
    //Average to find approximate derivative
    var b = (n1 - n2)/(2 * eps);
    curl.x = a - b;
  
    //Find rate of change in ZX plane
    n1 = fbm(x, y, z + eps); 
    n2 = fbm(x, y, z - eps); 
    //Average to find approximate derivative
    a = (n1 - n2)/(2 * eps);
    n1 = fbm(x + eps, y, z); 
    n2 = fbm(x - eps, y, z); 
    //Average to find approximate derivative
    b = (n1 - n2)/(2 * eps);
    curl.y = a - b;
  
    //Find rate of change in XY plane
    n1 = noise.simplex3(x + eps, y, z); 
    n2 = noise.simplex3(x - eps, y, z); 
    //Average to find approximate derivative
    a = (n1 - n2)/(2 * eps);
    n1 = noise.simplex3(x, y + eps, z); 
    n2 = noise.simplex3(x, y - eps, z); 
    //Average to find approximate derivative
    b = (n1 - n2)/(2 * eps);
    curl.z = a - b;
  
    return curl;
  }
  
  //----------MOVE----------//
  function move(){
    for(i = 0; i < particleCount * 3.0; i+=3){
  
      //Find curl value at partile location
      var curl = computeCurl(particles[i]/step, particles[i+1]/step, particles[i+2]/step);
  
      //Update particle velocity according to curl value and speed
      velocities[i] += speed*curl.x;
      velocities[i+1] += speed*curl.y;
      velocities[i+2] += speed*curl.z;

      velocities[i] *= 0.9;
      velocities[i+1] *= 0.9;
      velocities[i+2] *= 0.9;
  
      //Update particle position based on velocity
      particles[i] += velocities[i];
      particles[i+1] += velocities[i+1];
      particles[i+2] += velocities[i+2];
  
      //Boudnary conditions
      //If a particle gets too far away from (0,0,0), reset it to a random location
      var dist = Math.sqrt(particles[i] * particles[i] + particles[i+1] * particles[i+1] + particles[i+2] * particles[i+2]);
      if(dist > 2.0*width){
        particles[i] = width/2 - Math.random() * width;
        particles[i+1] = height/2 - Math.random() * height;
        particles[i+2] = depth/2 - Math.random() * depth; 
      }
    }
    
    tokenState.three.particles.getAttribute('position').copyArray(particles);
    tokenState.three.particles.getAttribute('position').needsUpdate = true;
    
  }

  let scene, camera;
  let 
  
  initialize = () => {
    // const width    = window.innerWidth;
    // const height   = window.innerHeight;
    // const ratio    = window.innerWidth / window.innerHeight;
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var ratio = w/h;

    
    scene    = new THREE.Scene();

    distance = 400;
    var FOV = 2 * Math.atan( window.innerHeight / ( 2 * distance ) ) * 90 / Math.PI;
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1.0, 200000 );
    // camera = new THREE.PerspectiveCamera(FOV, ratio, 1, 200000);
    camera.aspect = window.innerWidth / window.innerHeight;
    // const controls = new THREE.OrbitControls( camera, renderer.domElement );
    camera.position.set(-2*width, -2*height, -2*width*4);
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.maxDistance = 200000-5*width;
    controls.minDistance = 100;
    // controls.target = new THREE.Vector3( 0, 50, 0)
    // controls.autoRotate = true;
    controls.update()
    // camera.position.set( 0, 1.6, 1.5 );
    // const light    = new THREE.AmbientLight(0xa0a0a0);
    // const directLight = new THREE.DirectionalLight( 0xa0a0a0, 0.5 );
    

    

    // var camera = new THREE.PerspectiveCamera(FOV, ratio, 1, 200000);

    // camera.position.set(-2*width, -2*height, -2*width);

    scene.add(camera);
    let stats = new Stats()
    // stats.showPanel( 0 );
    stats.domElement.style.cssText = 'position:absolute;top:20px;right:0px;';
    document.body.appendChild(stats.dom)
    
    

    // scene.add(light);
    // scene.add(directLight);
    
    state.three = {
      scene: scene,
      camera: camera,
      mesh: null,
      controls: controls,
      uniforms: uniforms,
      stats: stats,
    };

    sceneAssembly()
  };

  // render scene
  canvas.render = () => {
    const { scene, camera } = state.three;
    renderer.render(scene, camera);
  };


  function animate() {

    renderer.setAnimationLoop( render );
    

  }

  


  function render() {

    let dt = clock.getDelta();
    uniforms.iT.value += dt;
    uniforms.iV2.value = state.colorMode;

    move();

    renderer.render( scene, camera );
    state.three.controls.update()
    state.three.stats.update()
  }
  initialize();
  animate();
};

//-----------------------------------------------------------------------------

/**
 * Main entry function.
 */
const run = (tokenData, tokenState) => {
  const renderer = setupCanvasThreeJs()
  
  doArt(renderer, tokenData.hash, tokenState);
  
};

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

window.onload = () => {
  run(tokenData, tokenState);
};



