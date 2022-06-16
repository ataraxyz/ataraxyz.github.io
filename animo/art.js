// SOUND STUFF

//F, G, A♭, B♭, C, D♭, and E
// const AMinorScale = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
// const AMinorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const addOctaveNumbers = (scale, octaveNumber) => scale.map(note => {
  const firstOctaveNoteIndex = scale.indexOf('C') !== -1 ? scale.indexOf('C') : scale.indexOf('C#')
  const noteOctaveNumber = scale.indexOf(note) < firstOctaveNoteIndex ? octaveNumber - 1 : octaveNumber;
  return `${note}${noteOctaveNumber}`
 });

 var cmode_test = 0;

const constructMajorChord = (scale, octave, rootNote) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof(scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 7];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0,1)}${updatedOctave}`;
    }

    return nextNote;
  }

  const thirdNote = getNextChordNote(rootNote, 3)
  const fifthNote = getNextChordNote(rootNote, 5)
  const chord = [rootNote, thirdNote, fifthNote] 

  return chord
}

const constructChords = (scale, octave) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof(scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 6];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0,1)}${updatedOctave}`;
    }

    return nextNote;
  }


  const chordArray = scaleWithOctave.map(note => {
    let thirdNote = getNextChordNote(note, 3)
    let fifthNote = getNextChordNote(note, 5)
   
    const chord = [note, thirdNote, fifthNote] 

    return chord
  })

  return chordArray;
}




const curveToCoord = (index, level ) => {
  var resX = 0;
  var resY = 0;
  gridDist = (1<<level)-1; 
  gridDist = 1.0;

  for( let k=0; k<level; k++ )
  {
    var rX = index>>1 & 1;
    var rY = index^(index>>1) & 1
    if (rY==0) 
    { 
      if(rX==1)
      { 
        resX = (1<<k)-1-resX; 
        resY = (1<<k)-1-resY; 
      } 
      var tmp = resY;
      resY = resX;
      resX = tmp;
    }

    resX += rX<<k;
    resY += rY<<k;
    index >>= 2; 
  }
  return [resX / gridDist, resY / gridDist];
}

const curvePoints = () => {
  var level = tokenState.three.uniforms.iI9.value;
  var numPoints      = 1<<(level<<1);
  var deltaP = numPoints / 1.61803398874 + 0.5;
  var seeed = tokenState.three.uniforms.iI2.value;
  var layers = tokenState.three.uniforms.iI0.value;

  numPointsInLayer = tokenState.three.uniforms.iI3.value;
  var result = [];
  
  var layerType = tokenState.three.uniforms.iI5.value;
  for ( let l = 1; l <= layers; l++ )
  {
    var layerResult = [];
    var curveIndex = hash11( seeed + l + 33.0 ) * numPoints;
    

    if ( tokenState.three.uniforms.iI1.value < 50 && l == 1 )
      numPointsInLayer = Math.max(4,numPointsInLayer / 2);

    if ( tokenState.three.uniforms.iI5.value==0 )
      layerType = 1+(hash11( seeed + l + 34468.0 )*4.0)%5;
    

    for ( let p = 1; p <= numPointsInLayer; p++ )
    {
      if ( layerType < 2 || hash11( seeed + p*l + 4589.0 ) < tokenState.three.uniforms.iI13.value/100.0) 
      {
        curveIndex = ( curveIndex + deltaP ) % numPoints;
        layerResult.push( curveIndex / numPoints );

      }
      // if ( l == 2 )
      // {
      //   var curveCoords = curveToCoord( curveIndex, level); 
      //   console.log( curveCoords[0] + " " + curveCoords[1] );
      // }
    }
    layerResult.sort();
    result.push(layerResult);
  }
  // console.log('CURVE POINTS RAW: ' + result);
  
  return result;
}



var vol = new Tone.Volume();
vol.volume = -12;    
var dist = new Tone.Distortion(0.5).toDestination();
// var pitchShift = new Tone.PitchShift();
var wah = new Tone.AutoWah(0, 6, -30);//.toDestination();
// dist.distortion = 0.8;


