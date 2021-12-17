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
uniform int iInt12; // textfade
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
float vignette = smoothstep( 1.0, 0.0,length(vinCoord*0.5));
fragColor.rgb = (accumulatedCol.rgb + bgColor * (1.-accumulatedCol.a))*vignette;
fragColor.a = 1.0;}

void main(){
mainImage(gl_FragColor, gl_FragCoord.xy);}