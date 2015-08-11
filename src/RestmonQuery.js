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

  RestmonQuery.prototype.limit = function(lim) {
    this.mongooseQuery = this.mongooseQuery.limit(lim);
    return this;
  };

  RestmonQuery.prototype.populate = function(populate) {
    this.mongooseQuery = this.mongooseQuery.populate(populate);
    return this;
  };

  var buildCursorQuery = function(cursor, queryDirection) {
    var query, i, sortableField, direction, sortProperty, finalDirection;
    direction = queryDirection === 'before' ? -1 : 1;
    query = {};
    for(i = 0; i < this.restmon_.sortables_.length; i++) {
      sortableField = this.restmon_.sortables_[i];
      finalDirection = this.mongooseQuery.options.sort[sortableField] * direction;
      query[sortableField] = (finalDirection > 0)
        ? {$gt: cursor.get(sortableField)}
        : {$lt: cursor.get(sortableField)};
    }
    return query;
  };

  RestmonQuery.prototype.after = function(cursor) {
    this.mongooseQuery._conditions.$and.push(
      buildCursorQuery.bind(this)(cursor, 'after')
    );
    return this;
  };

  RestmonQuery.prototype.before = function(cursor) {
    return this;
  };

  RestmonQuery.prototype.since = function(timestamp) {
    var sinceClause = {};
    sinceClause[this.restmon_.config_.updated] = {$gt: timestamp};
    this.mongooseQuery._conditions.$and.push(sinceClause);
    return this;
  };

  RestmonQuery.prototype.until = function(timestamp) {
    var sinceClause = {};
    sinceClause[this.restmon_.config_.updated] = {$lt: timestamp};
    this.mongooseQuery._conditions.$and.push(sinceClause);
    return this;
  };

  RestmonQuery.prototype.exec = function(cb) {
    var response = {_meta: {}};
    var i;
    return this.mongooseQuery.exec(function(err, data) {
      if (data && Array.isArray(data)) {
        response.data = data;
        response._meta.first = this.restmon_.getCursor(data[0]).encode();
        response._meta.last = this.restmon_.getCursor(data[data.length - 1]).encode();
        for (i = 0; i < data.length; i++) {
          if (!response._meta.freshest || data[i][this.restmon_.config_.updated] > response._meta.freshest) {
            response._meta.freshest = data[i][this.restmon_.config_.updated];
          }
          if (!response._meta.stalest || data[i][this.restmon_.config_.updated] < response._meta.stalest) {
            response._meta.stalest = data[i][this.restmon_.config_.updated];
          }
        }
      } else {
        response.data = data;
      }
      if (cb) {
        cb(err, response);
      }
    }.bind(this));
  };

  return RestmonQuery;
};
