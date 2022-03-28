const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));

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
const randomInt = rn => (a, b) => Math.floor(rn(a, b + 1));
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
const colorDist = {0: .5,1: .5,2: .28,3: .13,4: .28,5: .13,6: .28,7: .13,8: .28,9: .13,10: .28,11: .13,12: .28, 13: .13,14: .05,15: .02,16: .28,17: .13,18: .28,19: .13,20: .28,21: .13,22: .28,23: .13,24: .28,25: .13};
const shapeDist = {0: .5,1: .28,2: .15,3: .05,4: .05,5: .02};
const levelDist = {7: .5,6: .28,5: .15,4: .05,3: .05,2: .02};

const hashToTraits = hash => {
  const R = mkRandom(hash);
  const layers = R.ri( 2, 12 );
  const post  = R.ri(0,100);
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  const pointsl = layers < 3?R.ri(12, 15 ):R.ri(7, 15 );
  const shape = selectRandomDist(shapeDist, R.r);
  const speed = R.ri( 20, 150 );
  const size = R.ri( 100, 200 );
  const level = selectRandomDist(levelDist, R.r);
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
  const width  = window.innerWidth;
  const height = window.innerHeight;
  const body   = document.querySelector('body');
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: false  });
  renderer.setPixelRatio(8);
  renderer.setSize(width/8, height/8, false);
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
  var fragmentShader =`
  uniform vec3 iR;uniform float iT;uniform int iI0,iI1,iI2,iI3,iI4,iI5,iI6,iI7,iI8,iI9,iI10,iI13;float f(in vec2 i){return dot(i,i);}float i(float i){return i=fract(i*.1031),i*=i+33.33,i*=i+i,fract(i);}float t(vec2 i){vec3 v=fract(vec3(i.xyx)*.1031);v+=dot(v,v.yzx+33.33);return fract((v.x+v.y)*v.z);}vec2 v(int i){ivec2 v=ivec2(0,0);for(int e=0;e<iI9;e++){ivec2 f=ivec2(i>>1,i^i>>1)&1;if(f.y==0){if(f.x==1)v=(1<<e)-1-v;v=v.yx;}v+=f<<e;i>>=2;}return vec2(float(v.x),float(v.y));}vec2 f(vec2 i,float v){if(v>0.)return i*mat2(cos(v),sin(v),-sin(v),cos(v));else if(v<0.)return-i*mat2(cos(v),-sin(v),sin(v),cos(v));else return i;}vec2 i(vec2 i,vec2 v){return i-v;}float t(vec2 i,float v){float m=length(i)-v;return m;}float v(vec2 i,float v){return max(abs(i).x*.866025+i.y*.5,-i.y)-v*.5;}float r(vec2 v,float m){return max(abs(v).x*i(v.x)+v.y*.5,-v.y)-m*.5;}float f(vec2 i,vec2 v,float f){v-=vec2(f);vec2 m=abs(i)-v;return min(max(m.x,m.y),0.)+length(max(m,0.))-f;}float s(in vec2 i,in float v){const vec3 f=vec3(-.866,.5,.577);vec2 m=sign(i);i=abs(i);float x=dot(f.xy,i);i-=2.*min(x,0.)*f.xy;i-=vec2(clamp(i.x,-f.z*v,f.z*v),v);return length(i)*sign(i.y);}float i(float i,float v,float m){float f=clamp(.5+.5*(v-i)/m,0.,1.);return mix(v,i,f)-m*f*(1.-f);}vec3 r(vec3 i){vec4 v=vec4(1.,2./3.,1./3.,3.);vec3 f=abs(fract(i.xxx+v.xyz)*6.-v.www);return i.z*mix(v.xxx,clamp(f-v.xxx,0.,1.),i.y);}vec3 f(in float i,in vec3 v,in vec3 m,in vec3 f,in vec3 x){return v+m*cos(6.28318*(f*i+x));}vec3 s(float i){return f(i,vec3(.5,.5,.5),vec3(.5,.5,.5),vec3(1.,1.,1.),vec3(0.,.33,.67));}vec3 n(float i){const vec3 v=vec3(.2777,.0054,.334),f=vec3(.105,1.4046,1.3845),m=vec3(-.3308,.2148,.095),x=vec3(-4.6342,-5.7991,-19.3324),c=vec3(6.2282,14.1799,56.6905),a=vec3(4.7763,-13.7451,-65.353),y=vec3(-5.4354,4.64585,26.3124);return v+i*(f+i*(m+i*(x+i*(c+i*(a+i*y)))));}vec3 x(float i){return f(i,vec3(.5,.5,.5),vec3(.5,.5,.5),vec3(2.,1.,0.),vec3(.5,.2,.25));}vec3 m(float i){return f(i,vec3(.5,.5,.5),vec3(.5,1.,.5),vec3(2.,2.,1.),vec3(.2,.1,0.));}vec3 p(float i){return f(i,vec3(.5,.5,.5),vec3(.5,.25,.5),vec3(.5,2.,.5),vec3(0.,.5,.5));}vec3 h(float i){return f(i,vec3(.5,.5,.5),vec3(.5,.5,.5),vec3(1.,1.,1.),vec3(0.,.1,.2));}vec3 d(float i){return f(i,vec3(.1,1.,.4),vec3(.4,.5,.2),vec3(.6,1.,.4),vec3(.8,.66,.2));}vec3 l(float i){return vec3(i);}vec3 e(float i){return f(i,vec3(.66,.5,.5),vec3(.5,.66,.5),vec3(1.,.2,.66),vec3(0.,.53,.67));}vec3 c(float i){const vec3 v=vec3(.0002,.0016,-.0194),f=vec3(.1065,.5639,3.9327),m=vec3(11.6024,-3.9728,-15.9423),x=vec3(-41.7039,17.4363,44.3541),c=vec3(77.1629,-33.4023,-81.8073),a=vec3(-71.3194,32.626,73.2095),y=vec3(25.1311,-12.2426,-23.0703);return v+i*(f+i*(m+i*(x+i*(c+i*(a+i*y)))));}vec3 o(float i){const vec3 v=vec3(.114,.0628,.2248),f=vec3(6.7164,3.1822,7.5715),m=vec3(-66.094,-4.9279,-10.0943),x=vec3(228.766,25.0498,-91.541),c=vec3(-334.835,-69.3174,288.586),a=vec3(218.764,67.5215,-305.205),y=vec3(-52.889,-21.5452,110.517);return v+i*(f+i*(m+i*(x+i*(c+i*(a+i*y)))));}vec3 a(float i){return vec3(1,.25,.0625)*exp(4.*i-1.);}vec3 a(float v,float f,float y){float z=666.,w=mod(floor(abs(v/f))*f,1.),g=fract(i(y+floor(v/f)+z));if(iI10==0){float t=i(y+floor(v/f)+555.),u=i(y+floor(v/f)+z),T=i(y+floor(v/f)+777.);return vec3(t,u,T);}else if(iI10==1){float t=i(y+z)+floor(v/f)*.381966;return r(vec3(t,.75,.75));}else if(iI10==2)return n(g);else if(iI10==3)return n(w);else if(iI10==4)return x(g);else if(iI10==5)return x(w);else if(iI10==6)return h(g);else if(iI10==7)return h(w);else if(iI10==8)return c(g);else if(iI10==9)return c(w);else if(iI10==10)return o(g);else if(iI10==11)return o(w);else if(iI10==12)return a(g);else if(iI10==13)return a(w);else if(iI10==14)return s(floor((v+i(y+z))/f)*f);else if(iI10==15)return s(w);else if(iI10==16)return e(g);else if(iI10==17)return e(w);else if(iI10==18)return d(g);else if(iI10==19)return d(w);else if(iI10==20)return l(g);else if(iI10==21)return l(w);else if(iI10==22)return m(g);else if(iI10==23)return m(w);else if(iI10==24)return p(g);else if(iI10==25)return p(w);return vec3(0.);}float a(int m,vec2 x,vec2 y,float w,float g,float z){float c=1.;if(i(w+789456.)<.5)c=-1.;if(m==1)return t(i(x,y),i(w)*200.*g);else if(m==2){float a=i(w)*200.*g;return f(i(x,y),vec2(a),a*.1);}else if(m==3)return v(f(i(x,y),c*(i(w)*360./180.*3.14159+iT)*z*512.),i(w+1234.)*200.*g);else if(m==4)return s(f(i(x,y),c*(i(w)*360./180.*3.14159+iT)*z*512.),i(w+1234.)*200.*g);else if(m==5)return r(i(x,y),i(w)*200.*g);}void a(out vec4 e,in vec2 f){vec2 m=f/iR.xy,x=f/max(iR.y,iR.x);int w=1<<(iI9<<1),y=int(float(w)/1.618+.5);float g=float(w),c=float((1<<iI9)-1),t=float(iI2),z=float(iI6),T=float(iI7)/100./1024.,s=float(iI8)/100./1024.,r;vec4 d=vec4(0.);float l=float(iI0);for(int o=1;o<=iI0;o++){float n=float(o);int p=iI3;float u=s*(.5+(1.-n/l)*.5);if(iI1<50&&o==1)u*=.1,p=max(4,p/2);int h=int(i(t+n+33.)*g);vec2 I=v(h)/c;int b=iI5;if(iI5==0)b=1+int(i(t+n+34468.)*4.)%5;float R=a(b,x,I,t+n+4.,u,T);for(int F=1;F<p;F++){float C=float(F);if(b<2||i(t+C*n+4589.)<float(iI13)/100.)h=(h+y)%w;I=v(h)/c;R=i(R,a(b,x,I,t+C+n+4.,u,T),float(iI4)/1024.);}if(o==1)r=R;else r=i(r,R,float(iI4)/1024.);float F=iT*(5.+i(z+n+5.)*100.)*T,C=smoothstep(.005,0.,R);vec3 Z=a((-R-F)*256.,3.+i(z+n+6.)*60.*s,z+n+7.);Z*=C;d.xyz=Z+d.xyz*(1.-C);d.w=max(d.w,C);}vec3 n=a(r-iT*50.*T,(10.+i(z+99.)*60.)*s,z+8.);e.xyz=d.xyz+n*(1.-d.w);e.w=1.;}void main(){a(gl_FragColor,gl_FragCoord.xy);}
  `
  const uniforms = {
    iT: { value: 0 },
    iR:  { value: new THREE.Vector3() },
    iI0: { value : +layers }, 
    iI1: { value : +post }, 
    iI2: { value : +seed }, 
    iI3: { value : +pointsl }, 
    iI4: { value : +state.sdfblend },
    iI5: { value : +shape },
    iI6: { value : +seedC },
    iI7: { value : +speed + +state.speed },
    iI8: { value : +size*(state.size/100) },
    iI9: { value : +level },
    iI10: { value : +cmode },
    iI13: { value : +sameProb },
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
    window.addEventListener('resize', canvas.resize, false);
    refresh();
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
    tokenState.three.uniforms.layers = +layers;
    tokenState.three.uniforms.post = +post;
    tokenState.three.uniforms.seed = +seed;
    tokenState.three.uniforms.seedC = +seedC;
    tokenState.three.uniforms.pointsl = +pointsl;
    tokenState.three.uniforms.shape = +shape;
    tokenState.three.uniforms.speed = +speed;
    tokenState.three.uniforms.size = +size;
    tokenState.three.uniforms.level = +level;
    tokenState.three.uniforms.cmode = +cmode;
    tokenState.three.uniforms.sameProb = +sameProb
  };

  canvas.resize = () => {
    const { scene, camera } = state.three;
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

    uniforms.iR.value.set(width, height, 1);
    uniforms.iT.value += clock.getDelta();
    uniforms.iI0.value = +state.three.uniforms.layers;
    uniforms.iI1.value = +state.three.uniforms.post;
    uniforms.iI2.value = +state.three.uniforms.seed;
    uniforms.iI3.value = +state.three.uniforms.pointsl;
    uniforms.iI4.value = +state.sdfblend;
    uniforms.iI5.value = +state.three.uniforms.shape;
    uniforms.iI6.value = +state.three.uniforms.seedC;
    uniforms.iI7.value = +state.three.uniforms.speed + +state.speed;
    uniforms.iI8.value = +state.three.uniforms.size*(state.size/100);
    uniforms.iI9.value = +state.three.uniforms.level;
    uniforms.iI10.value = +state.three.uniforms.cmode;
    uniforms.iI13.value = +state.three.uniforms.sameProb;
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
  // tokenData.hash    = randomHash(64);
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
  tokenState.three.uniforms.layers = +layers;
  tokenState.three.uniforms.post = +post;
  tokenState.three.uniforms.seed = +seed;
  tokenState.three.uniforms.seedC = +seedC;
  tokenState.three.uniforms.pointsl = +pointsl;
  tokenState.three.uniforms.shape = +shape;
  tokenState.three.uniforms.speed = +speed;
  tokenState.three.uniforms.size = +size;
  tokenState.three.uniforms.level = +level;
  tokenState.three.uniforms.cmode = +cmode;
  tokenState.three.uniforms.sameProb = +sameProb;
}

const run = (tokenData, tokenState) => {
    const renderer = setupCanvasThreeJs();
    doArt(renderer, tokenData.hash, tokenState);
};

window.onload = () => {
  run(tokenData, tokenState);
};