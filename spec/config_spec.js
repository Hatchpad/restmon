const mongoose = require('mongoose');
const Restmon = require('../')(mongoose);
const db = require('./db')

describe('config and default params', function() {
  const schema = {
    username:{type:String, sortable:true}
  };

  beforeAll(async () => await db.connect());
  afterEach(async () => await db.clearDatabase());
  afterAll(async () => await db.closeDatabase());

  describe('when ignoreCase is true by default', function() {
    let UserRestmon;

    beforeEach(function() {
      UserRestmon = new Restmon('User', schema);
    });

    afterEach(function() {
      delete mongoose.models['User'];
    });

    it('sets ignoreCase to true in config', function() {
      expect(UserRestmon.config_.ignoreCase).toBe(true);
    });

    it('sets ignoreCase to true for sortable string property', function() {
      expect(UserRestmon.isIgnoreCase('username')).toBe(true);
    });
  });

  describe('when ignoreCase is set to true', function() {
    var UserRestmon;

    beforeEach(function() {
      UserRestmon = new Restmon('User', schema, {ignoreCase:true});
    });

    afterEach(function() {
      delete mongoose.models['User'];
    });

    it('sets ignoreCase to true in config', function() {
      expect(UserRestmon.config_.ignoreCase).toBe(true);
    });

    it('sets ignoreCase to true for sortable string property', function() {
      expect(UserRestmon.isIgnoreCase('username')).toBe(true);
    });
  });

  describe('when ignoreCase is set to false', function() {
    var UserRestmon;

    beforeEach(function() {
      UserRestmon = new Restmon('User', schema, {ignoreCase:false});
    });

    afterEach(function() {
      delete mongoose.models['User'];
    });

    it('sets ignoreCase to false in config', function() {
      expect(UserRestmon.config_.ignoreCase).toBe(false);
    });

    it('sets ignoreCase to false for sortable string property', function() {
      expect(UserRestmon.isIgnoreCase('username')).toBe(false);
    });
  });

  describe('when ignoreCase is set to true in config and false in schema', function() {
    var UserRestmon;

    beforeEach(function() {
      schema.username.ignoreCase = false;
      UserRestmon = new Restmon('User', schema, {ignoreCase:true});
    });

    afterEach(function() {
      delete mongoose.models['User'];
    });

    it('sets ignoreCase to false in config', function() {
      expect(UserRestmon.config_.ignoreCase).toBe(true);
    });

    it('sets ignoreCase to false for sortable string property', function() {
      expect(UserRestmon.isIgnoreCase('username')).toBe(false);
    });
  });

  describe('when ignoreCase is set to false in config and true in schema', function() {
    var UserRestmon;

    beforeEach(function() {
      schema.username.ignoreCase = true;
      UserRestmon = new Restmon('User', schema, {ignoreCase:false});
    });

    afterEach(function() {
      delete mongoose.models['User'];
    });

    it('sets ignoreCase to false in config', function() {
      expect(UserRestmon.config_.ignoreCase).toBe(false);
    });

    it('sets ignoreCase to false for sortable string property', function() {
      expect(UserRestmon.isIgnoreCase('username')).toBe(true);
    });
  });
});
