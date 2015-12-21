# restmon

A package that implements common desired functionality of RESTful designs.

For use with Mongoose and MongoDB.

1. Pagination using cursors that does not rely on page numbers or single field sorting
2. Automatically duplicating string values to a lower case field for sorting
3. Automatically updating an "updated" field

## Installation

`npm install @hatchpad/restmon --save`

## Usage

### Include

#### Schema & Model Definition
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

#### Queries

```
Let's assume the database has the following person objects:
[
{firstName: 'John', lastName: 'Doe',    dob:'Dec 10, 1990'},
{firstName: 'Bob',  lastName: 'Smith',  dob:'Oct 03, 1980'},
{firstName: 'Bill', lastName: 'Doe',    dob:'Jun 10, 1990'},
{firstName: 'Doug', lastName: 'Dooley', dob:'Mar 12, 1960'},
{firstName: 'John', lastName: 'Smith',  dob:'Jul 20, 1990'}
]
```
