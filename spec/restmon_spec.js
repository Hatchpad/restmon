const mongoose = require('mongoose');
const db = require('./db')
const secret = 'a_secret';
const Restmon = require('../')(mongoose, secret);

describe('Restmon tests', function () {
  beforeAll(async () => await db.connect());
  afterEach(async () => await db.clearDatabase());
  afterAll(async () => await db.closeDatabase());

  describe('when ignoreCase is true', function () {
    const schema = {
      created:{type:Date, default:Date.now, index:true},
      username:{type:String, sortable:true}
    };
    let UserRestmon;
    let savedUser;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const transientUser = new UserRestmon.model({username:'Jason'});
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('adds the lower case field to the schema', function() {
      const _usernameColumn = UserRestmon.mongooseSchema_.paths._username;
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
      let foundObj;

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
      let foundObj;

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
    const schema = {
      created:{type:Date, default:Date.now, index:true},
      username:{type:String, sortable:true, ignoreCase:false}
    };
    let UserRestmon;
    let savedUser;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const transientUser = new UserRestmon.model({username:'Jason', ignoreCase:false});
      UserRestmon.save(transientUser, function(err, data) {
        savedUser = data;
        done();
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('does not add the lower case field to the schema', function() {
      const _usernameColumn = UserRestmon.mongooseSchema_.paths._username;
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
      let foundObj = undefined;

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
      let foundObj = undefined;

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

  describe('bulk create', function() {
    const schema = {
      created:{type:Date, default:Date.now, sortable:true},
      username:{type:String, sortable:true, ignoreCase:false},
      firstName:{type:String, sortable:true}
    };

    let u1, u2, foundUsers;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      u1 = new UserRestmon.model({username: 'a', firstName: 'John'});
      u2 = new UserRestmon.model({username: 'b', firstName: 'Jane'});
      UserRestmon.create([u1,u2], function() {
        UserRestmon.find({})
        .sort({firstName:1})
        .exec(function(err, res) {
          foundUsers = res.data;
          done();
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('creates the records correctly', function() {
      expect(foundUsers.length).toBe(2);
      expect(foundUsers[0].firstName).toBe('Jane');
      expect(foundUsers[0]._firstName).toBe('jane');
      expect(foundUsers[0].username).toBe('b');
      expect(foundUsers[0]._username).toBe(undefined);
      expect(foundUsers[1].firstName).toBe('John');
      expect(foundUsers[1]._firstName).toBe('john');
      expect(foundUsers[1].username).toBe('a');
      expect(foundUsers[1]._username).toBe(undefined);
    });
  });

  describe('cursors', function () {
    const schema = {
      created:{type:Date, default:Date.now, sortable:true},
      username:{type:String, sortable:true, ignoreCase:false},
      firstName:{type:String, sortable:true},
      lastName:{type:String, sortable:true},
      ssn:{type:String, index:true},
      about:{type:String}
    };
    let UserRestmon;
    let savedUser;
    let cursor;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const transientUser = new UserRestmon.model({
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
      expect(cursor.get('updated')).not.toBe(undefined);
      expect(cursor.get('updated')).not.toBe(null);
    });
  });

  describe('sort by updated', function() {
    const schema = {
      name:{type:String}
    };
    let UserRestmon;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const u1 = new UserRestmon.model({name:'bjohn'});
      const u2 = new UserRestmon.model({name:'ajohn'});
      const u3 = new UserRestmon.model({name:'cjohn'});
      UserRestmon.save(u1, function(err, data) {
        setTimeout(function() {
          UserRestmon.save(u2, function(err, data) {
            setTimeout(function() {
              UserRestmon.save(u3, function(err, data) {
                u2.name = 'djohn';
                UserRestmon.save(u2, function(err, data) {
                  done();
                });
              });
            }, 2);
          });
        }, 2);
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    describe('sorting by updated', function() {
      let foundUsers = [];

      beforeEach(function(done) {
        UserRestmon.find({})
        .sort('-updated')
        .exec(function(err, res) {
          foundUsers = res.data;
          done();
        });
      });

      it('finds the users', function() {
        expect(foundUsers.length).toBe(3);
      });

      it('sorts this users by updated', function() {
        expect(foundUsers[0].name).toBe('djohn');
        expect(foundUsers[1].name).toBe('cjohn');
        expect(foundUsers[2].name).toBe('bjohn');
      });
    });
  });

  describe('sorting', function() {
    const schema = {
      created:{type:Date, default:Date.now, sortable:true},
      username:{type:String, sortable:true, ignoreCase:false},
      firstName:{type:String, sortable:true},
      lastName:{type:String, sortable:true},
      ssn:{type:String, index:true},
      about:{type:String}
    };
    let UserRestmon;
    let users = [];
    let cursors = [];

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const transientUser1 = new UserRestmon.model({
        username:'boog',
        firstName:'John',
        lastName:'Doe',
        ssn:'000-00-0000',
        about:'This is a sentence about John.'
      });
      const transientUser2 = new UserRestmon.model({
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
        delete mongoose.models['User'];
        done();
      });
    });

    describe('find by username ignoring case', function() {
      let foundUsers = [];

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

    describe('since with results', function() {
      let response, aboutNow;

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

      it('gets the user since the date', function() {
        expect(response.data.username).toBe('boog');
      });
    });

    describe('since without results', function() {
      let response, aboutNow;

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
      let response, aboutNow;

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
      let response, aboutNow;

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
    const schema = {
      username:{type:String, sortable:true}
    };
    let UserRestmon, findResponse;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const transientUser0 = new UserRestmon.model({username:'c'});
      const transientUser1 = new UserRestmon.model({username:'b'});
      const transientUser2 = new UserRestmon.model({username:'e'});
      const transientUser3 = new UserRestmon.model({username:'d'});

      const u0 = new UserRestmon.model({username:'dd'});
      const u1 = new UserRestmon.model({username:'f'});
      const u2 = new UserRestmon.model({username:'a'});
      const u3 = new UserRestmon.model({username:'bb'});
      UserRestmon.save(transientUser0, function(err, data) {
        UserRestmon.save(transientUser1, function(err, data) {
          UserRestmon.save(transientUser2, function(err, data) {
            setTimeout(function() {
              UserRestmon.save(transientUser3, function(err, data) {
                UserRestmon.find({})
                .sort({username:1})
                .exec(function(err, res) {
                  findResponse = res;
                  UserRestmon.create([u0,u1,u2,u3], function() {
                    done();
                  });
                });
              });
            }, 5);
          });
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
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
      const cursor = new Restmon.Cursor(findResponse._meta.first);
      expect(cursor.get('username')).toBe('b');
    });

    it('provides a last cursor', function() {
      expect(findResponse._meta.last).not.toBe(null);
      expect(findResponse._meta.last).not.toBe(undefined);
    });

    it('provides the currect last cursor', function() {
      const cursor = new Restmon.Cursor(findResponse._meta.last);
      expect(cursor.get('username')).toBe('e');
    });

    describe('after sorted asc', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findResponse._meta.last);
        UserRestmon.find({})
        .sort({username:1})
        .after(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('finds the correct records', function() {
        expect(afterRes.data.length).toBe(1);
        expect(afterRes.data[0].username).toBe('f');
      });
    });

    describe('before sorted asc', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findResponse._meta.first);
        UserRestmon.find({})
        .sort({username:1})
        .before(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('finds the correct records', function() {
        expect(afterRes.data.length).toBe(1);
        expect(afterRes.data[0].username).toBe('a');
      });
    });

    describe('after sorted desc', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findResponse._meta.last);
        UserRestmon.find({})
        .sort({username:-1})
        .after(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('finds the correct records', function() {
        expect(afterRes.data.length).toBe(6);
      });
    });

    describe('before sorted desc', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findResponse._meta.first);
        UserRestmon.find({})
        .sort({username:-1})
        .before(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('finds the correct records', function() {
        expect(afterRes.data.length).toBe(6);
      });
    });
  });

  describe('multi field sorting', function() {
    const schema = {
      fn:{type:String, sortable:true},
      ln:{type:String, sortable:true},
      ph:{type:String, sortable:true},
      em:{type:String, sortable:true}
    };
    let UserRestmon, findRes, sortByStringRes;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      let userArr = [];
      userArr.push(new UserRestmon.model({fn:'John', ln:'Doe', ph:'555-555-5556'}));  // 4
      userArr.push(new UserRestmon.model({fn:'Bob', ln:'Doe', ph:'555-555-5555'}));   // 0
      userArr.push(new UserRestmon.model({fn:'John', ln:'Foe', ph:'555-555-5555'}));  // 1
      userArr.push(new UserRestmon.model({fn:'john', ln:'Doe', ph:'555-555-5555'}));  // 3
      userArr.push(new UserRestmon.model({fn:'John', ln:'Doe', ph:'555-555-5554'}));  // 2
      UserRestmon.create(userArr, function() {
        UserRestmon.find({})
        .sort({fn:1, ln:-1, ph:1})
        .exec(function(err, res) {
          findRes = res;
          UserRestmon.find({})
          .sort('fn,-ln, +ph')
          .exec(function(err, res) {
            sortByStringRes = res;
            userArr = [];
            userArr.push(new UserRestmon.model({fn:'Cob', ln:'Doe', ph:'555-555-5555'})); // middle
            userArr.push(new UserRestmon.model({fn:'John', ln:'Doe', ph:'555-555-5557'})); // after
            userArr.push(new UserRestmon.model({fn:'John', ln:'Aoe', ph:'555-555-5555'})); // after
            userArr.push(new UserRestmon.model({fn:'Kevin', ln:'Doe', ph:'555-555-5555'})); // after
            userArr.push(new UserRestmon.model({fn:'Acorn', ln:'Doe', ph:'555-555-5555'})); // before
            userArr.push(new UserRestmon.model({fn:'Bob', ln:'Foe', ph:'555-555-5555'})); // before
            userArr.push(new UserRestmon.model({fn:'Bob', ln:'Doe', ph:'555-555-5554'})); // before
            UserRestmon.create(userArr, function() {
              done();
            });
          });
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('sorts the entities correctly', function() {
      expect(findRes.data[0].fn).toBe('Bob');
      expect(findRes.data[1].fn).toBe('John');
      expect(findRes.data[1].ln).toBe('Foe');
      expect(findRes.data[2].fn).toBe('John');
      expect(findRes.data[2].ln).toBe('Doe');
      expect(findRes.data[2].ph).toBe('555-555-5554');
      expect(findRes.data[3].fn).toBe('john');
      expect(findRes.data[3].ln).toBe('Doe');
      expect(findRes.data[3].ph).toBe('555-555-5555');
      expect(findRes.data[4].fn).toBe('John');
      expect(findRes.data[4].ln).toBe('Doe');
      expect(findRes.data[4].ph).toBe('555-555-5556');
    });

    it('sorts the entities correctly using string sort', function() {
      expect(sortByStringRes.data[0].fn).toBe('Bob');
      expect(sortByStringRes.data[1].fn).toBe('John');
      expect(sortByStringRes.data[1].ln).toBe('Foe');
      expect(sortByStringRes.data[2].fn).toBe('John');
      expect(sortByStringRes.data[2].ln).toBe('Doe');
      expect(sortByStringRes.data[2].ph).toBe('555-555-5554');
      expect(sortByStringRes.data[3].fn).toBe('john');
      expect(sortByStringRes.data[3].ln).toBe('Doe');
      expect(sortByStringRes.data[3].ph).toBe('555-555-5555');
      expect(sortByStringRes.data[4].fn).toBe('John');
      expect(sortByStringRes.data[4].ln).toBe('Doe');
      expect(sortByStringRes.data[4].ph).toBe('555-555-5556');
    });

    describe('select', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findRes._meta.last);
        UserRestmon.find({})
        .select('fn ln')
        .sort({fn:1, ln:-1, ph:1})
        .after(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('only gets the fields included in the select', function() {
        expect(afterRes.data[0].fn).toBe('John');
        expect(afterRes.data[0].ln).toBe('Doe');
        expect(afterRes.data[0].ph).toBe(undefined);
      });
    });

    describe('after', function() {
      let afterRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findRes._meta.last);
        UserRestmon.find({})
        .sort({fn:1, ln:-1, ph:1})
        .after(cursor)
        .exec(function(err, res) {
          afterRes = res;
          done();
        });
      });

      it('executes after correctly', function() {
        expect(afterRes.data.length).toBe(3);
        expect(afterRes.data[0].fn).toBe('John');
        expect(afterRes.data[0].ln).toBe('Doe');
        expect(afterRes.data[0].ph).toBe('555-555-5557');
        expect(afterRes.data[1].fn).toBe('John');
        expect(afterRes.data[1].ln).toBe('Aoe');
        expect(afterRes.data[2].fn).toBe('Kevin');
      });
    });

    describe('before', function() {
      let beforeRes;

      beforeEach(function(done) {
        const cursor = new Restmon.Cursor(findRes._meta.first);
        UserRestmon.find({})
        .sort({fn:1, ln:-1, ph:1})
        .before(cursor)
        .exec(function(err, res) {
          beforeRes = res;
          done();
        });
      });

      it('executes before correctly', function() {
        expect(beforeRes.data.length).toBe(3);
        expect(beforeRes.data[0].fn).toBe('Acorn');
        expect(beforeRes.data[0].ln).toBe('Doe');
        expect(beforeRes.data[1].fn).toBe('Bob');
        expect(beforeRes.data[1].ln).toBe('Foe');
        expect(beforeRes.data[2].fn).toBe('Bob');
        expect(beforeRes.data[2].ln).toBe('Doe');
      });
    });
  });

  describe('update', function() {
    const schema = {
      fn:{type:String, sortable:true},
      ln:{type:String, sortable:true},
      company:{type:String, sortable:true}
    };
    let UserRestmon, findRes, sortByStringRes;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const userArr = [];
      userArr.push(new UserRestmon.model({fn:'John', ln:'Doe', company:'Google'}));  // 4
      userArr.push(new UserRestmon.model({fn:'Bob', ln:'Doe', company:'Facebook'}));   // 0
      userArr.push(new UserRestmon.model({fn:'John', ln:'Foe', company:'Google'}));  // 1
      userArr.push(new UserRestmon.model({fn:'john', ln:'Doe', company:'Facebook'}));  // 3
      userArr.push(new UserRestmon.model({fn:'John', ln:'Doe', company:'SAP'}));  // 2
      UserRestmon.create(userArr, function() {
        setTimeout(function() {
          done();
        }, 5);
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    describe('before the update', function() {

      let beforeRes, afterRes;

      beforeEach(function(done) {
        UserRestmon.find({})
        .sort('company')
        .exec(function(err, res) {
          beforeRes = res;
          UserRestmon.update({}, {company:'Hatchpad.io'}, {multi:true}, function(err) {
            UserRestmon.find({})
            .sort('company')
            .exec(function(err, res) {
              afterRes = res;
              done();
            });
          });
        });
      });

      it('updates the docs correctly', function() {
        expect(beforeRes.data[0].company).toBe('Facebook');
        expect(beforeRes.data[0]._company).toBe('facebook');
        expect(beforeRes.data[4].company).toBe('SAP');
        expect(beforeRes.data[4]._company).toBe('sap');
        for (let i = 0; i < 5; i++) {
          expect(afterRes.data[i].company).toBe('Hatchpad.io');
          expect(afterRes.data[i]._company).toBe('hatchpad.io');
        }
      });
    });
  });

  describe('sorting with null and undefined fields', function() {
    const schema = {
      un:{type:String, sortable:true},
      other:{type:String, sortable:true}
    };
    let UserRestmon, result1, result2, result3;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const userArr = [];
      userArr.push(new UserRestmon.model({un:'un4', other:'other1'}));
      userArr.push(new UserRestmon.model({un:null, other:'other2'}));
      userArr.push(new UserRestmon.model({other:'other3'}));
      userArr.push(new UserRestmon.model({un:'un1', other:'other4'}));
      userArr.push(new UserRestmon.model({other:'other5'}));
      UserRestmon.create(userArr, function() {
        UserRestmon.find({})
        .sort('un,other')
        .limit(2)
        .exec(function(err, res) {
          result1 = res;
          const cursor = new Restmon.Cursor(result1._meta.last);
          UserRestmon.find({})
          .sort('un,other')
          .after(cursor)
          .limit(2)
          .exec(function(err, res) {
            result2 = res;
            const cursor2 = new Restmon.Cursor(result2._meta.last);
            UserRestmon.find({})
            .sort('un,other')
            .after(cursor2)
            .limit(2)
            .exec(function(err, res) {
              result3 = res;
              done();
            });
          });
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('sorts the first fetch correctly', function() {
      expect(result1.data.length).toBe(2);
      expect(result1.data[0].other).toBe('other2');
      expect(result1.data[1].other).toBe('other3');
      expect(result2.data.length).toBe(2);
      expect(result2.data[0].other).toBe('other5');
      expect(result2.data[1].other).toBe('other4');
      expect(result3.data.length).toBe(1);
      expect(result3.data[0].other).toBe('other1');
    });
  });

  describe('sorting with null and undefined fields descending', function() {
    const schema = {
      un:{type:String, sortable:true},
      other:{type:String, sortable:true}
    };
    let UserRestmon, result1, result2, result3;

    beforeEach(function(done) {
      UserRestmon = new Restmon('User', schema);
      const userArr = [];
      userArr.push(new UserRestmon.model({un:'un4', other:'other1'}));
      userArr.push(new UserRestmon.model({un:null, other:'other2'}));
      userArr.push(new UserRestmon.model({other:'other3'}));
      userArr.push(new UserRestmon.model({un:'un1', other:'other4'}));
      userArr.push(new UserRestmon.model({other:'other5'}));
      UserRestmon.create(userArr, function() {
        UserRestmon.find({})
        .sort('-un,other')
        .limit(2)
        .exec(function(err, res) {
          result1 = res;
          const cursor = new Restmon.Cursor(result1._meta.last);
          UserRestmon.find({})
          .sort('-un,other')
          .after(cursor)
          .limit(2)
          .exec(function(err, res) {
            result2 = res;
            const cursor2 = new Restmon.Cursor(result2._meta.last);
            UserRestmon.find({})
            .sort('-un,other')
            .after(cursor2)
            .limit(2)
            .exec(function(err, res) {
              result3 = res;
              done();
            });
          });
        });
      });
    });

    afterEach(function(done) {
      UserRestmon.model.remove({}, function() {
        delete mongoose.models['User'];
        done();
      });
    });

    it('sorts the first fetch correctly', function() {
      expect(result1.data.length).toBe(2);
      expect(result1.data[0].other).toBe('other1');
      expect(result1.data[1].other).toBe('other4');
      expect(result2.data.length).toBe(2);
      expect(result2.data[0].other).toBe('other2');
      expect(result2.data[1].other).toBe('other3');
      expect(result3.data.length).toBe(1);
      expect(result3.data[0].other).toBe('other5');
    });
  });
});
