module.exports = function(mongoose, secret) {
  var RestmonQuery = require('./RestmonQuery')(secret);
  var RestmonCursor = require('./RestmonCursor')(secret);

  if (!mongoose) {
    throw new Error('mongoose is required');
  }

  var Restmon = function(name, schema, config, doBeforeModelCreation, schemaOptions) {
    config = config || {};
    config.ignoreCase = (config.ignoreCase === false) ? false : true;
    config.id = config.id || '_id';
    config.updated = config.updated || 'updated';
    this.config_ = config;

    this.schema_ = schema;
    this.schemaOptions_ = schemaOptions;
    this.generateMongooseSchema(schema);
    if (schemaOptions && schemaOptions.plugins) {
      schemaOptions.plugins.forEach(function(plugin) {
        this.schema_.plugin(plugin.plugin, plugin.opts);
      }.bind(this));
    }
    if (doBeforeModelCreation) {
      doBeforeModelCreation.bind(this)();
    }
    this.model = mongoose.model(name, this.mongooseSchema_);
  };

  Restmon.prototype.isIgnoreCase = function(fieldName) {
    if (fieldName === this.config_.updated) return false;
    var property = this.schema_[fieldName];
    if (property.type != String) return false;
    if (property.ignoreCase === true) return true;
    if (property.ignoreCase === false) return false;
    return this.config_.ignoreCase;
  };

  Restmon.prototype.generateMongooseSchema = function(schema) {
    var key, property, builtSchema;

    this.sortables_ = [];
    builtSchema = {};

    if (!schema[this.config_.updated]) {
      builtSchema[this.config_.updated] = {type:Date, default:Date.now, sortable:true};
    }
    this.sortables_.push(this.config_.updated);
    for (key in schema) {
      property = schema[key];
      builtSchema[key] = property;
      if (typeof property == 'object' && property.sortable) {
        if (this.isIgnoreCase(key) && property.type == String) {
          builtSchema['_' + key] = schema[key]
          builtSchema['_' + key].index = true;
        } else {
          builtSchema[key].index = true;
        }
        this.sortables_.push(key);
      }
    }
    this.mongooseSchema_ = new mongoose.Schema(builtSchema, this.schemaOptions_);
  };

  Restmon.prototype.save = function(entity, cb) {
    var key;
    for (key in entity) {
      if (this.schema_[key] && this.schema_[key].sortable && this.schema_[key].type == String && this.isIgnoreCase(key) && entity.isModified(key)) {
        if (entity[key]) {
          entity['_' + key] = entity[key].toLowerCase();
        } else {
          entity['_' + key] = entity[key];
        }
      }
    }
    entity[this.config_.updated] = Date.now();
    entity.save(cb);
  };

  Restmon.prototype.update = function(conditions, doc, options, cb) {
    var key;
    for (key in doc) {
      if (this.schema_[key] && this.schema_[key].sortable && this.schema_[key].type == String && this.isIgnoreCase(key)) {
        if (doc[key]) {
          doc['_' + key] = doc[key].toLowerCase();
        } else if (doc[key] !== undefined) {
          doc['_' + key] = doc[key];
        }
      }
    }
    doc[this.config_.updated] = Date.now();
    this.model.update(conditions, doc, options, cb);
  };

  Restmon.prototype.create = function(entities, cb) {
    if (!Array.isArray(entities)) {
      this.save(entities, cb);
      return;
    }
    entities.forEach(function(entity) {
      for (key in entity) {
        if (this.schema_[key] && this.schema_[key].sortable && this.schema_[key].type == String && this.isIgnoreCase(key) && entity.isModified(key)) {
          entity['_' + key] = entity[key] ? entity[key].toLowerCase() : entity[key];
        }
      }
      entity[this.config_.updated] = Date.now();
    }.bind(this));
    this.model.create(entities, cb);
  };

  Restmon.prototype.find = function(criteria, cb) {
    var crit = {$and: []};
    if (criteria && criteria != {}) {
      crit.$and.push(this.getCriteria(criteria));
    }
    var q = this.model.find(crit, cb);
    return new RestmonQuery(this, q);
  };

  Restmon.prototype.findOne = function(criteria, cb) {
    var crit = {$and: []};
    if (criteria && criteria != {}) {
      crit.$and.push(this.getCriteria(criteria));
    }
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
    cursor[this.config_.id] = entity[this.config_.id];
    cursor[this.config_.updated] = entity[this.config_.updated];
    return new RestmonCursor(cursor);
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

  Restmon.Cursor = RestmonCursor;

  return Restmon;
};
