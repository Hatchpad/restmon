var mongoose = require('mongoose');
var mongoUri = 'mongodb://@localhost/restmon';
mongoose.connect(mongoUri);
var Restmon = require('../')(mongoose);

describe('ignoreCase / toLowerCase', function () {
  describe('when ignoreCase is true (by default)', function () {
    var schema = {
      created:{type:Date, default:Date.now, index:true},
      username:{type:String, sortable:true}
    };
    var UserRestmon = new Restmon('User', schema);
    var savedUser;

    beforeEach(function(done) {
      var transientUser = new UserRestmon.model({username:'Jason'});
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        done();
      });
    });

    it('adds the lower case field to the schema', function() {
      var _usernameColumn = UserRestmon.mongooseSchema_.paths._username;
      expect(_usernameColumn.path).toBe('_username');
      expect(_usernameColumn.instance).toBe('String');
      expect(_usernameColumn.options.index).toBe(true);
    });

    it('saves the useraname correctly', function() {
      expect(savedUser.username).toBe('Jason');
      expect(savedUser._username).toBe('jason');
    });

    it('sets the updated field', function() {
      expect(savedUser.updated).not.toBe(null);
      expect(savedUser.updated).not.toBe(undefined);
    });

    it('does something', function() {
      expect(true).toBe(true);
    });

    describe('find by username', function() {
      var foundObj;

      beforeEach(function(done) {
        UserRestmon.findOne({_username:'Jason'}, function(err, usr) {
          foundObj = usr;
          done();
        });
      });

      it('finds the user', function() {
        expect(foundObj.username).toBe('Jason');
      });
    });
  });
});
