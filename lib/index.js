var async = require('async');
var _ = require('underscore');

module.exports = MongoEasyShard = function(options) {
  options = options || {};
  this._lookupInterval = options.lookupInterval || 1000 * 30; //30 secs
  
  this._shardMap = {};
  this._stopped = false;
  this._started = false;
  this._lookupDbSize = this._lookupDbSize.bind(this);
};

MongoEasyShard.prototype.addShard = function(name, conn) {
  var self = this;
  if(self._shardMap[name]) {
    throw new Error("Shard exists: " + name);
  }

  self._shardMap[name] = {
    conn: conn,
    size: null
  };
};

MongoEasyShard.prototype.getConnection = function(name) {
  var shardInfo = this._shardMap[name];
  if(!shardInfo) {
    throw new Error("Shard does not exists: " + name);
  }

  return shardInfo.conn;
};

MongoEasyShard.prototype.pickShard = function() {
  
};

MongoEasyShard.prototype.start = function() {
  var self = this;
  if(self._started) {
    throw new Error("Already started");
  }
  self._started = true;

  function startLookup() {
    if(self._stopped) {
      return;
    }

    var shardInfoList = _.values(self._shardMap);
    var startTime = Date.now();
    async.each(shardInfoList, self._lookupDbSize, function(err) {
      if(err) {
        console.warn("WARN - failed dbsize lookup:", err.message);
      }
      var timeTaken = Date.now() - startTime;
      var intervalTime = self._lookupInterval - timeTaken;
      intervalTime = (intervalTime < 0)? 0 : intervalTime;
      setTimeout(startLookup, intervalTime);
    });
  }

  startLookup();
};

MongoEasyShard.prototype._lookupDbSize = function(shardInfo, done) {
  var self = this;
  shardInfo.conn.command({dbStats: 1, scale: 1}, function(err, stat) {
    if(stat) {
      shardInfo.size = stat.dataSize + stat.indexSize;
    }
  
    done(err);
  });
};

MongoEasyShard.prototype.stop = function() {
  this._stopped = true;
};