const setupSynthForCurve = () => {
  
  var allCurvePoints = curvePoints();
  var tones = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var allTones = 7*9;
  var allBars = 32*4;

  var bassVolume = -20;
  var kickVolume = -16;
  var snareVolume = -20;
  var chrord1Volume = -20;
  var chrord2Volume = -20;
  var melodyVolume = -20;
  

  // var layerSize = allCurvePoints[0].length;
  var counter = 0;

  Tone.Transport.bpm.value =  Math.max( 85, (tokenState.three.uniforms.iI7.value+tokenState.speed)*0.25 );

  const now = Tone.now();
  mainMelody_Proc = [];
  mainChords_Proc = [];
  highOctaveChords_Proc = [];
  bassline_Proc = [];
  kick_Proc = [];
  snare_Proc = [];

  var curveBeat = [];
  var curveSnare = [];

  var synthType = "fatsawtooth";
  var shape = tokenState.three.uniforms.iI5.value;
  var colortype = tokenState.three.uniforms.iI10.value;
  var randomColorMode = colortype % 2 == 0;

  // even: ranG
  // odd:  regG
  
  // 0 1 random
  // 2 3 viridis
  // 4 5 plasma
  // 6 7 magma
  // 8 9 inferno
  // 10 11 turbo
  // 12 13 bbody
  // 14 15 rainbow
  // 16 17 vday
  // 18 19 w420
  // 20 21 gg
  // 22 23 sympatico
  // 24 25 mojo


  var allScales = [];
  allScales.push( ['C', 'D', 'E', 'F', 'G', 'A', 'B'] );  // CMajorScale
  allScales.push( ['C', 'D', 'E', 'G', 'A', 'C', 'D'] );  // CPentaScake
  allScales.push( ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] ); // DMajorScale
  allScales.push( ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] ); // EMajorScale
  allScales.push( ['F', 'G', 'A', 'B#', 'C', 'D', 'E'] ); // FMajorScale
  allScales.push( ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] ); // GMajorScale
  allScales.push( ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] ); // AMajorScale
  allScales.push( ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] ); // BMajorScale
  allScales.push( ['A', 'B', 'C', 'D', 'E', 'F', 'G'] ); // AMinorScale
  allScales.push( ['C', 'D', 'E', 'F', 'G', 'A', 'B'] ); // CMinorScale
  allScales.push( ['A', 'B', 'C#', 'E', 'F#', 'A', 'B'] );  // APentaScale
  allScales.push( ['C', 'D', 'E', 'F', 'G', 'A', 'B'] );  // CMajorScale
  allScales.push( ['C', 'D', 'E', 'G', 'A', 'C', 'D'] );  // CPentaScake

  var MainScale = allScales[Math.floor(colortype/2 + 0.5)]
  console.log(Math.floor(colortype/2 + 0.5))
  console.log(allScales.length)
  console.log(MainScale)
  var mainMelodyNotes = [ MainScale[1]+'4', MainScale[1]+'4', MainScale[3]+'4', MainScale[4]+'4', MainScale[5]+'4', MainScale[0]+'5']

  var bassNotes = [ 'D0', 'E0', 'F0', 'G0', 'A0', 'C0']

  const IChord = constructMajorChord(MainScale, 3, MainScale[0]+'3');
  const VChord = constructMajorChord(MainScale, 4, MainScale[4]+'4');
  const VIChord = constructMajorChord(MainScale, 3, MainScale[5]+'3');
  const IVChord = constructMajorChord(MainScale, 3, MainScale[3]+'3');
  IChord.push(MainScale[0]+'2', MainScale[0]+'4')
  VChord.push(MainScale[4]+'2', MainScale[4]+'4')
  VIChord.push(MainScale[5]+'2', MainScale[3]+'3')
  IVChord.push(MainScale[3]+'2', MainScale[3]+'4')

  const IChord1 = constructMajorChord(MainScale, 4, MainScale[0]+'4');
  const VChord1 = constructMajorChord(MainScale, 5, MainScale[4]+'5');
  const VIChord1= constructMajorChord(MainScale, 4, MainScale[5]+'4');
  const IVChord1 = constructMajorChord(MainScale, 4, MainScale[0]+'4');
  // const IChord1 = constructMajorChord(AMinorScale, 5, 'A4');
  // const VChord1 = constructMajorChord(AMinorScale, 5, 'E5');
  // const VIChord1= constructMajorChord(AMinorScale, 4, 'F4');
  // const IVChord1 = constructMajorChord(AMinorScale, 4, 'D4');

  // IChord1.push('A3', 'G5')
  // VChord1.push('E3', 'D5')
  // VIChord1.push('F3', 'E5')
  // IVChord1.push('D3', 'C5')
  var chords = [IChord,IVChord,VChord,VIChord];
  var chordsHigh = [IChord1,IVChord1,VChord1,VIChord1];
  
  if ( shape == 1 )
  {
    synthType = "fatsine";
    snareVolume = -32;
  }
  else if ( shape == 2 )
    synthType = "fatsquare4";
  else if ( shape == 3 )
    synthType = "fattriangle";
  else if ( shape == 4 )
    synthType = "sawtooth";
  else if ( shape == 5 )
    synthType = "fmsawtooth";

  

  

  var level = tokenState.three.uniforms.iI9.value;
  var numPoints      = 1<<(level<<1);

  
  var noteCounter = 0;
  for( let l = 0; l < allCurvePoints.length; l++ )
  {
    var lastCurveValue = 0.0;
    for( let i = 0; i < allCurvePoints[l].length; i++ )
    {
      var currentCuvePoint = allCurvePoints[l][i];
      var delta = currentCuvePoint - lastCurveValue;
      var takt = Math.floor(currentCuvePoint * 6)
      var note = Math.floor(( currentCuvePoint * 4 * 6 ) % 4 );
      var bar = takt.toString() + ":" + note.toString();
      const randomChord = Math.floor(Math.random() * chords.length);
      const randomChordHigh = Math.floor(Math.random() * chordsHigh.length);
      const randomNote = Math.floor(Math.random() * mainMelodyNotes.length);
      curveIndex = currentCuvePoint*numPoints;
      var curveCoords = curveToCoord( curveIndex, level); 
      curveBeat.push( curveCoords[0] );
      curveSnare.push( curveCoords[1] );
      
      if( delta > 0.0 ){
        if ( l == 0 ){
          var len = (1 + Math.floor( delta*10.0 )).toString() + "n";
          var len = "2n";
          if ( delta > 0.2 ) len = "4n"
            mainChords_Proc.push({'time': bar, 'note': chords[randomChord], 'duration': len})
          
        }
        else if ( l == 1 ){
          var len = (1 + Math.floor( delta*10.0 )).toString() + "n";
          var len = "2n";
          if ( delta > 0.2 ) len = "4n"
          
          highOctaveChords_Proc.push({'time': bar, 'note': chordsHigh[randomChordHigh], 'duration': len})

        }
        else // if ( l == 2 )
        {
          var len = '8n';

          if ( delta > 0.2 )
            len = '4n'

          var notetakt = Math.floor(noteCounter / 4)
          var notenote = Math.floor( noteCounter % 4 );

          if ( noteCounter % 3 == 0 || noteCounter % 5 == 0 || delta > 0.1 )
          {
            var notebar = notetakt.toString() + ":" + notenote.toString() + ":2";
            mainMelody_Proc.push({'time': notebar, 'note':mainMelodyNotes[randomNote], 'duration': len})
          }
          else
          {
            var notebar = notetakt.toString() + ":" + notenote.toString();
            mainMelody_Proc.push({'time': notebar, 'note':mainMelodyNotes[randomNote], 'duration': len})
          }
          // var notebar = notetakt.toString() + ":" + notenote.toString();
          // mainMelody_Proc.push({'time': notebar, 'note':mainMelodyNotes[randomNote], 'duration': len})
          
          if ( Math.random() < 0.5 )
          {
            bassline_Proc.push({'time': notebar, 'note':bassNotes[randomNote], 'duration': len})
          }
          noteCounter += 1
        }
      }
      lastCurveValue = currentCuvePoint;
    }
    
    
  }
  var curveBeatSorted = curveBeat.filter((item, index) => curveBeat.indexOf(item) === index && item < 256);
  curveBeatSorted.sort(function(a, b) {
    return a - b;
  });
  
  var curveSnareSorted = curveSnare.filter((item, index) => curveSnare.indexOf(item) === index && item < 256);
  curveSnareSorted.sort(function(a, b) {
    return a - b;
  });


  var lastVal  = 0;
  var kickCounter = 0
  var subKickCoutner = 0
  var accentKickCoutner = 0

  for( let i = 0; i < curveBeatSorted.length; i++ )
  {
    curVal = curveBeatSorted[i];

    var delta = curVal - lastVal;

    if ( delta > 3 )
    {
      kickCounter++;
      subKickCoutner = 0;
      accentKickCoutner = 0;
    }
    else
    {
      subKickCoutner++;
      if ( subKickCoutner % 4 == 0)
      {
        accentKickCoutner++;
      }
    }
    kick_Proc.push( {'time': kickCounter+':'+subKickCoutner+':'+accentKickCoutner} )
    lastVal = curVal;
  }

  var snareCounter = 0
  var subSnareCoutner = 0
  var accentSnareCoutner = 0

  for( let i = 0; i < curveSnareSorted.length; i++ )
  {
    curVal = curveSnareSorted[i];

    var delta = curVal - lastVal;

    if ( delta > 3 )
    {
      snareCounter++;
      subSnareCoutner = 0;
      accentSnareCoutner = 0;
    }
    else
    {
      subSnareCoutner++;
      if ( subSnareCoutner % 4 == 0)
      {
        accentSnareCoutner++;
      }
    }
    snare_Proc.push( {'time': snareCounter+':'+subSnareCoutner+':'+accentSnareCoutner} )
    lastVal = curVal;
  }

  const synth2 = new Tone.Synth({
    oscillator : {
      volume: melodyVolume,
      count: 3,
      spread: 40,
      type : synthType
    }
  });
  if ( randomColorMode && shape != 1 )
    synth2.chain(dist, vol, Tone.Master);
  else
    synth2.chain(vol, Tone.Master);
  // synth2.chain(dist, Tone.Master);
  // synth2.connect(dist);
  
  
  const mainChordSynth = new Tone.PolySynth(Tone.Synth, {
    volume: chrord1Volume,
    oscillator : {
      count: 6,
      spread: 80,
      type : synthType
    }
  });
  // if ( randomColorMode )
  //   mainChordSynth.connect(dist);
  mainChordSynth.chain(dist, vol, Tone.Master);
  // mainChordSynth.chain(wah, vol, Tone.Master);
  
  const highSynth  = new Tone.PolySynth(Tone.Synth, {
    volume: chrord2Volume,
    count: 6,
    spread: 80,
    oscillator : {
      type : synthType
    }
  });
  if ( randomColorMode )
    highSynth.connect(dist);
  
  highSynth.chain(vol, Tone.Master);



  const lowPass = new Tone.Filter({
    frequency: 8000,
  }).toDestination();
  
  snareType = "white"
  if ( randomColorMode )
  {
    snareType = "pink"
  }

  console.log( snareType )
  const snareDrum = new Tone.NoiseSynth({
    volume: snareVolume,
    noise: {
      type: snareType,
      playbackRate: 3,
    },
    envelope: {
      attack: 0.001,
      decay: 0.40,
      sustain: 0.07,
      release: 0.02,
    },
  }).connect(lowPass);

  snareDrum.chain(vol, Tone.Master);
  
  
  const kickDrum = new Tone.MembraneSynth({
    volume: kickVolume,
  }).toDestination();
  kickDrum.chain(vol, Tone.Master);

  const bass = new Tone.Synth({
    volume: bassVolume,
    oscillator : {
      type : "triangle"
    }
  }).toDestination();



  // Melody
  const mainMelodyPart = new Tone.Part(function(time, note){
    synth2.triggerAttackRelease(note.note, note.duration, time);
  }, mainMelody_Proc.slice(0, mainMelody_Proc.length-2)).start(0);
  console.log( mainMelody_Proc )
  // Chords
  const part = new Tone.Part(function(time, note){
    mainChordSynth.triggerAttackRelease(note.note, note.duration, time);
  }, mainChords_Proc).start(0);
  console.log( mainChords_Proc )
  
  const highOctaveChordPart = new Tone.Part(function(time, note){
    highSynth.triggerAttackRelease(note.note, note.duration, time, 0.5 );
  }, highOctaveChords_Proc).start(0);
  console.log( highOctaveChords_Proc )

  // drums
  const kickPart = new Tone.Part(function(time){
    kickDrum.triggerAttackRelease('C1', '8n', time)
  }, kick_Proc).start(0);
  console.log( kick_Proc )
  const snarePart = new Tone.Part(function(time){
    snareDrum.triggerAttackRelease('6n', time)
  }, snare_Proc).start(0);
  console.log( snare_Proc )

  // bass
  const bassPart = new Tone.Part(function(time, note){
    bass.triggerAttackRelease(note.note, note.duration, time);
  }, bassline_Proc).start(0);
  console.log( bassline_Proc )
  bass.chain(vol, Tone.Master);
  
}

