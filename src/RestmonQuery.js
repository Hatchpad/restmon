module.exports = function() {

  var RestmonQuery = function(restmon, mongooseQuery) {
    this.restmon_ = restmon;
    this.mongooseQuery = mongooseQuery;
  };

  RestmonQuery.prototype.sort = function(sortBy) {
    var key, property;
    for (key in sortBy) {
      if (this.restmon_.sortables_.indexOf(key) < 0) {
        throw new Error('attemped to sort by a non-sortable field');
      }
    }
    this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    return this;
  };

  RestmonQuery.prototype.populate = function(populate) {
    return this;
  };

  RestmonQuery.prototype.after = function(cursor) {
    return this;
  };

  RestmonQuery.prototype.before = function(cursor) {
    return this;
  };

  RestmonQuery.prototype.since = function(timestamp) {
    return this;
  };

  RestmonQuery.prototype.until = function(timestamp) {
    return this;
  };

  RestmonQuery.prototype.exec = function(cb) {
    return this.mongooseQuery.exec(cb);
  };

  return RestmonQuery;
};
