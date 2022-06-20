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
  
  const orbitProb = R.ri(0, 30 );
  const twinProb = R.ri(0, 20 );
  const insideProb = R.ri(0, 20 );
  const shapesForLayer = R.ri( 1, 4);
  const layers = R.ri( 2,8 );
  const size = R.ri( 50,200 )
  // const layers = 1

  return {
    shape,
    color,
    seed,
    orbitProb,
    twinProb,
    insideProb,
    shapesForLayer,
    layers,
    size
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
 * Example of setting up a canvas with p5.js.
 */

let bgColor;
let clock;
let sigSize = 50;
let outlineGraphics;
let baseLayer;
let lineColor;
let colorType;
let tt;

//-----------------------------------------------------------------------------
function polygon(x, y, radius, npoints ) {
  if( npoints == 0 )
  {
    circle( x,y, radius*2.0 );
  }
  else
  {
    let angle = TWO_PI / npoints;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sy = x + cos(a) * radius;
      let sx = y + sin(a) * radius;
      vertex(sx, -sy);
    }
    endShape(CLOSE);
  }
}
// 


function createCircles(n, radius, shapeSize, type = 0) {
  //angle between the circles
  var angle = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) 
  {
    if ( type == 0 ){
      circle( radius * Math.sin(angle * i),
              radius * Math.cos(angle * i),
              shapeSize );
    }
    // else {
    //   push();
    //   translate(radius * Math.sin(angle * i),radius * Math.cos(angle * i));
    //   createKnot( 0,
    //               0,
    //               shapeSize );
    //   pop();
    // }
  }
}

function createSeed(posx,posy, n, radius ) {
  circle( posx, posy, radius );
  createCircles( n, radius/2, radius );
}


function createFlower(n, radius ) {
  const r = radius / 1.666;
  var angle = (2 * Math.PI) / n;
  strokeWeight( 1 );
  for (let i = 0; i < n; i++) 
  {
    push();
    translate( r * Math.sin(angle * i), r * Math.cos(angle * i) )
    createSeed( 0,
                0,
                n,
                r );
            
    pop();
    push();
      rotate( PI / 3 * i) 
      circle( -r*1.73, 0, r)
      circle( -r*1.73, r*0.5, r)
      circle( -r*1.73, -r*0.5, r)
    pop();
  }
  push();
  stroke(bgColor);
  strokeWeight( r*1.75*0.5 )
  circle( 0, 0, r*3+r*1.75*0.5 )
  // noFill();
  // erase();
  // for( let i=1; i<shapeSize*1.75; i++ )
  // {
    
  //   circle( 0, 0, shapeSize*3+i)

  // }
  // noErase();
  pop();
  strokeWeight( 2 );
  // stroke(lineColor);
  circle( 0, 0, r*3)
  circle( 0, 0, r*3.1)
}

function createFruit(posx,posy, radius ) {
  const r = radius * 0.8;
  circle( posx, posy, r )
  createCircles( 6, r, r);
  createCircles( 6, r*2, r);
}

function createKnot(posx,posy, radius, outline=true ) {
  const r = radius * 0.85
  var halfR = r * 0.5;
  var aa = Math.sqrt( r*r - halfR*halfR );
  var od = ( r*2 * Math.sqrt(3.0) ) / Math.sqrt(6.0);
  var ob = ( r*2 * Math.sqrt(3.0) ) / 3.0;

  push();

    noFill();
    translate(0, r*0.580)
    push();

      arc( posx, posy, r*2, r*2, PI, 0);
      arc( posx, posy, r*1.8, r*1.8, PI+0.065, -0.065);
      push();
        translate(-halfR, -aa);
        rotate(HALF_PI + HALF_PI / 3.0);
        arc( posx, posy, r*2, r*2, PI, 0);
        arc( posx, posy, r*1.8, r*1.8, PI+0.065, -0.065);
      pop();
      
      push();
        translate(halfR, -aa);
        rotate((HALF_PI + HALF_PI / 3.0)*2.0);
        arc( posx, posy, r*2, r*2, PI, 0);
        arc( posx, posy, r*1.8, r*1.8, PI+0.065, -0.065);
      pop();

      if ( outline == true)
      {
        strokeWeight(ob*0.025)
        circle( posx, posy-r*0.580, ob*1.5)
      }

    pop();

  pop();
}

function createMetatron( posx, posy, radius, full = true ) {
  const r = radius * 0.8
  const rr = r * 2.0
  push();
  {
    if ( full == true )
    {
      createFruit( posx,posy, radius );
      polygon( posx, posy, r, 6 );
    }
    createInsideLines(posx, 0,rr, 6, true )
    polygon( posx, posy, r, 3 );
    polygon( posx, posy, rr, 3 );
    rotate(PI / 3) 
    polygon( posx, posy, rr, 3 );
    if ( full == true )
    {
      polygon( posx, posy, r, 3 );
      polygon( posx, posy, r, 6 );
    }
  }
  pop();
}

