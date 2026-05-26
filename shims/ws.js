// React Native has a native WebSocket — redirect the `ws` Node package to it.
const WS = global.WebSocket;
module.exports = WS;