// SOUND END

const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// var lsound = 0;
// var usound = 0;
var staticTime = false;
const fract = f => {
  return f % 1;
}
const hash11 = p => {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);}

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
const colorDist = {0: .5,1: .5,2: .28,3: .13,4: .28,5: .13,6: .28,7: .13,8: .28,9: .13,10: .28,11: .13,12: .28, 13: .13,14: .05,15: .02,16: .28,17: .13,18: .28,19: .13,20: .28,21: .13,22: .28,23: .13,24: .28,25: .13};
const shapeDist = {0: .5,1: .28,2: .15,3: .05,4: .05,5: .02};
const levelDist = {7: .5,6: .28,5: .15,4: .05,3: .05,2: .02};

const hashToTraits = hash => {
  const R = mkRandom(hash);
  var maxPointsPerLayer = 15;
  if ( isMobile )
    maxPointsPerLayer = 5;
  var maxLayer = 12;
  if ( isMobile )
    maxLayer = 2;
  const layers = R.ri( 4, maxLayer );
  const post  = R.ri(0,100);
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  // const pointsl = R.ri( 5, maxPointsPerLayer );
  const pointsl = layers < 3?R.ri(12, maxPointsPerLayer ):R.ri(7, maxPointsPerLayer );
  const shape = selectRandomDist(shapeDist, R.r);
  const speed = R.ri( 20, 150 );
  const size = R.ri( 100, 200 );
  
  var level = selectRandomDist(levelDist, R.r);
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
  const width  = window.innerWidth;
  const height = window.innerHeight;
  const body = document.querySelector('body > section:nth-child(1) > div > p');

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true  });
  renderer.setPixelRatio(8); // compensating for scale
  // renderer.setPixelRatio(window.devicePixelRatio);
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
  renderer.autoClear = false;
  renderer.autoClearColor = false;

  
  var fragmentShader =`
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
vec3 colorize( float distance, float colorWidth, float ss ){
  float b = 666.;
  float regG = mod(floor(abs((distance) / colorWidth)) * colorWidth, 1.0 );
  float ranG = fract( hash11(ss + floor(distance / colorWidth ) + b ) );
if ( iI10 == 0 ){
  float colR = hash11(ss + floor(distance / colorWidth ) + 555. );
  float colG = hash11(ss + floor(distance / colorWidth ) + b );
  float colB = hash11(ss + floor(distance / colorWidth ) + 777. );
  return vec3( colR, colG, colB );
} else if ( iI10 == 1 ) {
  float h = hash11(ss+b) + floor(distance / colorWidth) * 0.381966011;
  return hsv2rgb( vec3(h, 0.75,0.75));
} else if ( iI10 == 2 ){
  return viridis(ranG);
} else if ( iI10 == 3 ){
  return viridis(regG);
} else if ( iI10 == 4 ) {
  return plasma(ranG);
} else if ( iI10 == 5 ){
  return plasma(regG);
} else if ( iI10 == 6 ){
  return magma(ranG);
} else if ( iI10 == 7 ){
  return magma(regG);
} else if ( iI10 == 8 ){
  return inferno(ranG);
} else if ( iI10 == 9 ){
  return inferno(regG);
} else if ( iI10 == 10 ){
  return turbo(ranG);
} else if ( iI10 == 11 ){
  return turbo(regG);
} else if ( iI10 == 12 ) {
  return bbody(ranG);
} else if ( iI10 == 13 ){
  return bbody(regG);
} else if ( iI10 == 14 ){
  return rainbow( floor(( distance + hash11(ss + b )) / colorWidth) *  colorWidth );
} else if ( iI10 == 15 ) {
  return rainbow( regG );
} else if ( iI10 == 16 ) {
  return vday(ranG);
} else if ( iI10 == 17 ){
  return vday(regG);
} else if ( iI10 == 18 ) {
  return w420(ranG);
} else if ( iI10 == 19 ){
  return w420(regG);
} else if ( iI10 == 20 ){
  return gg(ranG);
} else if ( iI10 == 21 ){
  return gg(regG);
} else if ( iI10 == 22 ){
  return sympatico(ranG);
} else if ( iI10 == 23 ){
  return sympatico(regG);
} else if ( iI10 == 24 ){
  return mojo(ranG);
} else if ( iI10 == 25 ){
  return mojo(regG);
} return vec3(0.);
}



float sceneDist( int type, vec2 PP, vec2 hilbertP, float ss, float globalSize, float globalSpeed )
{
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
  return insaneDist(   translate( PP, hilbertP ), hash11( ss ) * 200. * globalSize );
}
float sceneDistTiled( int type, vec2 PP, vec2 hilbertP, float ss, float globalSize, float globalSpeed )
{
  float dist  =           sceneDist( type, PP, hilbertP              , ss, globalSize, globalSpeed );
  dist        = min(dist, sceneDist( type, PP, hilbertP + vec2(1.,0.), ss, globalSize, globalSpeed ));
  dist        = min(dist, sceneDist( type, PP, hilbertP - vec2(1.,0.), ss, globalSize, globalSpeed ));
  dist        = min(dist, sceneDist( type, PP, hilbertP + vec2(0.,1.), ss, globalSize, globalSpeed ));
  dist        = min(dist, sceneDist( type, PP, hilbertP - vec2(0.,1.), ss, globalSize, globalSpeed ));
  dist        = min(dist, sceneDist( type, PP, hilbertP + vec2(1.,1.), ss, globalSize, globalSpeed ));
  dist        = min(dist, sceneDist( type, PP, hilbertP - vec2(1.,1.), ss, globalSize, globalSpeed ));
  return dist;
}

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
  // float d = sceneDistTiled( layerType, P, PHC, seeed + ll + 4.0, gs, gSpeed );
  float d = sceneDist( layerType, P, PHC, seeed + ll + 4.0, gs, gSpeed );
  for ( int i = 1; i<numPointsInLayer; i++ ) {
    float ii = float(i);
    if ( layerType < 2 || hash11( seeed + ii*ll + 4589. ) < float(iI13)/100.) {
      curveIndex = ( curveIndex + deltaP ) % numPoints; 
    }
    
    PHC = curve(curveIndex)/gridDistance;
    // d = smoothMerge( d, sceneDistTiled( layerType, P, PHC, seeed + ii+ll + 4., gs, gSpeed ), float(iI4)/1024. );}
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
fragColor.rgb = pow((accumulatedCol.rgb + bgColor * (1.-accumulatedCol.a)),vec3(1.2));
// fragColor.rgb = vec3(abs(backgroundD)*4.);

// float colorWidth = 34.;
// float regG = mod(floor((uv.x) * colorWidth) / colorWidth, 1.0 );
// float ranG = hash11(regG);
// fragColor.rgb = mojo(ranG);
// fragColor.rg = P.xy;
// fragColor.b = 0.;
// fragColor.rgb = vec3(ranG);

fragColor.a = 1.;}

void main(){
mainImage(gl_FragColor, gl_FragCoord.xy);}
  `
  const uniforms = {
    iT: { value: 0 },
    iR:  { value: new THREE.Vector3() },
    iI0: { value : layers }, 
    iI1: { value : post }, 
    iI2: { value : seed }, 
    iI3: { value : pointsl }, 
    iI4: { value : state.sdfblend },
    iI5: { value : shape },
    iI6: { value : seedC },
    iI7: { value : speed+state.speed },
    iI8: { value : size*(state.size/100) },
    iI9: { value : level },
    iI10: { value : cmode },
    iI13: { value : sameProb },
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
    // console.log( window.outerWidth + "x" + window.outerHeight);
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
    // uniforms.iR.value.set(1024, 1024, 1);
    if (!staticTime)
      uniforms.iT.value += clock.getDelta();
    var secs = currentdate.getHours() * 3600.0 + currentdate.getMinutes() * 60.0 + ( currentdate.getMilliseconds() / 1000.0 );

    uniforms.iI0.value = state.three.uniforms.layers;
    uniforms.iI1.value = state.three.uniforms.post;
    uniforms.iI2.value = state.three.uniforms.seed;
    uniforms.iI3.value = state.three.uniforms.pointsl;
    uniforms.iI4.value = state.sdfblend;
    uniforms.iI5.value = state.three.uniforms.shape;
    uniforms.iI6.value = state.three.uniforms.seedC;
    uniforms.iI7.value = state.three.uniforms.speed+state.speed;//+usound;
    uniforms.iI8.value = state.three.uniforms.size*(state.size/100);//+lsound;
    uniforms.iI9.value = state.three.uniforms.level;
    uniforms.iI10.value = state.three.uniforms.cmode;
    uniforms.iI13.value = state.three.uniforms.sameProb;

    Tone.Transport.bpm.value = Math.max( 85, (tokenState.three.uniforms.iI7.value+tokenState.speed)*0.25 );
    vol.volume.value = -10 + state.size / 5;
    //pitchShift.pitch = -0.1 + state.sdfblend/500.0;
    wah.baseFrequency = state.sdfblend/2.0;
    // wah.wah
  };

  canvas.loop = () => {
    const { scene, camera } = state.three;
    // console.log(tokenState.fadeout)
    requestAnimationFrame(canvas.loop);
    if(tokenState.fadeout < 80)
    {
      canvas.update();
      renderer.setRenderTarget( null );
      renderer.render(scene, camera );
    }
  };

  canvas.initialize();
  canvas.render();
  canvas.loop();

};


