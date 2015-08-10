module.exports = function(mongoose) {
  var RestmonQuery = require('./RestmonQuery')();

  if (!mongoose) {
    throw new Error('mongoose is required');
  }

  var Restmon = function(name, schema, config) {
    config = config || {};
    config.ignoreCase = (config.ignoreCase === false) ? false : true;
    config.updated = config.updated || 'updated';
    this.config_ = config;

    this.schema_ = schema;
    this.generateMongooseSchema(schema);
    this.model = mongoose.model(name, this.mongooseSchema_);
  };

  Restmon.prototype.isIgnoreCase = function(fieldName) {
    var property = this.schema_[fieldName];
    if (property.ignoreCase === true) return true;
    if (property.ignoreCase === false) return false;
    return this.config_.ignoreCase;
  };

  Restmon.prototype.generateMongooseSchema = function(schema) {
    var key, property;

    this.sortables_ = [];

    if (!schema[this.config_.updated]) {
      schema[this.config_.updated] = {type:Date, default:Date.now, sortable:true};
    }
    for (key in schema) {
      property = schema[key];
      if (typeof property == 'object' && property.sortable) {
        if (this.isIgnoreCase(key) && property.type == String) {
          schema['_' + key] = property;
          schema['_' + key].index = true;
        } else {
          schema[key].index = true;
        }
        this.sortables_.push(key);
      }
    }
    this.mongooseSchema_ = new mongoose.Schema(schema);
  };

  Restmon.prototype.save = function(entity, cb) {
    var key;
    for (key in entity) {
      if (this.schema_[key] && this.schema_[key].sortable && this.schema_[key].type == String && this.isIgnoreCase(key) && entity.isModified(key)) {
        entity['_' + key] = entity[key].toLowerCase();
      }
    }
    entity[this.config_.updated] = Date.now();
    entity.save(cb);
  };

  Restmon.prototype.find = function(criteria, cb) {
    var crit = {$and: []};
    crit.$and.push(this.getCriteria(criteria));
    var q = this.model.find(crit, cb);
    return new RestmonQuery(this, q);
  };

  Restmon.prototype.findOne = function(criteria, cb) {
    var crit = {$and: []};
    crit.$and.push(this.getCriteria(criteria));
    var q = this.model.findOne(crit, cb);
    return new RestmonQuery(this, q);
  };

  Restmon.prototype.getCursor = function(entity) {
    var cursor, property;
    cursor = {};
    for(key in this.schema_) {
      property = this.schema_[key];
      if (property.sortable) {
        cursor[key] = entity[key];
      }
    }
    return cursor;
  };

  Restmon.prototype.getCriteria = function(rawCriteria) {
    if (!rawCriteria || typeof rawCriteria !== 'object') {
      return rawCriteria;
    }
    var key, criteria;
    criteria = {};
    for(key in rawCriteria) {
      if (typeof(key) === 'string' && this.schema_[key] && this.schema_[key].sortable && this.isIgnoreCase(key)) {
        criteria['_' + key] = rawCriteria[key].toLowerCase();
      } else {
        criteria[key] = rawCriteria[key];
      }
    }
    return criteria;
  };

  return Restmon;
};
