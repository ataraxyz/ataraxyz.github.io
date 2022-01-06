const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
// var lsound = 0;
// var usound = 0;
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
const randomDecimal = xss => () => {
  const t = xss();
  return Number(t % 9007199254740991n) / 9007199254740991;
}
const randomNumber = r => (a, b) => a + (b - a) * r();
 randomInt = rn => (a, b) => Math.floor(rn(a, b + 1));
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
const repeat = (item, n) => Array.from({length:n}).map(_ => item);
const selectRandom = (array, r) => array[Math.floor(r() * array.length)];
const selectRandomDist = (distMap, r) => {
  const keys = Object.keys(distMap)
    .reduce((a, k) => a.concat(repeat(k, distMap[k] * 100)), []);
  return selectRandom(shuffle(keys, r), r);
};
const toHex   = x => x.toString(16).padStart(2, '0');
const fromHex = hex => parseInt(hex, 16);
const randomColorHex = r => {
  const rc    = () => toHex(Math.floor(r() * 256));
  const red   = rc();
  const green = rc();
  const blue  = rc();
  return `#${red}${green}${blue}`;
};
const colorDist = {
  0: .225,
  1: .225,
  2: .1,
  3: .05,
  4: .15,
  5: .025,
  6: .05,
  7: .012,
  8: .2,
  9: .15,
  10: .035,
  11: .035,
  12: 0.05, 
  13: 0.05,
  14: .005,
  15: .0025
};
const shapeDist = {
  0: 0.5,
  1: .09,
  2: .09,
  3: .09,
  4: .09,
  5: .04
};
const hashToTraits = hash => {
  const R = mkRandom(hash);
  var maxPointsPerLayer = 20;
  
  var maxLayer = 12;

  const layers = R.ri( 2, maxLayer );
  const post  = R.ri(0,100);
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  const pointsl = 10;
  const shape = selectRandomDist(shapeDist, R.r);
  const speed = R.ri( 20, 150 );
  const size = R.ri( 100, 200 );
  
  var level = R.ri( 2, 7 );

  const cmode = selectRandomDist(colorDist, R.r);
  const sameProb = R.ri( 0, 100);
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
    cmode,
    sameProb
  };

};

const setupCanvasThreeJs = () => {
  const width  = window.innerWidth / 8;
  const height = window.innerHeight / 8;
  const body = document.querySelector('body > section:nth-child(1) > div > p');

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true  });
  renderer.setPixelRatio(8); // compensating for scale
  renderer.setSize(width, height, false);

  body.appendChild(renderer.domElement);

  return renderer;

};

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
    cmode,
    sameProb
  } = hashToTraits(hash);
  
  const canvas = document.querySelector('canvas');
  renderer.autoClear = false;
  renderer.autoClearColor = false;

  
  var fragmentShader =`
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
uniform int iInt13; // sameProb

float dot2( in vec2 v ) { return dot(v,v); }
float hash11(float p){
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);}

float hash12(vec2 p){
vec3 p3  = fract(vec3(p.xyx) * .1031);
p3 += dot(p3, p3.yzx + 33.33);
return fract((p3.x + p3.y) * p3.z);}

vec2 curve( int i ){
  ivec2 res = ivec2(0,0);
  for( int k=0; k<iInt9; k++ ){
      ivec2 r = ivec2( i>>1, i^(i>>1) ) & 1;
      if (r.y==0) { if(r.x==1) { res = (1<<k)-1-res; } res = res.yx; }
      
      res += r<<k;
      i >>= 2; }
  return vec2(float(res.x), float(res.y));  }

vec2 rotate( vec2 p, float a ) {
if ( a > 0.0 )
  return p * mat2(cos(a), sin(a), -sin(a), cos(a));
else if ( a < 0.0 )
  return -p * mat2(cos(a), -sin(a), sin(a), cos(a));
else
  return p;}

vec2 translate(vec2 p, vec2 t) {return p - t;}

float circleDist(vec2 p, float radius){
float result = length(p) - radius;
return result;}
float triangleDist(vec2 p, float radius){
return max(	abs(p).x * 0.866025 + 
        p.y * 0.5, -p.y) 
      -radius * 0.5;}

float insaneDist(vec2 p, float radius){
return max(	abs(p).x * hash11(p.x) + 
        p.y * 0.5, -p.y) 
      -radius * 0.5;}
float boxDist(vec2 p, vec2 size, float radius){
size -= vec2(radius);
vec2 d = abs(p) - size;
return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;}

float hexagonDist( in vec2 p, in float radius )  {
const vec3 k = vec3(-0.866025404,0.5,0.577350269);
vec2 s = sign(p);
p = abs(p);
float w = dot(k.xy,p);    
p -= 2.0*min(w,0.0)*k.xy;
p -= vec2(clamp(p.x, -k.z*radius, k.z*radius), radius);
return length(p)*sign(p.y);}
float smoothMerge(float d1, float d2, float k){
  float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0-h);}

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);}


vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){return a + b*cos( 6.28318*(c*t+d) );}

vec3 viridis(float t) {
const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 plasma(float t) {
const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 magma(float t) {
const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 inferno(float t) {
const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 turbo(float t) {
const vec3 c0 = vec3(0.1140890109226559, 0.06288340699912215, 0.2248337216805064);
const vec3 c1 = vec3(6.716419496985708, 3.182286745507602, 7.571581586103393);
const vec3 c2 = vec3(-66.09402360453038, -4.9279827041226, -10.09439367561635);
const vec3 c3 = vec3(228.7660791526501, 25.04986699771073, -91.54105330182436);
const vec3 c4 = vec3(-334.8351565777451, -69.31749712757485, 288.5858850615712);
const vec3 c5 = vec3(218.7637218434795, 67.52150567819112, -305.2045772184957);
const vec3 c6 = vec3(-52.88903478218835, -21.54527364654712, 110.5174647748972);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 bbody(float t){return vec3(1,1./4.,1./16.) * exp(4.*t - 1.);}

vec3 colorize( float distance, float colorWidth, float ss ){
if ( iInt10 == 0 ){
  // random mode
  float colR = hash11(ss + floor(distance / colorWidth ) + 555.0 );
  float colG = hash11(ss + floor(distance / colorWidth ) + 666.0 );
  float colB = hash11(ss + floor(distance / colorWidth ) + 777.0 );
  return vec3( colR, colG, colB );
} else if ( iInt10 == 1 ) {
  float h = hash11(ss+666.0) + floor(distance / colorWidth) * 0.381966011;
  return hsv2rgb( vec3(h, 0.75,0.75));
} else if ( iInt10 == 2 ){
  return viridis(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 3 ){
  return viridis(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 4 ) {
  return plasma(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 5 ){
  return plasma(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 6 ){
  return magma(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 7 ){
  return magma(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 8 ){
  return inferno(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 9 ){
  return inferno(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 10 ){
  return turbo(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 11 ){
  return turbo(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 12 ) {
  return bbody(fract( hash11(ss+666.0) + floor(distance / colorWidth)*0.025*colorWidth) );
} else if ( iInt10 == 13 ){
  return bbody(fract( hash11(ss + floor(distance / colorWidth ) + 666.0 ) ) );
} else if ( iInt10 == 14 ){
  vec3 cola = vec3( 0.5, 0.5, 0.5 );
  vec3 colb = vec3( 0.5, 0.5, 0.5 );
  vec3 colc = vec3( 1.0, 1.0, 1.0 );
  vec3 cold = vec3( 0.00, 0.33, 0.67 );
  return pal( hash11(ss + floor(distance / colorWidth ) + 666.0 ), cola, colb, colc, cold );
} else if ( iInt10 == 15 ) {
  vec3 cola = vec3( 0.5, 0.5, 0.5 );
  vec3 colb = vec3( 0.5, 0.5, 0.5 );
  vec3 colc = vec3( 1.0, 1.0, 1.0 );
  vec3 cold = vec3( 0.00, 0.33, 0.67 );
  return pal( hash11(ss+666.0) + floor(distance / colorWidth)*0.0025*colorWidth, cola, colb, colc, cold );
} return vec3(0.);
}

float sceneDist( int type, vec2 PP, vec2 hilbertP, float ss, float globalSize, float globalSpeed ){
float sign = 1.0;
if ( hash11(ss+789456.) < 0.5 )
  sign = -1.0;

if ( type == 1 )
  return circleDist(   translate( PP, hilbertP ), hash11( ss ) * 200. * globalSize );
else if ( type == 2 ){
  float radiusBox = hash11( ss ) * 200. * globalSize;
  return boxDist(      translate( PP, hilbertP ), vec2(radiusBox), radiusBox * 0.1 );
} else if ( type == 3 )
  return triangleDist( rotate( translate(PP, hilbertP),sign * (hash11( ss ) * 360. / 180. * 3.14159 + iTime*0.25) * globalSpeed ), hash11( ss + 1234. ) * 200. * globalSize ); 
else if ( type == 4 )
  return hexagonDist( rotate( translate(PP, hilbertP),sign * (hash11( ss ) * 360. / 180. * 3.14159 + iTime*0.25) * globalSpeed ), hash11( ss + 1234. ) * 200. * globalSize ); 
else if ( type == 5 )
  return insaneDist(   translate( PP, hilbertP ), hash11( ss ) * 200. * globalSize );}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
vec2 uv = fragCoord / iResolution.xy;
vec2 P = fragCoord + vec2( 0.5 );
int numPoints      = 1<<(iInt9<<1);
int deltaP = int(float(numPoints) / 1.61803398874 + 0.5);
float numPointsFloat = float(numPoints);
float gridDistance = float((1<<iInt9)-1); 

float seeed = float(iInt2);
float seeedC = float(iInt6);

float gSpeed = float(iInt7) / 100.0;
float gSize  = float(iInt8) / 100.0;

float backgroundD;
vec4 accumulatedCol = vec4(0.); // black background
float numLayers = float(iInt0);
for ( int l = 1; l<=iInt0; l++ ){
  float ll = float(l);
  int numPointsInLayer = iInt3;
  float gs = gSize * ( 0.5 + ( 1.-ll/numLayers) * 0.5);

  if ( iInt1 < 50 && l == 1 ){
    gs *= 10.;
    numPointsInLayer = max(4,numPointsInLayer / 2);}
  int curveIndex = int(hash11( seeed + ll + 33.0 ) * numPointsFloat);
  vec2 PHC = curve(curveIndex)/gridDistance * iResolution.xy;
  int layerType = iInt5;
  if ( iInt5==0 )
      layerType = 1+(int(hash11( seeed + ll + 34468.0 )*4.)%5);
  float d = sceneDist( layerType, P, PHC, seeed + ll + 4.0, gs, gSpeed );
  for ( int i = 1; i<numPointsInLayer; i++ ) {
    float ii = float(i);
    if ( layerType < 2 || hash11( seeed + ii*ll + 4589.0 ) < float(iInt13)/100.) {
      curveIndex = ( curveIndex + deltaP ) % numPoints; 
    }
    PHC = curve(curveIndex)/gridDistance * iResolution.xy;
    d = smoothMerge( d, sceneDist( layerType, P, PHC, seeed + ii+ll + 4.0, gs, gSpeed ), float(iInt4) );}
  if ( l == 1 )
    backgroundD = d;
  else
    backgroundD = smoothMerge( backgroundD, d, float(iInt4) );
  float layerSpeed = iTime * (5.+hash11( seeedC + ll + 5.0 )*100.0 ) * gSpeed;
  float alpha = smoothstep( 0.005, 0., d );
  vec3 layerCol = colorize( -d-layerSpeed, 3.+hash11( seeedC + ll + 6.0 )*60.*gSize, seeedC + ll + 7.0 );
  layerCol *= alpha; 
  accumulatedCol.rgb = layerCol + accumulatedCol.rgb * ( 1.0 - alpha );
  accumulatedCol.a = max(accumulatedCol.a, alpha);
}
vec3 bgColor  = colorize( backgroundD-iTime*50.*gSpeed, (10.+hash11( seeedC + 99.0 )*60.)*gSize, seeedC + 8.0 );
vec2 vinCoord = ( 2.0 * fragCoord - iResolution.xy ) / min(iResolution.x, iResolution.y);
fragColor.rgb = (accumulatedCol.rgb + bgColor * (1.-accumulatedCol.a));
fragColor.a = 1.0;}

void main(){
mainImage(gl_FragColor, gl_FragCoord.xy);}
  `
  const uniforms = {
    iTime: { value: 0 },
    iDate: { value: new THREE.Vector4() },
    iResolution:  { value: new THREE.Vector3() },
    iInt0: { value : layers }, 
    iInt1: { value : post }, 
    iInt2: { value : seed }, 
    iInt3: { value : pointsl }, 
    iInt4: { value : state.sdfblend },
    iInt5: { value : shape },
    iInt6: { value : seedC },
    iInt7: { value : speed+state.speed },
    iInt8: { value : size*(state.size/100) },
    iInt9: { value : level },
    iInt10: { value : cmode },
    iInt13: { value : sameProb },
  };
  const clock = new THREE.Clock();
  canvas.initialize = () => {
    const scene           = new THREE.Scene();
    const camera          = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1, );

    /*
    const listener = new THREE.AudioListener();
    camera.add( listener );
    const sound = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'sounds/cyber.mp3', function( buffer ) {
      sound.setBuffer( buffer );
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();
    });
    const analyser = new THREE.AudioAnalyser( sound, 32 );*/

    const plane = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial( {
      fragmentShader: fragmentShader,
      uniforms: uniforms,
    });
    mesh = new THREE.Mesh(plane, material);
    scene.add(mesh)
    state.three = {
      scene: scene,
      camera: camera,
      mesh: mesh,
      clock: clock,
      uniforms: uniforms,
      //analyser: analyser,
    };
    window.addEventListener('resize', canvas.resize, false);
    refresh();
  };

  canvas.resize = () => {
    const width  = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    renderer.setSize(width/8, height/8, false);
  };

  canvas.render = () => {
    const { scene, camera } = state.three;

    renderer.setRenderTarget( null );
    renderer.render(scene, camera);
  };

  
  canvas.update = () => {
    var currentdate = new Date();
    const width  = canvas.width;
    const height  = canvas.height;

    uniforms.iResolution.value.set(width, height, 1);
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
    uniforms.iInt7.value = state.three.uniforms.speed+state.speed;//+usound;
    uniforms.iInt8.value = state.three.uniforms.size*(state.size/100);//+lsound;
    uniforms.iInt9.value = state.three.uniforms.level;
    uniforms.iInt10.value = state.three.uniforms.cmode;
    uniforms.iInt13.value = state.three.uniforms.sameProb;

    /*
    const data = state.three.analyser.getAverageFrequency();
    const dataArray = state.three.analyser.getFrequencyData();
    var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
    var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);
    var lowerMax = -1;
    var lowerAvg = 0;
    for( var i = 0; i<lowerHalfArray.length; i++ )
    {
      if ( lowerHalfArray[i] > lowerMax )
        lowerMax = lowerHalfArray[i];

      lowerAvg += lowerHalfArray[i];
    }
    var upperMax = -1;
    var upperAvg = 0;
    for( var i = 0; i<upperHalfArray.length; i++ )
    {
      if ( upperHalfArray[i] > upperMax )
        upperMax = upperHalfArray[i];
        
        upperAvg += upperHalfArray[i];
    }
    if( ( lowerMax / 255.0 * 100 ) > 98.0 )
      lsound += 0.1;
    else
       lsound -= 10;
    lsound = Math.max(0,lsound );

    if( ( upperMax / 255.0 * 100 ) > 70.0 )
      usound += 1;
    else
      usound -= 10;
      usound = Math.max(0,usound );
    */
    
  };

  canvas.loop = () => {
    const { scene, camera } = state.three;
    requestAnimationFrame(canvas.loop);
    canvas.update();
    renderer.setRenderTarget( null );
    renderer.render(scene, camera );
  };

  canvas.initialize();
  canvas.render();
  canvas.loop();

};