function createAtara( gCanvas, posx,posy, currentSize )
{
  // gCanvas.stroke( random()*256, random()*256, random()*256 );
  var halfCurrentSize = currentSize * 0.5;
  gCanvas.stroke('black');
  gCanvas.strokeWeight(3);
  gCanvas.line( posx+halfCurrentSize, posy + halfCurrentSize,
        posx, posy - halfCurrentSize
      )
  gCanvas.line( posx, posy - halfCurrentSize,
        posx-halfCurrentSize, posy + halfCurrentSize
      )
  
  gCanvas.line( posx + halfCurrentSize*0.5, posy,
        posx - halfCurrentSize*0.5, posy,
      )
  gCanvas.strokeWeight(2);
  gCanvas.line( posx + halfCurrentSize*0.25, posy - currentSize*0.25,
        posx - halfCurrentSize*0.25, posy- currentSize*0.25,
      )
  gCanvas.line( posx, posy,
        posx, posy + halfCurrentSize,
      )
      line( posx, posy + currentSize*0.25,
        posx+halfCurrentSize, posy + halfCurrentSize,
      )    
  gCanvas.arc( posx, posy+halfCurrentSize* 0.25, halfCurrentSize*1.25, halfCurrentSize*0.5, -HALF_PI, HALF_PI)
  gCanvas.strokeWeight(1);
  gCanvas.line( posx, posy+halfCurrentSize* 0.75,
    posx + halfCurrentSize*0.5, posy + halfCurrentSize*0.75,
  )
} 

function createInsideLines(xValue, yValue, referenceRadius, sides, flip = false) {
  if ( sides == 0 )
    return;
  push();
  // stroke( lineColor );
  noFill();
  //the angle between the lines
  var angle = (2 * Math.PI) / sides;
  //we need an offset angle due to the way the library creates shapes
  var offsetAngle = angle / 2;
  for (let i = 0; i < sides; i++) {
    //we use the parametric function of the circle to set the values around the circumference
    //so the first x,y pair is on the circunference, and the second is at the center of the figure
    if( flip == true )
    {
      line(
        yValue + referenceRadius * Math.cos(offsetAngle + angle * i),
        xValue - referenceRadius * Math.sin(offsetAngle + angle * i),
        xValue,
        yValue
        );
    }
    else
    {
      line(
        xValue - referenceRadius * Math.sin(offsetAngle + angle * i),
        yValue + referenceRadius * Math.cos(offsetAngle + angle * i),
        xValue,
        yValue
        );
    }
  }
  pop();
}

// vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){return a + b*cos( 6.28318*(c*t+d) );}
// vec3 rainbow(float t) {return pal( t, vec3( 0.5, 0.5, 0.5 ), vec3( 0.5, 0.5, 0.5 ), vec3( 1.0, 1.0, 1.0 ),vec3( 0., 0.33, 0.67 ) );}


function  pal( t, a, b, c,d )
{
  let ar = red(a)/256.0;
  let br = red(b)/256.0;
  let cr = red(c)/256.0;
  let dr = red(d)/256.0;

  let ag = green(a)/256.0;
  let bg = green(b)/256.0;
  let cg = green(c)/256.0;
  let dg = green(d)/256.0;

  let ab = blue(a)/256.0;
  let bb = blue(b)/256.0;
  let cb = blue(c)/256.0;
  let db = blue(d)/256.0;
  

  var resultR = Math.floor(Math.pow(ar + br * Math.cos( 6.28318 * ( cr * t + dr) ), 2.2 ) * 256.0);
  var resultG = Math.floor(Math.pow(ag + bg * Math.cos( 6.28318 * ( cg * t + dg) ), 2.2 ) * 256.0);
  var resultB = Math.floor(Math.pow(ab + bb * Math.cos( 6.28318 * ( cb * t + db) ), 2.2 ) * 256.0);

  return color( resultR, resultG, resultB );
}
function rainbow(t) 
{
  let a = color( 128, 128, 128 );
  let b = color( 128, 128, 128 );
  let c = color( 255, 255, 255 );
  let d = color( 0, 85, 174 );

  return pal( t, a, b, c,d );
}

function plasma(t) 
{
  let a = color( 128, 128, 128 );
  let b = color( 128, 128, 128 );
  let c = color( 512, 255, 0 );
  let d = color( 128, 85, 64 );
  
  return pal( t, a, b, c,d );
}

