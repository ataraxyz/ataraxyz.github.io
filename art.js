// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// traits.js - convert hash to set of traits
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));

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

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

const hashToTraits = hash => {

  // setup random fns
  const R = mkRandom(hash);
  // const R = mkRandom("0xd2ee806205e8fe94780e8ff40983a7415bd0bcfdf0bfd1209f68aba5268bc3fe");

  // randomize shape
  const shape = selectRandomDist(shapeDist, R.r);

  // and color
  const color = randomColorHex(R.r)

  const seed = R.ri(0, 10000 );

  const colorMode = R.ri(0, 25 );
  const wireframe = R.ri(0, 100 );

  // const orbitProb = R.ri(0, 30 );
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
 const setupCanvasThreeJs = () => {

  const width  = window.innerWidth;
  const height = window.innerHeight;
  const scale  = window.devicePixelRatio;
  const body = document.querySelector('body > section:nth-child(1) > div > p');

  // setup render to match window size
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(scale);
  renderer.setSize(width, height/1.5);
  body.appendChild(renderer.domElement);

  return renderer;

  // const width  = window.innerWidth;
  // const height = window.innerHeight;
  

  // const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true  });
  // renderer.setPixelRatio(8); // compensating for scale
  // renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.setSize(width/8, height/8, false);
  // body.appendChild(renderer.domElement);

  // return renderer;

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
  while( true )
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


function branch( len, maxlen, parentMatrix, vertices, parentVertexIds, normals, faces, vColors, uvs, branchingSpread, gen )
{
  if( len > maxlen )
  {
    if ( len < maxlen/2 && THREE.MathUtils.randFloat(0.0, 1.0 ) < 0.1 )
    {
      // console.log( 'skipping')
    }
    else
    {
      let parentPosition = new THREE.Vector3()
      parentPosition.setFromMatrixPosition(parentMatrix)

      let upVec = new THREE.Vector3(0.0, 0.0, 1.0 )
      let rotVec = randomVecInXZ();
      let localMatRot = new THREE.Matrix4();
      let straigher = THREE.MathUtils.mapLinear(gen, 0, 3, 0.5, 1.0)
      localMatRot.makeRotationAxis(rotVec, THREE.MathUtils.randFloat(-branchingSpread, branchingSpread )*straigher)
      let diameter = THREE.MathUtils.mapLinear(len, 20, maxlen, 2.0, 0.01)
      // 
      // let diameter = 1.0-Math.min(Math.max( 0.0, gen / 20 ), 1.0 )
      // let diameter = maxlen
      // let dirvecNorm = randomVecInCone(new THREE.Vector3( 0.0, 1.0, 0.0 ), 0.8 ).applyMatrix4(parentMatrix)
      // let dirVec = randomVecInCone(new THREE.Vector3( 0.0, 1.0, 0.0 ), 0.8 ).applyMatrix4(parentMatrix).setLength(len)
      // let dirVec = new THREE.Vector3( 0.0, len, 0.0 ).applyMatrix4(new THREE.Matrix4().extractRotation(parentMatrix))
      // let dirVec = randomVecInCone(new THREE.Vector3( 0.0, 1.0, 0.0 ), branchingSpread ).setLength(len).applyMatrix4(new THREE.Matrix4().extractRotation(parentMatrix))
      let dirVec = new THREE.Vector3( 0.0, 1.0, 0.0 ).setLength(len).applyMatrix4(new THREE.Matrix4().extractRotation(parentMatrix)).applyMatrix4(localMatRot)
      // // let dirvecNorm = createVector( 0.0, 1.0, 0.0 )
      // let parentForwardX = new THREE.Vector3( 0.0, 0, -1.0 ).applyMatrix4(parentMatrix)
      // let parentP = new THREE.Vector3( 0.0, 0.0, 0.0 ).applyMatrix4(parentMatrix)
    
      // let dirvec = dirvecNorm.clone()
      // dirvec.setLength( len )
      // let zvec = p5.Vector.cross( dirvecNorm, parentForwardX )
      // let xvec = p5.Vector.cross( dirvecNorm, zvec )
      // zvec = p5.Vector.cross( dirvecNorm, xvec )
      // xvec.normalize()
      // zvec.normalize()

      // let localMat = new Matrix(  [[zvec.x   , zvec.y,   zvec.z,   0.0],
      //                             [dirvecNorm.x , dirvecNorm.y, dirvecNorm.z, 0.0],
      //                             [xvec.x   , xvec.y,   xvec.z,   0.0],
      //                             [dirvec.x, dirvec.y, dirvec.z, 1.0]] )
      // let localMat = new Matrix(  [[1   , 0,   0,   0.0],
      //                             [dirvecNorm.x , dirvecNorm.y, dirvecNorm.z, 0.0],
      //                             [zvec.x   , zvec.y,   zvec.z,   0.0],
      //                             [dirvec.x, dirvec.y, dirvec.z, 1.0]] )
      // let dirvec = new THREE.Vector3( 0.0, len, 0.0 )
      let localMat = new THREE.Matrix4();
      // localMat.identity()
      // localMat.makeRotationAxis( )
      // localMat.lookAt( parentP, parentP+dirvec, new THREE.Vector3(0.0, 0.0, 1.0 )  )
      
      // localMatRot.lookAt(parentPosition, dirVec, upVec )
      

      localMat.makeTranslation( dirVec.x,dirVec.y, dirVec.z )
      localMat.multiply(parentMatrix)
      localMat.multiply(localMatRot)
      
      let pBase = new THREE.Vector3( 0, 0, 0 ).applyMatrix4( localMat )

      let p1 = new THREE.Vector3( diameter, 0, diameter ).applyMatrix4( localMat )
      let p2 = new THREE.Vector3( -diameter, 0, diameter ).applyMatrix4( localMat )
      let p3 = new THREE.Vector3( -diameter, 0, -diameter ).applyMatrix4( localMat )
      let p4 = new THREE.Vector3( diameter, 0, -diameter ).applyMatrix4( localMat )

      let n1 = new THREE.Vector3();
      n1.subVectors( p1, pBase ).normalize();
      let n2 = new THREE.Vector3();
      n2.subVectors( p2, pBase ).normalize();
      let n3 = new THREE.Vector3();
      n3.subVectors( p3, pBase ).normalize();
      let n4 = new THREE.Vector3();
      n4.subVectors( p4, pBase ).normalize();
      // localMat.multiply( localMatRot)
      // parentMatrix.multiply(localMat)
      // localMat.multiply(parentMatrix)
      // let combinedMat = localMat.matMultiply( parentMatrix )

      // parentMatrix.draw(200)
      
        
      letCurrentId = vertices.length/3
      let vertexIds = [ letCurrentId, letCurrentId+1, letCurrentId+2, letCurrentId+3 ]
      // vertices.push( p1,p2,p3,p4 )
      vertices.push( p1.x, p1.y, p1.z )
      vertices.push( p2.x, p2.y, p2.z )
      vertices.push( p3.x, p3.y, p3.z )
      vertices.push( p4.x, p4.y, p4.z )

      normals.push( n1.x, n1.y, n1.z )
      normals.push( n2.x, n2.y, n2.z )
      normals.push( n3.x, n3.y, n3.z )
      normals.push( n4.x, n4.y, n4.z )

      uvs.push( gen, 0)
      uvs.push( gen, 0.25)
      uvs.push( gen, 0.5)
      uvs.push( gen, 0.75)

      // vColors.push( color('red'), color('red'), color('red'),color('red') )
      // faces.push( parentVertexIds[0], vertexIds[0], vertexIds[1] )
      for( let i = 0; i < vertexIds.length; i++ )
      {
        let id0 = i
        let id1 = (id0+1) % vertexIds.length
        // faces.push( [vertexIds[id0], parentVertexIds[id0], vertexIds[id1] ] )
        // faces.push( [vertexIds[id1], parentVertexIds[id0], parentVertexIds[id1] ] )  
        faces.push( parentVertexIds[id0], vertexIds[id0], vertexIds[id1] )
        faces.push( vertexIds[id1], parentVertexIds[id1], parentVertexIds[id0] )  
      }
      
      // faces.push( [parentVertexIds[0], parentVertexIds[1], vertexIds[1] ] )
      // faces.push( [vertexIds[1], vertexIds[0], parentVertexIds[0] ] )

      // faces.push( [vertexIds[0], parentVertexIds[3], vertexIds[3] ] )
      // faces.push( [vertexIds[0], parentVertexIds[0], parentVertexIds[3] ] )

      // faces.push( [vertexIds[3], vertexIds[2], parentVertexIds[3] ] )
      // faces.push( [parentVertexIds[3], parentVertexIds[2], vertexIds[2] ] )

      // faces.push( [parentVertexIds[2], parentVertexIds[1], vertexIds[1] ] )
      // faces.push( [parentVertexIds[2], vertexIds[1], vertexIds[2] ] )

      // branch( blength * random(0.7, 0.95 ), maxLen, combinedMat, vertices, vertexIds, faces)
      branch( len * 0.9, maxlen, localMat, vertices, vertexIds, normals, faces, vColors, uvs, branchingSpread, gen+1 )
      
      if( gen > 1 && THREE.MathUtils.randFloat(0.0, 1.0 ) < 0.666)
      {
        branch( len * 0.9, maxlen, localMat, vertices, vertexIds, normals, faces, vColors, uvs, branchingSpread, gen+1 )
      }

    }
  }
  else
  {
    // let r = 220 + random(-20,20) // 80 220 
    // let g = 120 + random(-20,20) // 120 120
    // let b = 170 + random(-20,20) // 40 170
    // // fill( r,g,b )
    // // noStroke()
    // rotateY(random(-90,90 ))
    // ellipse( 0, 0, random( 15,50) )
    // let dirvecNorm = randomVecInCone(createVector( 0.0, 1.0, 0.0 ), 0.8 )
    // dirvecNorm.setMag( blength * random(1, 5 ) )
    // let dirvecNorm = createVector( 0.0, 1.0, 0.0 )
    // let parentForwardX = parentMatrix.pointMultiply( [ 0.0, 0, -1.0, 1.0 ] )
  
    // let zvec = p5.Vector.cross( dirvecNorm, parentForwardX )
    // let xvec = p5.Vector.cross( dirvecNorm, zvec )
    // zvec = p5.Vector.cross( dirvecNorm, xvec )
    // xvec.normalize()
    // zvec.normalize()

    // let localMat = new Matrix(  [[1   , 0,   0,   0.0],
    //                             [0 , 1, 0, 0.0],
    //                             [0, 0, 1,   0.0],
    //                             [dirvecNorm.x, dirvecNorm.y, dirvecNorm.z, 1.0]] )
    // let localMat = new Matrix(  [[1   , 0,   0,   0.0],
    //                             [dirvecNorm.x , dirvecNorm.y, dirvecNorm.z, 0.0],
    //                             [zvec.x   , zvec.y,   zvec.z,   0.0],
    //                             [dirvec.x, dirvec.y, dirvec.z, 1.0]] )
    // let combinedMat = localMat.matMultiply( parentMatrix )
    // circle2D( random( 15,50), combinedMat, 8, vertices, faces )

    // beginShape()
    // let rad = random(5,15)
    // for( let i = 45; i < 135; i++ )
    // {
    //   let x = rad * cos(i)
    //   let y = rad * sin(i)

    //   vertex(x, y)
    // }

    // for( let i = 135; i > 40; i-- )
    // {
    //   let x = rad * cos(i)
    //   let y = rad * sin(-i)+20

    //   vertex(x, y)
    // }
    // endShape(CLOSE)
  }
  // pop()
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

  var vertexShader = `
  uniform float iT;

  varying vec2 vUv;
  void main()
  {
    vUv = uv;
    vec3 P_local = position;

    // float offsetX = sin(iT*vUv.r)*1.*vUv.r;
    // float offsetY = cos(iT*vUv.r)*1.*vUv.r;
    // P_local.x += offsetX;
    // P_local.y += offsetY;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( P_local, 1. );
  }
  `
  var fragmentShader =`
  uniform float iT;
  uniform vec3 iV1;
  uniform float iV2;

  varying vec2 vUv;

  float pulse( float time, float freq )
  {
    const float pi = 3.14159;
    //const float freq = 10; // in Hz
    return 0.5 * sin(2. * pi * freq * time );
  }

  float hash11(float p){
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);}  
  
  float hash12(vec2 p){
  vec3 p3  = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);}

  vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);}
  
  
  vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){return a + b*cos( 6.28318*(c*t+d) );}
  
  vec3 rainbow(float t) {return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 0.5, 0.5 ), vec3( 1.0, 1.0, 1.0 ),vec3( 0., 0.33, 0.67 ) );}
  
  
  vec3 viridis(float t) {
  const vec3 c0 = vec3(0.2777, 0.0054, 0.334);
  const vec3 c1 = vec3(0.105, 1.4046, 1.3845);
  const vec3 c2 = vec3(-0.3308, 0.2148, 0.095);
  const vec3 c3 = vec3(-4.6342, -5.7991, -19.3324);
  const vec3 c4 = vec3(6.2282, 14.1799, 56.6905);
  const vec3 c5 = vec3(4.7763, -13.7451, -65.353);
  const vec3 c6 = vec3(-5.4354, 4.64585, 26.3124);
  return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}
  
  vec3 plasma(float t) {return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 0.5, 0.5 ), vec3( 2., 1., 0. ),vec3( 0.5, 0.2, 0.25 ) );}
  
  vec3 sympatico(float t) { return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 1.0, 0.5 ), vec3( 2., 2.0, 1.0 ),vec3( 0.20, 0.1, 0.0 ) );}
  
  vec3 mojo(float t) { return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 0.25, 0.5 ), vec3( 0.5, 2.0, 0.5 ),vec3( 0.0, 0.5, 0.5 ) );}
  
  vec3 magma(float t) {return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 0.5, 0.5 ), vec3( 1., 1.0, 1. ),vec3( 0., 0.1, 0.2 ));}
  
  vec3 w420(float t) {return pal( t, vec3( 0.1, 1.0, 0.4 ), vec3( 0.4, 0.5, 0.2 ), vec3( 0.6, 1.0, 0.4 ),vec3( 0.8, 0.66, 0.2 ) );}
  
  vec3 gg(float t){ return vec3(t);}
  
  vec3 vday(float t) {return pal( t, vec3( 0.66, 0.5, 0.5 ), vec3( 0.5, 0.66, 0.5 ), vec3( 1.0, 0.2, 0.66 ),vec3( 0., 0.53, 0.67 ) );}
  
  vec3 inferno(float t) {
  const vec3 c0 = vec3(0.0002, 0.0016, -0.0194);
  const vec3 c1 = vec3(0.1065, 0.5639, 3.9327);
  const vec3 c2 = vec3(11.6024, -3.9728, -15.9423);
  const vec3 c3 = vec3(-41.7039, 17.4363, 44.3541);
  const vec3 c4 = vec3(77.1629, -33.4023, -81.8073);
  const vec3 c5 = vec3(-71.3194, 32.626, 73.2095);
  const vec3 c6 = vec3(25.1311, -12.2426, -23.0703);
  return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}
  
  vec3 turbo(float t) {
  const vec3 c0 = vec3(0.114, 0.0628, 0.2248);
  const vec3 c1 = vec3(6.7164, 3.1822, 7.5715);
  const vec3 c2 = vec3(-66.094, -4.9279, -10.0943);
  const vec3 c3 = vec3(228.766, 25.0498, -91.5410);
  const vec3 c4 = vec3(-334.8351, -69.3174, 288.5858);
  const vec3 c5 = vec3(218.7637, 67.5215, -305.2045);
  const vec3 c6 = vec3(-52.889, -21.5452, 110.5174);
  return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}
  
  vec3 bbody(float t){return vec3(1,1./4.,1./16.) * exp(4.*t - 1.);}
  vec3 colorize( float distance, float colorWidth, float ss, int colorTrait){
    float b = 666.;
    float regG = mod(floor(abs((distance) / colorWidth)) * colorWidth, 1.0 );
    float ranG = fract( hash11(ss + floor(distance / colorWidth ) + b ) );
  if ( colorTrait == 0 ){
    float colR = hash11(ss + floor(distance / colorWidth ) + 555. );
    float colG = hash11(ss + floor(distance / colorWidth ) + b );
    float colB = hash11(ss + floor(distance / colorWidth ) + 777. );
    return vec3( colR, colG, colB );
  } else if ( colorTrait == 1 ) {
    float h = hash11(ss+b) + floor(distance / colorWidth) * 0.381966011;
    return hsv2rgb( vec3(h, 0.75,0.75));
  } else if ( colorTrait == 2 ){
    return viridis(ranG);
  } else if ( colorTrait == 3 ){
    return viridis(regG);
  } else if ( colorTrait == 4 ) {
    return plasma(ranG);
  } else if ( colorTrait == 5 ){
    return plasma(regG);
  } else if ( colorTrait == 6 ){
    return magma(ranG);
  } else if ( colorTrait == 7 ){
    return magma(regG);
  } else if ( colorTrait == 8 ){
    return inferno(ranG);
  } else if ( colorTrait == 9 ){
    return inferno(regG);
  } else if ( colorTrait == 10 ){
    return turbo(ranG);
  } else if ( colorTrait == 11 ){
    return turbo(regG);
  } else if ( colorTrait == 12 ) {
    return bbody(ranG);
  } else if ( colorTrait == 13 ){
    return bbody(regG);
  } else if ( colorTrait == 14 ){
    return rainbow( floor(( distance + hash11(ss + b )) / colorWidth) *  colorWidth );
  } else if ( colorTrait == 15 ) {
    return rainbow( regG );
  } else if ( colorTrait == 16 ) {
    return vday(ranG);
  } else if ( colorTrait == 17 ){
    return vday(regG);
  } else if ( colorTrait == 18 ) {
    return w420(ranG);
  } else if ( colorTrait == 19 ){
    return w420(regG);
  } else if ( colorTrait == 20 ){
    return gg(ranG);
  } else if ( colorTrait == 21 ){
    return gg(regG);
  } else if ( colorTrait == 22 ){
    return sympatico(ranG);
  } else if ( colorTrait == 23 ){
    return sympatico(regG);
  } else if ( colorTrait == 24 ){
    return mojo(ranG);
  } else if ( colorTrait == 25 ){
    return mojo(regG);
  } return vec3(0.);
  }
  

void main(){
  // float dd = sin( vUv.r * 3.1415 + iT  );

  float dd = pulse( vUv.r - iT, 0.01);
  float roots = 1.-(vUv.r*vUv.r);
  vec3 pulseCol = colorize( dd, 0.04, 12345., int(iV2) );
  vec3 col = vec3(vUv.g * dd);

  gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots;
  // gl_FragColor.rgb = vec3();
  // gl_FragColor.b = 0.;

  gl_FragColor.a = 1.;}
`

  const uniforms = {
    iT: { value: 0 },
    iV1: { value: 0 },
    iV2: { value: 0 },

  }

  const clock = new THREE.Clock();

  // function createTree()
  createTree = () =>
  {
    tokenData.hash    = randomHash(64);

    
    const {
      shape,
      color,
      seed,
      colorMode,
      wireframe
    } = hashToTraits(tokenData.hash);
    
    state.colorMode = colorMode;
    // const material = new THREE.MeshLambertMaterial({ color: color });
    const material = new THREE.ShaderMaterial( {
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
  });
  material.wireframe = wireframe > 50;
  const geometry = new THREE.BufferGeometry();
    // var quad_vertices =
    // [
    // -30.0,  30.0, 0.0,
    // 30.0,  30.0, 0.0,
    // 30.0, -30.0, 0.0,
    // -30.0, -30.0, 0.0
    // ];
    // let upVec = new THREE.Vector3(1.0, 0.0, 0.0)
    // parentMatrixPos = new THREE.Matrix4()
    // parentMatrixRot = new THREE.Matrix4()
    // let mydir1 = new THREE.Vector3(40.0, 40.0, 40.0)
    // parentMatrixRot.lookAt( new THREE.Vector3(0.0, 0.0, 0.0), mydir1,upVec  )
    // parentMatrixPos.makeTranslation(mydir1.x, mydir1.y, mydir1.z )
    // parentMatrixPos.multiply(parentMatrixRot)
    // 
    // let localMatrix = new THREE.Matrix4()
    // let mydir2 = new THREE.Vector3(-20.0, 20.0, 10)
    // localMatrix.makeTranslation(mydir2.x, mydir2.y, mydir2.z )
    // parentMatrix.multiply( localMatrix )
    // let qp1 = new THREE.Vector3(-30.0,  30.0, 0.0).applyMatrix4( parentMatrixPos )
    // let qp2 = new THREE.Vector3( 30.0,  30.0, 0.0 ).applyMatrix4( parentMatrixPos )
    // let qp3 = new THREE.Vector3( 30.0, -30.0, 0.0 ).applyMatrix4( parentMatrixPos )
    // let qp4 = new THREE.Vector3( -30.0, -30.0, 0.0 ).applyMatrix4( parentMatrixPos )
    // var quad_vertices =
    // [
    //   qp1.x,  qp1.y, qp1.z,
    //   qp2.x,  qp2.y, qp2.z,
    //   qp3.x,  qp3.y, qp3.z,
    //   qp4.x,  qp4.y, qp4.z
    // ];
    // var quad_indices =
    // [
    // 0, 2, 1, 0, 3, 2
    // ];

    let vertices = []
    let faces = []
    let vColors = []
    let normals = []
    let uvs = []

    parentMatrix = new THREE.Matrix4()
    parentMatrix.identity()

    let randLen = THREE.MathUtils.randFloat( 12.0, 15.0)
    // let randLen = 10
    // let randWidth = 1
    let baseSize = 2
    let randWidth = randLen/10.0
    // let randWidth = Math.random(randLen/10, randLen/10)

    let baseCenter = new THREE.Vector3( 0,0,0)
    let basep1 = new THREE.Vector3( baseSize, 0, baseSize ).applyMatrix4( parentMatrix )
    let basep2 = new THREE.Vector3( -baseSize, 0, baseSize ).applyMatrix4( parentMatrix )
    let basep3 = new THREE.Vector3( -baseSize, 0, -baseSize ).applyMatrix4( parentMatrix )
    let basep4 = new THREE.Vector3( baseSize, 0, -baseSize ).applyMatrix4( parentMatrix )
    
    let basen1 = new THREE.Vector3();
    basen1.subVectors( basep1, baseCenter ).normalize();
    let basen2 = new THREE.Vector3();
    basen2.subVectors( basep2, baseCenter ).normalize();
    let basen3 = new THREE.Vector3();
    basen3.subVectors( basep3, baseCenter ).normalize();
    let basen4 = new THREE.Vector3();
    basen4.subVectors( basep4, baseCenter ).normalize();
    vertices.push( basep1.x, basep1.y, basep1.z )
    vertices.push( basep2.x, basep2.y, basep2.z )
    vertices.push( basep3.x, basep3.y, basep3.z )
    vertices.push( basep4.x, basep4.y, basep4.z )

    normals.push( basen1.x, basen1.y, basen1.z )
    normals.push( basen2.x, basen2.y, basen2.z )
    normals.push( basen3.x, basen3.y, basen3.z )
    normals.push( basen4.x, basen4.y, basen4.z )

    uvs.push( 0, 0)
    uvs.push( 0, 0.25)
    uvs.push( 0, 0.5)
    uvs.push( 0, 0.75)

    parentVertexIds = [ 0, 1, 2, 3 ]
    // faces.push( 0, 1, 2, 3 )
    branch( randLen, randWidth, parentMatrix, vertices, parentVertexIds, normals, faces, vColors, uvs, 0.8, 1 )
    
    // let maxUv = Math.max( ...uvs )
    let maxUv = 0;
    for ( let i = 0; i < uvs.length; i+=2)
    {
      maxUv = Math.max( uvs[i], maxUv )
    }
    for ( let i = 0; i < uvs.length; i+=2 )
    {
      uvs[i] = uvs[i] / maxUv
    }

    // console.log(uvs)
    // console.log(vertices)
    // console.log(normals)
    // console.log(faces)
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( faces ), 1 ) );
    // console.log(geometry)

    const mesh = new THREE.Mesh(geometry, material);
    state.three.mesh = mesh;
    // setup scene
    for (let i = tokenState.three.scene.children.length - 1; i >= 0; i--) {
      if(tokenState.three.scene.children[i].type === "Mesh")
        tokenState.three.scene.remove(tokenState.three.scene.children[i]);
    }
    tokenState.three.scene.add(mesh);
}
  // initialize scene
  canvas.initialize = () => {
    const ratio    = window.innerWidth / window.innerHeight;
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    const light    = new THREE.AmbientLight(0xa0a0a0);
    const directLight = new THREE.DirectionalLight( 0xa0a0a0, 0.5 );

    
    // scene.background = new THREE.Color(0xffffff)
    // const material = new THREE.MeshBasicMaterial({ color: color });
    // material.side = THREE.DoubleSide;
    // material.wireframe = true;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = 100;
    camera.position.y = 50;
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target = new THREE.Vector3( 0, 50, 0)
    controls.update()
    // create mesh
    // const geometry = shape == 'square'
    //   ? new THREE.BoxGeometry(1, 1, 1)
    //   : new THREE.SphereGeometry(.5, 32, 16);
    
    scene.add(light);
    scene.add(directLight);
    

    state.three = {
      scene: scene,
      camera: camera,
      mesh: null,
      controls: controls,
      uniforms: uniforms,
    };

    createTree()
  };

  // render scene
  canvas.render = () => {
    const { scene, camera } = state.three;
    renderer.render(scene, camera);
  };

  // update
  canvas.update = () => {
    let dt = clock.getDelta();
    const mesh = state.three.mesh;
    // mesh.rotation.x += 0.02;
    mesh.rotation.y += dt*0.5;
    // mesh.scale.x     = state.width;
    // mesh.scale.y     = 1;
    state.three.controls.update();
    uniforms.iT.value += dt;
    uniforms.iV2.value = state.colorMode;
  };

  // render/update loop
  canvas.loop = () => {
    const { scene, camera } = state.three;
    requestAnimationFrame(canvas.loop);
    canvas.update();
    renderer.render(scene, camera);
  };

  canvas.initialize();
  canvas.render();
  canvas.loop();

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
