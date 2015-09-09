## Mongo Sharded Cluster

A simple way to shard MongoDB on the app layer. 

With this approach, we have a set of replica sets. Then we can select a shard for our data based on free disk space on the DB.

> For this, you need to run identical clusters (with the same size of disk space and the same storage engine)


### Usage

Install it first:

```
npm i mongo-sharded-cluster
```

Using it

```js
var MongoCluster = require('mongo-sharded-cluster');
var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var myCluster = new MongoCluster();

var replSetUrls = [
    {name: "one", url: "mongodb://localhost/one"},
    {name: "two", url: "mongodb://localhost/two"},
];
async.each(replSetUrls, function(replSetInfo, done) {
    MongoClient.connect(replSetInfo.url, function(err, db) {
        if(db) {
            myCluster.add(replSetInfo.name, db);
        }
        done(err);
    });
}, function(err) {
    if(err) {
        throw err;
    }

    myCluster.startDbSizeLookup(function() {
        // Pick a shard
        var shardName = myCluster.pickShard(); 
        // Then you can save this shardName in where you need.
        
        // Get the connection for the shard
        var conn = myCluster.getConnection(shardName);
    });
});
```