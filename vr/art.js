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
let noiseTex;
let crystalContactShadowTx;
let treeContactShadowTx;
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

  // setup render to match window size
  // const renderer = new THREE.WebGLRenderer({ antialias: true });  
  // renderer.setPixelRatio(scale);
  // renderer.setSize(width, height);
  // body.appendChild(renderer.domElement);

  const renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.autoClear = false;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  document.body.appendChild( renderer.domElement );
  document.body.appendChild( VRButton.createButton( renderer ) );

  

  // var canvas = document.createElement("canvas");

  // document.body.onmousedown = handleGlitchDown;
  // document.body.ontouchstart = handleGlitchDown;
  // document.body.onmouseup = handleGlitchUp;
  // document.body.ontouchend = handleGlitchUp;
  

  // canvas.width = 400;
  // canvas.height = 400;


  // generateNoise(1, canvas);


  // noiseTex = new THREE.Texture(canvas);
  // noiseTex.needsUpdate = true;

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

  CreateContactShadows = ( contactPoints, maxDist ) => {
    const cMapWidth = 512;
    const cMapHeight = 512;

    const cMapSize = cMapWidth * cMapHeight;
    const cMapData = new Float32Array( 4 * cMapSize );
    // const cMapColor = new THREE.Color( 0xffffff );

    for ( let y = 0; y < cMapHeight; y++ )
    {
      for ( let x = 0; x < cMapWidth; x++ )
      {
        let index = y*cMapWidth+x;
        let stride = index * 4;

        let shadowAmount = new THREE.Vector4(0.0,0.0,0.0,0.0);

        // current position in WS
        let xpos = (((x / cMapWidth)) * 2.0 - 1.0 ) * maxDist
        let ypos = ((1.0-(y / cMapHeight)) * 2.0 - 1.0 ) * maxDist
        for ( let i = 0; i < contactPoints.length; i++ )
        {
          

          let xx = xpos - contactPoints[i].x
          let yy = ypos - contactPoints[i].z

          let radc = contactPoints[i].y*maxDist;
          let dist = Math.sqrt( xx*xx + yy*yy)
          let distNorm = 1.0 - Math.max(0.0, Math.min( 1.0, dist / radc ) );

          // shadowAmount = Math.min( 1.0, shadowAmount + distNorm);//Math.max( shadowAmount,distNorm )
          // shadowAmount = Math.max(shadowAmount, distNorm) 
          if ( distNorm > shadowAmount.w )
          {
            // console.log(distNorm)
            shadowAmount.w = distNorm;
            shadowAmount.x = contactPoints[i].x; 
            // shadowAmount.x = contactPoints[i].x / maxDist;
            shadowAmount.y = contactPoints[i].y;
            shadowAmount.z = contactPoints[i].z;
            // shadowAmount.z = 1.0-(contactPoints[i].z / maxDist);

            // console.log(shadowAmount)
          }
          // if ( distNorm > 0.1 )
          // {
            // console.log( x+'/'+ y + ' ==> ' + distNorm + ' == ' + shadowAmount)  
          // }

          // console.log( x+'/'+ y + ' ==> ' + distNorm)
        }
        // let vv = Math.floor((1.0-shadowAmount)*255)
        // cMapData[stride] = vv;
        // cMapData[stride+1] = vv;
        // cMapData[stride+2] = vv;
        // cMapData[stride+3] = 255;
        // cMapData[stride+0] = Math.floor(shadowAmount.x*255);
        // cMapData[stride+1] = Math.floor(shadowAmount.y*255);
        // cMapData[stride+2] = Math.floor(shadowAmount.z*255);
        // cMapData[stride+3] = Math.floor(shadowAmount.w*255);
        cMapData[stride+0] = shadowAmount.x;
        cMapData[stride+1] = shadowAmount.y;
        cMapData[stride+2] = shadowAmount.z;
        cMapData[stride+3] = shadowAmount.w;
      }
    }

    // const r = Math.floor( color.r * 255 );
    // const g = Math.floor( color.g * 255 );
    // const b = Math.floor( color.b * 255 );

    // for ( let i = 0; i < size; i ++ ) {

    //   const stride = i * 4;

    //   data[ stride ] = r;
    //   data[ stride + 1 ] = g;
    //   data[ stride + 2 ] = b;
    //   data[ stride + 3 ] = 255;

    // }

    // used the buffer to create a DataTexture
    // console.log(cMapData)
    const cMapTexture = new THREE.DataTexture( cMapData, cMapWidth, cMapHeight, THREE.RGBAFormat, THREE.FloatType );
    cMapTexture.needsUpdate = true;
    return cMapTexture;
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

  createTree = ( treePos, startlength, maxlength ) =>
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
    const geometry = new THREE.BufferGeometry();
    let vertices = []
    let faces = []
    let vColors = []
    let normals = []
    let uvs = []

    parentMatrix = new THREE.Matrix4()
    parentMatrix.identity()
    parentMatrix.makeTranslation( treePos.x, treePos.y, treePos.z )

    // let randLen = THREE.MathUtils.randFloat( 12.0, 15.0)
    // let randLen = 10
    // let randWidth = 1
    let baseSize = 2
    // let randWidth = randLen/10.0
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
    branch( startlength, maxlength, parentMatrix, vertices, parentVertexIds, normals, faces, vColors, uvs, 0.8, 1 )
    
    // let maxUv = Math.max( ...uvs )
    let maxUv = 0;
    let ids = new Array(uvs.length/2).fill(THREE.MathUtils.randInt(0, 123456 ))
    for ( let i = 0; i < uvs.length; i+=2)
    {
      maxUv = Math.max( uvs[i], maxUv )
    }
    for ( let i = 0; i < uvs.length; i+=2 )
    {
      uvs[i] = uvs[i] / maxUv
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute(
          'customId',
          new THREE.BufferAttribute(new Float32Array(ids), 1));
    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( faces ), 1 ) );
    // console.log(geometry)
    return geometry
    
  }


  createCrystalsCluster = ( clusterCenter, 
                            cheightRange, 
                            cwidthRange, 
                            csidesRange, 
                            ctowerRange, 
                            ctowerheightRange, 
                            irragularityRange, 
                            cnumCrystalsRange, 
                            isRing ) =>
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
    const geometry = new THREE.BufferGeometry();
    let vertices = []
    let faces = []
    // let vColors = []
    let normals = []
    let uvs = []
    let ids = []    


    let cnumCrystals = THREE.MathUtils.randInt(cnumCrystalsRange.x, cnumCrystalsRange.y );
    let startId = 0
    let ringAngle = Math.PI * 2.0 / cnumCrystals
    for( let crystalId = 0; crystalId < cnumCrystals; crystalId++ )
    {
      let cheight = THREE.MathUtils.randFloat( cheightRange.x, cheightRange.y);
      let cwidth = THREE.MathUtils.randFloat( cwidthRange.x, cwidthRange.y);
      let csides =  THREE.MathUtils.randInt( csidesRange.x, csidesRange.y);
      let ctower = THREE.MathUtils.randFloat( 0.0, 1.0 ) > ctowerRange;
      let ctowerheight = THREE.MathUtils.randFloat( ctowerheightRange.x, ctowerheightRange.y);
      let irragularity =  THREE.MathUtils.randFloat( irragularityRange.x, irragularityRange.y);
      
      parentMatrix = new THREE.Matrix4()
      parentMatrix.identity()
      parentMatrix.makeTranslation( clusterCenter.x, clusterCenter.y, clusterCenter.z )
      if ( isRing )
      {
        let ringX = Math.sin(crystalId*ringAngle) * 300.0
        let ringZ = Math.cos(crystalId*ringAngle) * 300.0
        parentMatrix.makeTranslation( clusterCenter.x+ringX, clusterCenter.y, clusterCenter.z + ringZ )
      }
      let crystalOffsetId = THREE.MathUtils.randInt( 0, 123456 );
      // parentMatrix.makeTranslation(THREE.MathUtils.randFloat( 10.0, 100.0 ), 0.0, THREE.MathUtils.randFloat( 10.0, 100.0 ) )
      
      
      
      let rotVec = randomVecInXYZ(true);
      let localMatRot = new THREE.Matrix4();
      localMatRot.makeRotationAxis(rotVec, THREE.MathUtils.randFloat(-5.0, 5.0 ))
      if ( isRing )
      {
        let ringX = Math.sin(crystalId*ringAngle) * 300.0
        let ringZ = Math.cos(crystalId*ringAngle) * 300.0
        parentMatrix.makeTranslation( clusterCenter.x+ringX, clusterCenter.y, clusterCenter.z + ringZ )

        localMatRot.makeRotationAxis(new THREE.Vector3( 0.0, 1.0, 0.0 ), THREE.MathUtils.randFloat(-3.14159, 3.14159 ))
      }
      let cangle = Math.PI * 2.0  / csides
      for ( let i = 0; i<csides; i++ )
      {
        let currangle = cangle * i
        let xx = Math.sin( currangle )
        let zz = Math.cos( currangle )

        let offsetVec = randomVecInXYZ().setLength(irragularity)

        let p0 = new THREE.Vector3( xx * cwidth, 0.0,     zz * cwidth ).add(offsetVec)
        p0.applyMatrix4(localMatRot).applyMatrix4(parentMatrix)

        let p1 = new THREE.Vector3( xx * cwidth, cheight, zz * cwidth ).add(offsetVec)
        p1.applyMatrix4(localMatRot).applyMatrix4(parentMatrix)

        vertices.push( p0.x, p0.y, p0.z )
        vertices.push( p1.x, p1.y, p1.z )

        p0.normalize()

        normals.push( p0.x, p0.y, p0.z )
        normals.push( p0.x, p0.y, p0.z )

        ids.push(crystalOffsetId)
        ids.push(crystalOffsetId)

        if ( ctower )
        {
          uvs.push( 1, i/(csides-1))
          uvs.push( 1.0-(cheight/(cheight+ctowerheight)), i/(csides-1))
        }
        else
        {
          uvs.push( 1, i/(csides-1))
          uvs.push( 0.0, i/(csides-1))
        }

        let curId0 = i*2;
        let curId1 = i*2+1;
        let curId2 = (curId0+2) % (csides * 2);
        let curId3 = (curId1+2) % (csides * 2);

        faces.push( startId + curId0, startId + curId2, startId + curId1 )
        faces.push( startId + curId1, startId + curId2, startId + curId3 )
      }

      let tipHeight = cheight
      if ( ctower )
        tipHeight = cheight+ctowerheight
      let ptip = new THREE.Vector3( 0.0, tipHeight, 0.0 ).applyMatrix4(localMatRot).applyMatrix4(parentMatrix)
      vertices.push( ptip.x, ptip.y, ptip.z )
      ptip.normalize()
      normals.push( ptip.x, ptip.y, ptip.z )
      ids.push(crystalOffsetId)
      uvs.push( 0.0, 0.5)

      let pbottom = new THREE.Vector3( 0.0, 0.0, 0.0 ).applyMatrix4(localMatRot).applyMatrix4(parentMatrix)
      vertices.push( pbottom.x, pbottom.y, pbottom.z )
      pbottom.normalize()
      normals.push( pbottom.x, pbottom.y, pbottom.z )
      ids.push(crystalOffsetId)
      uvs.push( 1.0, 0.5)


      let tipId = csides*2
      for ( let i = 0; i<csides; i++ )
      {
        let currid = i * 2 + 1
        let nextId = ( currid + 2 ) % (csides * 2)
        faces.push( startId + currid, startId + nextId, startId + tipId )
      }
      let bottomIdId = csides*2+1
      for ( let i = 0; i<csides; i++ )
      {
        let currid = i * 2
        let nextId = ( currid + 2 ) % (csides * 2)
        faces.push( startId + nextId, startId + currid, startId + bottomIdId )
      }

      startId += csides*2+2
    }

    
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute(
          'customId',
          new THREE.BufferAttribute(new Float32Array(ids), 1));
    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( faces ), 1 ) );

    geometry.computeVertexNormals();
    
    return geometry
  }

 

  createDisk = ( centerPos, radius, segments ) =>
  {
    tokenData.hash    = randomHash(64);


    const {
    shape,
    color,
    seed,
    colorMode,
    wireframe
    } = hashToTraits(tokenData.hash);

    const geometry = new THREE.BufferGeometry();
    let vertices = []
    let faces = []
    // let vColors = []
    let normals = []
    let uvs = []

    let ringAngle = Math.PI * 2.0 / segments
    for ( let i = 0; i < segments; i++ )
    {
      let currangle = ringAngle * i
      let xx = Math.sin( currangle )
      let zz = Math.cos( currangle )

      let pp = new THREE.Vector3( xx * radius, 0.0,     zz * radius ).add(centerPos)

      vertices.push( pp.x, pp.y, pp.z )

      normals.push( 0.0, 1.0, 0.0 )

      uvs.push( 0, i/(segments-1))
    

      let curId0 = i;
      let curId1 = (curId0+1) % (segments);
      

      faces.push( segments, curId0, curId1 )
    }

    vertices.push( centerPos.x, centerPos.y, centerPos.z )
    normals.push( 0.0, 1.0, 0.0 )
    uvs.push( 1.0, 0.5)

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
    return geometry
  }

  

  sceneAssembly = () =>
  {
    cleanScene()
    let crystalContactPositions = []
    let treeContactPositions = []
    treeContactPositions.push( new THREE.Vector3(0.0, 50.0, 0.0 ) )
    // treeContactPositions.push( new THREE.Vector3(0.0, 10.0, 0.0 ) )
    let allMeshes = []
    let mainStartLength = THREE.MathUtils.randFloat( 12.0, 15.0);
    // MAIN TREE
    allMeshes.push( MainTreeMaterial(uniforms, createTree(new THREE.Vector3( 0.0, 0.0, 0.0 ), mainStartLength, mainStartLength/10.0 )) )
    
    
    // BGFORREST
    let forrestTreeAmount = 60
    let angle = Math.PI*4.0 / forrestTreeAmount
    for ( let i = 0; i < forrestTreeAmount; i++ )
    {
      let posVec = new THREE.Vector3( Math.sin(i*angle), 0.0, Math.cos(i*angle) )
      posVec.setLength( THREE.MathUtils.randFloat( 150.0, 250.0 ) )
      allMeshes.push( BGTreeMaterial(uniforms, createTree(posVec, 15.0, 5.0 ) ) )
      treeContactPositions.push( new THREE.Vector3( posVec.x, 10.0, posVec.z ) )
    }

    let groundCrystalAmnount = 1000
    let groundCrystalRadMin = 10.0
    let groundCrystalRadMax = 200.0
    for( let i = 0; i < groundCrystalAmnount; i++ )
    {
      let posVec = randomVecInXZ();
      posVec.setLength( THREE.MathUtils.randFloat( groundCrystalRadMin, groundCrystalRadMax ) )

      let cheightRange = new THREE.Vector2( 1.0, 4.0);
      let cwidthRange = new THREE.Vector2( 0.2, 0.5);
      let csidesRange = new THREE.Vector2( 4,8);
      let ctowerRange = 0.25;
      let ctowerheightRange = new THREE.Vector2( 0.1, 0.5);
      let irragularityRange = new THREE.Vector2( 0.0, 0.2);
      let cnumCrystalsRange = new THREE.Vector2(5,10);

      

      allMeshes.push( GroundCrystalMaterial(uniforms, createCrystalsCluster(  posVec, 
                                                                              cheightRange, 
                                                                              cwidthRange, 
                                                                              csidesRange, 
                                                                              ctowerRange, 
                                                                              ctowerheightRange, 
                                                                              irragularityRange, 
                                                                              cnumCrystalsRange, 
                                                                              false )
      ) )

      crystalContactPositions.push( new THREE.Vector3( posVec.x, 6.0, posVec.z ) )
    }
    let ring_cheight = new THREE.Vector2( 40.0, 120.0);
    let ring_cwidth = new THREE.Vector2( 10.0, 30.0);
    let ring_csides =  new THREE.Vector2( 4,8);
    let ring_ctower = 0.5;
    let ring_ctowerheight = new THREE.Vector2( 10, 40);
    let ring_irragularity =  new THREE.Vector2( 10.0, 20.0);
    let ring_cnumCrystals = new THREE.Vector2( 80, 100 );
    allMeshes.push( WallCrystalMaterial(uniforms, createCrystalsCluster(  new THREE.Vector3( 0.0, 0.0, 0.0 ), 
                                                                          ring_cheight, 
                                                                          ring_cwidth, 
                                                                          ring_csides, 
                                                                          ring_ctower, 
                                                                          ring_ctowerheight, 
                                                                          ring_irragularity, 
                                                                          ring_cnumCrystals, 
                                                                          true )
      ) )
    
        
    
    


    const material = new THREE.MeshLambertMaterial({ color: color });
    crystalContactShadowTx = CreateContactShadows(crystalContactPositions, 320.0);
    treeContactShadowTx = CreateContactShadows(treeContactPositions, 320.0);
    
    uniforms.ctex.value = crystalContactShadowTx;
    uniforms.ttex.value = treeContactShadowTx;
    var groundGeo = new THREE.PlaneBufferGeometry(320*2, 320*2);
    // var planeMat = new THREE.MeshBasicMaterial({ map: contactShadowTx });
    
    let groundMat = new THREE.ShaderMaterial( {
      vertexShader: vertexShader(),
      fragmentShader: fragmentShaderGround(),
      uniforms: uniforms,
    });
    groundMat.side = THREE.DoubleSide;

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -90.0 * 3.14159 / 180.0;
    allMeshes.push(ground)


    let sphereMat = new THREE.ShaderMaterial( {
      vertexShader: vertexShader(),
      fragmentShader: fragmentShaderSphere(),
      uniforms: uniforms,
    });

    //  let sphereMat = new THREE.MeshLambertMaterial({ color: "green" });
    sphereMat.side = THREE.DoubleSide;
    const bgSphereGeo = new THREE.SphereGeometry( 400.0, 
                                                  64, 
                                                  32,
                                                  0,
                                                  Math.PI * 2,
                                                  0,
                                                  Math.PI * 0.5
                                                  );
    var bgSphere = new THREE.Mesh(bgSphereGeo, sphereMat);
    allMeshes.push(bgSphere)
    AddMeshesToState(allMeshes)


    hand1 = renderer.xr.getHand( 0 );
    hand1.add( new OculusHandModel( hand1 ) );
    scene.add( hand1 );

    // hand 2
    hand2 = renderer.xr.getHand( 1 );
    hand2.add( new OculusHandModel( hand2 ) );
    scene.add( hand2 );

      // controllers
    controller1 = renderer.xr.getController(0);
    controller1.name="left";    ////MODIFIED, added .name="left"
    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.name="right";  ////MODIFIED added .name="right"
    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);
    scene.add(controller2);

    var controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(
        controllerModelFactory.createControllerModel(controllerGrip1)
    );
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(
        controllerModelFactory.createControllerModel(controllerGrip2)
    );
    scene.add(controllerGrip2);

  }

  let scene, camera;
  
  initialize = () => {
    const width    = window.innerWidth;
    const height   = window.innerHeight;
    const ratio    = window.innerWidth / window.innerHeight;

    
    scene    = new THREE.Scene();
    // const camera   = new THREE.PerspectiveCamera(75, ratio, 0.5, 1000);
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 0, 1.6, 1.5 );
    // const camera   =  new THREE.CinematicCamera( 60, ratio, 1, 1000 );
    // camera.setLens(15, 35.0, 0.1, camera.coc )
    // camera.postprocessing.bokeh_uniforms[ 'focalDepth' ].value = 300.0;
    const light    = new THREE.AmbientLight(0xa0a0a0);
    const directLight = new THREE.DirectionalLight( 0xa0a0a0, 0.5 );
    let stats = new Stats()
    // stats.showPanel( 0 );
    // stats.domElement.style.cssText = 'position:absolute;top:20px;right:0px;';
    // document.body.appendChild(stats.dom)
    
    // renderer.xr.enabled = true;
    // document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );
    // document.body.appendChild( VRButton.createButton( renderer ) );


    const loader = new THREE.CubeTextureLoader();
    const texture = loader
        .load([
            '../asset/env/posx.jpg',
            '../asset/env/negx.jpg',
            '../asset/env/posy.jpg',
            '../asset/env/negy.jpg',
            '../asset/env/posz.jpg',
            '../asset/env/negz.jpg'
        ]);
        // .load([
        //     '/asset/env/px.jpg',
        //     '/asset/env/nx.jpg',
        //     '/asset/env/py.jpg',
        //     '/asset/env/ny.jpg',
        //     '/asset/env/pz.jpg',
        //     '/asset/env/nz.jpg'
        // ]);
    // scene.background = texture;
    
    // scene.background = new THREE.Color(0xffffff)
    // const material = new THREE.MeshBasicMaterial({ color: color });
    // material.side = THREE.DoubleSide;
    // material.wireframe = true;
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.position.z = 100;
    // camera.position.y = 50;
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    
    // controls.target = new THREE.Vector3( 0, 50, 0)
    // controls.update()

    

    // create mesh
    // const geometry = shape == 'square'
    //   ? new THREE.BoxGeometry(1, 1, 1)
    //   : new THREE.SphereGeometry(.5, 32, 16);
    
    scene.add(light);
    scene.add(directLight);
    
    

    const renderScene = new THREE.RenderPass( scene, camera );
    const aaPass = new THREE.SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
    const bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.0, 1.0, 0.85 );
    const filmPass =  new THREE.FilmPass(0.3, 0.1, height/2.0, false);
    glitchPass =  new THREE.GlitchPass(64);
    // glitchPass.goWild = true;
    glitchPass.isActive = false;
    const ssaoPass = new THREE.SSAOPass( scene, camera, 1024*4, 1024 );
    const adTonePass = new THREE.AdaptiveToneMappingPass( true, 1024 );
    const bokehPass = new THREE.BokehPass( scene, camera, {
      focus: 150.0,
      aperture: 0.00004,
      maxblur: 0.04,

      width: width,
      height: height
    } );

    const composer = new THREE.EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( aaPass );
    
    // composer.addPass( ssaoPass );
    composer.addPass( bloomPass );
    composer.addPass( adTonePass );
    composer.addPass( glitchPass );
    composer.addPass( filmPass );
    
    composer.addPass( bokehPass );
    state.three = {
      scene: scene,
      camera: camera,
      mesh: null,
      controls: controls,
      uniforms: uniforms,
      stats: stats,
      composer: composer
    };
    tokenState.usePostProcessing = true;
    sceneAssembly()

    
  };

  // render scene
  canvas.render = () => {
    const { scene, camera } = state.three;
    // state.three.composer.render()

    renderer.render(scene, camera);
  };

  // update
  // canvas.update = () => {
  //   let dt = clock.getDelta();
  //   // const mesh = state.three.mesh;
  //   const meshes = state.three.meshes;

  //   for ( let i = 0; i < tokenState.three.scene.children.length; i++ )
  //   {
  //     if ( tokenState.three.scene.children[i].type == "Group" )
  //     {
  //       // tokenState.three.scene.children[i].scale = new THREE.Vector3(0.01,0.01,0.01);
  //       // tokenState.three.scene.children[i].rotation.y += dt*0.1;
  //     }
  //   }
  //   // for ( let i = 0; i < meshes.length; i++ )
  //   // {
  //     // mesh.rotation.x += 0.02;
  //     // meshes[i].rotation.y += dt*0.1;
  //     // mesh.scale.x     = state.width;
  //     // mesh.scale.y     = 1;
  //   // }
  //   // state.three.controls.update();
  //   uniforms.iT.value += dt;
  //   uniforms.iV2.value = state.colorMode;
  // };

  // // render/update loop
  // canvas.loop = () => {
  //   const { scene, camera } = state.three;
  //   // scene.overrideMaterial = new THREE.MeshLambertMaterial({ color: "green" });
  //   requestAnimationFrame(canvas.loop);
  //   canvas.update();
  //   // if ( tokenState.usePostProcessing )
  //   //   state.three.composer.render()
  //   // else
  //   //   renderer.render(scene, camera);
  //   // camera.renderCinematic( scene, renderer )
  //     renderer.render(scene, camera);

  //     // console.log( camera.position )
      
  //   state.three.stats.update()
  // };

  function animate() {

    renderer.setAnimationLoop( render );
    

  }

  // function update() {
  //     let dt = clock.getDelta();
  //     // const mesh = state.three.mesh;
  //     const meshes = state.three.meshes;
  
  //     for ( let i = 0; i < tokenState.three.scene.children.length; i++ )
  //     {
  //       if ( tokenState.three.scene.children[i].type == "Group" )
  //       {
  //         // tokenState.three.scene.children[i].scale = new THREE.Vector3(0.01,0.01,0.01);
  //         // tokenState.three.scene.children[i].rotation.y += dt*0.1;
  //       }
  //     }
  //     // for ( let i = 0; i < meshes.length; i++ )
  //     // {
  //       // mesh.rotation.x += 0.02;
  //       // meshes[i].rotation.y += dt*0.1;
  //       // mesh.scale.x     = state.width;
  //       // mesh.scale.y     = 1;
  //     // }
  //     // state.three.controls.update();
  //     uniforms.iT.value += dt;
  //     uniforms.iV2.value = state.colorMode;
  //   };
  


  function render() {

    // const time = performance.now() * 0.0002;
    // const torus = scene.getObjectByName( 'torus' );
    // torus.rotation.x = time * 2;
    // torus.rotation.y = time * 5;
    let dt = clock.getDelta();
    uniforms.iT.value += dt;
    uniforms.iV2.value = state.colorMode;
    renderer.render( scene, camera );
    // stats.update();

    // Canvas elements doesn't trigger DOM updates, so we have to update the texture
    // statsMesh.material.map.update();


  }
  initialize();
  animate();
  // canvas.initialize();
  // canvas.render();
  // canvas.loop();

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



