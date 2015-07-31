module.exports = function(mongoose) {

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

  Restmon.prototype.generateMongooseSchema = function(schema) {
    var key, property;

    this.sortables_ = [];

    if (!schema[this.config_.updated]) {
      schema[this.config_.updated] = {type:Date, default:Date.now, sortable:true};
    }
    for (key in schema) {
      property = schema[key];
      if (typeof property == 'object') {
        if (this.config_.ignoreCase && property.type == String && property.sortable) {
          schema['_' + key] = property;
          schema['_' + key].index = true;
          this.sortables_.push({key:key, field:'_' + key})
        } else {
          schema[key].index = true;
          this.sortables_.push({key:key, field:key});
        }
      }
    }
    this.mongooseSchema_ = new mongoose.Schema(schema);
  };

  Restmon.prototype.save = function(entity, cb) {
    var key;
    for (key in entity) {
      if (this.schema_[key] && this.schema_[key].sortable && this.schema_[key].type == String && entity.isModified(key)) {
        entity['_' + key] = entity[key].toLowerCase();
      }
    }
    entity[this.config_.updated] = Date.now();
    entity.save(cb);
  };

  return Restmon;
};
