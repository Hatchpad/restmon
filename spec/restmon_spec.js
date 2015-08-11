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

    it('builds the cursor correctly', function() {
      expect(cursor).not.toBe(undefined);
      expect(cursor).not.toBe(null);
      expect(cursor.get('username')).toBe('boog');
      expect(cursor.get('firstName')).toBe('John');
      expect(cursor.get('lastName')).toBe('Doe');
      expect(cursor.get('ssn')).toBe(undefined);
      expect(cursor.get('about')).toBe(undefined);
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
    var users = [];
    var cursors = [];

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser1 = new UserRestmon.model({
        username:'boog',
        firstName:'John',
        lastName:'Doe',
        ssn:'000-00-0000',
        about:'This is a sentence about John.'
      });
      var transientUser2 = new UserRestmon.model({
        username:'aoog',
        firstName:'Zohn',
        lastName:'Goe',
        ssn:'000-00-0000',
        about:'This is a sentence about John.'
      });
      UserRestmon.save(transientUser1, function(err, data) {
        users.push(data);
        cursors.push(UserRestmon.getCursor(data));
        UserRestmon.save(transientUser2, function(err, data) {
          users.push(data);
          cursors.push(UserRestmon.getCursor(data));
          done();
        });
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
        UserRestmon.find({ssn:'000-00-0000'})
        .sort({username:1})
        .exec(function(err, res) {
          foundUsers = res.data;
          done();
        });
      });

      it('finds the users', function() {
        expect(foundUsers.length).toBe(2);
      });

      it('sorts the users by username', function() {
        expect(foundUsers[0].username).toBe('aoog');
        expect(foundUsers[1].username).toBe('boog');
      });
    });

    describe('after with results', function() {
      var response, aboutNow;

      beforeEach(function(done) {
        aboutNow = Date.now() - 10000;
        UserRestmon.findOne({username:'boog'}, function(err, usr) {
          UserRestmon.save(usr, function(err, res) {
            UserRestmon
            .findOne({username:'boog'})
            .since(aboutNow)
            .exec(function(err, res) {
              response = res;
              done();
            });
          });
        });
      });

      it('gets the user after the date', function() {
        expect(response.data.username).toBe('boog');
      });
    });

    describe('after without results', function() {
      var response, aboutNow;

      beforeEach(function(done) {
        aboutNow = Date.now() + 1000;
        UserRestmon.findOne({username:'boog'}, function(err, usr) {
          UserRestmon.save(usr, function(err, res) {
            UserRestmon
            .findOne({username:'boog'})
            .since(aboutNow)
            .exec(function(err, res) {
              response = res;
              done();
            });
          });
        });
      });

      it('does not get the user since the date', function() {
        expect(response.data).toBe(null);
      });
    });

    describe('until with results', function() {
      var response, aboutNow;

      beforeEach(function(done) {
        aboutNow = Date.now() + 1000;
        UserRestmon.findOne({username:'boog'}, function(err, usr) {
          UserRestmon.save(usr, function(err, res) {
            UserRestmon
            .findOne({username:'boog'})
            .until(aboutNow)
            .exec(function(err, res) {
              response = res;
              done();
            });
          });
        });
      });

      it('gets the user until the date', function() {
        expect(response.data.username).toBe('boog');
      });
    });

    describe('until without results', function() {
      var response, aboutNow;

      beforeEach(function(done) {
        aboutNow = Date.now() - 10000;
        UserRestmon.findOne({username:'boog'}, function(err, usr) {
          UserRestmon.save(usr, function(err, res) {
            UserRestmon
            .findOne({username:'boog'})
            .until(aboutNow)
            .exec(function(err, res) {
              response = res;
              done();
            });
          });
        });
      });

      it('does not get the user until the date', function() {
        expect(response.data).toBe(null);
      });
    });
  });

  describe('_meta', function() {
    var schema = {
      username:{type:String, sortable:true}
    };
    var UserRestmon;
    var findResponse;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      var transientUser0 = new UserRestmon.model({username:'b'});
      var transientUser1 = new UserRestmon.model({username:'a'});
      var transientUser2 = new UserRestmon.model({username:'d'});
      var transientUser3 = new UserRestmon.model({username:'c'});
      UserRestmon.save(transientUser0, function(err, data) {
        UserRestmon.save(transientUser1, function(err, data) {
          UserRestmon.save(transientUser2, function(err, data) {
            setTimeout(function() {
              UserRestmon.save(transientUser3, function(err, data) {
                UserRestmon.find({})
                .sort({username:1})
                .exec(function(err, res) {
                  findResponse = res;
                  done();
                });
              });
            }, 5);
          });
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.modelSchemas['User'];
        delete mongoose.models['User'];
        done();
      });
    });

    it('provides the freshest updated data in response metadata', function() {
      expect(findResponse._meta.freshest).not.toBe(null);
      expect(findResponse._meta.freshest).not.toBe(undefined);
    });

    it('provides the stalest updated data in response metadata', function() {
      expect(findResponse._meta.stalest).not.toBe(null);
      expect(findResponse._meta.stalest).not.toBe(undefined);
    });

    it('affirms that the stalest is older than the freshest', function() {
      expect(findResponse._meta.stalest).toBeLessThan(findResponse._meta.freshest);
    });

    it('provides a first cursor', function() {
      expect(findResponse._meta.first).not.toBe(null);
      expect(findResponse._meta.first).not.toBe(undefined);
    });

    it('provides the currect first cursor', function() {
      var cursor = new Restmon.Cursor(findResponse._meta.first);
      expect(cursor.get('username')).toBe('a');
    });

    it('provides a last cursor', function() {
      expect(findResponse._meta.last).not.toBe(null);
      expect(findResponse._meta.last).not.toBe(undefined);
    });

    it('provides the currect last cursor', function() {
      var cursor = new Restmon.Cursor(findResponse._meta.last);
      expect(cursor.get('username')).toBe('d');
    });
  });
});
