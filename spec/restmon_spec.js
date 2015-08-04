var mongoose = require('mongoose');
var mongoUri = 'mongodb://@localhost/restmon';
mongoose.connect(mongoUri);
var Restmon = require('../')(mongoose);

describe('ignoreCase / toLowerCase', function () {
  describe('when ignoreCase is true (by default)', function () {
    var schema = {
      username:{type:String, sortable:true}
    };
    var UserRestmon = new Restmon('User', schema);
    var user = new UserRestmon.model({username:'Jason'});

    beforeEach(function(done) {
      UserRestmon.save(user, function(err, data) {
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

    it('does something', function() {
      expect(true).toBe(true);
    });
  });
});
