var MongoEasyShard = require('../lib/index.js');
var mongo = require("mocha-mongo")("mongodb://localhost/easy-shard");
var drop = mongo.drop();
var assert = require('assert');

describe("MongoEasyShard", function() {
  describe("_lookupDbSize", function() {
    it("should look the db and store dbsize", drop(function(db, done) {
      var es = new MongoEasyShard();
      var shardInfo = {conn: db, size: null};

      db.collection('abc').insert({aa: 10}, function(err) {
        assert.ifError(err);
        es._lookupDbSize(shardInfo, function(err) {
          assert.ifError(err);
          assert.equal(shardInfo.size > 0, true);
          done();
        });
      });
    }));
  })
});