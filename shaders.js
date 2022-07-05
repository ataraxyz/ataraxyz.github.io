
  function fragHelperCode(){
    return `
    
    float map(float value, float inMin, float inMax, float outMin, float outMax) {
      return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
    }
    
    vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
      return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
    }
    
    vec3 map(vec3 value, vec3 inMin, vec3 inMax, vec3 outMin, vec3 outMax) {
      return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
    }
    
    vec4 map(vec4 value, vec4 inMin, vec4 inMax, vec4 outMin, vec4 outMax) {
      return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
    }

    float distAttenuation( vec3 pWorld )
    {
      float dist = length(pWorld.xz);
      // float atten = 0.1+(1.0 - smoothstep( 0.0, 100.0, dist )) * 0.9;
      float atten = map( dist, 0.0, 300.0, 1.0, 0.01 );
      return atten;
    }

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
      // float ranG = fract( hash11(ss + floor(distance / colorWidth ) + b ) );
      float ranG = regG;
      // colorTrait = 0;
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
      // return rainbow( floor(( distance + hash11(ss + b )) / colorWidth) *  colorWidth );
      return rainbow( regG );
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
    }`
  }

  function vertexShader() {
  return `
    uniform float iT;

    varying vec2 vUv;
    varying vec3 vPos;

    varying vec3 vNN; 
    varying vec3 vEye;

    void main()
    {
      vUv = uv;
      vec3 P_local = position;

      // float offsetX = sin(iT*vUv.r)*1.*vUv.r;
      // float offsetY = cos(iT*vUv.r)*1.*vUv.r;
      // P_local.x += offsetX;
      // P_local.y += offsetY;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( P_local, 1. );
      vPos = (modelMatrix * vec4( P_local, 1. )).xyz;
      mat4 LM = modelMatrix;
      LM[2][3] = 0.0;
      LM[3][0] = 0.0;
      LM[3][1] = 0.0;
      LM[3][2] = 0.0;
      // vec4 GN = LM * vec4(normal.xyz, 1.0);
      vNN = (projectionMatrix * modelViewMatrix* vec4(normal, 0.0)).xyz;
      vEye = (viewMatrix * vec4(cameraPosition, 1.0)).xyz - (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).xyz;
      vEye = normalize(vEye);
      // gl_Position = vec4( uv.xy * 2.0 - 1.0, 0.5, 1.0);

    }
    `
  }

  function fragmentShaderGround(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;    

  void main(){
    float dd = pulse( vUv.r - iT*0.05, 0.05);
    float roots = 1.-(vUv.r*vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);


    float distAtten = distAttenuation( vPos );
    gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots * distAtten;
    gl_FragColor.a = 1.;}
  `
  }


  function fragmentShader(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;    

  void main(){
    // float dd = sin( vUv.r * 3.1415 + iT  );

    // float normDist = length(vPos.xz)/350.0;
    // float dd = pulse( normDist - iT*0.25, 0.5);
    float dd = pulse( vUv.r - iT*0.25, 0.5);
    float roots = 1.-(vUv.r*vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);


    gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots;
    // gl_FragColor.rgb = vec3(length(vPos)/350.0);
    // gl_FragColor.rgb = vec3();
    // gl_FragColor.b = 0.;
    // gl_FragColor.rgb = vec3( vUv.r, vUv.g, 0.0 );

    gl_FragColor.a = 1.;}
  `
  }

  function fragmentShaderMainTree(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;
    varying vec3 vNN; 
    varying vec3 vEye;

  void main(){
    // float dd = sin( vUv.r * 3.1415 + iT  );

    // float normDist = length(vPos.xz)/350.0;
    // float dd = pulse( normDist - iT*0.25, 0.5);
    float dd = pulse( vUv.r - iT*0.25, 0.5);
    float roots = (vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);
    float edge = 1.0-max(dot(vEye, vNN), 0.0 );


    // gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots + ( edge*edge*edge*0.25);
    gl_FragColor.rgb = ( pulseCol + ( edge*edge*edge*0.25) ) * roots;
    // gl_FragColor.rgb = vec3(length(vPos)/350.0);
    // gl_FragColor.rgb = vec3(roots);
    gl_FragColor.rgb = (pulseCol+edge*0.2)*roots;
    // gl_FragColor.b = 0.;
    // gl_FragColor.rgb = vec3( vUv.r, vUv.r, 0.0 );
    // gl_FragColor.rgb = vec3(edge*edge*edge);
    
    gl_FragColor.a = 1.;}
  `
  }

  function fragmentShaderGroundCrystals(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;
    varying vec3 vNN; 
    varying vec3 vEye;

  void main(){
    // float dd = sin( vUv.r * 3.1415 + iT  );

    // float normDist = length(vPos.xz)/350.0;
    // float dd = pulse( normDist - iT*0.25, 0.01);
    float distAtten = distAttenuation( vPos );
    float dd = pulse( vUv.r - iT*0.15, 0.05);
    float roots = 1.-(vUv.r*vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);
    float edge = 1.0 - max(dot(vEye, vNN), 0.0 );

    // gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots * distAtten;
    gl_FragColor.rgb = pulseCol * roots*roots * distAtten;
    // gl_FragColor.rgb = vec3(length(vPos)/350.0);
    // gl_FragColor.rgb = vec3(edge*0.1);
    // gl_FragColor.rgb = vEye;
    // gl_FragColor.b = 0.;
    // gl_FragColor.rgb = vec3( vUv.r, vUv.g, 0.0 );

    gl_FragColor.a = 1.;}
  `
  }

  function fragmentShaderBGTree(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;    

  void main(){
    // float dd = sin( vUv.r * 3.1415 + iT  );

    // float normDist = length(vPos.xz)/350.0;
    // float dd = pulse( normDist - iT*0.25, 0.5);
    float distAtten = distAttenuation( vPos );
    float dd = pulse( vUv.r - iT*0.05, 0.5);
    float roots = 1.-(vUv.r*vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);


    gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots * distAtten;
    // gl_FragColor.rgb = vec3(length(vPos)/350.0);
    // gl_FragColor.rgb = vec3(distAtten);
    // gl_FragColor.b = 0.;
    // gl_FragColor.rgb = vec3( vUv.r, vUv.g, 0.0 );

    gl_FragColor.a = 1.;}
  `
  }

  function fragmentShaderCrystal(){
    return fragHelperCode() + `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;    

  void main(){
    // float dd = sin( vUv.r * 3.1415 + iT  );

    // float normDist = length(vPos.xz)/350.0;
    // float dd = pulse( normDist - iT*0.25, 0.5);
    float distAtten = distAttenuation( vPos );
    float dd = pulse( vUv.r - iT*0.25, 0.5);
    float roots = 1.-(vUv.r*vUv.r);
    vec3 pulseCol = colorize( dd, 0.01, 12345., int(iV2) );
    // vec3 pulseCol = colorize( dd, 0.001, 12345., 13 );
    vec3 col = vec3(vUv.g * dd);


    gl_FragColor.rgb = (0.5 + vUv.g * 0.5 ) * pulseCol * roots * distAtten;
    // gl_FragColor.rgb = vec3(length(vPos)/350.0);
    // gl_FragColor.rgb = vec3(distAtten);
    // gl_FragColor.b = 0.;
    // gl_FragColor.rgb = vec3( vUv.r, vUv.g, 0.0 );

    gl_FragColor.a = 1.;}
  `
  }

  function fragmentShaderFakeShadow(){
    return `
    uniform float iT;
    uniform vec3 iV1;
    uniform float iV2;

    varying vec2 vUv;
    varying vec3 vPos;    

  void main(){
    float shadow = vUv.r;
    gl_FragColor.rgb = vec3(0.0);
    gl_FragColor.a = shadow*shadow;
    }
  `
  }

//////////////////////////
////// MATERIALS /////////
//////////////////////////

function MainTreeMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderMainTree(),
    uniforms: uniforms,
  });
  // let mat = new THREE.PointsMaterial( { 
  //   color: 0x888888,
  //   size: 0.01
  // } );
  return new THREE.Mesh(geo, mat);
  // return new THREE.Points( geo, mat )
}

function BGTreeMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderBGTree(),
    uniforms: uniforms,
  });
  return new THREE.Mesh(geo, mat);
}


function GroundCrystalMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderGroundCrystals(),
    uniforms: uniforms,
  });
  return new THREE.Mesh(geo, mat);
}

function WallCrystalMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderCrystal(),
    uniforms: uniforms,
  });
  return new THREE.Mesh(geo, mat);
}

function FloorMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderGround(),
    uniforms: uniforms,
  });
  return new THREE.Mesh(geo, mat);
}

function FakeShadowDiskMaterial(uniforms, geo ) {
  let mat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderFakeShadow(),
    uniforms: uniforms,
    transparent: true,
    // blending: THREE.MultiplyBlending,
    // depthTest: false
  });
  
  return new THREE.Mesh(geo, mat);
}



//  const material = new THREE.MeshLambertMaterial({ 
  //     color: color,
  //     blending: THREE.CustomBlending,
  //     blendEquation: THREE.AddEquation,
  //     blendSrc: THREE.SrcAlphaFactor,
  //     blendDst:THREE.OneMinusSrcAlphaFactor,
  //   });
  // const material = new THREE.MeshLambertMaterial();
  // const material = new THREE.ShaderMaterial( {
  //   vertexShader: vertexShader(),
  //   fragmentShader: fragmentShader(),
  //   uniforms: uniforms,
    // blending: THREE.AdditiveBlending,
    // depthTest: false
    
    // blending: THREE.CustomBlending,
    // blendEquation: THREE.AddEquation,
    // blendSrc: THREE.SrcAlphaFactor,
    // blendDst:THREE.OneMinusSrcAlphaFactor,
    // });