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

    it("should fire the callback only once", function(done) {
      var es = new MongoEasyShard({lookupInterval: 100});
      es.addShard("s1", {});
      es._lookupDbSize = function(sharInfo, done) {
        done();
      };
      
      var count = 0;
      es.startDbSizeLookup(function() {
        count++;
      });

      setTimeout(function() {
        assert.equal(count, 1);
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

  describe("pickShard", function() {
    it("should pick the minimum sized shard", function(done) {
      var es = new MongoEasyShard();
      es._started = true;
      es._shardMap["s1"] = {name: "s1", size: 10};
      es._shardMap["s2"] = {name: "s2", size: 1};
      es._shardMap["s3"] = {name: "s3", size: 100};

      var shardName = es.pickShard();
      assert.equal(shardName, "s2");
      done();
    });

    it("should throw an error, if not started", function(done) {
      var es = new MongoEasyShard();
      try {
        es.pickShard();
      } catch(ex) {
        done();
      }
    });
  });
});