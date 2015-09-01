module.exports = function() {

  var RestmonQuery = function(restmon, mongooseQuery) {
    this.restmon_ = restmon;
    this.mongooseQuery = mongooseQuery;
  };

  var convertSortByString = function(sort) {
    var splitStr, trimmedArr, sortBy;
    sortBy = {};
    splitStr = sort.split(',');
    trimmedArr = [];
    splitStr.forEach(function(str) {
      trimmedArr.push(str.trim());
    });
    trimmedArr.forEach(function(sortClause) {
      if (sortClause[0] === '+') {
        sortBy[sortClause.substr(1, sortClause.length - 1)] = 1;
      } else if (sortClause[0] === '-') {
        sortBy[sortClause.substr(1, sortClause.length - 1)] = -1;
      } else {
        sortBy[sortClause] = 1;
      }
    });
    return sortBy;
  };

  RestmonQuery.prototype.sort = function(sort) {
    var key, property, finalSort, sortBy;
    sortBy = typeof(sort) == 'string' ? convertSortByString(sort) : sort;
    finalSort = {};
    this.sort_ = sortBy;
    for (key in sortBy) {
      if (this.restmon_.sortables_.indexOf(key) < 0) {
        throw new Error('attemped to sort by a non-sortable field');
      }
      if (this.restmon_.isIgnoreCase(key)) {
        finalSort['_' + key] = sortBy[key];
      } else {
        finalSort[key] = sortBy[key];
      }
    }
    this.mongooseQuery = this.mongooseQuery.sort(finalSort);
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

  RestmonQuery.prototype.select = function(select) {
    this.mongooseQuery = this.mongooseQuery.select(select);
    return this;
  };

  var buildCursorQuery = function(cursor, queryDirection) {
    var i, query, appendQueryKey, naturalDirection, sortBy, sortByKeys, key;

    naturalDirection = queryDirection === 'before' ? -1 : 1;
    sortBy = this.sort_ || {};
    query = {};
    sortByKeys = [];

    for(key in sortBy) {
      sortByKeys.push(key);
    }

    if (sortByKeys.length == 0) {
      query[this.restmon_.config_.id] = naturalDirection > 0
        ? {$gt: cursor.get(this.restmon_.config_.id)}
        : {$lt: cursor.get(this.restmon_.config_.id)};
      return query;
    }

    query.$or = [];

    appendQueryKey = function(queryOr, idx) {
      var sortProp, and, or, part, field, fieldValue, rawField;
      part = {};
      field = sortByKeys[idx];
      if (this.restmon_.isIgnoreCase(field)) {
        rawField = '_' + field;
        fieldValue = cursor.get(field).toLowerCase();
      } else {
        rawField = field;
        fieldValue = cursor.get(field);
      }
      sortProp = sortBy[field];
      if (sortProp * naturalDirection > 0) {
        part[rawField] = {$gt: fieldValue};
      } else {
        part[rawField] = {$lt: fieldValue};
      }
      queryOr.push(part);
      and = {$and: []};
      queryOr.push(and);
      part = {};
      part[rawField] = {$eq: fieldValue};
      and.$and.push(part);
      if (idx == sortByKeys.length - 1) {
        part = {};
        if (sortProp * naturalDirection > 0) {
          part[this.restmon_.config_.id] = {$gt: cursor.get(this.restmon_.config_.id)};
        }
        else {
          part[this.restmon_.config_.id] = {$lt: cursor.get(this.restmon_.config_.id)};
        }
        and.$and.push(part);
        return query;
      }
      else {
        or = {$or: []};
        and.$and.push(or);
        return appendQueryKey.bind(this)(or.$or, idx + 1);
      }
    };

    return appendQueryKey.bind(this)(query.$or, 0);
  };

  RestmonQuery.prototype.after = function(cursor) {
    this.mongooseQuery._conditions.$and.push(
      buildCursorQuery.bind(this)(cursor, 'after')
    );
    return this;
  };

  RestmonQuery.prototype.before = function(cursor) {
    this.mongooseQuery._conditions.$and.push(
      buildCursorQuery.bind(this)(cursor, 'before')
    );
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
        if (data.length > 0) {
          response._meta.first = this.restmon_.getCursor(data[0]).encode();
          response._meta.last = this.restmon_.getCursor(data[data.length - 1]).encode();
        }
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