function mojo(t) 
{
  let a = color( 128, 128, 128 );
  let b = color( 128, 64, 128 );
  let c = color( 128, 512, 128 );
  let d = color( 0, 128, 128 );
  
  return pal( t, a, b, c,d );
}

function colorize( t, colType )
{
  if ( colType == 0 )
    return rainbow(t);
  else if ( colType == 1 )
    return plasma(t);
  else if ( colType == 2 )
    return mojo(t);
}

function refresh(){
  tokenData.hash    = randomHash(64);
  setup();
}

function setup() {

  const body = document.querySelector('body > section:nth-child(1) > div > p');

  // figure out canvas size
  const width  = window.innerWidth;
  const height = window.innerHeight;


  // setup canvas to match window size
  const renderer = createCanvas(width, height).parent(body);
  baseLayer = createGraphics(width, height);
  outlineGraphics = createGraphics(width, height);
  var colorTypes = [0,1,2]
  colorType = random(colorTypes);
  tt = random();
  bgColor = colorize( tt, colorType)
  lineColor = color( 'black' )

  const baseRand = random();
  // const baseRand = 0.3;
  baseLayer.stroke( lineColor);
  baseLayer.noFill();
  
  clock = 0.0
  tokenState.tf = 0.0;
}


/**
 * Draw is required to be defined for processing library to load into the
 *  global scope.
 */
