const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
  2: .05,
  3: .05,
  4: .05,
  5: .05,
  6: .05,
  7: .05,
  8: .05,
  9: .05,
  10: .05,
  11: .05,
  12: 0.05, 
  13: 0.05,
  14: .025,
  15: .025
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
  if ( isMobile )
    maxPointsPerLayer = 5;
  var maxLayer = 12;
  if ( isMobile )
    maxLayer = 2;
  const layers = R.ri( 2, maxLayer );
  const post  = R.ri(0,100);
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  const pointsl = 10;
  const shape = selectRandomDist(shapeDist, R.r);
  const speed = R.ri( 20, 150 );
  const size = R.ri( 100, 200 );
  
  var level = R.ri( 2, 7 );
  if ( isMobile )
    level = 4;
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
  uniform vec3 iResolution;uniform float iTime;uniform vec4 iDate;uniform sampler2D iChannel0;uniform int iInt0,iInt1,iInt2,iInt3,iInt4,iInt5,iInt6,iInt7,iInt8,iInt9,iInt10,iInt11,iInt12,iInt13;
float t(in vec2 i){return dot(i,i);}float f(float f){return f=fract(f*.1031),f*=f+33.33,f*=f+f,fract(f);}float i(vec2 i){vec3 f=fract(vec3(i.xyx)*.1031);f+=dot(f,f.yzx+33.33);return fract((f.x+f.y)*f.z);}vec2 v(int i){ivec2 v=ivec2(0,0);for(int f=0;f<iInt9;f++){ivec2 m=ivec2(i>>1,i^i>>1)&1;if(m.y==0){if(m.x==1)v=(1<<f)-1-v;v=v.yx;}v+=m<<f;i>>=2;}return vec2(float(v.x),float(v.y));}vec2 f(vec2 i,float f){if(f>0.)return i*mat2(cos(f),sin(f),-sin(f),cos(f));else if(f<0.)return-i*mat2(cos(f),-sin(f),sin(f),cos(f));else return i;}vec2 i(vec2 i,vec2 v){return i-v;}float t(vec2 f,float i){float v=length(f)-i;return v;}float v(vec2 f,float i){return max(abs(f).x*.866025+f.y*.5,-f.y)-i*.5;}float r(vec2 i,float v){return max(abs(i).x*f(i.x)+i.y*.5,-i.y)-v*.5;}float f(vec2 i,vec2 v,float f){v-=vec2(f);vec2 m=abs(i)-v;return min(max(m.x,m.y),0.)+length(max(m,0.))-f;}float s(in vec2 f,in float i){const vec3 v=vec3(-.866025,.5,.57735);vec2 m=sign(f);f=abs(f);float x=dot(v.xy,f);f-=2.*min(x,0.)*v.xy;f-=vec2(clamp(f.x,-v.z*i,v.z*i),i);return length(f)*sign(f.y);}float i(float i,float f,float v){float m=clamp(.5+.5*(f-i)/v,0.,1.);return mix(f,i,m)-v*m*(1.-m);}vec3 r(vec3 f){vec4 i=vec4(1.,2./3.,1./3.,3.);vec3 v=abs(fract(f.xxx+i.xyz)*6.-i.www);return f.z*mix(i.xxx,clamp(v-i.xxx,0.,1.),f.y);}vec3 f(in float i,in vec3 v,in vec3 f,in vec3 m,in vec3 y){return v+f*cos(6.28318*(m*i+y));}vec3 s(float f){const vec3 i=vec3(.277727,.00540734,.3341),v=vec3(.105093,1.40461,1.38459),m=vec3(-.330862,.214848,.0950952),x=vec3(-4.63423,-5.7991,-19.3324),c=vec3(6.22827,14.1799,56.6906),z=vec3(4.77638,-13.7451,-65.353),y=vec3(-5.43546,4.64585,26.3124);return i+f*(v+f*(m+f*(x+f*(c+f*(z+f*y)))));}vec3 n(float f){const vec3 i=vec3(.0587323,.0233367,.54334),v=vec3(2.17651,.238383,.75396),m=vec3(-2.68946,-7.45585,3.1108),x=vec3(6.13035,42.3462,-28.5189),c=vec3(-11.1074,-82.6663,60.1398),z=vec3(10.0231,71.4136,-54.0722),y=vec3(-3.65871,-22.9315,18.1919);return i+f*(v+f*(m+f*(x+f*(c+f*(z+f*y)))));}vec3 x(float f){const vec3 i=vec3(-.00213649,-.000749655,-.00538613),v=vec3(.251661,.677523,2.49403),m=vec3(8.35372,-3.57772,.314468),x=vec3(-27.6687,14.2647,-13.6492),c=vec3(52.1761,-27.9436,12.9442),z=vec3(-50.7685,29.0466,4.23415),y=vec3(18.6557,-11.4898,-5.60196);return i+f*(v+f*(m+f*(x+f*(c+f*(z+f*y)))));}vec3 p(float f){const vec3 i=vec3(.00021894,.001651,-.0194809),v=vec3(.106513,.563956,3.93271),m=vec3(11.6025,-3.97285,-15.9424),x=vec3(-41.704,17.4364,44.3541),c=vec3(77.1629,-33.4024,-81.8073),z=vec3(-71.3194,32.6261,73.2095),y=vec3(25.1311,-12.2427,-23.0703);return i+f*(v+f*(m+f*(x+f*(c+f*(z+f*y)))));}vec3 m(float f){const vec3 i=vec3(.114089,.0628834,.224834),v=vec3(6.71642,3.18229,7.57158),m=vec3(-66.094,-4.92798,-10.0944),x=vec3(228.766,25.0499,-91.5411),c=vec3(-334.835,-69.3175,288.586),z=vec3(218.764,67.5215,-305.205),y=vec3(-52.889,-21.5453,110.517);return i+f*(v+f*(m+f*(x+f*(c+f*(z+f*y)))));}vec3 h(float i){return vec3(1,.25,.0625)*exp(4.*i-1.);}vec3 h(float i,float v,float y){if(iInt10==0){float c=f(y+floor(i/v)+555.),z=f(y+floor(i/v)+666.),w=f(y+floor(i/v)+777.);return vec3(c,z,w);}else if(iInt10==1){float c=f(y+666.)+floor(i/v)*0.381966011;return r(vec3(c,.75,.75));}else if(iInt10==2)return s(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==3)return s(fract(f(y+floor(i/v)+666.)));else if(iInt10==4)return n(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==5)return n(fract(f(y+floor(i/v)+666.)));else if(iInt10==6)return x(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==7)return x(fract(f(y+floor(i/v)+666.)));else if(iInt10==8)return p(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==9)return p(fract(f(y+floor(i/v)+666.)));else if(iInt10==10)return m(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==11)return m(fract(f(y+floor(i/v)+666.)));else if(iInt10==12)return h(fract(f(y+666.)+floor(i/v)*.025*v));else if(iInt10==13)return h(fract(f(y+floor(i/v)+666.)));else if(iInt10==14){vec3 c=vec3(.5,.5,.5),z=vec3(.5,.5,.5),w=vec3(1.,1.,1.),l=vec3(0.,.33,.67);return f(f(y+floor(i/v)+666.),c,z,w,l);}else if(iInt10==15){vec3 c=vec3(.5,.5,.5),z=vec3(.5,.5,.5),w=vec3(1.,1.,1.),l=vec3(0.,.33,.67);return f(f(y+666.)+floor(i/v)*.0025*v,c,z,w,l);}return vec3(0.);}float f(int m,vec2 y,vec2 x,float c,float w,float n){float z=1.;if(f(c+789456.)<.5)z=-1.;if(m==1)return t(i(y,x),f(c)*200.*w);else if(m==2){float l=f(c)*200.*w;return f(i(y,x),vec2(l),l*.1);}else if(m==3)return v(f(i(y,x),z*(f(c)*360./180.*3.14159+iTime*.25)*n),f(c+1234.)*200.*w);else if(m==4)return s(f(i(y,x),z*(f(c)*360./180.*3.14159+iTime*.25)*n),f(c+1234.)*200.*w);else if(m==5)return r(i(y,x),f(c)*200.*w);}void h(out vec4 m,in vec2 y){vec2 c=y/iResolution.xy,z=y+vec2(.5);int x=1<<(iInt9<<1),w=int(float(x)/1.61803+.5);float n=float(x),l=float((1<<iInt9)-1),s=float(iInt2),a=float(iInt6),r=float(iInt7)/100.,e=float(iInt8)/100.,p;vec4 u=vec4(0.);float t=float(iInt0);for(int o=1;o<=iInt0;o++){float G=float(o);int g=iInt3;float d=e*(.5+(1.-G/t)*.5);if(iInt1<50&&o==1)d*=10.,g=max(4,g/2);int I=int(f(s+G+33.)*n);vec2 R=v(I)/l*iResolution.xy;int T=iInt5;if(iInt5==0)T=1+int(f(s+G+34468.)*4.)%5;float E=f(T,z,R,s+G+4.,d,r);for(int b=1;b<g;b++){float N=float(b);if(T<2||f(s+N*G+4589.)<float(iInt13)/100.)I=(I+w)%x;R=v(I)/l*iResolution.xy;E=i(E,f(T,z,R,s+N+G+4.,d,r),float(iInt4));}if(o==1)p=E;else p=i(p,E,float(iInt4));float b=iTime*(5.+f(a+G+5.)*100.)*r,N=smoothstep(.005,0.,E);vec3 L=h(-E-b,3.+f(a+G+6.)*60.*e,a+G+7.);L*=N;u.xyz=L+u.xyz*(1.-N);u.w=max(u.w,N);}vec3 G=h(p-iTime*50.*r,(10.+f(a+99.)*60.)*e,a+8.);vec2 o=(2.*y-iResolution.xy)/min(iResolution.x,iResolution.y);float E=smoothstep(1.,0.,length(o*.5));m.xyz=(u.xyz+G*(1.-u.w))*E;m.w=1.;}void main(){h(gl_FragColor,gl_FragCoord.xy);}
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
    iInt11: { value: state.fadeout },
    iInt12: { value: state.textfade },
    iInt13: { value : sameProb },
  };
  const clock = new THREE.Clock();
  canvas.initialize = () => {
    const scene           = new THREE.Scene();
    const camera          = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1, );
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
    };
    refresh();
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
    uniforms.iInt7.value = state.three.uniforms.speed+state.speed;
    uniforms.iInt8.value = state.three.uniforms.size*(state.size/100);
    uniforms.iInt9.value = state.three.uniforms.level;
    uniforms.iInt10.value = state.three.uniforms.cmode;
    uniforms.iInt11.value = state.fadeout;
    uniforms.iInt12.value = state.textfade;
    uniforms.iInt13.value = state.three.uniforms.sameProb;
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

const refresh = () => {
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
