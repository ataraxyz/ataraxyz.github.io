uniform vec3 iR;uniform float iT;uniform int iI0,iI1,iI2,iI3,iI4,iI5,iI6,iI7,iI8,iI9,iI10,iI13;float t(in vec2 i){return dot(i,i);}float f(float f){return f=fract(f*.1031),f*=f+33.33,f*=f+f,fract(f);}float i(vec2 i){vec3 f=fract(vec3(i.xyx)*.1031);f+=dot(f,f.yzx+33.33);return fract((f.x+f.y)*f.z);}vec2 v(int i){ivec2 f=ivec2(0,0);for(int y=0;y<iI9;y++){ivec2 v=ivec2(i>>1,i^i>>1)&1;if(v.y==0){if(v.x==1)f=(1<<y)-1-f;f=f.yx;}f+=v<<y;i>>=2;}return vec2(float(f.x),float(f.y));}vec2 f(vec2 i,float f){if(f>0.)return i*mat2(cos(f),sin(f),-sin(f),cos(f));else if(f<0.)return-i*mat2(cos(f),-sin(f),sin(f),cos(f));else return i;}vec2 i(vec2 i,vec2 y){return i-y;}float t(vec2 f,float i){float v=length(f)-i;return v;}float v(vec2 f,float i){return max(abs(f).x*.866025+f.y*.5,-f.y)-i*.5;}float r(vec2 i,float y){return max(abs(i).x*f(i.x)+i.y*.5,-i.y)-y*.5;}float f(vec2 f,vec2 i,float v){i-=vec2(v);vec2 m=abs(f)-i;return min(max(m.x,m.y),0.)+length(max(m,0.))-v;}float s(in vec2 f,in float i){const vec3 v=vec3(-.866,.5,.577);vec2 m=sign(f);f=abs(f);float y=dot(v.xy,f);f-=2.*min(y,0.)*v.xy;f-=vec2(clamp(f.x,-v.z*i,v.z*i),i);return length(f)*sign(f.y);}float i(float i,float f,float y){float v=clamp(.5+.5*(f-i)/y,0.,1.);return mix(f,i,v)-y*v*(1.-v);}vec3 r(vec3 f){vec4 i=vec4(1.,2./3.,1./3.,3.);vec3 v=abs(fract(f.xxx+i.xyz)*6.-i.www);return f.z*mix(i.xxx,clamp(v-i.xxx,0.,1.),f.y);}vec3 f(in float i,in vec3 f,in vec3 y,in vec3 v,in vec3 m){return f+y*cos(6.28318*(v*i+m));}vec3 s(float f){const vec3 i=vec3(.2777,.0054,.334),v=vec3(.105,1.4046,1.3845),m=vec3(-.3308,.2148,.095),y=vec3(-4.6342,-5.7991,-19.3324),c=vec3(6.2282,14.1799,56.6905),x=vec3(4.7763,-13.7451,-65.353),z=vec3(-5.4354,4.64585,26.3124);return i+f*(v+f*(m+f*(y+f*(c+f*(x+f*z)))));}vec3 n(float f){const vec3 i=vec3(.0587,.0233,.5433),v=vec3(2.1765,.2383,.7539),m=vec3(-2.6894,-7.4558,3.1107),y=vec3(6.1303,42.3461,-28.5188),c=vec3(-11.1074,-82.6663,60.1398),x=vec3(10.023,71.4136,-54.0721),z=vec3(-3.6587,-22.9315,18.1919);return i+f*(v+f*(m+f*(y+f*(c+f*(x+f*z)))));}vec3 x(float f){const vec3 i=vec3(-.0021,-.0007,-.0053),v=vec3(.2516,.6775,2.494),m=vec3(8.3537,-3.5777,.3144),y=vec3(-27.6687,14.2647,-13.6492),c=vec3(52.1761,-27.9436,12.9441),x=vec3(-50.7685,29.0465,4.2341),z=vec3(18.6557,-11.4897,-5.6019);return i+f*(v+f*(m+f*(y+f*(c+f*(x+f*z)))));}vec3 m(float f){const vec3 i=vec3(.0002,.0016,-.0194),v=vec3(.1065,.5639,3.9327),m=vec3(11.6024,-3.9728,-15.9423),y=vec3(-41.7039,17.4363,44.3541),c=vec3(77.1629,-33.4023,-81.8073),x=vec3(-71.3194,32.626,73.2095),z=vec3(25.1311,-12.2426,-23.0703);return i+f*(v+f*(m+f*(y+f*(c+f*(x+f*z)))));}vec3 p(float f){const vec3 i=vec3(.114,.0628,.2248),v=vec3(6.7164,3.1822,7.5715),m=vec3(-66.094,-4.9279,-10.0943),y=vec3(228.766,25.0498,-91.541),c=vec3(-334.835,-69.3174,288.586),x=vec3(218.764,67.5215,-305.205),z=vec3(-52.889,-21.5452,110.517);return i+f*(v+f*(m+f*(y+f*(c+f*(x+f*z)))));}vec3 h(float i){return vec3(1,.25,.0625)*exp(4.*i-1.);}float y=666.;vec3 h(float i,float v,float c){if(iI10==0){float z=f(c+floor(i/v)+555.),w=f(c+floor(i/v)+y),T=f(c+floor(i/v)+777.);return vec3(z,w,T);}else if(iI10==1){float z=f(c+y)+floor(i/v)*.381966;return r(vec3(z,.75,.75));}else if(iI10==2)return s(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==3)return s(fract(f(c+floor(i/v)+y)));else if(iI10==4)return n(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==5)return n(fract(f(c+floor(i/v)+y)));else if(iI10==6)return x(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==7)return x(fract(f(c+floor(i/v)+y)));else if(iI10==8)return m(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==9)return m(fract(f(c+floor(i/v)+y)));else if(iI10==10)return p(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==11)return p(fract(f(c+floor(i/v)+y)));else if(iI10==12)return h(fract(f(c+y)+floor(i/v)*12.8*v));else if(iI10==13)return h(fract(f(c+floor(i/v)+y)));else if(iI10==14){vec3 z=vec3(.5,.5,.5),w=vec3(.5,.5,.5),T=vec3(1.,1.,1.),g=vec3(0.,.33,.67);return f(f(c+floor(i/v)+y),z,w,T,g);}else if(iI10==15){vec3 z=vec3(.5,.5,.5),w=vec3(.5,.5,.5),T=vec3(1.,1.,1.),g=vec3(0.,.33,.67);return f(f(c+y)+floor(i/v)*.0025*v,z,w,T,g);}return vec3(0.);}float f(int c,vec2 m,vec2 y,float x,float z,float T){float w=1.;if(f(x+789456.)<.5)w=-1.;if(c==1)return t(i(m,y),f(x)*200.*z);else if(c==2){float g=f(x)*200.*z;return f(i(m,y),vec2(g),g*.1);}else if(c==3)return v(f(i(m,y),w*(f(x)*360./180.*3.14159+iT)*T*512.),f(x+1234.)*200.*z);else if(c==4)return s(f(i(m,y),w*(f(x)*360./180.*3.14159+iT)*T*512.),f(x+1234.)*200.*z);else if(c==5)return r(i(m,y),f(x)*200.*z);}void h(out vec4 m,in vec2 y){vec2 z=y/iR.xy,c=y/max(iR.y,iR.x);int x=1<<(iI9<<1),w=int(float(x)/1.618+.5);float T=float(x),g=float((1<<iI9)-1),s=float(iI2),a=float(iI6),r=float(iI7)/100./1024.,d=float(iI8)/100./1024.,n;vec4 e=vec4(0.);float p=float(iI0);for(int u=1;u<=iI0;u++){float l=float(u);int t=iI3;float o=d*(.5+(1.-l/p)*.5);if(iI1<50&&u==1)o*=.1,t=max(4,t/2);int I=int(f(s+l+33.)*T);vec2 b=v(I)/g;int R=iI5;if(iI5==0)R=1+int(f(s+l+34468.)*4.)%5;float F=f(R,c,b,s+l+4.,o,r);for(int C=1;C<t;C++){float Z=float(C);if(R<2||f(s+Z*l+4589.)<float(iI13)/100.)I=(I+w)%x;b=v(I)/g;F=i(F,f(R,c,b,s+Z+l+4.,o,r),float(iI4)/1024.);}if(u==1)n=F;else n=i(n,F,float(iI4)/1024.);float C=iT*(5.+f(a+l+5.)*100.)*r,Z=smoothstep(.005,0.,F);vec3 Y=h((-F-C)*256.,3.+f(a+l+6.)*60.*d,a+l+7.);Y*=Z;e.xyz=Y+e.xyz*(1.-Z);e.w=max(e.w,Z);}vec3 l=h(n-iT*50.*r,(10.+f(a+99.)*60.)*d,a+8.);m.xyz=e.xyz+l*(1.-e.w);m.w=1.;}void main(){h(gl_FragColor,gl_FragCoord.xy);}