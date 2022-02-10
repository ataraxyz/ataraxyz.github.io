uniform vec3 iR;
uniform float iT;
uniform int iI0;  // layers
uniform int iI1;  // post
uniform int iI2;  // seed
uniform int iI3;  // pointsl
uniform int iI4;  // sdfblend
uniform int iI5;  // shape
uniform int iI6;  // seed Color
uniform int iI7;  // global speed
uniform int iI8;  // global size
uniform int iI9;  // hilbert level
uniform int iI10; // color mode
uniform int iI13; // sameProb

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
  for( int k=0; k<iI9; k++ ){
      ivec2 r = ivec2( i>>1, i^(i>>1) ) & 1;
      if (r.y==0) { if(r.x==1) { res = (1<<k)-1-res; } res = res.yx; }
      
      res += r<<k;
      i >>= 2; }
  return vec2(float(res.x), float(res.y));  }

vec2 rotate( vec2 p, float a ) {
if ( a > 0. )
  return p * mat2(cos(a), sin(a), -sin(a), cos(a));
else if ( a < 0. )
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
return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - radius;}

float hexagonDist( in vec2 p, in float radius )  {
const vec3 k = vec3(-0.866,0.5,0.577);
vec2 s = sign(p);
p = abs(p);
float w = dot(k.xy,p);    
p -= 2.0*min(w,0.)*k.xy;
p -= vec2(clamp(p.x, -k.z*radius, k.z*radius), radius);
return length(p)*sign(p.y);}
float smoothMerge(float d1, float d2, float k){
  float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0., 1.);
  return mix(d2, d1, h) - k * h * (1.-h);}

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);}


vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){return a + b*cos( 6.28318*(c*t+d) );}

