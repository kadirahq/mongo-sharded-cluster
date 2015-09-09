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

  describe("startDbSizeLookup", function() {
    it("should lookup db size", drop(function(db, done) {
      var es = new MongoEasyShard();
      es.addShard("s1", db);
      es.addShard("s2", db);

      db.collection('abc').insert({aa: 10}, function(err) {
        assert.ifError(err);
        es.startDbSizeLookup();
        setTimeout(function() {
          assert.equal(es._shardMap["s1"].size > 0, true);
          assert.equal(es._shardMap["s2"].size > 0, true);
          es.stop();
          done();
        }, 200);
      });
    }));

    it("should poll for the dbsize continously", function(done) {
      var es = new MongoEasyShard({lookupInterval: 100});
      es.addShard("s1", {});
      var count = 0;
      es._lookupDbSize = function(sharInfo, done) {
        count++;
        done();
      };
      es.startDbSizeLookup();

      setTimeout(function() {
        assert.equal(count, 5);
        done();
        es.stop();
      }, 450);
    });
  })

  describe("getConnection", function() {
    it("should give the registerded connection", function(done) {
      var es = new MongoEasyShard();
      var conn = {};
      es.addShard("s1", conn);
      var c = es.getConnection("s1");
      assert.equal(c, conn);
      done();
    }); 

    it("should throw an error when there is no shard", function(done) {
      var es = new MongoEasyShard();
      try{
        es.getConnection("s1");
      } catch(ex) {
        done();
      }
    });
  });
});