const movementToggle = () => {
  staticTime = !staticTime;

  if ( staticTime == true )
    tokenState.three.uniforms.iT.value = 0.0;
}


const refresh = () => {
  staticTime = false;
  tokenData.hash    = randomHash(64);
  // tokenData.hash = '0x' + '8f3e22a6e16b94def6a08b191a45b361c0a3ee7744a3fcb8ee4ddc43036ee372'
  // tokenData.hash = "0x3bb5d07918782765fad287be316135c8ec36a5b2be354802dab88c47ac42e76e";
  // tokenData.hash = "0xa9c87d70dc2180aadc6432b31ad46e9d95b08d3d3dda19f2076fce3e40b31532";
  // tokenData.hash = "0xd22019469a09145e8034e17ff5b93d00e825b39d516cbc8ffecc6445b58113f0";
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
  // 
  // tokenState.three.uniforms.layers = 3;
  tokenState.three.uniforms.post = post;
  tokenState.three.uniforms.seed = seed;
  tokenState.three.uniforms.seedC = seedC;
  tokenState.three.uniforms.pointsl = pointsl;
  // tokenState.three.uniforms.pointsl = 4;
  
  tokenState.three.uniforms.shape = shape;
  tokenState.three.uniforms.speed = speed;
  tokenState.three.uniforms.size = size;
  tokenState.three.uniforms.level = level;
  tokenState.three.uniforms.cmode = cmode;
  tokenState.three.uniforms.sameProb = sameProb;
  
  var hashStr = tokenData.hash.toString();
  // console.log(hashStr);
  navigator.clipboard.writeText(hashStr).then(function() {
    console.log('HASH ' + hashStr + 'Copied to Clipboard successfully');
  }, function(err) {
    console.log( hashStr + ' Please copy manually as auto copy to clipboard failed' )
  });
  
}

const toggleSound = () => {
  // refresh();
  // Tone.Transport.stop();
  if ( Tone.Transport.state === 'stopped' )
  {
    // Tone.context.close()
    setupSynthForCurve();


    // Tone.context = new AudioContext();
    // Tone.start();
    let lastMelody = mainMelody_Proc[mainMelody_Proc.length - 1];
    Tone.Transport.loopStart = 0.0;
    Tone.Transport.loopEnd = lastMelody['time'];
    console.log(lastMelody['time'] + ' is the last time')
    Tone.Transport.loop = true;
    Tone.Transport.start();
  }
  else
  {
    // kickPart bassPart  mainMelodyPart part highOctaveChordPart
    // kickPart.cancel();
    // bassPart.cancel();
    // mainMelodyPart.cancel();
    // part.cancel();
    // highOctaveChordPart.cancel();
  }
}

const refreshConstant = ( inputHash ) => {
  staticTime = false;
  tokenData.hash    = inputHash;
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

