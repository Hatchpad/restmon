module.exports = function(secret) {

  var jwt = require('jwt-simple');

  if (!secret) {
    secret = 'my secret';
  }

  var RestmonCursor = function(cursor) {
    var cursorObj, key;
    if (typeof(cursor) === 'string') {
      cursorObj = jwt.decode(cursor, secret);
    } else {
      cursorObj = cursor;
    }
    this.cursor_ = cursorObj;
  };

  RestmonCursor.prototype.get = function(key) {
    return this.cursor_[key];
  };

  RestmonCursor.prototype.encode = function() {
    return jwt.encode(this.cursor_, secret);
  };

  return RestmonCursor;
};