vec3 viridis(float t) {
const vec3 c0 = vec3(0.2777, 0.0054, 0.334);
const vec3 c1 = vec3(0.105, 1.4046, 1.3845);
const vec3 c2 = vec3(-0.3308, 0.2148, 0.095);
const vec3 c3 = vec3(-4.6342, -5.7991, -19.3324);
const vec3 c4 = vec3(6.2282, 14.1799, 56.6905);
const vec3 c5 = vec3(4.7763, -13.7451, -65.353);
const vec3 c6 = vec3(-5.4354, 4.64585, 26.3124);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 plasma(float t) {
const vec3 c0 = vec3(0.0587, 0.0233, 0.5433);
const vec3 c1 = vec3(2.1765, 0.2383, 0.7539);
const vec3 c2 = vec3(-2.6894, -7.4558, 3.1107);
const vec3 c3 = vec3(6.1303, 42.3461, -28.5188);
const vec3 c4 = vec3(-11.1074, -82.6663, 60.1398);
const vec3 c5 = vec3(10.023, 71.4136, -54.0721);
const vec3 c6 = vec3(-3.6587, -22.9315, 18.1919);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

vec3 magma(float t) {
const vec3 c0 = vec3(-0.0021, -0.0007, -0.0053);
const vec3 c1 = vec3(0.2516, 0.6775, 2.494);
const vec3 c2 = vec3(8.3537, -3.5777, 0.3144);
const vec3 c3 = vec3(-27.6687, 14.2647, -13.6492);
const vec3 c4 = vec3(52.1761, -27.9436, 12.9441);
const vec3 c5 = vec3(-50.7685, 29.0465, 4.2341);
const vec3 c6 = vec3(18.6557, -11.4897, -5.6019);
return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));}

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
float b = 666.;
vec3 colorize( float distance, float colorWidth, float ss ){
if ( iI10 == 0 ){
  float colR = hash11(ss + floor(distance / colorWidth ) + 555. );
  float colG = hash11(ss + floor(distance / colorWidth ) + b );
  float colB = hash11(ss + floor(distance / colorWidth ) + 777. );
  return vec3( colR, colG, colB );
} else if ( iI10 == 1 ) {
  float h = hash11(ss+b) + floor(distance / colorWidth) * 0.381966011;
  return hsv2rgb( vec3(h, 0.75,0.75));
} else if ( iI10 == 2 ){
  return viridis(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 3 ){
  return viridis(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 4 ) {
  return plasma(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 5 ){
  return plasma(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 6 ){
  return magma(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 7 ){
  return magma(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 8 ){
  return inferno(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 9 ){
  return inferno(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 10 ){
  return turbo(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 11 ){
  return turbo(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 12 ) {
  return bbody(fract( hash11(ss+b) + floor(distance / colorWidth)*12.8*colorWidth) );
} else if ( iI10 == 13 ){
  return bbody(fract( hash11(ss + floor(distance / colorWidth ) + b ) ) );
} else if ( iI10 == 14 ){
  vec3 cola = vec3( 0.5, 0.5, 0.5 );
  vec3 colb = vec3( 0.5, 0.5, 0.5 );
  vec3 colc = vec3( 1.0, 1.0, 1.0 );
  vec3 cold = vec3( 0.00, 0.33, 0.67 );
  return pal( hash11(ss + floor(distance / colorWidth ) + b ), cola, colb, colc, cold );
} else if ( iI10 == 15 ) {
  vec3 cola = vec3( 0.5, 0.5, 0.5 );
  vec3 colb = vec3( 0.5, 0.5, 0.5 );
  vec3 colc = vec3( 1.0, 1.0, 1.0 );
  vec3 cold = vec3( 0.00, 0.33, 0.67 );
  return pal( hash11(ss+b) + floor(distance / colorWidth)*0.0025*colorWidth, cola, colb, colc, cold );
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
  return triangleDist( rotate( translate(PP, hilbertP),sign * (hash11( ss ) * 360. / 180. * 3.14159 + iT) * globalSpeed * 512. ), hash11( ss + 1234. ) * 200. * globalSize ); 
else if ( type == 4 )
  return hexagonDist( rotate( translate(PP, hilbertP),sign * (hash11( ss ) * 360. / 180. * 3.14159 + iT) * globalSpeed * 512. ), hash11( ss + 1234. ) * 200. * globalSize ); 
else if ( type == 5 )
  return insaneDist(   translate( PP, hilbertP ), hash11( ss ) * 200. * globalSize );}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
vec2 uv = fragCoord / iR.xy;
vec2 P = (fragCoord)/max(iR.y, iR.x );
int numPoints      = 1<<(iI9<<1);
int deltaP = int(float(numPoints) / 1.618 + 0.5);
float numPointsFloat = float(numPoints);
float gridDistance = float((1<<iI9)-1); 

float seeed = float(iI2);
float seeedC = float(iI6);

float gSpeed = float(iI7) / 100. / 1024.;
float gSize  = float(iI8) / 100. / 1024.;

float backgroundD;
vec4 accumulatedCol = vec4(0.); 
float numLayers = float(iI0);
for ( int l = 1; l<=iI0; l++ ){
  float ll = float(l);
  int numPointsInLayer = iI3;
  float gs = gSize * ( 0.5 + ( 1.-ll/numLayers) * 0.5);

  if ( iI1 < 50 && l == 1 ){
    gs *= 0.1;
    numPointsInLayer = max(4,numPointsInLayer / 2);}
  int curveIndex = int(hash11( seeed + ll + 33. ) * numPointsFloat);
  vec2 PHC = curve(curveIndex)/gridDistance;
  int layerType = iI5;
  if ( iI5==0 )
      layerType = 1+(int(hash11( seeed + ll + 34468. )*4.)%5);
  float d = sceneDist( layerType, P, PHC, seeed + ll + 4.0, gs, gSpeed );
  for ( int i = 1; i<numPointsInLayer; i++ ) {
    float ii = float(i);
    if ( layerType < 2 || hash11( seeed + ii*ll + 4589. ) < float(iI13)/100.) {
      curveIndex = ( curveIndex + deltaP ) % numPoints; 
    }
    PHC = curve(curveIndex)/gridDistance;
    d = smoothMerge( d, sceneDist( layerType, P, PHC, seeed + ii+ll + 4., gs, gSpeed ), float(iI4)/1024. );}
  if ( l == 1 )
    backgroundD = d;
  else
    backgroundD = smoothMerge( backgroundD, d, float(iI4)/1024. );
  float layerSpeed = iT * (5.+hash11( seeedC + ll + 5. )*100. ) * gSpeed;
  float alpha = smoothstep( 0.005, 0., d );
  vec3 layerCol = colorize( (-d-layerSpeed) * 256., 3.+hash11( seeedC + ll + 6. )*60.*gSize, seeedC + ll + 7. );
  layerCol *= alpha; 
  accumulatedCol.rgb = layerCol + accumulatedCol.rgb * ( 1. - alpha );
  accumulatedCol.a = max(accumulatedCol.a, alpha);
}
vec3 bgColor  = colorize( (backgroundD-iT*50.*gSpeed), (10.+hash11( seeedC + 99. )*60.)*gSize, seeedC + 8. );
fragColor.rgb = (accumulatedCol.rgb + bgColor * (1.-accumulatedCol.a));
fragColor.a = 1.;}

void main(){
mainImage(gl_FragColor, gl_FragCoord.xy);}