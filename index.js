module.exports = function(mongoose) {
  var Restmon = require('./src/Restmon')(mongoose);
  return Restmon;
};
