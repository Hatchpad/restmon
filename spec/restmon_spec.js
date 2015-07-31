var mongoose = require('mongoose');
var mongoUri = 'mongodb://@localhost/restmon';
mongoose.connect(mongoUri);
var Restmon = require('../')(mongoose);

describe('functionality', function () {
  beforeEach(function() {
    var schema = {
      username:{type:String, sortable:true}
    };
    var UserRestmon = new Restmon('User', schema);
    var user = new UserRestmon.model({username:'Jason'});
    UserRestmon.save(user, function(err, data) {
      console.log('save err ' + err);
      console.log('save data ' + data);
    });
  });

  it('does something', function() {
    expect(true).toBe(true);
  });
});
