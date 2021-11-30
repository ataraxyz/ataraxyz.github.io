// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// boot.js - bootstrap script with global data
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// testing
//-----------------------------------------------------------------------------

const randomHash = size => {
  const digits = "0123456789abcdef";
  return '0x' + [...Array(size).keys()]
    .map(() => digits[Math.floor(Math.random() * digits.length)])
    .join('');
};

//-----------------------------------------------------------------------------
// globals
//-----------------------------------------------------------------------------

const tokenData = {
  projectId: 1,
  tokenId: 1,
  hash: randomHash(64)
};

//-----------------------------------------------------------------------------
const tokenState = {
  sdfblend: 50,
  fadeout: 0,
  textfade: 100,
  speed : 50
};

//const tokenState = {
//  layers: 2,
//  post: 0,
//  seed: 666,
//  seedC: 10666,
//  pointsl: 20,
//  sdfblend: 50,
//  shape:0,
//  speed:100,
//  size:100,
//  level:5,
//  cmode:0,
//};