# restmon

A package that implements common desired functionality of RESTful designs.

For use with Mongoose and MongoDB.

1. Pagination using cursors that does not rely on page numbers or single field sorting
2. Automatically duplicating string values to a lower case field for sorting
3. Automatically updating an "updated" field

## Installation

`npm install @hatchpad/restmon --save`

## Usage

### Schema & Model Definition

```
// Person.js
var mongoose = require('mongoose');
var Restmon = require('@hatchpad/restmon')(mongoose, 'a_secret_token');

var schema = {
  firstName:{type:String, sortable:true},   // notice sortable property
  lastName:{type:String, sortable:true},
  dob:{type:Date, sortable: true}
};

var Person = new Restmon('Person', schema);
module.exports = Person;
```

### Queries

##### Let's assume the database has the following person objects:
```
[
{firstName: 'Bill', lastName: 'Doe',    dob:'Dec 10, 1990'},
{firstName: 'Bob',  lastName: 'Smith',  dob:'Oct 03, 1980'},
{firstName: 'John', lastName: 'Doe',    dob:'Jun 10, 1990'},
{firstName: 'Doug', lastName: 'Dooley', dob:'Mar 12, 1960'},
{firstName: 'John', lastName: 'Smith',  dob:'Jul 20, 1990'}
]
```

#### Explanation of cursors

Cursors are a string token representing all the sortable fields of an object. Using the metadata returned in a restmon query, we can easily set up pagination or polling without trusting that the data objects will not change or be removed from the database.

#### Pagination Example

##### *First Page*
```
// include the model object
var Person = require('./person.js');

var query = {};
Person.find(query)
.sort({lastName:1, firstName:-1})  // sort by lastName asc then firstName desc
.limit(2)
.exec(function(err, response) {
  var personArr = response.data;   // ['John Doe', 'Bill Doe']
  var lastPersonCursor = response._meta.last;
});
```

##### *Second Page*

Assume we have retained *lastPersonCursor* from the previous code block
```
var query = {};
Person.find(query)
.sort({'lastName,-firstName'})    // string representation of sort
.limit(2)
.after(lastPersonCursor)          // use of "after"
.exec(function(err, response) {
  var personArr = response.data;  // ['Doug Dooley', 'John Smith']
});
```

#### Polling Example

##### *First Query*
```
// include the model object
var Person = require('./person.js');

var asOf = new Date();             // keep track of the asOf date

var query = {};
Person.find(query)
.sort({lastName:1, firstName:-1})  // sort by lastName asc then firstName desc
.limit(2)
.exec(function(err, response) {
  var personArr = response.data;   // ['John Doe', 'Bill Doe']
  var lastPersonCursor = response._meta.last;
});
```

##### *Polling*

Assume we have retained *lastPersonCursor* and *asOf* from the previous code block
```
var query = {};
Person.find(query)
.sort({'lastName,-firstName'})    // string representation of sort
.limit(2)
.before(lastPersonCursor)         // use of "before"
.since(asOf)
.exec(function(err, response) {
  // will only return objects that are new or have been updated
  var personArr = response.data;
});
```

### Updating

Example showing automatic update tracking date and sortable string duplication
```
var person = {
  firstName: 'Rick',
  lastName: 'Peoples'
};
Person.save(person, function(err, savedPerson) {
});
```

In this example, savedPerson will be this
```
{
  _firstName: 'rick',
  firstName: 'Rick',
  _lastName: 'peoples',
  lastName: 'Peoples',
  updated: "the current date/time"
}
```

### Config Options

#### Config Options Example
```
var options = {ignoreCase: false};
var Restmon = require('@hatchpad/restmon')(mongoose, 'a_secret_token', options);
```

* **ignoreCase**
  * **Boolean** - whether to ignore case for strings when sorting
  * *default* true
