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

// const levelDist = {
//   A: 2,
//   B: 3,
//   C: 4,
//   D: 5,
//   E: 6,
//   F: 4,
//   G: 5,
//   H: 4,
//   I: 5,
// };

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------
const hashToTraits = hash => {
  // setup random fns
  const R = mkRandom(hash);

  const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
  // const isMobile = true
  

  var maxPointsPerLayer = 10;
  if ( isMobile )
  {
    maxPointsPerLayer = 5;
  }
  var maxLayer = 4;
  if ( isMobile )
  {
    maxLayer = 1;
  }

  const layers = Math.min(maxLayer,R.ri( 2, 3 ));
  const post  = 10;
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  const pointsl = Math.min( maxPointsPerLayer, R.ri(0, (4-layers) * 10 ));
  const shape = R.ri(-1,3 );
  const speed = R.ri( 50, 200 );
  const size = R.ri( 50, 200 );

  const level = R.ri( 2, 5 );
  // hack so layers are bisased to higher orders
  // const level = selectRandomDist(levelDist, R.r);
  const cmode = R.ri( 0, 14 );

  return {
    layers,
    post,
    seed,
    seedC,
    pointsl,
    shape,
    speed,
    size,
    level,
    cmode
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
  
   
  const scale  = window.devicePixelRatio;
  const width  = window.innerWidth;
  const height = window.innerHeight;
  // const body   = document.querySelector('body');
  //const body   = document.querySelector('body > section:nth-child(3) > div > div');
  const body = document.querySelector('body > section:nth-child(1) > div > p');

  // const body = document.querySelector('body > section:nth-child(1)');
  
  // setup render to match window size
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true  });
  renderer.setPixelRatio(scale);
  renderer.setSize(width, height);
  body.appendChild(renderer.domElement);

  return renderer;

};

//-----------------------------------------------------------------------------

