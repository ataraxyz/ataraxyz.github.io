// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle speed state change.
 */
const onChangeLayers = value => {
  tokenState.layers = parseInt(value);
};

const onChangePost = value => {
  tokenState.post = parseInt(value);
};

const onChangeSeed = value => {
  tokenState.seed = parseInt(value);
};

const onChangeSeedC = value => {
  tokenState.seedC = parseInt(value);
};

const onChangePointsL = value => {
  tokenState.pointsl = parseInt(value);
};

const onChangeSdfblend = value => {
  tokenState.sdfblend = parseInt(value);
};

const onChangeShape = value => {
  tokenState.shape = parseInt(value);
};

const onChangeSpeed = value => {
  tokenState.speed = parseInt(value);
};

const onChangeSize = value => {
  tokenState.size = parseInt(value);
};

const onChangeLevel = value => {
  tokenState.level = parseInt(value);
};

const onChangeCMode = value => {
  tokenState.cmode = parseInt(value);
};
