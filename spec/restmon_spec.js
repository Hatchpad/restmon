var mongoose = require('mongoose');
var mongoUri = 'mongodb://@localhost/restmon';
mongoose.connect(mongoUri);
var Restmon = require('../')(mongoose);

describe('ignoreCase / toLowerCase', function () {
  describe('when ignoreCase is true', function () {
    var schema = {
      created:{type:Date, default:Date.now, index:true},
      username:{type:String, sortable:true}
    };
    var UserRestmon;
    var savedUser;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser = new UserRestmon.model({username:'Jason'});
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.modelSchemas['User'];
        delete mongoose.models['User'];
        done();
      });
    });

    it('adds the lower case field to the schema', function() {
      var _usernameColumn = UserRestmon.mongooseSchema_.paths._username;
      expect(_usernameColumn.path).toBe('_username');
      expect(_usernameColumn.instance).toBe('String');
      expect(_usernameColumn.options.index).toBe(true);
    });

    it('saves the username correctly', function() {
      expect(savedUser.username).toBe('Jason');
      expect(savedUser._username).toBe('jason');
    });

    it('sets the updated field', function() {
      expect(savedUser.updated).not.toBe(null);
      expect(savedUser.updated).not.toBe(undefined);
    });

    describe('find by username with exact match', function() {
      var foundObj;

      beforeEach(function(done) {
        UserRestmon.findOne({username:'Jason'}, function(err, usr) {
          foundObj = usr;
          done();
        });
      });

      it('finds the user', function() {
        expect(foundObj.username).toBe('Jason');
      });
    });

    describe('find by username ignoring case', function() {
      var foundObj;

      beforeEach(function(done) {
        UserRestmon.findOne({username:'jason'}, function(err, usr) {
          foundObj = usr;
          done();
        });
      });

      it('finds the user', function() {
        expect(foundObj.username).toBe('Jason');
        expect(foundObj._username).toBe('jason');
      });
    });
  });

  describe('when ignoreCase is false', function () {
    var schema = {
      created:{type:Date, default:Date.now, index:true},
      username:{type:String, sortable:true, ignoreCase:false}
    };
    var UserRestmon;
    var savedUser;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser = new UserRestmon.model({username:'Jason', ignoreCase:false});
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.modelSchemas['User'];
        delete mongoose.models['User'];
        done();
      });
    });

    it('does not add the lower case field to the schema', function() {
      var _usernameColumn = UserRestmon.mongooseSchema_.paths._username;
      expect(_usernameColumn).toBe(undefined);
    });

    it('saves the username correctly', function() {
      expect(savedUser.username).toBe('Jason');
      expect(savedUser._username).toBe(undefined);
    });

    it('sets the updated field', function() {
      expect(savedUser.updated).not.toBe(null);
      expect(savedUser.updated).not.toBe(undefined);
    });

    describe('find by username with exact match', function() {
      var foundObj = undefined;

      beforeEach(function(done) {
        UserRestmon.findOne({username:'Jason'}, function(err, usr) {
          foundObj = usr;
          done();
        });
      });

      it('finds the user', function() {
        expect(foundObj.username).toBe('Jason');
        expect(foundObj._username).toBe(undefined);
      });
    });

    describe('find by username ignoring case', function() {
      var foundObj = undefined;

      beforeEach(function(done) {
        UserRestmon.findOne({username:'jason'}, function(err, usr) {
          foundObj = usr;
          done();
        });
      });

      it('does not find the user', function() {
        expect(foundObj).toBe(null);
      });
    });
  });

  describe('cursors', function () {
    var schema = {
      created:{type:Date, default:Date.now, sortable:true},
      username:{type:String, sortable:true, ignoreCase:false},
      firstName:{type:String, sortable:true},
      lastName:{type:String, sortable:true},
      ssn:{type:String, index:true},
      about:{type:String}
    };
    var UserRestmon;
    var savedUser;
    var cursor;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser = new UserRestmon.model({
        username:'boog',
        firstName:'John',
        lastName:'Doe',
        ssn:'000-00-0000',
        about:'This is a sentence about John.'
      });
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        cursor = UserRestmon.getCursor(savedUser);
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.modelSchemas['User'];
        delete mongoose.models['User'];
        done();
      });
    });

    it('creates the cursor correctly', function() {
      expect(cursor).not.toBe(undefined);
      expect(cursor).not.toBe(null);
      expect(cursor.username).toBe('boog');
      expect(cursor.firstName).toBe('John');
      expect(cursor.lastName).toBe('Doe');
      expect(cursor.ssn).toBe(undefined);
      expect(cursor.about).toBe(undefined);
    });
  });

  describe('sorting', function() {
    var schema = {
      created:{type:Date, default:Date.now, sortable:true},
      username:{type:String, sortable:true, ignoreCase:false},
      firstName:{type:String, sortable:true},
      lastName:{type:String, sortable:true},
      ssn:{type:String, index:true},
      about:{type:String}
    };
    var UserRestmon;
    var savedUser;
    var cursor;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser = new UserRestmon.model({
        username:'boog',
        firstName:'John',
        lastName:'Doe',
        ssn:'000-00-0000',
        about:'This is a sentence about John.'
      });
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        cursor = UserRestmon.getCursor(savedUser);
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.modelSchemas['User'];
        delete mongoose.models['User'];
        done();
      });
    });

    describe('find by username ignoring case', function() {
      var foundUsers = [];

      beforeEach(function(done) {
        UserRestmon.find({username:'boog'})
        .sort({username:1})
        .mongooseQuery.exec(function(err, users) {
          foundUsers = users;
          done();
        });
      });

      it('finds the users', function() {
        expect(foundUsers.length).toBe(1);
      });
    });
  });
});
