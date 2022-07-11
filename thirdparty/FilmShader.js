( function () {

	/**
 * Film grain & scanlines shader
 *
 * - ported from HLSL to WebGL / GLSL
 * https://web.archive.org/web/20210226214859/http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 *
 * Screen Space Static Postprocessor
 *
 * Produces an analogue noise overlay similar to a film grain / TV static
 *
 * Original implementation and noise algorithm
 * Pat 'Hawthorne' Shearon
 *
 * Optimized scanlines + noise version with intensity scaling
 * Georg 'Leviathan' Steinrohder
 *
 * This version is provided under a Creative Commons Attribution 3.0 License
 * http://creativecommons.org/licenses/by/3.0/
 */
	const FilmShader = {
		uniforms: {
			'tDiffuse': {
				value: null
			},
			'time': {
				value: 0.0
			},
			'nIntensity': {
				value: 0.5
			},
			'sIntensity': {
				value: 0.05
			},
			'sCount': {
				value: 4096
			},
			'grayscale': {
				value: 1
			}
		},
		vertexShader:
  /* glsl */
  `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
		fragmentShader:
  /* glsl */
  `

		#include <common>

		// control parameter
		uniform float time;

		uniform bool grayscale;

		// noise effect intensity value (0 = no effect, 1 = full effect)
		uniform float nIntensity;

		// scanlines effect intensity value (0 = no effect, 1 = full effect)
		uniform float sIntensity;

		// scanlines effect count value (0 = no effect, 4096 = full effect)
		uniform float sCount;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		vec2 barrelDistortion(vec2 coord, float amt) {
			vec2 cc = coord - 0.5;
			float dist = dot(cc, cc);
			return coord + cc * dist * amt;
		}
		
		float sat( float t )
		{
			return clamp( t, 0.0, 1.0 );
		}
		
		float linterp( float t ) {
			return sat( 1.0 - abs( 2.0*t - 1.0 ) );
		}
		
		float remap( float t, float a, float b ) {
			return sat( (t - a) / (b - a) );
		}
		
		vec4 spectrum_offset( float t ) {
			vec4 ret;
			float lo = step(t,0.5);
			float hi = 1.0-lo;
			float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
			ret = vec4(lo,1.0,hi, 1.) * vec4(1.0-w, w, 1.0-w, 1.);
		
			return pow( ret, vec4(1.0/2.2) );
		}
		
		const float max_distort = 0.25;
		const int num_iter = 6;
		const float reci_num_iter_f = 1.0 / float(num_iter);


		void main() {

			float vignette = 1.0-length( (vUv.xy * 2.0 - 1.0) * 0.5 + vec2(0.01,-0.02)  );
			float distBlend = length( (vUv.xy * 2.0 - 1.0));
		// sample the source
			vec4 cTextureScreen = texture2D( tDiffuse, vUv );

			vec2 uv=(vUv*1.0)-0.0;
			vec4 sumcol = vec4(0.0);
			vec4 sumw = vec4(0.0);	
			for ( int i=0; i<num_iter;++i )
			{
				float t = float(i) * reci_num_iter_f;
				vec4 w = spectrum_offset( t );
				sumw += w;
				sumcol += w * texture2D( tDiffuse, barrelDistortion(uv, .6 * max_distort*t ) );
			}
				
			vec4 distortCol = sumcol / sumw;

			cTextureScreen = mix( cTextureScreen, distortCol, distBlend);


		// make some noise
			float dx = rand( vUv + time );
			float strength = 16.0;
			float x = (vUv.x + 4.0 ) * (vUv.y + 4.0 ) * (time * 10.0);
			vec4 grain = vec4(mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01)-0.005) * strength;

		// add noise
			// vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );
			vec3 cResult = cTextureScreen.rgb + grain.xyz;
		// get us a sine and cosine
			vec2 sc = vec2( sin( vUv.y * sCount + (time * 30.0) ), cos( vUv.y * sCount + (time * 30.0) ) );

		// add scanlines
			cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;

		// interpolate between source and result by intensity
			cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );

		// convert to grayscale if desired
			if( grayscale ) {

				cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );

			}

			
			

			gl_FragColor =  vec4( cResult*vignette, cTextureScreen.a );
			// gl_FragColor =  vec4( cTextureScreen.rgb, cTextureScreen.a );

			// gl_FragColor = mix( cTextureScreen, distortCol, distBlend);

		}`
	};

	THREE.FilmShader = FilmShader;

} )();;