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


  // TODO make the float number actual floats to avoid type conversions in shader later
  //const layers = R.ri( 2, 4 );
  const layers = 2;
  const post  = 10;
  const seed = R.ri(0, 10000 );
  const seedC = R.ri(0, 10000 );
  // const pointsl = R.ri(0, (5-layers) * 20 );
  const pointsl = 20;
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




// <input id="layers" type="range" min="1" max="6" value="2" step="1"></input>
// <input id="post" type="range" min="0" max="10" value="0" step="1"></input>
// <input id="seed" type="range" min="1" max="10000" value="666" step="1"></input>
// <input id="seedC" type="range" min="10000" max="20000" value="10666" step="1"></input>
// <input id="pointsl" type="range" min="10" max="200" value="20" step="1"></input>
// <input id="sdfblend" type="range" min="0" max="100" value="50" step="1"></input>
// <input id="shape" type="range" min="-1" max="3" value="0" step="1"></input>
// <input id="speed" type="range" min="50" max="200" value="100" step="1"></input>
// <input id="size" type="range" min="50" max="200" value="100" step="1"></input>
// <input id="level" type="range" min="2" max="6" value="5" step="1"></input>
// <input id="cmode" type="range" min="0" max="14" value="0" step="1"></input>