function draw() {

  const {
    shape,
    color,
    seed,
    orbitProb,
    twinProb,
    insideProb,
    shapesForLayer,
    layers,
    size
  } = hashToTraits(tokenData.hash);
  randomSeed( seed )
  const hexToRGB = color => Array.from(Array(3).keys())
    .map(i => i * 2 + 1)
    .map(i => fromHex(color.slice(i, i + 2)));

  
  // goto center
  const width = window.innerWidth
  const height = window.innerHeight
  const minDim = min( width, height );
  const halfWidth  = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;
  const quarterWidth  = window.innerWidth / 4;
  const quarterHeight = window.innerHeight / 4;
  const quarterMinDim = minDim / 4;
  const halfMinDim = minDim / 2;
  const center     = [halfWidth, halfHeight]

  // clear background
  // outlineGraphics = createGraphics(width, height);
  outlineGraphics.reset();
  background( bgColor );
  // background(0, 0, 0);
  // background(255, 255, 255);
  // for( let y = 0; y < height; y++ )
  // {
  //   var n = map( y,0, height, 0,1)
  //   let newColor = lerpColor( bgColorA, bgColorB, n )
  //   stroke( newColor )
  //   line( 0, y, width, y )
  // }



  // setup render mode
  clear();
  background(bgColor);
  rectMode(CENTER);
  outlineGraphics.rectMode(CENTER);
  blendMode(BLEND);

  // goto center + delta
  translate(...center);
  outlineGraphics.translate(...center);
  

  // set color
  // fill(...hexToRGB(color));
  outlineGraphics.noFill();
  noFill();
  
  // var shapeType = 3;
  // var layers = 6;
  
  // var size = tokenState.size;
  // var scaledSize = size/100.0 * tokenState.size/100.0;
  const hashSize = size/100.0
  const userScale = tokenState.size/100.0;
  var scaledSize = halfMinDim
  var orbit = orbitProb < 10
  var twin = twinProb < 10
  var inside = insideProb < 10

  // stroke( 'black')

  var genShapeTypes = [ 3,3,3,4,5,6,6,6,7,8,9,0,0 ]
  // var genShapeTypes = [ 0 ];
  var layerSpeeds = [ 0.001, 0.002, 0.0015, 0.0005, -0.001, -0.002, -0.0015, -0.0005 ]

  
  // var currentSize = scaledSize+scaledSize;
  var didSeed = false
  var t = tt;
  
  var deltaColor = 1.0 / ( shapesForLayer * layers );
  
  push();
  {
    // for( let i=0; i<layers; i++ )
    for( let i=layers; i>=0; i-- )
    {
      
      push();
      {
        rotate( clock*random(layerSpeeds) * tokenState.speed / 100.0 )
        // stroke(...hexToRGB(color));
        
        strokeWeight(random( 1, 3));

        // var shapesForLayer = random( 4,5 )
        
        var shapeType = random(genShapeTypes)
        // var currentSize = ( width / 8 ) + (i+1)*scaledSize;
        const minSize = halfMinDim / 8
        // var currentSize = ( ( minSize ) + ( i * ( (halfMinDim / 2 - minSize) / layers ) ) ) * scaledSize;
        var currentSize = (minSize + ( (scaledSize - minSize ) * Math.pow((  i / layers ), hashSize) )) * userScale
        for( let j=shapesForLayer; j>=0; j-- )
        {
          
          // stroke( 0,0,0 )
          // stroke( lineColor )
          // stroke( R, G, B, 0 );

          // const R = random( 0,255 )
          // const G = random( 0,255 )
          // const B = random( 0,255 )


          // const overDrawLayers = random(1,15);
          const overDrawLayers = 1;
          const A = tokenState.alpha/overDrawLayers;

          const knotOrbits = random([0,1]);
          
          for( let k=0; k<overDrawLayers; k++ )
          {
            nextColor = colorize( t,colorType );
            nextColor.setAlpha( A*0.25 );
            

            const R = red( nextColor );
            const G = green( nextColor );
            const B = blue( nextColor );

            // stroke( R*0.25, G*0.25, B*0.25, 255 );
            stroke( 'black' );
            fill( R, G, B, A );
            
            // let gradient = drawingContext.createLinearGradient(-currentSize, -currentSize, currentSize,currentSize);
            let gradient = drawingContext.createRadialGradient(0, 0, 0,0,0,quarterMinDim*scaledSize);
            gradient.addColorStop(0, nextColor);
            t+=deltaColor;
            if( t>1.0)
              t = 0.0;
            nextColor = colorize( t, colorType );
            nextColor.setAlpha(A);
            gradient.addColorStop(1, nextColor);
            drawingContext.fillStyle = gradient;
            push();
            {
              // blendMode(ADD);
              // var shapeType = 3+j;
              // var shapeType = 3

              
              if( random() > 0.5 ){
                rotate(PI / shapeType);
              }
              if ( inside )
              {
                createInsideLines(  0, 0, currentSize, shapeType )
              }
              // createInsideLines( outline, 0, 0, currentSize, shapeType )
              polygon( 0, 0, currentSize, shapeType );
              
              if ( twin )
              {
                polygon( 0, 0, currentSize * 0.985, shapeType );
                polygon( 0, 0, currentSize * 1.015, shapeType );
              }
              
              //ORBIT SHAPES
              if( orbit ){
                rotate(PI / shapeType) 
                createCircles( shapeType, currentSize, currentSize * random(0.1, 0.666), knotOrbits );
              }
              // else if ( random() > 1.0 - orbit && didSeed == false )
              // {
              //   createSeed( 0, 0, 6, currentSize );
              //   createCircles( 6, currentSize, currentSize);
              //   // createMetatron( 0, 0, currentSize );
              //   didSeed = true;
              // }
            }
            pop();
          }
        }
        // currentSize += scaledSize;
      }
      pop();
    }
  }
  pop();

  push();
    rotate( clock*random(layerSpeeds) * tokenState.speed / 100.0 * 0.333 )
    const baseRand = random() * 1.2;
    // const baseRand = 0.9;
    

    // nextColor = ;
    strokeWeight(2);
    // stroke(colorize( t,colorType ) );
    stroke('black');

    if( baseRand < 0.2 ) 
    {
      createMetatron(0, 0, quarterMinDim );
    }
    else if ( baseRand >0.2 && baseRand < 0.4)
    {
      createFlower( 6, halfMinDim );
    }
    else if ( baseRand >0.4 && baseRand < 0.6)
    {
      createSeed( 0, 0, 6, halfMinDim )
    }
    else if ( baseRand > 0.6 && baseRand < 0.8)
    {
      createFruit( 0, 0, quarterMinDim)
    }
    else if ( baseRand > 0.8 && baseRand < 1.0)
    {
      createKnot( 0, 0, halfMinDim )
    }
  pop();
  // createKnot( 0, 0, quarterMinDim * 0.75 * scaledSize )
  
  
  




  
  // REF FOR OFFSCREEN RENDERING
  // background( bgColor );
  // circle( 100, 100, 100 );
  // outlineGraphics.noFill();
  // outlineGraphics.stroke( lineColor )
  // outlineGraphics.circle( 00, 00, 100 );
  createAtara( outlineGraphics,  halfWidth-sigSize,halfHeight-sigSize, sigSize );
  
  translate( -halfWidth, -halfHeight );
  image(outlineGraphics, 0,0, width, height );
  // step
  // tokenState.tf = (tokenState.tf + 0.05) % (Math.PI * 2);
  clock += deltaTime;


  // const debug = true;
  if( tokenState.debug == true )
  {
    stroke('black');
    text( frameRate().toFixed(2), width-sigSize, 0+sigSize )

    text( 'COLOR PALETTE', 25, 20 )
    for( let i = 0; i<10; i++ )
    {
      const nextColor = colorize( i/10.0, colorType );
      stroke( nextColor );
      fill(nextColor);
      rect(50+i*50, 50, 50,50);
    }
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  outlineGraphics.reset();
  outlineGraphics = createGraphics(windowWidth, windowHeight);
}

