// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle speed state change.
 */
const onChangeSpeed = value => {
  tokenState.speed = parseInt(value);
};
const onChangeSize = value => {
  tokenState.size = parseInt(value);
};
const onChangeAlpha = value => {
  tokenState.alpha = parseInt(value);
};
const onChangeDebug = value => {
  
  tokenState.debug = !tokenState.debug;
  console.log(tokenState.debug)
  // tokenState.debug = parseInt(value);
};