const ik_hashArray = [  'a21840e3390535312bff0a539e8cd03ac47293f346b31c5ac42592d91c42c21c',
'2542bc67ea743ee655d41abcbd5ffa0c42a95eac4652d15cf7961deded60b82d',
'02548bb05542b97bee85d4274427088c6f5ee9b15210ee28ef1d5970567e8bb4',
'f0158f94fb6d0a07f8c831a385b4f6235ec8d6aa66a32e33a2c60d860b3db8bf',
'1cce0890d7d3f90f300b19a9d7eecc51e6d9de6e2a129b40c333be64afb1e2dc',
'41f65545d7874dc1d7dba6b88d5eaf9fbdeafae82dd82cd9ded7e09d1fd16c41',
'ef282a920956b48cb5ddaf377673d134fdc7a992966a76a55560896bfdca15d7',
'4ce744bea286838877f87378822ac007e9f6d2bbe907a0aede93365bc94e5a49',
'a9db678b30e9f0946e50b2d7f84b74153aa90549acd98369ce28b43088cc722e',
'3c466ecb1868db31286444538bef0d39ac034d0328c0003df1b5c08a302d162f',
'723e9c5444a494d04bb4a6621f7f99930ba7904936ce3ea9a575271335b5bb28',
'0e8d900a14805ba90557998add8ddc0131314517339180e67d2cc815091b3d70',
'fbf1fbe1e75e6e11d3a236be069b9a809aaf58eb88167f64047917d4afad06b2',
'8d9d82aaa44a573900a8a1c7b167de2d9b835ce4aa21f8e3f00890405d8b0a6d',
'166beb7668d19722e3f8cbc0795143c9d4c1a931e85a0d9d8aa87b3ef8d31036',
'febf2c9d22476cffa31b786ecd0e0223b89801ee80e92b544051cb4ab893d06a',
'7cc16b7410de94778a41e3b334932507bcb97bdba857fcc7e900fa957347832b',
'9cc99337cca2f1de41b4e348b345f302403ac82939c7e7a5e4178771531ab815',
'55fc4363621af9377352270b6a8dd4a92ab16e6ba44d499816f015e96e8c3fd8',
'e084806ba2533e8a07ce3ff3026963900b4824b230d3d247a4811aae84640d52',
'0a7491e175fe59a16181a659e80438015b29160fe6c0efad0b247bf025478007',
'788a656f0986725081f7628abd8ddbe551e5baec95b03f3c67e8a57b1eed737b',
'e8c1e7731e5ea49bed195c3dbb18f6255a5a1db722e85594b66cb3b24fc7bf82',
'94afd93252d1c72030aa6c27ef527eba21dfedf5eedefdb65f2626636f651e21',
'379c90b94cc3021e52366f55e9fb28bd01d49bcca7012961ceaab5cd27b7582d',
'168582d44cc35e4736c528f06697d2c4535edcc75a549a4514ee0833833a1eff',
'87fff4e9b90db58ab4ec54843808c188732a797dd897828098dd2c6a26be508a',
'35d3ed77fb998897dd7e9092763b81c59c862546377b9c9c3aaf6f0c98aee45f',
'c33b424bf012ef577485bb37b8275af9120f43407b517ac9f64cf90f7e1ef0d9',
'4d4b18d829000178c034815c6f9b52897c80aa1c1999f8db7df5870685a3cabe',
'5012467b845edec3578fb57d1975c26a7b5f46d9bf4acf377ad0e86d4ca0726a',
'a327652cfee9da9b2b63ad930e70a62c7557b2e19ad824c675661bd076127b2e',
'767ea327947fa593b3f09540f435bfe068c8665331991be143d521856bded249',
'47de6ff92fa1f5fc2f33c209063e8ab9a23f30a6885cab8a1f98463706d0ab10',
'76aae4a5f175d91fae682f2d8892067bec531034d03f2518eb3a499bbb5aab82',
'a7cc9c6f6e2a89d7f3b4f6a2f54ded5aea4bafd77ed7d49f44bb24133ac30173',
'b59f36c6afb04d097ff687b0a76cc73d19219c98a384e795dd9659d0abe96556',
'27450e651e01bfac08ddf426a32b5de8e604f41409a16235cc5cee800deafc6c',
'1e3871133a12efe732a404bbc587ffe4b002e2e144f812ba5cf5141d19209be0',
'34388bba1f60e383244cc1b504d07a93c8fc34a736e40151be167fcda9c12e00',
'222cd79e7702f84c05d65a384381acd286210de5548d0c57d2be3a8a34bc87bd',
'19489c0731cb96c590c2d2bf180e90492fd85452a753638c16030629ece79a40',
'ac0dd5ef8ec108b0f0e20c5429801f2395ecdca7e0709916e036c118d341d924',
'fa6e573608efb818dbfde1753545c049b663a7d31d640e4d01c879353c4d8e44',
'd71747ed5225681cee903dbbe276dacd839f934aece93f68a3a9fe9c62e0de01',
'74a21812c4eb360bdbb4aa1e46f6ff1e861ff81995c557546c4c41da30284310',
'1d92c02b3e1854511985a939d0d6922dc072d152a09a616635b716963862fc05',
'87ca3c28ad0b58cb911e325728cf06daefbfa71b22873f21c88089dd1cf4b511',
'99dfef58406654fa4a4543bd837f84c37719f393b6bb34a18b6967331af2a986',
'e20d56b604d98319335a3b23a00f1f55efd04f5eda136aa81e77effb02d2aeb7',
'73ad2589eb757bd336e7548ce3220d4619967e32630757a96ba09e802b09dfae',
'd2c7f0a050a629c424c39318dadd3c5dff59514a0388bf3a9bace70d4ceb5b1f',
'470a62818dd71565fa3cf6bdae002ba1ef40892c0cbf523565619109ca90ac79',
'5860225e4d75df2894ebf1df9cc56a3173c420469c754245d61807c40dc2fc1e',
'04caad19fee38df3ae1ba57d982175e518f05db3587972a1edca2f2f81e5764e',
'cc46a91f18cf3e82b335d6b115990d56f5c18dbe87bb1b253e3a4dab4711e653',
'a0e5e968235b206213d47288c213e80298f1daa22953042d74dee852ada6ffb4',
'5a7cf84838d76b38a2e5b609c1e8e4da506c7ff67deaeb3589042f3057fd4fd9',
'16fbad74ca9aa6c397574f6f0ebcaaf61e33fa63b479f65d87b9391309a4955b',
'ed438595536354f5fa38bb1f06d26f9ce3a1d9938e0d746ee5c7aad1e749ed10',
'b7491888061797c1cc7e7adc1f8fe94d0faa0ba31a14d9fda7c1b96e769e8a74',
'93bfb46ccdca36871c76fe7d79104bf96af2dcf7b3e47a1581425f1b3f263473',
'04ddc2001f3c5a34080f286c26546754cc99b7931573e71a0843cec3cfe08e2e',
'bd431fbd7ec41ade9b85763b8f41539d9607dfcfb0aef23d89aa4c6efcd4851f',
'48d90569bea0073066057bc589e61cf767262e22b31f3858a21d221db9871ee4',
'6b772fa546d744b14efdf0f0d3eec629a5e4f420e84783f6f7211a2e40c594b1',
'5551183f558569702b62b362e7a2a0020ed59dd3ec6df4a2442913813e6a3abf',
'77328651e486c01618176f71972c7ef6511c6b58601e5442cdd1d1af8153f252',
'8e8d40fc5a89d1dfb9f5dc4c9e88fdaf0f4f15cad579fcddb9ffb87cb50520c8',
'3d7a7b440c74e4c4763c34d1947e2bf52d2f5eea176a0c74a8b17c902458fc9e',
'2a7cc6b900d8af920ecda3c41753b56ea50330463a43c3e0abab1433ca7a7c64',
'f38ba05be2b70612f9fddae37137fc4d040b3a7d6adb2764af016661605af24f',
'd7cbb10e07f7d026b1510b72706729e78c00b4501c43ae449b9f10063ab3871b',
'21412531c5da3a838cfb73b9e27a26c1076ea18bf39150b033607ae910c95d86',
'a6d4379fae34fbf008384e6976799754697c33fe8b0b2a3b34ad2e1bfff40a01',
'9be546c7dc95386621c87ad8f73d56c7ccc2a700771389e7f728e3fe06fde66c',
'30dc524ba83c06d97e6dd1e246744cd9a09f69eb03ca0a130c0092fbbdf4ebb0',
'e830d278217cbdad3e285f1af59df9e6fec6685f8dbcab2cc2f8ccf18da6489b',
'd4ff17e44b684bda12a6c7134eab75f569264c5e743596f577cd0a6f965ccee8',
'33d7e5140e4284e363ddfdf0f28b9c0b86c1c3511670fc8deb8aed73a39ed812',
'f3ec161c0c93d52a5001a0cf6d507483c374048ba01267ea01355055c41bbe08',
'60bfdccd1808a5af635e881470e3b4aeddd1f7e6acc7d35a4f965681c819c17e',
'91a102d61dd2b9e99dcf710fb4e0c617570efe7d9a9709f1f16088c16b7e963a',
'1760dbe4454807286b4e10ef8b82b03cb8832b32824d1c25c48c2364215398c5',
'7e7fad1c047044f7dc7bfac1d30840cec7c50fab13b940334447b5f245ec9de6',
'72ce0e817c3efdb7de501e371747dd9ec227006a3fccccdcb2603d98bf1d579b',
'3482b0f494b208190a23132502b53ed26e1673c847f25f9117f49e94ba7b6d18',
'0c61ea13fc3587e97ba998d61b067eaed3e2ef7e6ed7b2cd50692eedd061f270',
'f764b0deb5191a6032cb611b03dc97e6f7c177909f0f74f339cad1e3f16d6524',
'5bddd907f89cad890a311e76ff0ee163605f966f2861dc403aea92e9f6b59c29',
'd4ef208abe7db8cbcd172b353f1095ad299bcc0f22a0558b0ea2c9bde663542a',
'3c211b4f5ed3891e364955f8d91a45f505f3d4ecece6c35facab2c92f674ba37',
'448f9e310f59840e510c64ec8cf91cb1d3960380c8fb8c5814f1c3e7ce66983a',
'3f0191a3a2031844b7905dd065532856b71c030371976d9f14fc1a91601252e4',
'87bb805b08326efc22b9814aba1935ab19f34ed1845d6d88a5f68b97fcaa3e13',
'c2e6862c220af0ab5ce009c53a603997cb14d817ea2032db7062b6ed7079f55a',
'd307e2c2d7c1a4357bc90009ab51529a5d10c95465ecd5621ed93b17bd68e704',
'044a72ae1a37e29ff0fc85e1c05c7d44543b61dbd36ee404c8b48f7ad2796712',
'e743d4735e0e67bf0d11627853fcff37fc1052269687fa402246c66d4a36e430',
'825d66b70399fb356fd3e13479ce54f5e9cbeb3512c687d7b218ffd43bf78438',
'65a524b5627fa66e05b4705ecc2d221c0044290291db4c7df7ac8f2074cd1ec1',
'617a86b0f417fde9e2a575ff5b8c6688008e130109acbc8d02860c2076eb5cfa',
'6f292927feba489de9af1b5eacc70e8e08f6438657925b0c674869a3712cf2ac',
'e66de4efffeb03e538d66cc23f2cc74f4fa0e574db0b898c2bbdc0760fc6800b',
'0f4b2b114f5a026881e2db182e0373b20dba922fea03fbd134b42387f021e142',
'4af445ec32866f6b113b7154889a72ef42636c85b74fbaacf40c226df86b9d66',
'adce9bbe3db1f647eec004a621b1fd9ea1fe3756d6da3eb263edb513c8f2c75f',
'3fb9167c5f9a75be636cbdf21dc51eb8589b568691b3c474b164a2c4deefeace',
'b163500e0a0ae7941acfe0e0d990ba11eb517dbd56cf395dd399f65d05dcdd2f',
'1911de993987e53507c300fc68f21918d65452ac7c4883662e9a1288d22f1b29',
'7192f81e5c498e58378fcd3da47d9af8fcd9a079a26b1e75a0970f8dd71971ae',
'ef2986763b853b7d2296222a2dfcb0515506f7502220a7fe69ad34670d39a3a3',
'0085598c02911028161831db12c5ec93c7db7033c663acf0b6e4617b07140c2d',
'b3dab4498c98f0babd300b4c31d380cb233ec96514fada063d77de7385162672',
'378e06e255b95c095a2e9c21ce6933c99300b7c146cca8f5cf8d21d46dd09acf',
'd78e88eb79174475467a9361b5660776972ba5537161a76553f59c04cbf2db4c',
'8a07f5b6d1a046a5721a7a8a7ffb056a0210462f1131ae706673a617b7c19d87',
'b2dd04e0f52f227438e6a4ebbba5d0d4f886042905a66f4c6dcb02aa182765ca',
'd480b53067745c9092799647aa16b3e9c450309caff5567d76a90cf918fb7854',
'aedfdea841186ec97f9ade7e6867ddd88a7513f8cad04fb1b36544602e3b4bc4',
'7a97ac6074573f5d7387582e5268ea7bf70aa128782454be85bbb1a5a310eb6f',
'f7e0ad02c9b833fc8656b8ba621a0645daad2ff4ebcaa6b56d58a529f7c51e55',
'd0ba8ffdb9edd7452bab5df6bd4a0c1db02ca0708f69b66ba814df865f34dc1b',
'a78f8e0ca382c68a4af7e760f05106b588818a8986b1ba407be4f177180463f5',
'b4804e8148f62f0c0ac542abaa336711b400959e118e89caea557c60c0330f66',
'f8afcb8b6e8487679b99b7e7c0b6993231539608aabee52fe2f60cd8902311d8',
'ace7c43082fe1eeff90c375ddc893166ab5df6ea179805c567cdc3998c2d2949',
'02a6d0babd883e11c17b32528e57237bab9136c37a83f31af201f8dc16678e48',
'306917234ee6b3db397503902ac86aeb51fce73d5bc7f05001951a6942429930',
'68c6e6119330cd29bce478842c88b2a72a08778207498a24b4c15e580c635848',
'8e20b9e15b0e37dc50bf312c52fc4269e640ff44a6f4794c891750495de4f041',
'3aaaa81e1eaef91ac6d048b6f42aa38f91b5997906575a2855f7263ff8fbb3ab',
'5e9e1520d31d5db8af5f0102ba7bc943c0be68ab1516e802c88040c8c9ad261b',
'95f346d0866bf404126ddcb775babce65b1c358710f56e4ea129b0b56e9647d0',
'a4cdb6efeceac0aa5e0ff5178c9d4642702751a73f10b62305aa384a6e06b0f7',
'3e28b6a44ae268582b570505b6f620a3a88136a6e49b75d20225e00c2a929f5d',
'd2dab775399c3cb505ef8580c8b61535cffd735cea7d24916a4229f5df86df58',
'18d14374fe00129fc6048005b14536343d91c58cfe5b99fba29772dc68e6b898',
'a0b8289bda331403b320309594980e84be2dcbe0768810de76c64921115b6a68',
'dd50dcd0d59da07fb1f4cde69255dc6932d47a714191abe4bfeb2f7ab1a64d28',
'01b082150ab7a7f179cb78c8bca3a3bf074114dffab07e79986d4b70a84a52e1',
'5d147ca0c0e091a17aad64399bd9c7cfd56079cd89c3719ab76986c71fc0d45c',
'10dfe78adfe86f6aea5165a1a8147aa3af85bcfe5064d73535302ce3c680d431',
'10f82678cd7764466a02ef13c2aa17a3d42ad04b761b1fa15949e8cf35c331f2',
'0c1d21525f7caa818c8fbfe105492667ba52a5935d8cf0e73deb80f02eb39a51',
'5c0bcc6f30ee8211ef8de057661fc37586e59fae47b0d027120ea94b3c92bf3d',
'47fab2b6c9586fbb0b225d33815b480521bd1b90a249bec7de8bea11e550056a',
'2ea83ab68867e98c2984988ce079f9bb9f5e4493053f14758985071f3e5b4161',
'c3190c2011a283ba4f352eaddce8630b293f8f0fd308d28b712418d528d06e08',
'a946c66d76138c28c5155dfc72374ac3aba4aff452793233225af08fb8226b9c',
'5ca4d9258360bd0c3d7b07205dabb258bf1accdd5b268604d79f6198a048717a',
'f8b9345de2421781fdf3f39096a5d5a2d8b995bacf60f85d13806f391977f88c',
'221b5edae1680c020379d2b10965702a018e6daf47e661681ff7c8ceccb1060c',
'2e3c62db9f473fde27a05403204145d4aaa7e96f3d5b135aa17ce32cfd296b3f',
'7b6bc159f1618f499fb05d2ef65105c4b9e76e2b7d358daa0c50612f1ca3b89e',
'876b950ad34dd1e5849e8a2b68e8af9a9d35db2dc342e6eff5673283a52e16de',
'e1a4e9b16a6f9c477f906fd2031d8d5db5150de1e5fe9fa2ea0a0f41ca7441e6',
'9a1daa02300a74e92e4aa00ebabb4d4da0ff7f9caaba033c9cb0c878b590d6ff',
'de2de50fd1785507c290f77ed0a11a68e0b0bd09b2df1a87004e7bb06c9c94d5',
'19935fd090da60ce90d64c42068e96d9dcdef6c963f4445d75b0d7f9c970ab5f',
'1e9244e7e872b1b0e5ca6d58065e6dee1cd3b4558fc40af5e4ad2ddd5c7982b7',
'cf3581efa2a1a27dd972d343f4a4b632c5fe83b692ef5bfb2e0244e728dd2114',
'b0b5c25be7cb3b3136289a9a1c482e8f6fef4070a155afe104c2fb6839f30514',
'86a62307246e76f7a2390e7e47e9728b19d1e00038fbe42d2e237254a605e3b2',
'd423820249f9ce9e84e683aacd1e83388f6e12eecd85f7ddbf018eef43137c20',
'c2df01ae4d2225037599099acd27bcfa60686ec7eff27e1d5cb075e84dd6a721',
'dd431c261a4a6bcdc0176fd242dfe9b35b4ba9a6aaf20499891afde24aa8dd10',
'99edb10f201f2287e26c18fbd7884c72a581585d0f04153e2359531c84a287f9',
'ff1f1dcfdd1ceccd86e0f2e4139ae63f7ed5dc25146d25d85dc64e0bab6f52a1',
'b8860b7449b2296b409d0856f5d20271b87328637216af337b8b7c189f43f2e1',
'c121ade9c65d997ed27b44e6d9cc75514c4e7cb346bbc577eef1b28f37ac3a26',
'bbaddfa541f06a525785814be7c2d66cddc28043b7c4c588d963b56d9da26aaf',
'7f382c2fe0cb42b4ddc80f7d81de78547bc8f27781e6a06647f7491b73dcafe4',
'c479363639f3d91e64882a79e8b5750455b8884b30dd80e5a9a04afc357abef5',
'dabe647939b705c95fe261e98453ad53a7c056b1d02b2779a3e9df94a75b2106',
'2c94392fa173913412811a06120e113a906422c792d6fabd02bdebc2ef08425b',
'6684aa90f5f752b06b9cfe7834235993f80b8d5bcb167b5aa7f8bfd70a21dcc8',
'b3d469923ee055de8a5b3db622767b2ab6b23255ed5f5cd517cce72bc21eaf86',
'1e0a92954ec746cde9cdb6771e639be0e6e07b000a9aa4daed3c47181bfe9613',
'7a7230c4268eccea3b049a36808196799c789704b43fc1826c8023520f24e4b2',
'4852c624657d87e44b4562925ae0cfe9f3ade0c2970c1e2f01711bd686104569',
'ea52c211b96d1eb7c06d2db7bfec70f17a9c4e9d7e1771fdf08bc5998fb4afc7',
'da949f50e5c1478f27142c7db311069d11ca6fdfada87f47f77c75e9fb84bf97',
'9ab0a8d0536a7496ce8ab544ad1a117ce9bb1748bc529c626692d9dc70c5aca7',
'9c728ad31e94e76ee07f1a01ed61fe3af3bfed3e46eefa560dafb57b26ed1e15',
'9a02072a0ecadbd28df85b1d3ce03275e918ca1c33852c18bdc2bddf3dc645e5',
'aac7384f371ebe5a66b1814b029267d46580a452c709b96132ab2bd277ad1c41',
'd4888536b51862e86621a74cdbcd76ffc3451b387168d89f4a9c27d10985c23c',
'15c0f1cfdcdbf2511763b430acab8de96aff37927d5b1a0124876314f16df062',
'521bea550036db501f8741c50b715d425c5e8e8b348087ada08fdfeb32494200',
'14bdc0214c091e9364f86dacab34f0a6d571f502df7e3ebc9df21bb92d6b57ca',
'ba4fa3a8fd61d25a875cbb9fc68d02d3aa45d3e28f55e93645c893e57abb6ccd',
'7795109f01082a8421bbbafe9c88fc3ec4c47b5d6e7d2d845c1db7422c1845c6',
'0343571779ffb9d4d422e3c26e7aec161fd1de1c5a24488124e4cf7bc1f09891',
'0c3b13911799ec8e802e03ebfb47ff5344951ca546c564d9122069baa81e4524',
'7d90d329223d9c5d64444a9d6eec87a8265b94b16021b29aeab380ab80d94fa8',
'a6cc399f080f25d0a36d3d657862ee99ef5f451ce4d9e076a86cf811d6ee2b98',
'8ac2b1d390ab8629a24d37c1aa169c52d48a1681538a70b20d70dbb2c840819e',
'0d2ef126bf33509990b2d63bbe29aac2c5cf46f726b3b7582c8c87d3b01c2882',
'458d61ec4dc9ca34fe76376320f4931e8902993fe29d06c336ec8595844655a2',
'adab9d48b3419c64600ccd6a11bba475c077f404f4f9b940f8f8380f5190a471',
'a1781e7d1973a1ac4b8ef972268d5d543adc3e5b8c1faa3e2c5571b4b45f73d4',
'b72a9aa5cdd9695632ccd7d8ed649ed153d9eb014ae1f0a8e7ea70ac1121479e',
'749e3f6a1cbb6c18430bae53cd3d961d7c68610b65507e37b672a17121485902',
'c747dcc76c8e2bf7967bdceb6536c7bc5408f1b68a3a23b9957402404e84a82a',
'25c01439c2a8d79b4dff2d4f4f376d0ca4f511a7cd22d933931ca8094702de1d',
'd63c15e2a3dff780f4744527c9beba8ce99fbe1c910eaa0ec3daef904a73a2f3',
'4d5b4b405c159f2c8b2b48a9876612ddcbb8945d01daa75dd031c09f14bb95aa',
'aa754dd6e3f1d9285631d14c0c4456ffc2bf32b38f9790f26ec35048d9e7d11f',
'70fe04db79f5b9e79059a051c63b2dc9e119eb87ff84eef7bcecc5072fb7135e',
'cb012b4f46c54ed41f7e50addf0a061f4a5a05221c61d2307e3a1c54eb0269b1',
'574f8de008e5a920525e1fe80689f1f59ee46fb6b354f4f90de3e60fbf124cb5',
'5e1c0de39704f27134c0f253c04dbf4dd5d8072b74f6e33c37fdd2007c9d4e88',
'c73dcba818be892530737a1cb03f05b2575875c0833882f8f6beb777f7130019',
'7a90ef17491e050f5338bce1ebcbac49b78260e3cbeb15318b7cf930cfaa8dbf',
'1753baee53f1f8844f02596ec7d9d1fc5c6a58aab2a97c9cef8b39991e15d1b5',
'9214c85d6b68cf304fafeca762aa6541c511e4bcfaa359ccdd4b6d75c396dabd',
'75dbc64dbd8c63058dabac6c04faef8011542e16d7d6db72bd98fbb370b4d3f6',
'40b1c204c37073fb4689d8ab44c7a58daace05b04939d2911e94ee4c7e61c270',
'4c023008730756d35fe76ef70230b374b1f270ad12b821891a2f6a67a4fa2ea6',
'0ccb609750bb2d7a36ee022c43f1b62c5acdf08465ea7372fa7e3825e51141df',
'c3d6eade53ea33d29681b1d396d9833178d8390b55f6b8ab61c9fc0fbbecf0a3',
'786834e7e6ebb9968ba0c0a1b5717ae4dac18291a863048c0b8a70e0f879b413',
'7c8d6fd4a477df124e7b6ecd92935c84613c5ab7a1d130977ce2fd438210a8a0',
'bb09ac7811050f0a741d4fa9f00200b0e0a1bb7d947d266e5dfe983f62f3c77d',
'48cc879ec33c9af0ac1cd5f2130762da3942ce2b81caf7bb2de0fb7253977f94',
'2c601b7061ed6b4ed4c86b4e0c7b2017798a97530752b134629db4405a9fceef',
'51f173fc8ff039a984c1ed05bbd6a9ab97ef1897dc8aca1530f0bc6f5b7840ec',
'bc637050686690792c55d38cd7212907bfe96fa9968a0d8a66275e5af3b2c225',
'09668c9d92b25e8615086897483e82b61d4cb06b9a120137d83128bf7e9ba76f',
'a1402f38da8398d9ccdf761ed9b4fa4bc6b667f14f1faf98b4a4fcfcd7d22980',
'5a91e285648f0b505db6bf512cb2e60d54760460bb76a15127258bd99d0ecc3a',
'7d9a79103d33928d88c6988e9b2194af08eb8450bc78aa83196dc92e6b8077d8',
'599f14204c204b3c15c359df3b4f7af50ece20e80761fa0c5bbe5e3bee250570',
'35fe73cabe47fbe5b8acb0bcbef976f80c81b63f3d994eb49a03c8d6142536e5',
'fa0e143e9e436f79b10de0ffef2a6ec3442c9be79009371caba4ccd05ad4b26e',
'1d0974b96567947e599c94719c9c2c23daedf1f781ac7f2362a5253e2fd7f314',
'125e81cb0e720b05398cff7b9352d235c3e61dba195c004f9259908081e55bf0',
'b0b93e1a3796fa7883f65865e70dea128f620889c72cff77731be93f9a450921',
'4398fa81143adbacbb11f68296ca3a5e654395e9dd33a56e6e3e66bc63c68a4b',
'3267c510638def09f54dbc9720c37eec2e9fef4c7ec89ff8c8e3ea77d9c37f50',
'9e45ab7fb5c2d41034851814c80b2c5723912c6630e2f171ee4c063b34b9fe39',
'12a046abd4257a4ae41228a92e72ac6b2dfc4dbaab12e17a751fc5622edce8ad',
'8a64b7dba9908cf7a25b292cb772125fa67f037d72b620eb4f4ccf25f803146f',
'1518a7b2ed0ccf83676b074446e0b981eda90fc011e2814a8153b752250fa9db',
'98e67a88678e851091c460b57d4c005ad44f6f1f972b09c36562dcfafb7cd025',
'e7b2a7165e9efee99e1b0c0e00cca09722a6a6d29d604322fc76d82b47cf7e2c',
'1fa7a085c7871393e9862ce0d8abb336be75312b2f3dd9e88009da7f18fe86c6',
'953382cf4edd9e4130fb320a733a44239b4c8ca33e715bb094f251e880556101',
'87dbc53e16a183666e36e96022888597eb348904fdf7c463af7a3825cedf0a60',
'41fa10c77689304d8b809a8b8c062863a403060bbf72a6fa1e259a0ce632c103',
'496d5e76371e056b15f255c92351035433e04c35fad7de9a216c95f54d88bb33',
'941fecca5cfb991bdd71c3cfbf034f4da94d0d263d92ff7a705e314d9bb5cbf0',
'c6654ed626a15df5ad8907103c40ddb52ddc0551b30b724a1435b4414247de15',
'4f107f334c171e90f745fe3e6564247673fcd4128a4f26d80daf862a25b3420f',
'2e22b56f5617baae9c6c924535e444079eb59e06668d9357d4dead2f55ee0ae0',
'0b4e13bb49309c19a5075783393a304ab6914419c3eb308c083bfffd3507a691',
'ec6ad2d843b4fc58837600acc293b7226ffa131a56d720e0dd631a1b79091178',
'85df202846b28082123e32d52697e4b6f85b82003e3c1d6add6b33b09a20ec39',
'5c45ed2bf5702e948123439ff6693f2e6ceb71266f47bd92c703e902cb3b1a1d',
'15dd1e98a8aac7adaafe4a5e3575c539c99ff4cf51f74cd8358689e89f7f7c93',
'46bb63609dffb2bbd3a93c9b88038764792efbf15c9a06d2e23b799e54219f2f',
'f0aeab70daa2776e58511cc39dda8c0689c0fea245de9161f9f12d32b3788ea2',
'82024e4f951ace1f1debfc4a926489d15b4a3da818f99c50d9625d8dcc4a5f24',
'ea8d8da46244449a14661ef403d8320a1933441b2ba8543ae4aff0bda864822c',
'6c9f427efc281e356af2b5817d91569a090150c8248bfe5ce2df32f04ecff72d',
'c3d8322d3db18f4006a58cfdcaf5f22c06c64fc62b9a10dd0139c2ecf0ea9910',
'a08318a5bba886eb47446e408604cf5d30e32e53d80723764cbba2a0a668fb90',
'916a77a7473b0b9ec1a92ebad2d81e0292f1803227c07c0151983c20a1d876c6',
'e0f8654443feca0c455137fc26d71496a5bc014df9aac6debd849c7c795c7acd',
'17735fa0cf3a3325a36702fa2fff655e89eb41c7c69b751aacdd6edab167c1c5',
'6223ded21a289ccfb4bdd62461cbdb215545bb4d6a7f48f1440c856657ead202',
'e2ab96216734162f1d5aa9a13925666dbad4b268866748c3a06b0eadbbee9620',
'fafc55caaace38f17328b3d96f74170fca25b976a1010174ee3a553af6e0ceff',
'f248fabf5f5e0eb18ed2b4a14c61387dd326a954165fc08b3bead96348eacb1e',
'76890f80103852c7f40d7e3db1e3c67b0af5f28b674e2cadf82d84cf78a69ab5',
'8585edac8d0434022248dcfd6ad520689b668a4103e0a42d9aae2e776377d53f',
'0cf60c9a476c92193e32b6f59a7065532db3ad82b586753b490986e93fc836e7',
'b7cf6d1d5b3de2dcbcb5f20855733689ee9c4717eba4169934f9d7878224eb57',
'1367f7cdcf5fb7be0469aec196040be7ba2fc261245b58a9585fa6e845df66df',
'53237bb818d009f21184369d208107ffe565a0cd2f6e1a533656a536d57d6617',
'003438babe53f8b3161ca26f7772ea0ca2195c9805394425319e0c60108cf3e0',
'ac0ca1bef6b706d213308fc65ed3334bbb40d36bfe3df633bb76e299f6d0469d',
'3eb1c448e56a2e44fb692e22954d3fa25f95c0e1dede70ffd969bdfd6fc68469',
'353fed63c6ad2e94c07050f3d278ea93c80bf4940755cbae8f40c2f2c7e6cea4',
'1e87a5eed777ab00bb68d14b61efd5d7c5632ce3d8a73476f9a4b0662973e796',
'523d17bde775df5b32a2d03fbeff7f83d7b5ff9676103da55117cda7f751b3a2',
'c65f95d8d94dc202b303cb09fe906aafcc4d5f5c1117a3f39ff5aa4f8e50d8cd',
'6ed7a5e5f07d106ade092582182425527f5c1623f9d38c145860905b6846008e',
'8fdfc779afc84e93f5beb00748e7410b911a978fbf5a9f34c0d285d06fae8ab6',
'3e1cb267c3941cd9d294ac8cb260b2c822e28d3683540e55c55438cd117fe18b',
'7ac78dbbf848184cdf5a4a8a6335ceec9c09964c1334a06ffa1c3bfb01e80562',
'cb6b4bce139888b1fa66dc26325d36f88e0a513a2cf841f152e81ac0738e2fa4',
'097b5e2cb9aa97713401aa0d7ceec4f31ee9e670de8bd673ffed6e3845fc1a60',
'd253eb3ff4df0eadfe09a50872ff14d2341fa197059d374b89c7772f056638e3',
'5e2c087a5644c3b5cdbc2890fe1672a68d84e41994cf4658207e2f7e15163485',
'0bc064df8dc0c7c1d86524e9e19960d0c3eb0e9b0f7ac9c02ae336eaee31ad22',
'a5e9c48e4046a7d62f050bdecf00da3e013a6c5d29c3e82f9e887e570112f92b',
'6c3d4df7a73a92e57d2a9b6a44a29bdfabc19a40cda49dedff5b2231730f4beb',
'5c770019bab93e7a7d938371fca388b62ed8bdf85afc43dfd89fb1b74a90778d',
'503fd50a3b40ea793d213a8731f1a320f2353ca80bf7b66fc7313d2f38c6bb82',
'4f21567653785ee0ac0c7ec194878df8cb465af4209fec3e3a920ee834698028',
'38b1bb27f949495a5c5206cc423c44e2fa2cffeff8e8519aa8057a423642e058',
'45a75d5c9ca8648a355db14eb9fdb29f2c04dccf02814b60a8c74fa35b84a1e4',
'81c2355884e9a990c33841d4c1d88637e9e9f9e2acce0aabbbe749522e8e4f4b',
'974b5e81954c4ea82c03dcd7638729cfbea7f58703b67041fcb58f398b58321b',
'f0c68e5259672c01dc7dc86fb4f08d81d0c2233d50aee3e52ae0b6fdcbea92c4',
'4b02117716b5c9e71c002bdd8e8dea00417887f4fab2b599c8bcfe9872c9e28b',
'a5a92073f61dd2a0e825e903ffd4d7c92956ca3b67235fd4e99b875a5cf17e0a',
'452183522b724ddd9f6593390fa13df16e70017e967de29a3e06db462e3b3426',
'5b47a2af7070c86485179ba772a6e82dd633cc67f147279dd13c949641cce805',
'c1b373166b6f8ff2beca2ecdf7ac32662da48ae057a7d8455ccf0230a647948d',
'bd4aa6483731b56f64782f05a76703a3709ad5b62100115928cf48d455828bcc',
'c04db5c701e5be32f47563bc71e19a74ab5614e2c5ee6fbe1a9f3f218652326a',
'52b3a950a7129842a6a179a16c110789250b25b2bfa0584dc3c6daef6bddc558',
'cf167965a334ffe0da1b3b55566a34b30ddac7cb7450a8437ef6a32a98f879e0',
'9f3c2381b3f5368317eb3aaea820d1dff8e329b4dc63d5ea7cb7557f4dd19863',
'647e25676cf00d61189702cc5dd117c597ae767e094f55740aa05934dae628ce',
'ff619a855f19a810581130be884c9b0fcb099527142ec5c838797156e75d835a',
'76853f7cfb0c99afbed310e5eff16782827adba7a7c270ca7ca96e59c22825bf',
'ca51a975a0091fa062051b50c51b2767d0010a41f7282617cbb68a67ea9ba396',
'00db0650fbceb59b2bb3a54711ccf32c9ab62a86a7b920848bdda7252fc1284f',
'f59fd1f64c6e937fbf890bdefb66505705b0d71f8fd6a5c1804757177e0d6a71',
'b7c2ded415d1b2374420e240961553f7c1661ae87e934ef10f068566a4fa22f7',
'56396e2060e63ad0113d628e49d6518e4380c433de8720b9ccd647a0cdc53c96',
'5a3c386f1dbab86eb3e58603deeae23a5f0ce2e1b42a57dc0f7f94334994436b',
'6cba9837840a664047f7e1bf6808093a74e81f115e9b336d420f04a74c9c58fc',
'39b6a9ffe88f7362740978b6ef2b243a14dd2592622dfccd38d3b01a7e0e1feb',
'667358970f26ea986c741c15ebbd8543765013f698bd389d3fc9e782d81d019b',
'9afbc677319d8dff408d30be3541ae9a910df2a094b2b2f5b839b990e4182ebb',
'14830e2029bcdc31f73925697e13f39328750118477c30533ff5d5a36d258281',
'f5b57967b799cd8fe1c70677c5ef298ed7d2cc4024fe4fab9b45ab568848c9d3',
'33e4a788fd37ac0a2b4be2b8151cc7a4ea49b3268cd0171323b5e2e3803f8b6c',
'9c372917cf816fbae7b2387650f9a189212736948822565efdadce2b5c4ad5c6',
'0e0c998b524c3598dc7b8b257bffc688bde235b06859fef3b60d15d18859cb5a',
'3998502011deee526625c3725c780ec6b681921636f02eecfb3bdadf6d1557ee',
'376adcdd5fb9d1dd652539d026f8c39ad84298bc75227742d1fcb6a3fbeacf57',
'5ed43d9bca77bafb6f196c944712f796667bb2701166810491e9287a57c1ef3a',
'c94f26150a91e9ee269f6d003ce7829fdadb2a78b209d754a34bc59382258db6',
'124cf5fb9bc4723b555e1a08ca82d264ed3e1f83ed6bbacd3673e839cc2aca88',
'c57570f4da9fb5336199f11cc219f51012e052d54d6d207e3fee2f7b26463b3d',
'd9ff0417093b7b98bf43f873c65383d6e00126d8b8318c51ecc7819870cc366b',
'57685822dce0f6800e02c5d293cafa8212eaca3bf4956c23ffd70b7c93fc1fa8',
'80fb2ea68af75d7deda3f165d834fd49da2746a5c0bc8374b7e959c5081cf668',
'a174fe630551c891f777f185be4be400ebb08e79cc7cf512a955dfc14795e72e',
'f44aabdb7572dd79e2e89a707bacef997fdf08aa4093d041ecb13cf9f04d41a1',
'4ce5d5b75386cffe406e9c090634e905f1a3dd1ca0d74c5b1da76ff04f3e4534',
'1185c62c0ca91f719cf21763af5277657973bd19b27aa2fb65e7561f654e67d5',
'dc296961c9b08762b8a1f0af9ec50bf97addc68868cdc73a4cb445c55bb9125f',
'f64d8e2daed77b3c9e87ba298f63eb42510a777f7577017860068879737b043f',
'4142f6a4bc50ba2a1524d8f7c1a559874c27c559d282f58aaef36cc5a14e4d13',
'f29c5d6f49e58dcadf4692e5236f33add6fcf4c54eddde1b996c86b97f355960',
'1de858329b95e391795a88f470bdb060dde7bde43ec6c07a2117b21bcb4680c5',
'68e65914ee20152898f9dce84b58573eab38c31722b401a53864858c6168f3c4',
'4b81a84d82443c73bab7d850a7e9376f1fd31ac1cc796a0f035d81712bde3bd1',
'13e033420ece8c072e71dd2fe62ce40811329aea28ff5df6ce5a9d4c7bda0fd1',
'4d959521004e911da95cf8b65971d59cf817c55b13b76f26403fb3ced95a5fdd',
'ea9453dcd06967c6d4c81e165628a824c07bf5764cb295327ca48cb9a2b5045a',
'0c81002b3faa53a49552aea6b740d81f21b6975908d31a586d1195781302c68f',
'3f276dc968f27058ed4c5951ee0f44b5196a94192005ee7ce1a5e8b639640649',
'8a6a3d239e3310888aa66261405aa0507350e40b1a8a2ad829c1265220bf1876',
'818ad0f4610b7f6bafc23f0c9b6b612d7ced92110a2dcf34d31eeb3633f57424',
'1afefc4ab34d5b58486b8f9fb2724e1a4755c0fb4125bc4d8f840f32337578a2',
'0dda82fa5fd0daf06d39a3f1747f213aaa3d71f2bfbe3e4bf9610b412a1a9729',
'c205d458cb89c6fe3817a7a4cede7a62e75030b9ef07c28fb33dfb39abb45646',
'9f034221d7503c7439afee73fe8dce5a1cac357e2d6a6db8e099f9a41eda2de8',
'6c151506cffde274974e5016164b7095228361dbbdb6285356479567de18768c',
'020adcb680f1b0eb9de4634dad31a3e4aa6ea0c6b06116281c044eb8c6db5bca',
'45445fd9433cacf1db279993ee1efc2a3205b7173efd1be248d72707d0584f68',
'6d55df15b002fda4e8d1f9af3198ca3b2edcb0437386eaa9160d6c4b10e47e67',
'a471674e80c6a65f38a9e994d0578fd2fe1e8aba1fc208eac31b585702c21978',
'b4584f96e89472c5f08f073fb89be01b86d25ce226487ab7acec928a6d9fbe7e',
'e3bb16511cf8603ec539ef42449e7306eca068893a6a9749ae66234c0cd759eb',
'714e8645d6d98e77b86d07b92007d92eeab96bfca66e350d6cf1a32b0b039c1d',
'1a65f30f250b3680d54f51b4e8f809d33bc4bcb78fa4b9a59ba090e7c745cdb4',
'124e2a4870304b6d1f9da402c225bcc7eaa73d2660bc37426b0ebf98d0e95895',
'1d1c7bc2bf329c871dbc95a08321cf814f682331fa6bf8b1005e17c283ed5bb2',
'3f5efb5849b49bace7a1afec83e51c7ad9dec990ab28d5fb7c55c665b7fdec70',
'98cf4d6d51a6736b1e44b5dd6ebe9720644e79360600797933010302b6fea6fb',
'acf98fe0ee298b9d7f13f83ce716ec154352f4e72debc8b1f6c86fbfb7cd58cb',
'4d4b8d95cbc5f9293711450e7b60b328d4c0e5df7e0807dcadbe50b729f30f4b',
'7765d32485a72a5f547c435f57e7b4c250e7edf3585f8f37145057db4ff6665b',
'f9ad9b7d6ce0355d8df61a7f3e1d5a40857d5755dc0fa79a341ef6e17da1c5ac',
'5a6568c1f65cde28b40b49c7159a763d67a733d94a3fd8b168a3faac30326864',
'660563b70a2185074e247917c8470d50ab5e5fd01ac6109178c1161670cebe80',
'1adc8ccb0dfaa4523da3a5c8bc3edde60da94e5c2e36cdae1bab146b58b905a6',
'1b977a2a1408334f855e25a6987a220f303febdb37cf824204fdf8f1a97b8945',
'319663e9d6f818ea71d8fc44316cb942f4e988944c5719aa694d6179401ef44d',
'9ae4dbc61ea44d5e1351561bc1df91054ce75cce925795398f12aae07944bf34',
'b387fdb216b333f6670fbd733f8eafa32a33efb1873b1ab88abf7b2b4b756bb7',
'f32959507428df892bb6465f0bd341e29496d98551a3954fee31bbe63b558c46',
'27da67cfff09d93638727dcfc6ebbc2f93b4c2e11700f55201267290d10e34da',
'53ccf686aeb8e3cc75f5385ab59754e76beb5864e569ced30d16a5bea16d693c',
'4e60f77e88a3e8296f454c4cca2b9f026ee0b89890bd20d888e2a1947266ab4a',
'1be31da8ebc9083926ae1fdf3e401d51507b299b7f2f5cccd0935607d31d1457',
'15ee497aa0bde3786689d8abcd9307a88d8fa9f1d2f768c8483f1af3801649ca',
'4c6a6fd6195e1ef6cd312c991d7435e05386dd934bbaee065a481f9a087e0be4',
'6283effa7bb60445d65504f570c8f15e4ee3caa345e2fd8d7e69a7bff1f03b00',
'0dada477f1f2d13a344002ac0bb50a5e4ad07c574070329f2e57e3d9618b284e',
'c81dff186558fd34ca33361ec422d748bc5dffeff1dbb66009ff99a88241e694',
'0fff5dab0e45f2b4b70b2656548ab271bd135a15f4177980c82a5b0ba197066e',
'29f4f9e479372354768b8f7b225f72fb8648c6a8dd6149077475c202c212043d',
'484c90296b9fef3ec38367dadd28a70af08c38f2a51e6eb48c9de1e3b522a430',
'25fb0d8039896a247b0928b9e01af4db462482546c547ff327fd3aa8cafbded8',
'221939689344ecff926a29086be04ad2da07ef840f0bcb6a2f42e80274dcfd82',
'876040ae2789d4a94c16167eb89b9ccda59c48742a8cd86ad5f550e079debde5',
'df16951bb34aad74192a96791e8dd1e9d2a35b13980e0dc18d5fe438e8a8729d',
'c06bb62c0700c8d0dc6d5e00c3e5edf5b74bb83ba74932aee16ca74c1c8c0a41',
'21776f42ba6959fb429d61be82d693346d8fd0ba1b593bad8035f08aa388338a',
'56dcd7e50a5194a33aa8c7d8817bc915e39a3fd72c29202969fa96f854e5f9e6',
'f8af58364a19485f7f992d7f97e8f1206b55dcb3b9b0e316e16387014ad354e9',
'803c0c95149df4dd8984ac9afe7e97c8e6b5193f886a5af1ab62b95dcef66099',
'482051ee227166cd25f28aaddea999cdc26a83741409013cb92edf8e7dc92cf3',
'fbcc1f4922a822a95e7d8daeb076871b53caf8b1921d538cc70fb87dc14059a8',
'71e58fbbd1613f6cfc2c7029a831be9a9eb009045c43828d073b65b81b0bd48e',
'da361d68402f770ff538882a2e774107129f5ed5dac22a867e3ec705ebb40301',
'733da49a913f28d429550f3c27d45743e0bdc339c873569a0bd7773274143170',
'cdb3c93a3de5edee7af10c4170d16ed5c55a3bb794d2ae49e484c4453fa524dd',
'21fb222bdbbf5734b4ec4c9d7f98a68343d967af439fd97ee4d198a333b8d09a',
'1f32c927d2ac5d2d15d8a632cf91c72b052155e1a89c0930aa1c3e782dc02961',
'3ef909d7fd750f8a826e4f27b6430ac00e7746e3e9704e3edc045366f9269ee1',
'2861789a1761fe6fee0918c2f3732ffb554f5f90a967e5b18a5dd6b9a1004e2c',
'be06f3a03a30e95cdc5f5bd328f5fd7bfbe9b07d72c55a3d16cf274e8e35d263',
'bd215493a3963faedf6877873443caf74e05e645203c684f7d46d66894f8c250',
'ad5caab522b02c39d1c0e4199dc17fb50849814fdf1faf45c00551641b859ba6',
'dc2503e40b94c069cb8c35ff7655728644516d7043f4ccc3beac3ed69bb13ec2',
'f1dcd63b00502dc8d4f0d54e7ec7a53b968de9f4cb6b416fcd60c6b9eb1cf3e9',
'75919f6941f085952a051e81da3a68499e5aa265c9925cf50d5d14d47f0648f6',
'b76105e6fef56a67621ae11020934d9c5681287aad0ce1f9ca5a5ceead0e2881',
'3c022918a404132912613a333dfabde5afb382bad0879b66e84200f8b1f39f7d',
'e9d3add4d3c13c19b643d46f0cb6e8f8a7156fc5c8f955024c5147b2edfe967e',
'370b34498e56720acda09c1d3bd180c2a060c85b72a6f1bb09c430657b7a03be',
'5628820579ffd6dbfd3744453d276a57de25661e88dca640615b99e3cac67387',
'a40997337f7caf8ea19764b5b0229c9092022fffda363019d77819b3bd086210',
'ad4c789ba3d5a1899f5783b583f968bfcfd22221e310634f0aaf0544f5b81b15',
'1a5244c6c1f458000aa3366eb926a08eebc6f5aa74b2f09e349ae6aa0f2277fe',
'6c72f18e3a153e391e0e6100dfb187e5ec96edf1c469866cb72da48ec0ce7774',
'8192ee582628ad39641b6b3e273d1b19e83c9a7b03c34efb6ca0ba5b9b3f63e8',
'c0a9aa255201eae997d2b83b7929dc763e527e821cd67e9e2f074a76920547fe',
'f8c74d82648e7296433bf6cb66051fae475ccc71fefcbdd510fee8e25147f505',
'f514e3db85eba3b369bff1d0d818a01e8ac436e36ce834c80fa302b3ce635524',
'7533865b594cee9af907997ca595b2b7989f9e1b87f64ecbde28661018d3cc02',
'718aee9f9d44b5c04786c2a66927d651d5c51cb6c8afa86bfed7cc5721f43f0d',
'3ef7d80c8af675c595c9e5162b22fbc8204435db045d68bc7c76a2a1aac02858',
'cb3d8c150a4424a4df3e1da2661ecc0ed0a039dec587b14b807efd39ee2db029',
'21fe5af37675bb2af2093dc1df10df52b44afe155108ed35e4831f830df24b57',
'481078eb9dba382bda9c823c12bf7ce5e7f9edb7aa249f94c359e5b5000fad75',
'b3204addf0a38772ed36c4a13e0e5005dda27323347d7cadd200edc8e4b5f6a4',
'ce54bfa487be8e7854a924a4c335251a310d281ad0f463bc917c309d1dc3d7c3',
'cc4ef538adeb5c958988d42b9d5a6b0a9ffadee7bde06879a40fae26dd0f8dc1',
'986dff333a0f83a2c94bcdfca73ad42c141b121b745c432f9999e12ee65f0890',
'1335d2c5fde7cf022f4d3a06f3655818fc24c1ac4bb0d999df8a3b20d6243dce',
'a8d1d06fa18a962c0aeaefa21f417dc649bfe4abf970178b5d2b65717d5a37d7',
'a8d75bf25a2d0c8617c19c3e090b05248f6e48fb6020c52289503eb4f96b24a3',
'925e0e1ef0b0bd4d84778d0e0176171532303278e57ed059a4dc42c4852c0379',
'2980328a6cdd18c8cf85517fef1566f56a79931fe507cc155191946a43175f1e',
'5af6a4c36b7ada67164145dba1a7ce1946a380b660b6e3ad15e555a3d5eb8cb6',
'2192911290ea091ed4dd53abcc9bdc9fb65d75cca0d28db0db765f4a892e4ecf',
'9cbaa315570fb47d49aac743fbaaac2a7afbbc17229bf758ba4d555a43749658',
'bbd90ec8f9d2ba4582a9adc5dc0d1f9ce4cafcb84e85856b89fa4c72c316e67b',
'1967f046b43375ca0524fdab8ba7ace657c406eef476296b307d640579e295c6',
'fe1a5f97cf62fcab7c36cf46c7254a4aa696bf27019128503070d9ee9334c14f',
'65115b9af993f710672d5f8f030a9f0621651f1fd8c55ad3a655f40e124c0cf0',
'29c7258e3c97f8cb1135fae5161e11816c451598e8f9022533d9bb4b17a35c9d',
'e28e5137912c1d764606530cfde1e9bbe475404c67f178fc31953b702d4565b5',
'233d4b6fd81b7ff6b27b611d3042f7d2ad8ec8390e12b930299e2315e3bca67c',
'483da1f24a08162df6f1a860875a077dfbaeb17ce213490e003b50db81d064b2',
'da52ce068957d6638b255eed871a1a6688c7bebcdf73916bdc5399dfca529f09',
'd92a177702fa95d82eb8395299d64478713b3fa174574e82700d76da46577687',
'6f702e8ad86173d4001ed60a0b416a09abd6df45267bafbc7b7c51babee95a80',
'cc9aab2662e4c5fb2a7d38dc97eddb6430fd322c0047d175be46bcbdcbdb326b',
'1fdcf1ca00fc8c5db2ffef4ddfc152f37c214d4b6df55a00e3048c9d3e8407e2',
'cc56ac1344a5e1c7d8469e62cb1367db7e9183df4d2390087e5fc8e7c07b31a0',
'7791ecc08badc674820a9801c4b090203d32f4ce434b8bc5b24307e201dbde8c',
'ac2148bb6d1b3bee75020c513adc0c3b9abf3b7c34a493e814ac6fd59dd4f3b0',
'dd4c1bec05ada49bfbe16b18b79344ceee9d7776c3582ca71db89ed5471257cf',
'124b750bde4089c6a8928334a5b870532edee7fdb7f43c2246dc7919664cb6d6',
'049b41e7bfba4a6a2ac58a2862ec8b051b0aeca131e3551505f7685e0cdfbd89',
'48a1f30e92845b55438d317281e50de1681f0a056896d6f45e46b756696da27f',
'924d672e25cb446310005d292aa913c070f86306c37836496ff5542b48ddb1c8',
'9d59475ecc28d4a45c99a6991e76fb2c0f3fe0076db0521d070266a60e80be76',
'f306cd0a33f029b06d60eeb1f392475b701f46fc8b8677ce2e221aea8a680a3e',
'61e2e7932b06e1570aca8b3165924eeffd940f3a4c87a673cad57bc84705145b',
'49b636454068ce0233044e96e4452cfdfb41efb993881afe9bc412173dedbed3',
'a419cfe37f5a91f38fadbd79822ad837aba63cffb5945718ee405ff3544f780a',
'acb20057b3080a109999c452120d9554b6a2e0c838a6ead7649e311e38bae9cf',
'23bd668bad1944e38ce6885e149d9ea9f56a26976daa39e03788b17718dd9d08',
'0cff054cafc0850cf74a6d373f17da34e27b7ac35db51b0eb1b4ca0b2d2cdd5f',
'72c2c18b3a7e1c15fa1992dcd16815be2d05ef9a1f1fc752f3deb84f7e4c3b55',
'64c2a9fb88d3a84d20f7bb575d7a1876de0a3707b703f7016aa826c66e313890',
'e860a1c2cedfc812fc3fc8421d434c4a5c2e9294a3318e6ed03dbb3a320cd8d4',
'1fe4a31c508fb3faa70b4ba76e27b4cf95ee6c2e980fc678af7e8ab991ea893f',
'25a365c87d1ccf49ea9dead1176b44978af3ec8f6c71c6a6dc42d751bfde45e9',
'73a6e912aeb1b5972f5703e6d87cd4234f372932a2a09959a0633be120f90d7c',
'a33355ed6af6cafc1fd8263bedff914b1a13eae34f052a8a8d28ca2f4562c5e3',
'89c253d921d701bad5de5c0face5081a95a1a2961e3e0a7967df7137aaebc480',
'48c012c53a0649f086e1a4069e8c0d01836eb2aa19bf71c51fde1f3daebbc243',
'45073e7c2c032ec77af46f45a6ce20bbcb68c43ef79f84c38c748427d339bf76',
'00e1d52d31d2842f21f3166471ef15d8591c8fa71a3a145c5f8380fc9d84f838',
'261e713297517a45a162fd06ec27102cffa4adc6900fc54878efb875cc15040c',
'fa5240e25bb6b3bec26407f3ba8f13bb260d4221267e2294e791bd2f7719042d',
'64b947457ab1f1357d2b3e7ca3f97d33183fb9fcf43f59217323fc3f008b57aa',
'8e009b2f5981b3d5f5a7571deabecc8dbff2c878b8befe61d17e0ea2d8b0b27d',
'089d693898b1a694d2e93e4bfc590329b151f63f58f76533ab95e1ec98acc28b',
'651642b243e9b21f32fe651450bbad73d7230bcca58b6437da5020c9c94543dc',
'd7aad83e4a3db771e79c3d8b0c850745ccfee2b984506d755d9e80bbfc6466e0',
'c7a8565e819c788065de563260c6df733c638ebb02eeeb0d4fbd154636f04b9b',
'a1d946115eb5f305a2a8c51d024b991d8524821adb7b345efab71541babaa3f7',
'3d9819293c8461be4cd022b89ad7ccb37c91ad2090e5d31bf60a5ddf70782f86',
'dfb30286afa04f1b1952ec59db340e28f2c4c6e3a1d70f194d704afa751a952a',
'edc4da893c7cdca1d005112e0a5406187a563de34bd7a3b22b29cf4da17a43bb',
'8757ed652b36a25a5297c7451660de1659bf9b53e47f40b0502ee5a2ef2ef81f',
'5cba45b9d65ed441b888147aab17ccebd9fadbdad866c941ebb6931efb611ad5',
'635ccc57f695f7dce46398cda616e23db101a2c6428747de8abcf46b70e58eef',
'84e179d1cece749e8788442bf71617b7d9df6554c6b8fa863b93ae0507e21dd5',
'247f793ed38ff2cd2ab4f62236500645ab559bbb748625cdb0440947d3a9a9c7',
'0d4b2f722dfca885a00bcfa2c0da74bfd7140544aeb2288a7a616a260ad018d9',
'59c0bd6d8d8e517ba0bdde07be7c864f7fa346479a7fd6e5a36b3f81ff00da90',
'02b583cc2060f44b94ce1d3ba9e5c075d5d545334d467f973ebbd9629797eeb5',
'dfb89d4b1d9cd887f1b50bfd1468f2505d5319d58a4cbca60712a5b638008bcf',
'0b803c596b710d7e290bf6fa13f952fb3d3fd86f84adcc4408aa95abc0ff3f5d',
'16973c5d6d668c4fad7d66d4f1656d079e7dd041cca6a454a213fe958fbeb038',
'f0de91c76400012af1f9407dd1fec8c0b3353f17ed718e648cdc00c5c41352e7',
'5d160d82a9f9976ef6caaae2c23ee78e00a57fbfed03692a922ecc0c421a08e6',
'3129638424f9530b7d61b6278a22976be2776d25392618149f15d53a07091a00',
'365d8b255ba5f1f6fe26a8d3106404110767a3beb99258eb37f56d9e940d4e18',
'084efaf70c2898e1b67f4b6c4bc8a6b88c226c3aaa63ccb05a21dbbf5756ecee',
'176aa2c7d872cddb3c814ab295682fe121d4ead0acdd8f4e398514c4e607f257',
'd2e4110a2c832c581b72d8c2c3100748ff6907052419e08f98204d78e3843135',
'e35def7366d43c9cd0b5632851e1f55f42d907de679f62b6dd908d34f2f7058f',
'0732edf2f130bd60d80dc857ec150ff2c5c7ea9992255f868ff8b85de4883b46',
'c1c7d20ddb747919694e06034eb4f01e72bbdffab661a22e734b904afe86f0f6',
'091be5ea36a0d7365ba3ed3663d761dcf19b5dbc19fd870c86f6e44be55a0f7f',
'836ba6ac282819aa66d17725fc5a4a62fed911787a0e548ead3f6c37abfc7084',
'c272345a8fa29ff157d6b18c7960684c0b82660105258415bae2ce3e3e161db5',
'bcb73805c990ec028c15614ccef4a8366e8fac057c9a375525852d6e8ac21f07',
'0916d965565b8c1c2f91a2c88e6cde3bf4813c798516bb7004bfe25d7838f4c7',
'5b384400e801c76e4b9d2555b75ad6ae898fa01c83cd20d5e21030d1d5b34ffe',
'8754c8b3bd86c02c9d23291878a8c4c24f06a97fa0b6163a5c41c78778df7a69',
'e6feec41d1c6fd6899ac3e9da893fe9680edf5e36e156580b360d7877560c449',
'eab57df67a184a3a204455840aeb2d612a063dccafbba17e58cd83ce388994f4',
'122e3619a772afd6de7c42ab70342721fb976c1bbb521c5d1b47460950bed032',
'c3f7bd58f7471196dda888965791a69a522f87e843ba24fd668962aaf8e43402',
'455a1ab9a7e98d077544dbb30f7d0221a59c1ad295f59da7d78dc09eebb52991',
'b1b11945a7092e19ae131f21089d84f0ff1f5317b9af8803d1c691458dfb1162',
'20d980e301f3d162e4803d93f990ac7219dfd640a2a7a25f8e01fa5b9df68bd3',
'1c5ff2daa8c7a7590035e9b3d14411fa28801413f701da860f385ff32c72198f',
'13fcc58efad9b422fad20e9a7a4c1db1cd55bd4c17bacab046482c721765e771',
'6a0cc0bab3132a0ba50cb1248d675e56c8f599cafcb05f40548768bf48af2973',
'0a261466ad5a2165add66c40674ac75a9564870fa7aee8395f9d085114e268f0',
'eee08ee3169dbd79647a2f38173523a553a143741096f7b75890750da4f57755',
'c97e8192445d1f1f7a5cd04d732dbb26273ffad81bb214632b91e67a33df5872',
'4988c283a63c33cd15d2c467da86ad9fd450329dc3132f36566b165e110ff0eb',
'8e5b59b5ce46c4a747bf32d2d884b945047bdbaebe97b5872f1e4fad66119c49',
'9231d4a5e4b98c200af80745f4a82af418ce8e4222fdb6f7987d9e9d547a09cb',
'31e47be8663b59a37cdf846f8aa69989b5f3d0eefcd51c02b862aadd67219d7c',
'6382cbca02cc0ae3659ff77773a7b859305510ad8ecdaff5f73edd6512cf20bd',
'f9d6dd86584db04bb69c673881c1f223271ab578a20612d0e047b0f667cbaa90',
'9ddd2fa3b1abb860df8e9ad20781b77ce1521a050b92a05b38110b2e8dae010d',
'1e5abb436bd8a6029db35abf1e0b9f9fb08186ffef0fdb9b5bc175b7625d89c1',
'a443f3014e4e0bb0d580960bbb920c13a80c798ceebac20d6f99f5b12be7af0a',
'78f738aaa110a19c19a4822b477636c3632550ec53918caa9c40027702702c09',
'4ccfe63e867a105089c301cd0f9731a1311721b172e6382049c623b3947f2aeb',
'6884fa3950bddc39cd94862000966b99cb24911343266e3ea8f38b789861b295',
'52a8bbcdcc69ea2ac605bf1aa270ef691aa9f959d3d48bd00b529f996c61d9d0',
'140a4c9b4f1744b6a676af33ef6a244b6fcb64b1514cb551adbd03366403bec7',
'01b1f06ce39347780c0839b9ac442e22ffa82ee580a7d4442ad59c0b79628106',
'fcdaf2dc924110162d7ad562aa065d1929a234a9a2dcbc41f6ac3b9eacf27a77',
'99b61cc43b7d1a3264c6324c68bb09dbbb1e411fd93dcb393c239db021a04587',
'97179da3d2041189a797d2eaf510a22f4777addd9cd96ad5f00b68f86c62a571',
'e1a082e9d6ac8df75262c78d5e8414ccbc7a35410db6f2f365f0902f20164290',
'38eae623509786afe8434e819e0b9398fac691fc45893aae67edc76395b129af',
'915bbd24d512bda651b797652f49489e4cf001f637639fdb3d2070729c98571f',
'2d993502e9f9210648597f0ea0bd75877afcec60425de54a651f851ce8033db0',
'6515b62ef268e932374d101ab056b6d909a94b0327184524e4c844e522fc4922',
'0d70a624d3d488b9ec388b45559b152bcbfc5c0bf954e83c66055c7a14ba2718',
'e0922ebe765f1c81c19a4edc4935ed2d60937a27e78c94e82cd9e576e431821a',
'51f0136b85a022dd459553b029497646e9e98e130daead5d0a022be72101fb53',
'd3168adf83cf9909b2e27dba1529129d58d1754b7766993cfc4acd08dbbc2acd',
'16974705d38bad1ef1290e857eb2479522935c797145d7ae4c70e05b30c62a97',
'db204b9fc54a478fa5bf56c648769002cbc04ae626d2bac5a74671ecdf6f5739',
'93d80def89b1c7b24a0822e6d98af8867a5e004a8f2b98b3797c83b76e862537',
'43a82eb4c02b031aa29289d6db98b00c692c9de031003385af1cc51c764fbbfd',
'a81abffcf637e44071d46b51b9e9684dfa158109d0627c0c53c4abac7fe2d484',
'6e5a02ad2e47a83f4f43ff8ecb81a985d5ea6d81b1f4cdaf50ec96d1e0266ffe',
'7b814208a3c8d8941d064d84aee9baeedb985644d0458490ebe6a0a89c42cd2c',
'3b5985b0ec1afba7a8b693766bb2da24a85565a34709a0e9660473169a882894',
'd443a63410cd7da94495be65f3955ae0d4b095077ae32d310ae2f77bc92fc4aa',
'1e37015b1ed0f6845465f6820f14040fb3f55e0cf0cf20751abaf41b6ec7f13e',
'e785b6ffbefdef565efebdb12256155a020dc396058f104529317a054a94042b',
'f9a8645cacfdc179a7a33fa25158ca6f6abd013e63db67cb135f00a7453a6a13',
'81db5c3c4aef199bbeee37b5d71646243b877a3f04f352c513371291fd52c437',
'948407aca5f6ada4fe524df0cd824e808dff966e52eab16ba80e23b7fabb4393',
'92ea59db484579f2ce7644aca10d29a5e0616a9f6a603ebee76e864cce3ba03a',
'8162fc4a70a3618c958a10e9850c79b002c1caecce9f2220fe7b5c7871219f73',
'825d66d1d141c3abbf7559bc41d5141fde9c061bf8f245c8eeb15e437aa1f77e',
'fc409fc5b54de64d15794e11478c6a2162b14ed909700270ec7b39a4047ebfea',
'e08cb1b7086de879a3cebe42d9f6649b1ca0024c139e28354dcb6c085948967f',
'00e059445660c72a90815bdfb73df9de5cf2085f42b1f174e457aae545d52047',
'3d99c904255338b2754499e25a21c88b1c466472309962aea0d64709093f79bf',
'4095e960fb07e8779d13c9cd3fa4c1ed4a72c37de8a37af33f338279bb4af59f',
'28d18bf2ab29f6ba9bd60956c310ddf483f47b24f47308eea6845319c32d3ac3',
'db1bca6b648eac0b017ff3b091f02e3a3df5abcf551fa484abd49435af2eabb1',
'c9d974f06b3004c96851a6d6cbf1a39950ae077adb32789a3282b259bb7b0eca',
'a8ccf5066c5ab639ee55ba5287fc162e4fcd72e48ef5041985b2135e2a78dcdb',
'623c22b48e6ed252e497423d1094a5a64c6a68bcbdd425f75fa65c4cae6b4b81',
'50b5a6ebf49fba62ec5336a3c860439e17e7ea5f0913a626f484b7a87aa669b5',
'b04bf0631f67e45ada54df50bbb9e8b901f3b8988a80d73f9e1b8488876d5cef',
'a8ac1b0415ca30dc5a3ffdb01dbd77c6f85c20eb4ba70bf6853c388312e454a3',
'846a2fd007a5bf6db80fdeb3e2ca3a9b9aa05c41d2b05f4ed7273aa898e02d98',
'79cf63e4b0bf41e3e47994ebb3b0211eaa9dbb5028fa48fd0eca59604412afc5',
'43c39fb324a35bfec25eed5a149b6e502b5d2043ee92640226f2393898f1d8c0',
'25dcddabf6030b6baf336a17ae77b39ecb0b1140027ccd77eec0aaf75c29d954',
'f21dd5d9528024fd37d3d37b16a2395b79af1de61b1a6736e49aa4a257323707',
'41ff992789e61278703c570de2679f3aad43e19b5a9b04ca8307e18f17f425a9',
'fc654fbb4193a3ac14d265ee31d25fe06606e248cf0f2d1f56f790fdfc5c2c9c',
'9d6b863687920dc618df65cb6869a318221efa0253a6589213c6c799d0c26599',
'ed1d404512a0e60c3bf7709ca66c4010b710c3b94bb574817ca872b797ad5191',
'0a46eae43f4f76d57c5c71e06425618109a9fa7a934a570014893f60958aaa47',
'465883ab17559454b984df49882a032a02232ddfbf9e02ca7f865b93ba8a9b10',
'5ce1d39cff28c09548ca304d39f4a29c2ce6c7408ddb2e0c3c50def0d1239816',
'03c972dbbda7b1b1164d03be0840e6bd4282f616d025af10c0b1607224ef73c9',
'47734b8ba67080d6c40de82e8e6c55afa5b528f71b8b6dbe7a71fd08a1ee5170',
'2feafa1fb3b6408c0783ce385ce7c1bbcd2741e9bea4dd78fef0a06f2a9809f3',
'9ca5deaa080fd4427f7e4366196ad658b97096f70805157f483e68a89436e156',
'9f70be67ec87898ab5b59d2a7eb93a77f5d74032b109965c5087b8c7ce2d06d5',
'f0ad0379383348410854ac5fc52f305010629e027f0518127a5b42d87e294a90',
'8091ca337e06a6de5aba98917ccbdebab717fb51ec04327fb5c069f756dc678c',
'161da9168066fcecf9e6b75a52827394b8ad90c5805c2dce5710e0d0f8da1b27',
'f5c55a469cd71a9f86e7860ad7d4ca03b13f18d86a29c9db67eff022c87f5979',
'655d33b627c1f51677f8c7ac8fe8eeeb3b9cc3c8b9986298bce18e5f5536bdfd',
'8a19fd6a7395c0bce8183196130644bebf9fdd096a3225cca7cf6b1356930270',
'3d17b8939e8a95a9932761d161ebb399662f826a3b040a7a4e3dd2e21e728525',
'3141c9c11e2432fd97c6bef99a177cf4aeafd24ae7b35bf6f19ab0641c6bd4b4',
'e87203a12ace4aba3923c494ca4befea92c3e6950e7e36a2ec09da572c0282fa',
'9352dcfad9a146efe4f71c8dac8b88efe14786cbff36c29b6f8a9599d8c0480a',
'48782b097e35e1a2e43d5dc5414296532c819bf8eb76c926fe51c9f1fd55d8af',
'5683873b50af406f757fae8344b012dff8765dbab81bc57152ab85b894580a4a',
'274fd22ee61dfef4e1d5bb31330ee5171ba975432eac6a675b161e36295a003e',
'482738eb2d79d99cd8301e3ebdef0c957267e6c2bf6a75168ea8e7972cb27509',
'e49bdb8071306321d324afc0281b5561f5c27d3f87a81e56c5bd8ae4c2b59e68',
'eabf1210e5556034d75eb81d81e920a1269e67659e30db18a657320fabb4b47f',
'f8938115c4c40df3e192168483b3a785895fdad291a8a642561c89a35eafd417',
'c593d1c36625ba15dafb538eb53acb99abe8b29ade592d471155e106e858d37f',
'c6107e6608d57c795785dd4b3c64772b07402f3546da4c60902d2f5f13ff2a1f',
'44d4d7627f0bed24c89a2ed0e69380bf0e2aa15a5c2244210bb2ac00fbd7f24d',
'dd698fff6b1147b8a8ebb1c11d299d23d31f885c40c1bf0514b439018b270d17',
'a795a1880cb5afd15b2d4f4ce2ace0bc7774442c962553002d2d1657551d7d5b',
'ef782de7bdb6c264300396f52833a63222d6e50b6ba8abd65bdf59f8fbac9042',
'88594a3aa4336b9a4de3e517902d383acfc7120e49ecb240638ec247cd9ddec9',
'756fc90f6e18ba15aa3702b3fb7531ddf7dc6ffff98acd6f4d5a6014ae785a8f',
'8aeb1569072116f2597dca0e4582cc474bcb09320539df973a40c23e55a1ee0e',
'dfed0c25a8ae3ca295e8e4a26f062455e297b448e992b7ef7ea37f5d8a9ddacc',
'abf28aafaab0c18bdb980161b9dfe804a12f291c7d267460507ba0a25873693e',
'eaaa7e78c296c6698f77a0f00cb47a44c2c5185a72e609df3453b955a0445977',
'864494e49e31fb06ec83c00e9b8764c62e66e010bfecf4ee2b94301484362d0d',
'a11f5869a61dbe533e76897851ee7bcef4b62f7e7a2359c38933008cc59d4ff5',
'ab909009247078a5094ce0ac084bad0597720401a66623f24ee2eef5f4430846',
'ca824fe29f9ca4fa707d713a7d487e0b5d62e7bfb43b4392368713159a450abb',
'b6c5f5a94026227438e5c6404882769455e1caf3f81ebaf86dbfdf186d1a40a2',
'2ef9bd9d23fdff30e1599e41da3a7bdeb6eee6c6c6c54e59955a68854cdc92a3',
'033ba422ed45121f3371a9c889353277d406129318d92b2b5e43ead2be463b49',
'e2d6496e0acfb631d4cb40a5d722b0a3f3e8613a830025576e4645982a80cf1e',
'890e5c3bff3ab186ab0278b1e23f370d2133085e6f7badb1eeaed9c400cb6ec9',
'1d4521cdee566360da71fe5e007d9ed9db297e1452bbcef04b3b41aca128d031',
'a8e656fd9cb86cee148c0b8d89c34430fd72f56acee7ee807fd22f14e233b7c6',
'aff5f50157698ce0f3adf66ffb502e35d26fcb29d20c86df4ac469b760d6d1e2',
'742f0aa5126a6e2accd5e6ed7b84884be160d22a2916b0b766f2f25396c11429',
'2cb4d9d04af9b21761e7447fb9e8392b45e9acf7a798551b72080a6e6e56d5eb',
'260e3082d53965f7fd49748109c6802648646286d55b15dc31251003acf91ec6',
'c14ad0640de6d945215919ca3483564ec14013e9db5d6baca6880d6079f61a44',
'd9ccd74f66229401e5ee13fe662d621e546449a8dc65e8e5b390cc6f468f7abe',
'2a5df03dfe499e48c7cf198b134b32ac9fbd21a1733d4aff1dbc937948209602',
'f33e53256e541e73a73378286d6a9eeab8c7fac2dc34434f6bb981a934236d61',
'b5bab90ad7c00d2bdb2e9813a0f3411817290eb863e3c05e396f5e1096e377e2',
'c2dc239c941384e77dfc456e38c66a6842635b8f3404ddca2eb4a170ec71f300',
'a8c0463cbbc93439ef5241404c5f135d371524aa8164e18e8ff446fcca45b14f',
'80620689118a6d1ba2c9722131fa3df222ff4f7caa8860261bd8d2cacf453a8e',
'71bb1b1fa0cf9fcee4612d26a99e3411edb661761e8b43ea7bc0aaaf0b1db8fd',
'd946d84786c3db5d22d5402fc8203e49cc82f19ea4600756ff16ab04613861a4',
'4ab35ccda36580d4dd376e74b99bc81e83c1df9e56bc39292790093040244cf2',
'cb33d7510db3577e619a9c058c514f4bafa4f4154b090ec6862eb18da8aa1812',
'd6e6bfe6b21a55044959b1fe2b5bce5b3ca841a94e581ab58724ea54aa455816',
'110cdfad47bbc4095c2b90ddc019905e2c93fdb05a889f2d665614a50415ac78',
'd257ef5df5b81a6cadec2effe90c294da28cd5223fdc3ca112795f5cb3c65a64',
'0d9c4fdaa74751f963ce0069ad1bee3df2586bf85f546e69c721959a2a3fe556',
'5aa609ee10a62b76b20c8ad5e2fd8a16316fa1bbf7f2e799c79bb0d7e848bceb',
'0706b24f38744d43e68bceb7fa828f3cf926fa2aa7d5a8f0b34725a4489d3533',
'a564b8b6cb0b37305f1830a759e06fbfa3623c7370c08497775551a6a90ad17a',
'3e39e5160ffb311e5b3b7111389a2e906cdff097e043a9f2efff21b02bd341e9',
'962b8d7f38602fe2255e7988616a08e606525401b27b81bdb7926314f4cd075d',
'328e362a217cc5954e4877236e92c9ecab500e16374a13bbb5be93e56617f523',
'0d40217f13b9060a189be2286e4eac4f712e87132f0a8250e2525fd7f28c605f',
'3eb26ad2e7fbcca35c23272bbaae093ac04bdd5f83c3a91b85d4b86118c1def1',
'45eb53be331e53645309c11fdb1c5408ffb73575ff4b61e2d1ffa6389f83cfd5',
'9f6ff5d8f348ea8794df9b5b1440dc995b03aa97a23cb9b5bddf5ec5afae6cdf',
'af9fc7caac3ecd12cbf5779cdd7e7a4ed537d4dacaaa93dd49a03b9c4b9ecd50',
'd56dc1e4075e9c204063c6624e9c2441f1a7a2fbdd194a8a7adab7d7e2cfa6c7',
'28ba7f6ee873cf4f80bc372706f344653d002893dc9fddce99e69d40c5f51eb6',
'18dbba7cd23eac97a76c8c5135bb3e3c38b2c78e964ed143d3f9fe5b70994ae7',
'83ab3b8b1cc69ef271ac7f73c3bd0cc6ca364c36ce9bf49388ed32d231b44cf4',
'56cffa0792b0f3e6f0f083ff3a4a5147ec7b1f68eff3b44045db1741f477e1e1',
'fa7b8fee1bf668ba4a7691a01cf6f15a8e875347bd31332431ed2cb9f47b83d3',
'347fc6e7ed7389748d0384a73dbe4dd8c98c6b5f5c168e5982702975b8a47518',
'a522f5da14fab541770de39875685457cbc17689dd9bd6e4b7e6edb723f2c4db',
'100fe42c64dd91df8b58d2273c972676e586384a8063c69f3172a24c2f794957',
'fdf939aed62ac864f399844eb728051f0f8347459615871e6abed6a812f08246',
'e331b44b58fc15473c4e61dee65afc12d9a9c415d893d8d7ee34bff5e4909863',
'd532ead2715c6dc89a7f4c4c623e1d29ca748814da7c9024805d23793ebfba45',
'543446dd02705143f38f5074ccdc53d8799ca21f5b7c785da261a12cbb8ef1bc',
'3b3e078ec718296d0987286ed0965a500d0c081e37fa253f4d8b8c00a508a7df',
'37b53256c148b320893304ed571f416bd3554bbd55de348a7603b3a5828c85d8',
'c2611c524870384507376a7c9a3b269e00cd37fced508ea14b0d2ddd630f863b',
'755746a3cf6b69c1c54314c9ebb875d5738ae0c24e7720696c1cd513d781fc52',
'd2446c9dafd981f772a1f6a2ef090d1627488ae67413e92c8425e6460b98e50a',
'5d01baab248f23f1d4355f802b4bf0c71f098c56eea1f73ed92296ae8f9bfef0',
'6da644c4e70712dc5cbd0659d038d3db18eadccee7d3a7da06ee9cb39391e961',
'607f0103d2476468ccb18885d850a2d5af8a40b6e8e10092f38f6155d1f7059b',
'27ab0fe67201fe6b4a5f53602deb07337a53c3d8c84fb528d75a2ded5e23882e',
'36bc59b904750ed52b4a1ce1fc6a7ccc0d39d0a8307659bb9d596ea8bbb9fe44',
'8c2af1ba050369e7f58891ab7ad59fdbb036e214aa87c0144c4a505d7ef8e2f0',
'8aad1c005dacf7f61214066487d0382de27522bc3448c3afb4096f350ecc6e5d',
'64acbfda5f073ec592f6d2b07b5083ac0ce157adc813822fa57a639b88cc3884',
'28fbf59213123b078ef7a8f5993346f39d017ba3954c74785f86f524cf9d8581',
'608c298d4e97581a45284fa9c4294646076b6eef07a57645376dfb1da709fc98',
'dc62da6a7bf5fd3856d76b711c38d080420ee2a5271237e091e634cd8be1b6c7',
'08ac64ee18004d39b2b3db301e8f8ee90e256753532323f34eac7df338f3efe8',
'4554475b37226e7780ab7fa892b1b9994c9a24d39bb52f14f566b611c426d015',
'7e8bf381a33197c33cf9eb5ebac648e1a589e5a5c4795a3d3428d15bd7b69aab',
'4411e99363e6cb01b0d60dee66b002666b1909b31e602b4c09431e8fe8bc1569',
'00df0c0a901fafa3881954f3621a329304017758a74b72ede187aeea872a9200',
'7a675b3cd28dc6441ef29cf6229585de6fbf5b1ea66c9ceac45139393670b0ef',
'7a3f1bdfd5f9888c635aebab46e55e4c0a0a141a53f10bb54529eb0a35ca682e',
'5186e990110a908e3df03544af81d21229ca15403362b7d1a96b7e9b45389245',
'0d6ea953b1e1fd5e586b228857d047c3b4d49ce872ed1218eeaae983dd866fe6',
'7d58b25bef18eff994d285497e18d50e76afae0fa08cf9e941c7d9eb58ed6da7',
'680984f663d4cd5473b265113f0c32e14cb561ee53f413f571279f7709db1398',
'937254601a110b27b5cd46abae5d1c10d86d34ada79b670de1db531cdf772571',
'ba41ea056fc541e520b8a3fcc5f075ef93b01ba772e6a60b94ef6d979f11f306',
'79fd91a42827c8fccce7d8589d6cf8d73d75f18260649beff5ea923a6b91e1fa',
'ce7ae680330c37d9daf220fb88d3e2fd58d83a27de8a1dee365f4ea3eb5d85e7',
'b4ffcc63511263c6481e385308e2b3e816e817ffc793522406b11e314046e23d',
'487e3460c88dc7e6fc7fc30df270c3e6764c520494f098ef4e2f88074b682350',
'366e7a72329f7457612919f48e439e366ae5c150a46bce25e9ffa0b715157799',
'2c06791c9c30e6f95500c8f69f9800b2591658df1bfa68009728ff446fe207ca',
'6a76a96da1a8ee86ff60723696107813958c0ae8605f1e93a7590cc1c060534b',
'92cb7163204cdacc6b2827c8411dce906207c696189c5bd01b061f87c384d456',
'722704b87c10dbb6785092833f74b106975b24588cd0ce527629fd5f4d7ef719',
'4ced433175d78d0e8c954cf2f62c5775a3c0b41dd004178e8aad9c3b9858afc5',
'fffee1ac1a64a7979e7537eb7c311e2bb9d88c07b3fd3479472cbf0fa8e62b27',
'040f9a5a7f53727272774c811b23207e3c2a42d27374ed2cd244ce5eb55378eb',
'55871522cb9ad482e57d739b323477b4f1f4fc3bce556155caa7ef6801b99cff',
'da17a17b0367ae54e807922cb38e5b5a0e12824bc4891f07815d511bec6226ed',
'70c8e2313ffd26ba0f1c186a779fb1fc3ccccacf0acd886964584cde47b81981',
'ee0b0eb0cbb65bfef45fe65f9dfd724c6644d0eb19973943f6d87db84b63a955',
'35120c7fe6b5ef7691d269b049286d4138ef4727bde6385d6270875ff0d3550c',
'45d70aa5e26ea72d37144435fdf34f70d2973afc0a6762d28ef49d9ea2f4bd3a',
'942c11fedb2e2d9c9215c17c715f061123eb2bf972748587aa58383d5f68fc9e',
'926dc3b0d415d6216ec4dbafa182466c3cb2fc16a2fe16870112b3fe891246a3',
'cdfa8e5def0809d594c9d5aca83763a827b4f3b12312be0cfe1c92a8b1b491b1',
'93d93fb1a9362ea589fad4fb969f034cd43081cf701cc71cc54d1450eb422bd5',
'be3cd7639ae3a1c1e925c619429035977e428349034e478c9cdbaf284ee903bf',
'cda5775bdd0fc07d3aeb8f117f0bdbab929fa2fa9878b046cbccc12d02ea30bf',
'1754c15e8687a2c668c74cc0fd35b7108a8b006e3639a5f45cc03e295a754ce0',
'94ee27bcc50a54dde88594c76e038f628c1f652ddeb523ada0ad397c04dacd40',
'8b1cf162317a0108ae3eaf9fa1dde253f3e01322b92a44aa0795291c1d3eac50',
'd785b5f9c49b660e26965d99f07bd78014cfb41479a67b9bc2009d14a80f135e',
'90e6c0a37658b4c5a991f7d6efb4aa490282e9d519c58c3468a4067e06742305',
'fde01b26102b0b9dc335a32beefb49fd48a25f28772ed61e8b39a87afe566525',
'ae299a68c743e1cb7befbc83cafc48b72919395d68682cc5340c8f0cf8c28580',
'14fb299f10204334da619d766b4e1b03b024eccd459716ad23d9701d20c2a573',
'97ddee4aa238a09bb918c19680729e2509aee94e992f2f38f1d9b2b21ef89e20',
'3fb169f7bae0f0fb2ecc9f0af64748f0350a2891ab1044cbd42637e8e2ae0fea',
'ca35440e28350d8b6eb11407731701a71d0e8c133a64c7e4dcfee84560143db2',
'a2eb7e140caac917c691f7c618b21e1031cc8ea2c20dd44fdab2dd125de9183e',
'9e00090e0175e7719f9c645da1fc4739601009b54e1ae050346c1adfdea37908',
'3cfe01b7a8291849f0ce88c37de9a64248f6d6a115e645e612475dbe4bd8ca67',
'fe96eab59540bb18b63b2fa00ccf4dafe98dd02443f9f4d095032c8841fe4a20',
'9582a7758fffcf31446324034271326b2e435bf576d7317881dd0302441be25f',
'9805047c1c741d089b8c7dd857eafbb575dcd116cc9f53fd7273f72bbca516e5',
'c68f155208fc0f4712acda72f97f5773fc8762ad84a1b1e7edac9502a98397bc',
'a0e16e6c778063a7c5edee5431bd6daf9459e7db00c90ab1c29a51b0101da33f',
'75166681d81691bc6407c46cac591bbef19c9ccdc7de4af856ae0535902b4529',
'cc5df4abbc9d220b51d658e534e70a5649e643049d44cef7ef1f336170e3b7a6',
'7f20a672163010e9527d5a81ab6371ccf24cf3fa983374e668fb8aab25015087',
'6cd6b610f20450720351a514b1911de559141736b86750e15cf3edc54aed806e',
'd9c39c27af2197a0ad8bcd257f04465a9d9c813604475c56909dfcc393858f1f',
'482be11cdb5aa77426b4c4b719ec37956492d4bfac12f1b1dd6ddd64d357a45a',
'a149ae581b3afd6175f5ef83a13846113170db65d74eb00c83f7a7c590e89a36',
'b7ddb1a5686a2ee4d8ff779aec7665996d0c5d52dbb8f11fa93fe05516c81c87',
'9b9e89028863057d6b6477c26c6d0da5b8ca51393f24ca60ab30660554431649',
'34955daadb6c4b6a839fb9d46af3330269f82cd0664da680517aa1f4a9d5e25f',
'48bc2073d077d7fb6031171d5ae039dccbed0fb0a45fd8650505a0642b3dce45',
'd04d77b3c64ae88bf6eaf290b4bd35edd3179f7fef4abd199ba0834ae7a60a9f',
'e2dd3358effbb823a3ffef0de29c7b06c4a6b9ed87a406564955fb03938845cc',
'be1ed041920e3228652f8adece947ba98fd004b937007fca4f5c897596a449e8',
'c27d4595e13362c6ea89704f6f31c6396deeeed0a1d94b5d7ae4b8d8e31b9eea',
'c3cf2e116fd7832282449a3ea23f9239b76a358b2326339c822357fef622da97',
'b092484fcdbf793be8fd208daff14e780f2ba6835d3bec59572a292c4cca0fba',
'01ee318405b43f0f3de0b54bb534f6a4a0c9658d9a15f8d894ea797267897945',
'9174715c269e04abcfbd114fd5866f3b3f9449185527786cc2b6426e4b9087ca',
'ca7f1a5c8f0c5da7386df8062b091f301c10cb80a655c194e12c3806567ae157',
'14a978ec0b4f161c2019bce0893ad156c531761c59bbb23fdcb14b6d1aaa1dd0',
'58bc6d45c3fd8646f9c34f5154609ec16e0595cc33f326089133674665f06964',
'122af5d72a767a7fc4ff7a5d9e833239c17688838da3c3fc293cdeb9e2406672',
'56339c3bec802bfa8138d8c594ebf9575c7b1f9f4d68ad1c63e3bb5dfe0ab910',
'299f5671777e5a0e6bc587b443873b8099bbd7a2e4dad07cce8e934c15ddd1bd',
'f1adc3dafb5145d64c43edfd4a39786d816214209e84adf77458ae0642b45710',
'acd283ea0c665abbbecbc84c270bec3b7a4fae412114a5e78919736104142c71',
'b2b62480ef979dbaff7c0e8b5838b1172c365e66682e004d028469f07f533262',
'd6212675703cb8d520bb32e8fb93edd3af68ed1e89cf6fa2c4d58ffb72692091',
'ad943f170f9bf83e27c8c93496ad4af55cc67ae70df582f42c0c8e996acd83a5',
'94a7a0bc7d4e76bf5bddd829ed7236e599bb23a938e6f2d8e0cf7d96c61c96a6',
'7d2d62abb2cd52a5319480c975dc16d9dcd6b526add9632930ea369580a42e73',
'0628ca3a4e18cb27b4f49c57d14bee75c34f98b442d107a38e746210d16be5d8',
'384a5a478f4a27610908d2028d97963782bc4828094b459b7a1c044e2b389ea5',
'1aeda8e7453a2e55576ac112408298105e1f903ca5fc69b5b8cfdca3446d3f30',
'8f20205c9b432ae8db774b3a4ffe2779c61065ffeb84029b59dc761a13df02a6',
'0cb2785b856c1207354006db0537f74f73a7591ecaad55e8a4bf271f74fca110',
'd687f4e1e136b9a2292e59ab891e2ef6e47573bdd605ee99c3908c5692f7b979',
'3a5ddaf7a9760bbce6af0cac7571460b30737fd3949bcf42e77310e18d1c7458',
'f7930a72ba4427a747a5e4f1f30ca55ea934308866fa92102797c9c6e0979737',
'b21f10782ed639dd5b493f75cff4f75846b8dadd8fdb451dd823648936ead9c7',
'd4270d6df5adb25e46e5f6f336e4207f21b185b08c7ce893929eac9470a8afb7',
'2c688728187fac4c26a8c7f70ef43cb29a415847b9abd2a63363c3ced40503bd',
'ff31520f51135672b6c3bbd938defee9bfef2393bb44d4d5329550412c9caba3',
'71d445d61bd36f38be2de1509b4075414919ba33b9a0fb855609b25c80b6c50e',
'c2ee711b2653d56e8e718241d44ba48a9d1833466f6040892d911f2fb6430f6f',
'f89d2a04228b5b63aac3deef09a93ee12509b7ee5f49859accbca0d3787a68bd',
'647ebf05b3dad9773871e6e5e2a051a6608cfa56d8509f17a68fe797930cdbc7',
'0c01905a5d1f1ce33a5ed6d1a65c119905d035018bde17fc23afd6cbde801818',
'7dcc957801377e7b44db6bb2f40754d2b41478c4380aa687dbbdf0c884267234',
'3c6496be10b2b113d437db7281cbca5000bab62fa65d37e1b8e3fcde40a5cbad',
'b2bad9b419da070dda124649905ea9f4313961245e73560d69b46154955f5b8f',
'9f7db047c392317039b2f773e9e85c8771126b8128e4cedb4c7c4101f871c670',
'de50c34e40ebb1789f5723daf209560ae000f556097e724f2011331b7f82b3f1',
'3e288d55c2fd0c28144e7653257e5ad6907068964c704b8e6d254d52d472c96d',
'4eacfce492413be8b8cb52038ed29548367505b29b14bc54ee04cb007a057c84',
'5227290e467435ecf6af74d12004f9dc3cf4864525dd911f898c8953edcfa0f8',
'b26236bf5f50877f31c9175f65502590fbd16fd0f1d5baa503fb36fa51f7fd48',
'cb31390d35b1c7de91e93d85e9f5fca4f9baf3d013da7a2288167f045612df12',
'76f9167f34be0ece1d77df0a13f63d524534681ea2b02b5ea2fc989d15eaedeb',
'51845170bc173286e6fdc8ff1432ce1b43e4e3230fd396e0f06e0d2485eb7f3b',
'3d78d7fc3ecc4f12be583a95e0c849eb0b798cf28b91f17507945a51c4c47e20',
'd8401e217452bf3f2a45fa17172903e95617304cda7f1c03be4776111c8ed689',
'04497a92320110a3a58541bd2519ae226483b70419b8af9a7f3ee3494239d730',
'2965cb2e7f2dd65031f18757937200357435bfce2299e132642c971efd1ac20a',
'96a3ac7c4a3099875fcaed2777b6cbd638611299e3aa6f7a5ce37401e2224cd0',
'76c77e99c83ba80ce293c5dbec7c57e646bcad8f15cfa1224571cc73455a37dd',
'0a83e110385e5a0ddf7af210c7829febdefdb26d81990f9f468994f402890859',
'2064e226b86c17488b7b434d185b8d6a632e2ee1209ed8f63313477de8327202',
'2fef9795ed74d7ce4e349bbd3425d491f909064836b74416b7c7c9dc112616cf',
'e8c8e7713c58e133f764bc378c29de31fdd6684e84fc2b15e4ca7a6f37a362d5',
'7e5b9a6ad8c20cc0732565858103ad7dec21b8b0bc9ffd8876d85d8cebf0c7b2',
'26b5174dc57d00f66ba05e9c187848821d8a79dd1990cc2865727250580a6ee7',
'8cbaa342f3419d3998b45eb0af36af4dd71f5f99d525c72ee29e76448811895a',
'8b7cd378e1c3353a86ce5700a987b410ddbc9ad0c615019249244624fe3e04db',
'385fb9fbeec4e79f5f53a1ef8c11692371f961b085c80f4faa5ffc7dc79316d9',
'2f201c1c8764090b32e7d217c73a42fd8366bfbca534d0d4dfa8d8c7fe2099df',
'c1245662ddec136dd3974818cd3e62bec954ff9e24e3726c2abd44bcc70ca429',
'2a4184d7de794f50fa8a408ae251920ba15679d657d15576acdaafaebd686fdf',
'850b125620d5afb9e9c04e90fee77f847b244ad715dbda61650b15fcd6938d96',
'd21ebeedf4417a1b39abb840e5a9b7e000028d32ad635ea34f465ea5830fd3f8',
'835f1cedcc2cc8f73f7ddcfa95f847efe6fb78ec3aff49853bd5175103743f6b',
'9f6f32c3aa27277767f0cfde1f3531dc1e4a22d8ecb2e248c6fd5db6528bed50',
'1870881ac1038fa0ec094e2514cbccbd1699d2ee3977cb174ae1dacc994a8cdf',
'71a664e0174056cb4aaf6cd623f357fe2db30ae95a9e74800e5a49556587a3fd',
'82327d620477d0dfa4b0498a4b0b7851e765a29b24137cd6216cdd5ccb85c30c',
'6c4d40e46df526e3d1d1d35d51e2c1b70aa12f73f8866c1c4928190ddc409ea9',
'c6402df4b1cc0d5b1c69f5aa00687d62998334f1fcab7cb44580f36812cca5dc',
'56d29a0cd337b8c892f562f189c72babbefb539889508906b0041940a686dbef',
'599133dc880a7a790cb2cd8c841ae6487a2f84184c8e26ea9957715ac5ca7587',
'b8f9f63a6919442fd528f356b02cd05af116b05fa02908cf4b5e70b7fde6a6f0',
'bd3b00bc811650dcc6d58492d01189d1f1649fd57758f885c5fb23d3a0d0e99c',
'41fd12b89abda1fe99944788a199bd5041eeb37a181f54194228b11cb8fe7ea8',
'08e3baebe5239aec21af1752fa68621cfdf16a67971a3e6260d5aa735ca8885e',
'14aff5a7666f7a457bcbb5a281a6350167ec1abaaa2d9268ee46f39df6f78ed0',
'9cab1384dbcd824c4488f25b15ec11263b7014ce099caab9444ee8745cc3fd13',
'0e34cfb02dfea6f35a43b8e9d6a08dd1b5a5695d95e8cf50f2d8728e2682b09f',
'7db7442e5fd89d6dce90f17d168d1f8876cef3081d41dc74458ce5cd1b9c7e5c',
'164991964f470d41e44eb21ae4fc9c7a2c28235f7e1b2dc2e28fe516952b0619',
'94e70846079cc9e8b4a8ee86aac0b4dd82454f0f81707c9d52bcf6bde59b3520',
'd8e5ae369926cb8767b99b1b1c7cf06d839b39dc5d7339aa4aad023df206f1bd',
'bde4acf6c81494801cd83bfff277a2e0702c1ab8fe88a7f4697b610f81ac31be',
'ba354ef641f83036bb4e6cfbb2733fc5d969e3fc01062c596297520fc7fba5ce',
'a13f704f4e8876dc2fff559173214e4636c618c5086af4176fa3d15917317f08',
'8b47f9cc63921318e8d7aac9cbd352e1e7eafcbedd2b0531917daf2216d395e8',
'7d6f9d6a9487d916839f861701eee105ce1e34ab9c73c9f408e5d89432db8b7a',
'0cfc4a7ad473191f27a98764a70618bb155da5ca53cf48c32791d8330a7c1774',
'a8c2238ba896834556bc689d21198a90e2988652cd3a9614d7002b85d0f84f91',
'31e02edc2d1e035e752eb991b22234f04e8c56b035ca56252d82dda9795103db',
'91b6c6fb75a939322410d221f357a65c0da32cde988de661ba9a8f51e69f5610',
'b5d6b88561c43f7957d893a2e249822ba3d19258d5e7adaa342d78973ac196af',
'5cb70ca07dd94c00339badfa5bb33f2e025688d6294a1e792fc4453c881a0628',
'e915cf03b8865e29fbb4ffa6e033f9733ca7a9b5c729f6515020eb6dd7c627a7',
'7febc2e05a0dd3b6d5f9306b8a4d72c88d8b4956db7d05c244e83403c17fa872',
'0f3b442ddf7df06e945e4e8d7b9c992d770dd005a14b900a881d0fc498c54eda',
'5f5bf834beaebdebeef00cf1bcda211adea0f46fb15719139702a531a3f6a668',
'4c883ecb095a0fbb79c67ca178c054fbd05226687fef26287869532e4b4620d6',
'79aa09f7aee8d63a7cba077e7689679ca1bf5a8608a46e0cdea6a03a86746db3',
'a5f38e5a07b2565f4a5d6eec69a467134612e516f2aeabb2dd25f695fa161c06',
'8f3e22a6e16b94def6a08b191a45b361c0a3ee7744a3fcb8ee4ddc43036ee372',
'af7bece37532cae63610b8c8427f35ae3169d0fe2229ec30b7925c47272d71fa',
'aa1783e72e0204cb54daf12443d0c7c94d2e1d3b2d2e70d446a89609614ac3d8',
'fb99ca400585ac2597b096db795794d2671fb0ef50253ec30801c58cb6de1edf',
'996876cdb562e6d3ec0d54da5653c4baa2f51a3b86be4e4d70db648897350b27',
'0575250e6a761537987c40596f249e5856d59adfea19c79c9cea357ec34dd65b',
'69e31baca2b1184e5e1abb1b6f2d54835e98256751344a79e5106652dc9c41dc',
'8438a9561571711061a249ee59592a6c418dfdf2001aa26e1d4681708f1d2cf3',
'35ba0905c95f3411e0ecdf8d4d62f10f8ce0ba585002890bcac93ae6318fd6e8',
'cdc3e3f9eb76d5bdf1553b1f6453b09318006159e3f8ad80eafc7b9869df2a90',
'454b1fec5e521d7e6e669c8bed3d19492e1040f88628997b9028a6b55f6db7a7',
'0cda851ba97c2d25639c41f8b6ab771b60ba19a1e017b1300413ae32e237f4df',
'bf7f371ced78d8eba5e3481e7792c2cfe365fde68101f9388d31d5e7aebed6a2',
'b51e52ef43c600ebb7946fcca4faf9ce89a85e1a0d39f1c58fa561961ab26a96',
'862826be5c2ff5a1b22f0431c6b79f3c47b92eb9c535c6ba30d803f528d9c085',
'900d60043c09896d3b0dd340f8466b2cf1c6bcdecab343cdfea3e23c9d50f891',
'fcb67edd86988e0a576b9b2e130ce895ae14c7bb5c8cc9712b0d0e6ca4d7a29b',
'949305c6776e39378c8b831e50f93b4cd1cb08dd4bbdd6d392ecaa2bf3595362',
'de34d19aba9a8590bcd2aa26ec1b89702fde6c4c8aeedf8b321dfef5ccb4610f',
'9c567d22f282db2a4e6c9688c0fd05ff6177edcd3f4cce1cdbda6b6b93995365',
'83ba19e9f1ae7546c5d9b0d56657659d268d9377410febcf72a814841ba2ee82',
'855ac65be6a367a9152d51f53012e4d34dddc136b896434986446cdd4c9acea8',
'08a8f5f64ffd3ff7786e22d5a4a518c184262c737126e2571d53aa4e82621466',
'815e88788d7030520164f94f0feb507636f752e2be734429f1d842c7521ab393',
'ccf63f87cd4ad4739eefacbb30aaf6c91fdeddf5c5ea77452987edb41f21d2ef',
'1187a648a103a0f1629f25da5fdb1f051d5f2d69121d4f00f7bf58fb2e2d6f43',
'73413aa9bca087efac9b9a116cc8994466533f4d5fd0476c565142978510340b',
'1ba25db8c37e59c0c922f027297801dd2f66658199e0617f14d87d34d970a099',
'66cc5dfa340c7c838f710c739aac0c5a20907dcb3e1460680eedfb18261f1229',
'8f58312c7a751455d69796907d48ec9287ad53e258b5896d1225b9d1f8225d03',
'58a9eaf992fdc68bd8426fda3c04f66c6d93566a30b4c0bd16478319e9ec1b3f',
'fd230c937dcfcbad02c2b0341d836a9baba1e8cf9ff8c90155b2fe937bc00850',
'71de1fd5e33e251b966ef43a28cf6f67904e7a3a3882d4113051dfdeead9554b',
'82802e1510b770cdb3bbdc3dc82a9e270d02d7bbbb7ba770c27a6c095d19ec74',
'040e9c441900c8487260e8b23dbc9ceb662dfceb4da59db84b7d792f12966d93',
'cae03d6014b7d6db0a40268ec7c10eafbe51b28dc99437e3906d23b7ade445e5',
'6b53cfd850b6cc2a318617f5c2ca2870cc2130a5380791d15fb0b328303b636e',
'ec5eb2bd26ba69b52448cf1c8e99358b0880945fe97c2188d30264b8c9f26d32',
'241c1575222b925016f89c327e2ec69be5c9fe20fad0a18245bf4906567b4ffd',
'd2140e4c1a5ce3c5891d2613cafa5110a6fce11871b0c713b74bde69c391f661',
'eb34b1e1b6aab71f23eb2df926958791c01b93daec45c0f3c51465f7677f9c09',
'48757079149f6f74c05aa8d7f099dc61198845b4899f63e1a80d400f80f50189',
'ca24f36a430877bd930140b3fddf16cfc9aaae16ecb32b423d46f9beb7b967da',
'75d45f002a9707158cca2649c828a7171ccc1842d6e7560f5354c878e37c39ea',
'e1b8b2174e3369b44ffa025dfaf125bad7b210335d35958f9ae57d873b2a974a',
'ae918d52dab9e76508453548c5bbe5f4781cbd271c1b450ffc5170b5a6048819',
'e8e5317457f6956f53956bd9aa997ed2c12335511bc1387bcdfc5c217991cb61',
'4a36fd9c57fbfc5fe08b3344feefffd57f6f443af0781f31d169390ab8da8b67',
'0bd32a025eca2c72015d4ee22bcfb7f34251e2def409a3d0eeb45d74e83d701e',
'2c337cbaec1d99402bc85a194b32ab1443c1062763721ed3f44baa6c72e3ecf5',
'69df4b385ec1a87e6b0e94f4c10f45e59899d6723791603546ea5a03f0cd8e17',
'b747ef3cd6d9e84a1481ae03486af6a2f5221da44ab9435c89516ee7e53d928f',
'bdb7e96b19b0eb8542774f5c37124a3d4cbd1453ad2e85cadcaa5901395580b7',
'cb6eaf80167b719c41fd110f2ba2bb9fd6824e023c9311f61945d481f3b64622',
'c39ff043520a1096551b40c93a99eb84629b0b27d30a37c7268a5fbadf245296',
'564673c5f221c72e8b7be0d4e350ec7599c5145907847039331f6aee4b23bf0a',
'b72680a37b7146594ab46a7d10c30ce4988ae2bd6a5db83cba0382acc7086178',
'e275ba5bce82b9224d7005c585dc4c6eec45af3abfc514d31abcbef69eed3917',
'3273348c498f4094b76ec606837dc7d92b1082b47b9e54a11f906465147ee8f8',
'a963717b16ab22b9b795ac2d162da3060459787161dc0153142126e523997826',
'98356c49e749f1bac187474ed7a0ae0c1237bf22a6da91182641f4ad93c881ad',
'1f75304a083961897768500b6e74a3cca6e991c14dbb32d93125ad34e4eb793a',
'6fffd24a2ad32f9b69cdd1a63ac7a928f5d030977d52f48a42ec245f4fec5260',
'7f194bf7424e72dea05c6514788b38c2395799be24523ed7e06f2f8caa8d043b',
'6a002bdce7921f02713362b936463335d0075e1f0e10750a659c85dfd0dcf921',
'90b9003ae7d6476a3360144e44092a1ad97610d1f680c9c10c216891c98b832f',
'af4f252941a9303939d2cd57351d3904b8b053416ffdf0a7cf456eac8669f26e',
'1c9453c7e9fedc12485425be79cca6e633b5d9f8bd558038c481c323c2234059',
'6718a41fcff78f19b994985a4fea30014a4cc30224cbbbecb87aaee6d7fe35dc',
'b30654f46f48ca9b5fee9aef0f8b11ef383cedf31f27fd7ff1e4bd9f94e3bdb0',
'758fd8a38226ec35cb780821b66e29c61acd923c45022f9175a8755a37bcaf74',
'bf2bfc7f63617bd249cd0fd31a9123478030dc3af09252ac83b6a157e5914ea7',
'd0538cb4124f36540a0fae62ba9f8f16858b96c4137185770b9fe75b6fad15c3',
'373335c0406a548a1130131ce75a3a1b9288214577928ae1409b6a1f1648d3b0',
'b736401fa9073ec26ea14803cd52331706819a603b796460079bf5c2fa6fbb4f',
'c18e2018f711b8b35defb6a07b2d5dd9b524973eb4bedfa48c01529509c2ce86',
'20ff48667161a4a1b6c88e5b7fbedc5cd6b22d1a05eeba9fdc7ba48f8ed45b58',
'911aa72f5ab4ea7301e1467de6169685a3b42734a1710ca1399f264e34e96f03',
'efb67016b866d1f1277923b1dca8505299e1ee33eec96ef1bf2d2c3a5b259fa0',
'371e01a19bdb638dcef41a6bd43c764e55228a2b64be18f2dd24aed0cab2dfac',
'e1d888650d060381ac43e2ecaf4ef55d413fc55e431efe1ebade4c5aca5fd2fe',
'113738c895c379a5c79ec047e38c6c28203b246a47313ac1063a978b89f94e50',
'9d3812ca7e216bd248b5ee211fc1fc5498b580d621a42a3b83a87b4522c6af03',
'cfb39e8962f78d104e5bc67c791af6dbc14f674942a452bd41fd6f3db2349478',
'435146bdd8f82c83ec29b412c1ec3e3e0799d2e9cc938c98a37eda42bb41d962',
'0050ac9c39cfc9b58a799bcc4b9a2a35dd9a7369b5512e744f87ba3efeac1c47',
'0dfc2c3a3acbd70d2a261c0fffee7332bfe1c7aa5499478284a7f27b9ca8a296',
'132107cef881faef6d6e69c78549d6b9d0d4f8447f468e74236c4901026b4563',
'c0b192ec7eba73b4627488d8a8c90f03293a9b4bb576760bc0fd0650b33582bb',
'8c59c194a949de2194a537c528a0c8d73f3ff0e676da7d68712042e138e48117',
'e0e11a2c1e63989f96d242eb8df84038d2e9070322cb09dbdee4a03eb983f8a0',
'4477274d9efdd489f9864b54578c93c1a038fd3af77bc2ee11f8514289445e6e',
'0d07c3cb1a9759aecc0be2a122503519ab61ed341cca8ce64818ed5fcb0bb154',
'b7b628b3b2f049a2812575d6294e8daa5d2a52aeb705002cf93a2a55cce9c775',
'09aaed122f6ba577383737e61bccfdc9d1b9945a09486f3b4ec410d04e6586d5',
'8ae3d58d5160818cd126654dc96755226dd654b2f685f67ee97ed7543d443a8e',
'7b5dadda416bac68436df415d77768b013c84e89cfef8deaa1ed70201eb5fff8',
'6646ab87635ae4de3d81725026a8b83df5368630c8328f9010b33eff43ff6b32',
'43fe12deac4da749119a31ff2cb674b0efda3c10984a63209e68f8cabee2626a',
'18ceae68e3126cec8d30a5e0d9338b623f65fe3a5658cab5d0d03ada4e83d237',
'e190fed560cc9c718eeb8fa52e4827aba78b717a558215a13ae35123440fe9d5',
'32c6f0bcdba6215b5c85ebae97443fe653cc95b7c0e89509c1a3fc34d61aacd7',
'26e753e005a7497bd8c4017e4f1b7fb398beb440a0d28cc9654ca9f52b51804f',
'be4dcd78dbc02c7a44a316ea923353049298607f7fa0cd414518de63d8f81a9d',
'c0e914278dea6c6f3426d7899b3ae9200efa23f90eb1dc8f47ff043dcc344cb3',
'94837b32b562312076ff2363a8cbc5aff83c9df1e8bf7ea5f43962213b5bdfb9',
'c1d514a99a1f886247c4eb470daa484b0321b74e98800277100757b0eec865fc',
'f27ece52b6239ff75fe8ecd87ffce6fe86e05e994d534e4479f0e4dd8b84005e',
'4c4e778612754514ebaca47cb83d6e31fd73119bfd0579005865971d2ca5820e',
'7f21a8a4dbc8f1ba0f1ed43d11e81a06b838ca45fd9c8309aac65e9d90c31d3d',
'bfc6ca76f752bc610de98979b7c2807a65811168f2f100e3629d92834c66894f',
'd4aeabdac956e8748518cf5ec81c4241818a949f9a245ecc9467a1028bdce067',
'ae0b28ece9405576aba65af6af518693182c47991ebec1f9c1e1a984330b8d8d',
'2ee869c3b38abedbc5135e9bd046f35a53848555b3f60d49483af33d715fa509',
'86b492e63ee9e2575d769a22754c2e5f5e4e4b33596c36bcd7498adb5ef334c8',
'4b913a1f922d3d5d7501cdaef12a94aa2faf0536c5275cbd5dfd6b4f22778d25',
'd23040ef1d0b9ce6c74874359ea7c3df04d660bfcc79a985cab549a70c3c525c',
'5d0ac371f486fb0d8e623a79b86f07d901e954f00d898650738e40bf957aea97',
'fb31627b38b6ca6a14e29d9ea0ff6e6f3ae523c81fadd4b2284427b3209959c2',
'b784881e44eccca4dfd0b26102812b4dea2cf2f54703f3a89866b9bc31968de9',
'03d17255f58467e24b27dfd8a43626d17d7d009a27e7f6b70c10462529a65f83',
'0811cd92aceade2ce0a1365b696616fa35f8c79f4ffddc5982240a591f6cf9af',
'f9fcdf1af14ef516e38df59db89972d2524f5d6e89efbeaf426058318b780f0c',
'7439e583038fc0043f2d8f3b5bc59c2fbf466d7a7b21869ea68a853e44508b4a',
'fd7bc48f01a76192ac62ea2c1c491ea84462d458e71489a90a5a0f18222f8ab9',
'b7f3c7200936171e6689499af090dd52f822f5b1e286c6a00a23c3405880aefd',
'e2e14b5338c1c5bb75b92091e6d1c2467fe4d5c23305ffcc28a74d94ca5c5d41',
'8c5e81e887d22bdc65c717d66be259e9ecc5f7cc79cd238a153ed11b35300015',
'30124851fcd1a96dac9f7ded449422863323c7690028de8ef02642e1fabceb6b',
'136190b46c6dda20cb9348b1324ddc770c4374470c771694ccf9a1636a65857e',
'e7d81232b177ad0fb0f06c38a7fcf105ecdb2ca31d8b7ee7b84ecaf7f5ea412c',
'e262fc5c699046fd4d2e61904c6926f68474a979efb5f751746b8a1711598f32',
'3b56b4afd7d51221a358371cb50ae5119910dfc1c0a789c1565aac3e2ba1b97a',
'58748c880c63817126c3919b8cb6e78644ee66910b6c6976d6ecbaafb807efb3',
'ea7c44b184c1ab4b623dc058469ee48131f8e67f2ffaa31a9689ecbe076f4057',
'5c567e078436c3412b0ffa92cf2f673c3075a4f943bd7652e7a048bb6e9a5ee7',
'c619b5813aadc03fee0adadb87e53400a583da5bcf733ae9e4d11eed3411fde1',
'c0effaaeb8e6bcd9d14a0d0c526b593dbd9c32294f50b878b53e7000eb36d895',
'6ce61f91676cd0ac8994751ba3df3a30622cfdeca4de378d8c586b2a8418b449',
'0b890907478710469c7bd613a538edd60774bc4a059084deb6d060f2d786b705',
'2b0bc19c04bcdc145774a3c334354c1e3addc263f5a2c22f2fe894014bc95d7c',
'846d51b1f61408ae5590a96b6a26e961ec0ba7b28d59ae890e27cf7b133dc2b0',
'9eeb4642075f1f40431edfb8bd7f5f7ef38f41b81f3d073f5eced4109a482b1b',
'61bdb8c2fc8477c45e7908c86208a7c003e4244876131c464e093deb6261e0be',
'c11412a4f5f7437020e38ed64090c0ae5382a7fcad7262d9295257e34ab12635',
'3f39fdda07a45a5eac1143b6b815c8623fc336a690d66c76c2a93cd846a7668e',
'0ad88dca2b2afe74101546e489a6dd104974052170874e37dae85663695124e4',
'15e9096ac29a2653403dbfbc99f6929782bc1f16af28556f2dfadf79b756bb7d',
'f138855239dca602340a50030978d03ba704fb0bc61d1b299a363106d0dc3260',
'9c2716e1594406ec028ef4695c1d7c3e5c80e331669831e2cb25c5c5fb97162f',
'66fc7e48b798c398304f0e9a043d7f377d88afe40909e66fc7d6951909e9d722',
'51e43ead8ab0c212e73e4c287e59eb80165b3b62fd81f389a102da084d9a6360',
'4201f2934aa8bc9ba0875c7836a1aeb5c995f0911459d2bf3b70555bd4a8ea3a',
'c2c453b843fe65c8d5f93efbd48cedeef694213eec309b7edbb5f7ab12ef0a48',
'0101f3e247f87245c2ad87d9a3d5e716910dc56cd5558c62853b3dace9793915',
'2c40e1b0c7a589c9e3c6ef22d45896cc3ff528ba992666446d1be758d2a56669',
'327ac9e4387dae2bc937e3f5515ec0d0f5ddfcda1c5396c3e037f04f3981ebce',
'862ab19c59080857e3f0a876b71a9919e84db5f41b05849e18e5b6d2b42eb729',
'264116ba9324865db49ed60b42628446324248529c8c30b0c363686db1f337bc',
'e162bd9d72bea703a070feadcc3be5d473f655c7a2918ca43da5c83f719a9702',
'54836e87868ebe0538512fc4a24554e1421418f8b9239725b0a33f2c1e1f1967',
'e4836e55a0f1e8d00f4b3945acaa9e22a797d478903e94632a34e1eda4ab9ba8',
'6a6c97cae4acd89b54058e73ddff200c8c2e06b969a88debdba23be4a9f86a72',
'5507dfe3b5b641a6d6d1c57c9de3e34c005def34328ca049645fcec8a2b06198',
'1e548aa5cc32f8b3ea2d5614b13b5c1a17f03782f325dce0f5dd51f1bb48f082',
'3e11c6bd4c6db6c2e9dc380d476ba6b141d63bf3dea0dedf7e7f8e52ffa7eedf',
'5dddddfe733044e264107d4695b5f0a11cfa8e2c7c621fb71c24495f2328b89d',
'38ab6ad7bf34bc3eef3e92e2d813c9268c7c086d9c2f30a86769e4b2ff55d086',
'd9fe8bf434e478d2b73aa3207292ead7ef7b572dec6a6a728a88363b6cfcc0ee',
'1722415da7171fd9c51e03546390976f39cf176a424f58dfa5224f0258e28917',
'310d89a7cdb6426959dc1f758cfef98373c2e8730ab1e01eb59278817971c2c1',
'678873bb94b83edfba54763903371069dcb75923881a20a7b8a1be3347ec8d9e',
'541e9b8a75e90e1a4b665416ddde642f311ad5b53b9b3287101b8077a75ec293',
'148317234b85cb56d6ac8a1634a0483fda1c2bbcc30be11a769d0138b2ef804f',
'd7b0d73fdd71520aafc503b332118e389ece5130c98819f6cb7230ce90431710',
'e5c0b81a68d5138b96b68948bef28cd3d1688c24091930d098b5244c9663bffd',
'496ab5c68f0cf8785772776354b1f6a437d9268a906df9d9e4d3d50bd01134e2',
'feba44c2cbc897978ba2f695d3ee36f4c323f65d0f66fff5ffdd081c7a7fde2f',
'68304bc51950d7ef374cd1a76306e50abef6053d2dd63a10f9085078b8f0bc49',
'1765cd9d1e4fa78a46b446150bce739d59e8a8d4231b8590a421c4b940bf0e0c',
'e503c1eab1b363dde76aa6b03c2811b1ab3a0c1ea97538a8da42d18f08387bea',
'296921fe27188fa0c41c93c84199f01220fc365c1c9d30090462b1d0117072de',
'981477bee7e4b40c939578f5729d5175f65e4302f2cfe516a40d64ed09e4a588',
'0ba02185aba3d4a05f6daab742df7803969616fd0b73d2cffc2edce3c956b498',
'c5575fb7e9d6e81b07e9562cd2746776660eddb08f6f61f00516448d51153ae6',
'255d4b90d98e894e18700b4b04cfb5d39e146c99e45e7bf1c49bbf1f053ba753',
'c7f8040c34f16f513858788b1321794011a0d6eda697cae0ac3835fabd1eaf61',
'b9375cd1d3345c54821e4095978ff4905f3c87516b41bfd9613254c1a4410725',
'46172ea022f1512c3e54a97ba67fd188087ed2a62db64c0002731bb7d216a44b',
'2eb7e33ac232cf0d1b1935637766155b5e82da97c131e482ec672689ce7bdc22',
'eb84479e369c2832540adccfb8df197be83cf71be59bf42839c4ba2ee94a2726',
'cfa4e2f221afedb5298bfb9b73076a9bc7eb66a6a9aa49620bdb11166f344bd2',
'857748ce5442b23ceaac29ad62a97a9c34bb01eaec23a3c96b564a9b2a6faa11',
'b2888e0963e492904e8bdf6caa23b6421fbbef19e8d672394c79d7cf6981b05f',
'14a2a343fa938035b4133f6c81140cbe411aa3237d0f47134289aab14469f67b',
'213d8ef960b10abf9ea8ff956ba4150e9c94883706f03e3ec440ab6facd36f1a',
'1591cba4cea61a0d69e5024e64bebdaf7c1f2a7a0476da2346d3bd3a6e62fb6b',
'9088338ee27230d0bb2850515d19ae734e5398eb71e48efa22dfd1f33b0ac1c7',
'a8faab274d2e8c571e4790b884e06ab4e9db268edbc2f4460020ba12151aa58f',
'07015d49cd5d37093b37aabc418ae3a5f57b578f4bb6f4bd468dfb9ef0fa6fc7',
'83026b2c3e3b3b2a9bf1c979c4e24e3ab285bf4bd49d0389ac6d861149816dfc',
'c247d3a1813e2aaf5dc4b9b355df78ee7fbdc58cd4ec11035332d42e35ad1839',
'4a164188522a932da9ba4f7998a780d460508c23cb3138bf29f111655d756ae8',
'6e449b3cb2649a5758312d4d046da7d74012e7f0f800bf1b21b862dcb13713cb',
'39d02a499567b4ce274f3e78d19c4ba8fc630b8b452f66676c36ae5bd129eae7',
'dd55d17588191df656d2b56c4fe3513cfcebbd264207f989eb1e9642ac4943b9',
'9788761a44f65025116de0929a95213ed62ac3b25c2af26af77539c5b3b7d03f',
'6ddb4e3b5f6ac71c8df76670ebb7b78db4dfb979f9badf97b964a1922ec64d77',
'9f5553bd20d24970aa3b9a53a5728132b30149cb445c3e52a42e1eb5d9189c61',
'bd34190b4e6cccfab911dae86996a3db0594e0cb4d5384800510ee9235253760',
'994a31c57cb91196e7ff420686550362675e812897030fe978ce3c9859d7a76d',
'8845b358fd2d7fe653498a08d8cf9fbe6ff13f44f1ed7bb1b4bd78ef3909a32d',
'73a455d7ce1be764008a597e6b556ee6afa2b743c3aebb1f7ad16f5f8eb9cfb3',
'f5fcbad4666b0349c9664fc261425794a1827f0c7632d9c8104d978a1db3568e',
'55dc0bb559fa07826c0d1f9fe48369c2abecd1b52542e24dee33abd2f96fe7cc',
'd672c539969123c4088e6d25a3f4509bf28e8ec443fd7a4c53b26eb210b70c41',
'70cd626927ecfb651db2d0c0aedfb02b0f1eb06f95d11393fd1f3c3af1790d0c',
'5d3d0f08c731d1427265dfbbc0f329a3eb267a61274f5495e6158a9c9ec05237',
'8a8bfe687574d3839b0bf3fdc35bd740a773d56e3caa5b15bc9f5f57a2c773ce',
'7a640304a315f2eef62a277a70d59502203cec5daf41f77e8432ac440cc23550',
'25dc221fd56496a66b788799ccdf4138910e6c5bb48f1b5a95ef45e858e188d1',
'1f9b19e701d568572e8a99c9f7439e14469725b61869c1c9fc9883dabeefd531',
'70689492d261e7feb11df9bb974595271c4365281dfe3e7b1926f6eea32472e0',
'a25ca413d907b719573b7c353827fd5025c47e41f946818a1a7abaf3f2f7d9f9',
'76fd9cf9e15cce5d5d86e16aa36114e2fdf47a322e50b067085d01625a2e9780',
'a53c03e7a2a3aa5cbcfdd029f0a7d6a3553d38e632da31acb0a0e732256aeb70',
'cfafb9fc0b68995c0f83a7deb8431d654cee9f3a324c76fa67ee053f95070abb',
'cc7975367a5226e113e559cc182301454d3b9a35d24aee03f46da6d7880a133c',
'c3ebf1be04f98d3978de212f1becd6092255532632d198c196c96d0bc60ef1d5',
'862393e19eaf7e807695c74242b99d9e82bbf47a0172623bd1440ce764bfb5fc',
'ac2bfdae3f344c36b0f995b27d406676b2220fc65f110ff446a3a4b7643b8988',
'eeaff138ef83aaec3d3d78b23fc8067f55256546b92c2e9973dbfe2e8e15cc5c',
'6e9c61f414f69eb0d9e8fc17b86e044652e0dfc396a0b739729e967982a2c85d',
'581ff52a022555cf1c594918a23cf1f243092091ba65794c81e912ff08dddb07',
'1c549757678df0b38ecb0cc560f628c4cc44762149ba0549793108e6a71833f2',
'3ee5e5917a9dd02f526134c3a15cd0f2e0e74853d8a5ae4a06d89093bc6399b7',
'a9a0e853c315688210b15aad2dfb4c55ecd71c8d86dcdcf94d9c30e00c25fc5c',
'5959fc18e2a0925b4e72b7343d20275f08b897645f1a5c5a2a41b1dc4d6d9f93',
'60acb14b96e25e33a8c1cac7c55d86eea40710e580240007d799d53af1620314',
'd609cf74ddb3c0d6b2b0702edffd4a024dc6a6fae0bf0b1439a164a0d566f200',
'4ec0d4056f06ff5f3388a91b4e897a2098f9946d7ad505761dbc1368e2f7de2d',
'c72fd3b3ab66cf55c3699e9e91c618ef3592751de8bf4c6d9708de50d4e0e664',
'022fa1ffe2f2572e54fb978fd4b7d7a45919052a7ec660d2b311b9540318748a',
'16fb281341c2849495ce25c20866b6644c4c3975a0200152d5e02241a3eb70f4',
'be4b59c62a43b8380bb4a28a8a98dc4892aad1bbe194a61ab8e8c2b9c9b4f33b',
'021637ef925d579a5ba23d0f4a773fc0e0bc7a64eaaadfdf823425cd5badb0a0',
'2e3dec892b521dce2cd3e711d3c4f86caa99b27e02d3031c127151fc35987795',
'd520c50fd482e01c7a41d0a9c3699b13d3f7b197c6e55e4140f393950cec492a',
'72434c2fc709cbef605d1146ed0037d6b9878c6e6bcb87790bf493ca7efbbac3',
'b2949a5b988671512e585e2a0d8f7f214a21b982dfe275cc9a8779b3984fc488',
'453f6408b5a42fbb7541a1cc7153b404389c45811a389e9d642658b1fa89267c',
'5dfe29822839b5571f0e5360c8f602943dbed1b088a4522a7ebb55de8ba51c59',
'aae2840c4306438fe85034494af33f9fbb596fa1f07a397d4ba8140af96e0113',
'01b83421144128da885ac98a442de3649b49e2bed15461e67b2374a84bee23cc',
'f89316c7aeb590574670061c87a5a0053d33651a7dec36c25fd794f43cacb263',
'df5248ecf9052be91c178244109f9a4b02dee081bcf5cacf6b9f2165d0f9dfaf',
'e8bf0e5a433a48d2a2ea54f333408678953c49d419fc282326d41571824bbf89',
'a7f1f17a6478f4fa5b4eabcbd3806bfd91689ba5fc6005f750214c3bc31da911',
'6deff0178f9de46e8f6d26f5ab29da9d51d7e52d2e6fdf319b4ada63199f8f3d',
'4602a8425e4eb4bc68c53e4c536636b141454b7f2459db6c621f465f75d2475a',
'ea91176b4620b24f9168d39e9ea531dbc36f940c1dd8a68d6b350dbaf38af565',
'266a6ff8c2f1d53f2ac8860cc1ae93c56365c4f0d0611912e2d0c8ecf66dc8a4',
'c930be895a3d36819db42b66631293e5948606ac1fbbcd11f0a25a114fd3dda6',
'00f5444a55249ea03c0fa37ae33dcbc677a11c33ede78ae9d03d34d760221a02',
'5193e99074f047cd4a0d5120117c9ca8afaebb39ed71d6d279c3c7ae5dcf3016',
'fee1306121eb5fef98cb5ddbd816e7277da8d126b35a4af11dba02bfc6980484',
'b8d57d17452cce309f5d3248587816ec8c7f3d1b1afd4cc0c1ebd0e2c76d5612',
'c83f9edc964f68dec2b30b556697e4a12a0e51d8367dff1a75c811c024486b7c',
'9590e10f7f5efc81a73af93940ead57ad1af072c8228e162a36f7eba9e7c5d22',
'eb2da21145a4f8770984f060f60d30ae4c864f78839ebd8aa348bac573012975',
'22a81c094bcc46f2fbcda09c0f8c47ba787c343203c1215ac6befb6fca36d448',
'2ccb0f72ba017fcb3a67646b5b9c09b6e95a687191246ab85ff2942fa08f35b4',
'be54d341de00257168ca55a60310b3eb1925b1ffa828645997ac10cfa3dd2d60',
'fe547c092ec8c57414fd395557f6cb9fb8600d01c6661c0d5ee1ad53d1ceee77',
'03c0f367d62b3ef973e9b430783b82f9d86c210270df77fd261c8af9f2315b1a',
'1f62b95430a392f0a61c990d4741150a78d0d4d6e3a8fc2766357e6b9b43dcb3',
'6052719de0aa56da836eaef1d07bb7b089dbd0266062de94e849713d9e6870af',
'306380dceab040faf3011443b94d7263e9ef7aa540a6e0587ea0aca37b0c97c7',
'23db78be0c1705b21edaa40799a5bce949b6ffd4bcb9456ea03cff375b732b2f',
'c88c652ecea89bc153ba9e4663e861166bbb139b51cac9d323c3975536181fa8',
'3821888e4873cefe13a2dafd69da4e138ea7e035d34c11b5a3921428656d96cd',
'e63071ee2d02b89fe2014c1846d928c8b2bf4e9bf44bbdf66113d3639ca61fd8',
'056c40ba414510cea4535b09f6542db2c48ea7b37ced6d31f73ecd814394ca28',
'31bcdc29f6dbe713f80da320d9a5349ca6e73b65cebfc7d04333809e22060001',
'a0a21bf0e0b2d6a680af6d86e41eb0ed488b63bf84a4800d271c37c45c03c5ff',
'f0f90d486ed5c10c653b6ab052cd10c00b69da7bc4fa8b8eac913ff88defd916',
'113ab4ea34908d4f3d46bca4f635328c8bc3167d130944862e35ca11ee65db15',
'a733b405d26d7ac6d1b153593caf44785fc380bc2fed028edc8865ee3202ae36',
'a8fa11b0e8bfb66af7e07906d85758cf0aa13719a2eeaa366d2f31d77c4b0a1d',
'01656cd1dd73f9291e76d14a4b304fcfce530a4196dcae8f0202b2a3c393c71d',
'5a0db0aa66624808966619899647a8e82a115216c39a757cfb93142d3345595c',
'2ee47b8b08bebc2a8efce82361864ea1d4bba1012b9dd1e306101c5feb56ef98',
'6053dccfeb410a58d40f2a0abb18e0e51c3b92a5030a3624b077cb7fd869f0af',
'52350ff5e0a02178ca7663120fc6b1bff199df50efe3da70b5924af3676643c0',
'43140b881faace580d38dd7c019154ad53461247d1f6e9555cad98e9937899cc',
'f221dccd967d6a87a02f47596c8bb5ce8a0385d1911ecb214cc19bef157a5053',
'bbc204e5b1bf9412a3c33b338c8c058f7eebb820a73af5765a3adbde12811c64',
'f7722b1b18d61571b41258477aa49ada39bc52792cda4e3f9d1b1feb6574bb3f',
'973910fc6c899a9accd7be744aad73be3a08f7280babf11ed46ac3c2f5b8f8f9',
'3937c73359e5469ed3f973f11a631501abd5534067253c1e9c5524e5e809f84a',
'f3b2ab0a62c7fb9ee4ad82fe3363d548470bbdda8bfde6f7b1944f867d4b9f97',
'031393bd86192ba25067cd36e61eec3fd55272deb0cef573078e92b18ddd041e',
'bbc69f069cb1a180bee6ae08be9a34b990f40bb086612ddee0c9bf116cb099dc',
'e434456f7bc7ec9da8bb8a2e44868f3c43996687e2fd2bda4faafd5348ce3ceb',
'a40434c6965740e17f45ab96907707e04c44ea18d048f3304cc960114324fb03',
'2f73168c65bd3e3758a993fc2cee9a4e0b16f4f87c8055a016be78f6a87eba8d',
'9c69b9866a907ccdc1d39b7a7e567e2e3ac57137b98c9ee1bf4f25d45421f029',
'3432d914cd22a16a5afe176997e71d08504e577c1ac6c8e2f451f493c900b063',
'9628128605aa2e33fb0c8d46892ee8d2000e3d59c769034124916edb1981f462',
'7f4081fb9bb7cbe522f3575895f4e50aef87dfa51603050c46de7e047bee1b0c',
'4aec53f4690e74500449f0f6d86461b6811b86940ff5c368f7579e9bd3cae0ab'
]
var ik_arrayCounter = 0;

const staticRefresh = inputHash => {
    //tokenData.hash    = randomHash(64);
    //tokenData.hash = '0x' + inputHash;
    //tokenData.hash = '0x' +  ik_hashArray[Math.floor(Math.random() * ik_hashArray.length)];
    tokenData.hash = '0x' +  ik_hashArray[ik_arrayCounter%1213];
    ik_arrayCounter += 1;
    console.log(tokenData.hash);
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
      cmode,
      sameProb
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
    tokenState.three.uniforms.sameProb = sameProb;
}

const refresh = () => {
  tokenData.hash    = randomHash(64);
  // tokenData.hash = '0x' + '8f3e22a6e16b94def6a08b191a45b361c0a3ee7744a3fcb8ee4ddc43036ee372'
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
    cmode,
    sameProb
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
  tokenState.three.uniforms.sameProb = sameProb;
}

const run = (tokenData, tokenState) => {
  if ( webGl2Supported ){
    const renderer = setupCanvasThreeJs();
    doArt(renderer, tokenData.hash, tokenState);
  }
};

window.onload = () => {
  run(tokenData, tokenState);
};