const doArt = (renderer, hash, state) => {

  const {
    layers,
    post,
    seed,
    seedC,
    pointsl,
    shape,
    speed,
    size,
    level,
    cmode
  } = hashToTraits(hash);
  
  // console.log( hashToTraits(hash));

  const canvas = document.querySelector('canvas');
  renderer.autoClear = false;
  renderer.autoClearColor = false;


const textureBlitShader = `
#include <common>
precision mediump float;

uniform vec3 iResolution;
uniform sampler2D blitTex;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = texture(blitTex, uv);
}
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const iChannel0FragmentShader = `
  #include <common>
  precision mediump float;
  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec4 iDate;
  uniform sampler2D iChannel0;
  uniform int iInt0;  // layers
  uniform int iInt1;  // post
  uniform int iInt2;  // seed
  uniform int iInt3;  // pointsl
  uniform int iInt4;  // sdfblend
  uniform int iInt5;  // shape
  uniform int iInt6;  // seed Color
  uniform int iInt7;  // global speed
  uniform int iInt8;  // global size
  uniform int iInt9;  // hilbert level
  uniform int iInt10; // color mode
  uniform int iInt11; // fadeout


  //const int level = iInt9; // numpoints == (2^level)^2
  // The Golden Angle is (3.-sqrt(5.0))*PI radians. == 2.39996323
  // in angle 137.5077640
  #define GOLDEN_ANGLE 0.381966011
  float dot2( in vec2 v ) { return dot(v,v); }

  float hash11(float p)
  {
      p = fract(p * .1031);
      p *= p + 33.33;
      p *= p + p;
      return fract(p);
  }

  float hash12(vec2 p)
  {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 curve( int i )
  {
      ivec2 res = ivec2(0,0);
      for( int k=0; k<iInt9; k++ )
      {
  
          ivec2 r = ivec2( i>>1, i^(i>>1) ) & 1;
          if (r.y==0) { if(r.x==1) { res = (1<<k)-1-res; } res = res.yx; }
          
          res += r<<k;
          i >>= 2;
      }
      return vec2(float(res.x), float(res.y));
  }

  vec2 rotateCCW(vec2 p, float a)
  {
    mat2 m = mat2(cos(a), sin(a), -sin(a), cos(a));
    return p * m;	
  }

  vec2 rotateCW(vec2 p, float a)
  {
    mat2 m = mat2(cos(a), -sin(a), sin(a), cos(a));
    return p * m;
  }

  vec2 rotate( vec2 p, float a )
  {
    if ( a > 0.0 )
      return rotateCW( p, a );
    else if ( a < 0.0 )
      return rotateCCW( -p, a );
    else
      return p;
  }

  vec2 translate(vec2 p, vec2 t)
  {
    return p - t;
  }

  float circleDist(vec2 p, float radius)
  {
    float result = length(p) - radius;
    // if ( result > 0.0 )
    // {
    //   if ( p.x + radius > iResolution.x )
    //     result = min( result, length(p-vec2( iResolution.x, 0. )) - radius );
    //   if ( p.x - radius < 0. )
    //     result = min( result, length(p+vec2( iResolution.x, 0. )) - radius );     
    // }
    return result;
  }


  float triangleDist(vec2 p, float radius)
  {
    return max(	abs(p).x * 0.866025 + 
            p.y * 0.5, -p.y) 
          -radius * 0.5;
  }


  float boxDist(vec2 p, vec2 size, float radius)
  {
    size -= vec2(radius);
    vec2 d = abs(p) - size;
      return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
  }

  float hexagonDist( in vec2 p, in float radius ) 
  {
    const vec3 k = vec3(-0.866025404,0.5,0.577350269);
    vec2 s = sign(p);
    p = abs(p);
    float w = dot(k.xy,p);    
    p -= 2.0*min(w,0.0)*k.xy;
    p -= vec2(clamp(p.x, -k.z*radius, k.z*radius), radius);
    return length(p)*sign(p.y);
  }


  float smoothMerge(float d1, float d2, float k)
  {
      float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
      return mix(d2, d1, h) - k * h * (1.0-h);
  }

  vec3 hsv2rgb(vec3 c)
  {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }


  vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
  {
      return a + b*cos( 6.28318*(c*t+d) );
  }
  
  vec3 viridis(float t) 
  {
    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
  }

  vec3 plasma(float t) 
  {
    const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
    const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
    const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
    const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
    const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
    const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
    const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
  }

  vec3 magma(float t) 
  {
    const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
    const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
    const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
    const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
    const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
    const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
    const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
  }

  vec3 inferno(float t) 
  {
    const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
    const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
    const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
    const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
    const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
    const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
    const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
  }

  vec3 turbo(float t) 
  {
    const vec3 c0 = vec3(0.1140890109226559, 0.06288340699912215, 0.2248337216805064);
    const vec3 c1 = vec3(6.716419496985708, 3.182286745507602, 7.571581586103393);
    const vec3 c2 = vec3(-66.09402360453038, -4.9279827041226, -10.09439367561635);
    const vec3 c3 = vec3(228.7660791526501, 25.04986699771073, -91.54105330182436);
    const vec3 c4 = vec3(-334.8351565777451, -69.31749712757485, 288.5858850615712);
    const vec3 c5 = vec3(218.7637218434795, 67.52150567819112, -305.2045772184957);
    const vec3 c6 = vec3(-52.88903478218835, -21.54527364654712, 110.5174647748972);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
  }

  vec3 colorize( float distance, float colorWidth, float ss )
  {
    if ( iInt10 == 0 )
    {
      // random mode
      float colR = hash11(ss + floor(distance / colorWidth ) + 555.0 );
      float colG = hash11(ss + floor(distance / colorWidth ) + 666.0 );
      float colB = hash11(ss + floor(distance / colorWidth ) + 777.0 );
      
      return vec3( colR, colG, colB );

    } 
    else if ( iInt10 == 1 )
    {
      // golden angle mode with full sat and value
      float h = hash11(ss+666.0) + floor(distance / colorWidth) * GOLDEN_ANGLE;
      return hsv2rgb( vec3(h, 0.75,0.75));
      
    } 
    else if ( iInt10 == 2 )
    {
      // golden angle mode with random sat and value
      float h = hash11(ss+666.0) + floor(distance / colorWidth) * GOLDEN_ANGLE;
      return hsv2rgb( vec3(h, 0.5+hash11(ss+555.0)*0.5,0.5+hash11(ss+777.0)*0.5));
    } 
    else if ( iInt10 == 3 )
    {
      return viridis(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
    } 
    else if ( iInt10 == 4 )
    {
      return viridis(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
    } 
    else if ( iInt10 == 5 )
    {
      return plasma(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
    } 
    else if ( iInt10 == 6 )
    {
      return plasma(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
    } 
    else if ( iInt10 == 7 )
    {
      return magma(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
    } 
    else if ( iInt10 == 8 )
    {
      return magma(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
    } 
    else if ( iInt10 == 9 )
    {
      return inferno(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
    } 
    else if ( iInt10 == 10 )
    {
      return inferno(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
    } 
    else if ( iInt10 == 11 )
    {
      return turbo(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
    } 
    else if ( iInt10 == 12 )
    {
      return turbo(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
    } 
    else if ( iInt10 == 13 )
    {
      // rainbow mode
      vec3 cola = vec3( 0.5, 0.5, 0.5 );
      vec3 colb = vec3( 0.5, 0.5, 0.5 );
      vec3 colc = vec3( 1.0, 1.0, 1.0 );
      vec3 cold = vec3( 0.00, 0.33, 0.67 );

      // random mix
      return pal( hash11(ss + floor(distance / colorWidth ) + 666.0 ), cola, colb, colc, cold );

    } 
    else if ( iInt10 == 14 )
    {
      // rainbow mode
      vec3 cola = vec3( 0.5, 0.5, 0.5 );
      vec3 colb = vec3( 0.5, 0.5, 0.5 );
      vec3 colc = vec3( 1.0, 1.0, 1.0 );
      vec3 cold = vec3( 0.00, 0.33, 0.67 );

      // constant
      return pal( hash11(ss+666.0) + floor(distance / colorWidth)*0.0025*colorWidth, cola, colb, colc, cold );
      
    }
    return vec3(0.);
  }

  float sceneDist( int type, vec2 PP, vec2 hilbertP, float ss, float globalSize )
  {
    
    float sign = 1.0;
    if ( hash11(ss+789456.) < 0.5 )
      sign = -1.0;

    if ( type == 0 )
      return circleDist(   translate( PP, hilbertP ), hash11( ss ) * 200. * globalSize );
    else if ( type == 1 )
    {
      float radiusBox = hash11( ss ) * 200. * globalSize;
      return boxDist(      translate( PP, hilbertP ), vec2(radiusBox), radiusBox * 0.1 );
    }
    else if ( type == 2 )
      return triangleDist( rotate( translate(PP, hilbertP),sign * hash11( ss ) * 360. / 180. * 3.14159 + iTime*0.25 ), hash11( ss + 1234. ) * 200. * globalSize ); 
    else
      return hexagonDist( rotate( translate(PP, hilbertP),sign * hash11( ss ) * 360. / 180. * 3.14159 + iTime*0.25 ), hash11( ss + 1234. ) * 200. * globalSize ); 
  }
  

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 P = fragCoord + vec2( 0.5 );
    int numPoints      = 1<<(iInt9<<1);
    float numPointsFloat = float(numPoints);
    float gridDistance = float((1<<iInt9)-1); 
    
    float seeed = float(iInt2);
    float seeedC = float(iInt6);

    float gSpeed = float(iInt7) / 100.0;
    float gSize  = float(iInt8) / 100.0;
    
    float backgroundD;
    vec4 accumulatedCol = vec4(0.); // black background
    
    
    // camera shake if wanted
    // P.y += (hash11( seeed + 666.0 + iTime ) * 2.0 - 1.0 ) * 2.0 * abs(sin(iTime));

    float numLayers = float(iInt0);

    for ( int l = 1; l<=iInt0; l++ )
    {
      float ll = float(l);
      int numPointsInLayer = min(numPoints, int(hash11( seeed+ll + 2.0 ) * float(iInt3) + 0.5) );
      float gs = gSize * ( 0.5 + ( 1.-ll/numLayers) * 0.5);

      int curveIndex = int(hash11( seeed + ll + 33.0 ) * numPointsFloat);
      vec2 PHC = curve(curveIndex)/gridDistance * iResolution.xy;

      float d = sceneDist( iInt5, P, PHC, seeed + ll + 4.0, gs );
      
      for ( int i = 1; i<numPointsInLayer; i++ )
      {
        float ii = float(i);
        curveIndex = int(hash11( seeed + ii*ll + 3.0 ) * numPointsFloat);
        PHC = curve(curveIndex)/gridDistance * iResolution.xy;
        
        if ( iInt5<0)
          d = smoothMerge( d, sceneDist( (iInt5+l)%4, P, PHC, seeed + ii+ll + 4.0, gs ), float(iInt4) );
        else
          d = smoothMerge( d, sceneDist( iInt5, P, PHC, seeed + ii+ll + 4.0, gs ), float(iInt4) );
      }

      if ( l == 1 )
        backgroundD = d;
      else
        backgroundD = smoothMerge( backgroundD, d, 0.001 ); // tiny merge to remove black edges
      
      float layerSpeed = iTime * (5.+hash11( seeedC + ll + 5.0 )*100.0 ) * gSpeed;

      float alpha = smoothstep( 0.005, 0., d );
      vec3 layerCol = colorize( -d-layerSpeed, 5.+40.*hash11( seeedC + ll + 6.0 ), seeedC + ll + 7.0 );
      layerCol *= alpha; // premult;
      accumulatedCol.rgb = layerCol + accumulatedCol.rgb * ( 1.0 - alpha ); // over
      accumulatedCol.a = max(accumulatedCol.a, alpha);
    }
    
    
    vec3 bgColor  = colorize( backgroundD-iTime*50.*gSpeed, (10.+hash11( seeedC + 99.0 )*60.)*gSize, seeedC + 8.0 );

    fragColor.rgb = accumulatedCol.rgb + bgColor * (1.-accumulatedCol.a);
    fragColor.a = 1.0;

    

  }

  
  void main() 
  {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;

  const iChannel1FragmentShader = `
  #include <common>
  precision mediump float;

  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec4 iDate;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;

  uniform int iInt0;
  uniform int iInt1; // post amount
  uniform int iInt2;
  uniform int iInt3;
  uniform int iInt4;
  uniform int iInt5;
  uniform int iInt6;
  uniform int iInt7;
  uniform int iInt8;
  uniform int iInt9;
  uniform int iInt10;
  uniform int iInt11; // fadeout 

  float hash12(vec2 p)
  {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  
  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    float seed = float(iInt2);
    vec2 uv = fragCoord / iResolution.xy;
    vec2 fromCenter = vec2(0.5) - uv;
    vec2 delta = fromCenter * 0.5 * float(iInt1)/2000.0;
    vec4 tx  = texture(iChannel0, uv);
    vec4 ttx = vec4(0.);
    vec4 origCol = vec4(0.);
    for ( int i=0; i < 4; i++ )
    {
      ttx+=texture(iChannel0, uv+delta*float(i));
      if( i == 0 )
        origCol = ttx;
    }

    ttx /= 4.0;

    vec2 vinCoord = ( 2.0 * fragCoord - iResolution.xy ) / min(iResolution.x, iResolution.y);
    float vignette = smoothstep( 1.2, 0.3,length(vinCoord*0.5));
    vec4 chroma = vec4( tx.r, ttx.g, tx.b, tx.a) * vignette;
    
    fragColor = mix(origCol, chroma, float(iInt1) / 10. );

    float globalfade = float(iInt11) / 100.0;
    fragColor.rgb = mix(fragColor.rgb, vec3(0.), globalfade );
  }
  
  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;

const fragmentShader = `
  #include <common>
  precision mediump float;
  
  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec4 iDate;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  uniform sampler2D overlayTx;

  uniform int iInt0;
  uniform int iInt1;
  uniform int iInt2;
  uniform int iInt3;
  uniform int iInt4;
  uniform int iInt5;
  uniform int iInt6;
  uniform int iInt7;
  uniform int iInt8;
  uniform int iInt9;
  uniform int iInt10;
 
  
  #define SS(a, b, x) (smoothstep(a, b, x) * smoothstep(b, a, x))

  #define UI0 1597334673U
  #define UI1 3812015801U
  #define UI2 uvec2(UI0, UI1)
  #define UI3 uvec3(UI0, UI1, 2798796415U)
  #define UIF (1. / float(0xffffffffU))

  // Hash by David_Hoskins
  vec3 hash33(vec3 p)
  {
    uvec3 q = uvec3(ivec3(p)) * UI3;
    q = (q.x ^ q.y ^ q.z)*UI3;
    return -1. + 2. * vec3(q) * UIF;
  }

  // Gradient noise by iq
  float gnoise(vec3 x)
  {
      // grid
      vec3 p = floor(x);
      vec3 w = fract(x);
      
      // quintic interpolant
      vec3 u = w * w * w * (w * (w * 6. - 15.) + 10.);
      
      // gradients
      vec3 ga = hash33(p + vec3(0., 0., 0.));
      vec3 gb = hash33(p + vec3(1., 0., 0.));
      vec3 gc = hash33(p + vec3(0., 1., 0.));
      vec3 gd = hash33(p + vec3(1., 1., 0.));
      vec3 ge = hash33(p + vec3(0., 0., 1.));
      vec3 gf = hash33(p + vec3(1., 0., 1.));
      vec3 gg = hash33(p + vec3(0., 1., 1.));
      vec3 gh = hash33(p + vec3(1., 1., 1.));
      
      // projections
      float va = dot(ga, w - vec3(0., 0., 0.));
      float vb = dot(gb, w - vec3(1., 0., 0.));
      float vc = dot(gc, w - vec3(0., 1., 0.));
      float vd = dot(gd, w - vec3(1., 1., 0.));
      float ve = dot(ge, w - vec3(0., 0., 1.));
      float vf = dot(gf, w - vec3(1., 0., 1.));
      float vg = dot(gg, w - vec3(0., 1., 1.));
      float vh = dot(gh, w - vec3(1., 1., 1.));
    
      // interpolation
      float gNoise = va + u.x * (vb - va) + 
                u.y * (vc - va) + 
                u.z * (ve - va) + 
                u.x * u.y * (va - vb - vc + vd) + 
                u.y * u.z * (va - vc - ve + vg) + 
                u.z * u.x * (va - vb - ve + vf) + 
                u.x * u.y * u.z * (-va + vb + vc - vd + ve - vf - vg + vh);
      
      return 2. * gNoise;
  }

  // gradient noise in range [0, 1]
  float gnoise01(vec3 x)
  {
    return .5 + .5 * gnoise(x);   
  }


  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 iChannelResolution = vec2(2048., 2048.);
      vec2 uvbase = fragCoord / iResolution.xy;
      vec3 baseLayer = texture( iChannel1, uvbase ).rgb;
      
      vec2 margin = vec2(10), Sres = iResolution.xy -2.*margin, Tres = iChannelResolution, ratio = Sres/Tres;
      vec2 uv = fragCoord - margin;
      uv -= .5*Tres*max(vec2(ratio.x-ratio.y,ratio.y-ratio.x),0.);
      uv /= Tres*min(ratio.x,ratio.y);
      
      
      
      float t = iTime;
      
      // smoothed interval for which the glitch gets triggered
      float glitchAmount = SS(7. * .001, 7. * 0.5, mod(t, 7.));  
    float displayNoise = 0.;
      vec3 col = vec3(0.);
      vec2 eps = vec2(5. / iResolution.x, 0.);
      vec2 st = vec2(0.);

      // analog distortion
      float y = uv.y * iResolution.y;
      float distortion = gnoise(vec3(0., y * .01, t * 500.)) * (glitchAmount * 4. + .1);
      distortion *= gnoise(vec3(0., y * .02, t * 250.)) * (glitchAmount * 2. + .025);

      ++displayNoise;
      distortion += smoothstep(.999, 1., sin((uv.y + t * 1.6) * 2.)) * .02;
      distortion -= smoothstep(.999, 1., sin((uv.y + t) * 2.)) * .02;
      st = uv + vec2(distortion, 0.);
      // chromatic aberration
      col.r += textureLod(overlayTx, clamp(st + eps + distortion,0.,1.), 0.).r;
      col.g += textureLod(overlayTx, clamp(st,0.,1.), 0.).r;
      col.b += textureLod(overlayTx, clamp(st - eps - distortion,0.,1.), 0.).r;
      
      float a = 0.;
      if( col.r > 0.5 || col.g > 0.5 || col.b > 0.5 )
          a = 1.;
      col = (col*a) + ( baseLayer * (1.-a));
      fragColor = vec4(col, 1.0);
  }

  // void mainImage( out vec4 fragColor, in vec2 fragCoord )
  // {
  //   vec2 uv = fragCoord / iResolution.xy;
  //   float ar = iResolution.y / iResolution.x;
  //   vec4 overlay = texture( overlayTx, uv * vec2( 1., ar )  );
  //   fragColor.rgb = ( overlay.rgb * overlay.a ) + ( texture(iChannel1, uv).rgb * (1. - overlay.a) );
  // }
  
 
  void main() 
  {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;

  const scale  = window.devicePixelRatio;
  const width  = window.innerWidth * scale;
  const height = window.innerHeight * scale;
  
  var iChannel0Target = new THREE.WebGLRenderTarget(  width, height, {  wrapS: THREE.RepeatWrapping, 
                                                                                                wrapT: THREE.RepeatWrapping, 
                                                                                                minFilter: THREE.NearestFilter, 
                                                                                                magFilter: THREE.NearestFilter,
                                                                                                format: THREE.RGBAFormat, 
                                                                                                type: THREE.FloatType,
                                                                                                stencilBuffer: false });
  var iChannel1Target = new THREE.WebGLRenderTarget(  width, height, {  wrapS: THREE.RepeatWrapping, 
                                                                                                wrapT: THREE.RepeatWrapping, 
                                                                                                minFilter: THREE.NearestFilter, 
                                                                                                magFilter: THREE.NearestFilter,
                                                                                                format: THREE.RGBAFormat, 
                                                                                                type: THREE.FloatType,
                                                                                                stencilBuffer: false });                                                                                              
  var blitTempTarget  = new THREE.WebGLRenderTarget(  width, height, {  wrapS: THREE.RepeatWrapping, 
                                                                                                wrapT: THREE.RepeatWrapping, 
                                                                                                minFilter: THREE.NearestFilter, 
                                                                                                magFilter: THREE.NearestFilter,
                                                                                                format: THREE.RGBAFormat, 
                                                                                                type: THREE.FloatType,
                                                                                                stencilBuffer: false });

  const overlayTexture = new THREE.TextureLoader().load( 'overlayText.png' );


  const uniforms = {
    iTime: { value: 0 },
    iDate: { value: new THREE.Vector4() },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: iChannel0Target.texture },
    iChannel1: { value: iChannel1Target.texture },
    iInt0: { value : layers }, 
    iInt1: { value : post }, 
    iInt2: { value : seed }, 
    iInt3: { value : pointsl }, 
    iInt4: { value : state.sdfblend },
    iInt5: { value : shape },
    iInt6: { value : seedC },
    iInt7: { value : speed },
    iInt8: { value : size },
    iInt9: { value : level },
    iInt10: { value : cmode },
    iInt11: { value: state.fadeout },
    overlayTx: { type: 't', value: 0, texture: overlayTexture }
  };

  const uniformsBlit = {
    iResolution:  { value: new THREE.Vector3() },
    blitTex: { value: blitTempTarget.texture}
  };

  const clock = new THREE.Clock();

  // initialize scene
  canvas.initialize = () => {
    const ratio           = window.innerWidth / window.innerHeight;

    const scene           = new THREE.Scene();
    const iChannel0Scene  = new THREE.Scene();
    const iChannel1Scene  = new THREE.Scene();
    const blitScene       = new THREE.Scene();

    const camera          = new THREE.OrthographicCamera(
      -1, // left
       1, // right
       1, // top
      -1, // bottom
      -1, // near,
       1, // far
    );
    
    const plane          = new THREE.PlaneGeometry(2, 2);
    const iChannel0Plane = new THREE.PlaneGeometry(2, 2);
    const iChannel1Plane = new THREE.PlaneGeometry(2, 2);
    const blitPlane      = new THREE.PlaneGeometry(2, 2);
    

    const material = new THREE.ShaderMaterial({
      fragmentShader: fragmentShader,
      uniforms: uniforms,
    });

    const blitMaterial = new THREE.ShaderMaterial({
      fragmentShader: textureBlitShader,
      uniforms: uniformsBlit,
    });

    const iChannel0Material = new THREE.ShaderMaterial( {
      fragmentShader: iChannel0FragmentShader,
      uniforms: uniforms,
    });

    const iChannel1Material = new THREE.ShaderMaterial( {
      fragmentShader: iChannel1FragmentShader,
      uniforms: uniforms,
    });

    mesh = new THREE.Mesh(plane, material);
    scene.add(mesh);

    meshiChannel0 = new THREE.Mesh(iChannel0Plane, iChannel0Material);
    iChannel0Scene.add(meshiChannel0)

    meshiChannel1 = new THREE.Mesh(iChannel1Plane, iChannel1Material);
    iChannel1Scene.add(meshiChannel1)

    meshBlit = new THREE.Mesh(blitPlane, blitMaterial);
    blitScene.add(meshBlit);

    state.three = {
      scene: scene,
      camera: camera,
      mesh: mesh,
      clock: clock,
      uniforms: uniforms,
      iChannel0Scene: iChannel0Scene,
      iChannel1Scene: iChannel1Scene,
      blitScene: blitScene

    };

    

    // const listener = new THREE.AudioListener();
    // camera.add( listener );

    // create a global audio source
    // const sound = new THREE.Audio( listener );
    // var oscillator1 = listener.context.createOscillator();
    // oscillator1.type = 'triangle';
    // oscillator1.frequency.value = 261.6;
    // oscillator1.start(0);
    // var oscillator2 = listener.context.createOscillator();
    // oscillator2.type = 'sine';
    // oscillator2.frequency.value = 329.6;
    // oscillator2.start(0);
    // var oscillator3 = listener.context.createOscillator();
    // oscillator3.type = 'sawtooth';
    // oscillator3.frequency.value = 392.0;
    // oscillator3.start(0);

    // oscillator1.connect( sound.context.destination );
    // oscillator2.connect( sound.context.destination );
    // oscillator3.connect( sound.context.destination );

    refresh();
  };

  // render scene
  canvas.render = () => {
    const { scene, camera } = state.three;

    // Render iChannel0 to temp and blit it out
    // renderer.setRenderTarget( blitTempTarget );
    // renderer.render(state.three.iChannel0Scene, camera );
    // renderer.setRenderTarget( iChannel0Target );
    // renderer.render(state.three.blitScene, camera );

    // // Render iChannel1 to temp and blit it out
    // renderer.setRenderTarget( blitTempTarget );
    // renderer.render(state.three.iChannel1Scene, camera );
    // renderer.setRenderTarget( iChannel1Target );
    // renderer.render(state.three.blitScene, camera );
    
    // final render
    renderer.setRenderTarget( null );
    renderer.render(scene, camera);
  };

  // update
  canvas.update = () => {
    // const mesh = state.three.mesh;
    // mesh.rotation.x += 0.02;
    // mesh.rotation.y += 0.01;
    // mesh.scale.x     = state.width;
    // mesh.scale.y     = 1;
    // state.iResolution.value.set(canvas.width, canvas.height, 1);
    // state.iTime.value += 0.001;

    var currentdate = new Date();


    // console.log( "Width: " + canvas.width + " Height " + canvas.height );
    uniformsBlit.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value += clock.getDelta();
    var secs = currentdate.getHours() * 3600.0 + currentdate.getMinutes() * 60.0 + ( currentdate.getMilliseconds() / 1000.0 );
    uniforms.iDate.value.set( currentdate.getYear(), currentdate.getMonth(), currentdate.getDay(), secs );

    uniforms.iInt0.value = state.three.uniforms.layers;
    uniforms.iInt1.value = state.three.uniforms.post;
    uniforms.iInt2.value = state.three.uniforms.seed;
    uniforms.iInt3.value = state.three.uniforms.pointsl;
    uniforms.iInt4.value = state.sdfblend;
    uniforms.iInt5.value = state.three.uniforms.shape;
    uniforms.iInt6.value = state.three.uniforms.seedC;
    uniforms.iInt7.value = state.three.uniforms.speed;
    uniforms.iInt8.value = state.three.uniforms.size;
    uniforms.iInt9.value = state.three.uniforms.level;
    uniforms.iInt10.value = state.three.uniforms.cmode;
    uniforms.iInt11.value = state.fadeout;
    uniforms.overlayTx.value = overlayTexture;
  };

  // render/update loop
  canvas.loop = () => {
    const { scene, camera } = state.three;
    requestAnimationFrame(canvas.loop);
    canvas.update();
    
    // Render iChannel0 to temp and blit it out
    renderer.setRenderTarget( blitTempTarget );
    renderer.render(state.three.iChannel0Scene, camera );
    renderer.setRenderTarget( iChannel0Target );
    renderer.render(state.three.blitScene, camera );


    // Render iChannel1 to temp and blit it out
    renderer.setRenderTarget( blitTempTarget );
    renderer.render(state.three.iChannel1Scene, camera );
    renderer.setRenderTarget( iChannel1Target );
    renderer.render(state.three.blitScene, camera );

    // final render
    renderer.setRenderTarget( null );
    renderer.render(scene, camera);
  };

  canvas.initialize();
  canvas.render();
  canvas.loop();

};

//-----------------------------------------------------------------------------
const refresh = () => {
  // update hash/state from token and rerun
  tokenData.hash    = randomHash(64);
  const {
    layers,
    post,
    seed,
    seedC,
    pointsl,
    shape,
    speed,
    size,
    level,
    cmode
  } = hashToTraits(tokenData.hash);
  tokenState.three.uniforms.layers = layers;
  tokenState.three.uniforms.post = post;
  tokenState.three.uniforms.seed = seed;
  tokenState.three.uniforms.seedC = seedC;
  tokenState.three.uniforms.pointsl = pointsl;
  tokenState.three.uniforms.shape = shape;
  tokenState.three.uniforms.speed = speed;
  tokenState.three.uniforms.size = size;
  tokenState.three.uniforms.level = level;
  tokenState.three.uniforms.cmode = cmode;
}
/**
 * Main entry function.
 */
const run = (tokenData, tokenState) => {
  const renderer = setupCanvasThreeJs();
  doArt(renderer, tokenData.hash, tokenState);
};

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

window.onload = () => {
  run(tokenData, tokenState);
};
