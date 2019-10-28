const redis = require("redis");
const redisClient = redis.createClient(6379);
const Promise = require("promise");

const cacheUpdate = (key, dbKey, data) => {
  return new Promise((resolve, reject) => {
    redisClient.select(dbKey, (err, res) => {
      if (err) {
        reject(err);
      } else {
        redisClient.setex(key, 3600, JSON.stringify(data));
        resolve();
      }
    });
  });
};

const cacheRetreive = (key, dbKey) => {
  return new Promise((resolve, reject) => {
    redisClient.select(dbKey, (err, res) => {
      if (err) {
        reject(err);
      } else {
        redisClient.get(key, (err, data) => {
          if (err) {
            reject(err);
          } else {
            if (data) {
              resolve(JSON.parse(data));
            } else {
              resolve(false);
            }
          }
        });
      }
    });
  });
};

const cacheDelete = key => {
  return new Promise((resolve, reject) => {
    redisClient.del(key);
    resolve();
  });
};

const clearCache = dbKey => {
  return new Promise((resolve, reject) => {
    redisClient.select(dbKey, (err, res) => {
      if (err) {
        reject(err);
      } else {
        redisClient.flushdb(() => {
          resolve();
        });
      }
    });
  });
};

const readCache = dbKey => {
  return new Promise((resolve, reject) => {
    redisClient.select(dbKey, (err, res) => {
      redisClient.keys("*", (err, keys) => {
        if (keys.length > 0) {
          if (err) {
            reject(err);
          } else {
            redisClient.mget(keys, (err, data) => {
              resolve(JSON.parse(data));
            });
          }
        }
      });
    });
  });
};

module.exports = {
  cacheUpdate: cacheUpdate,
  cacheRetreive: cacheRetreive,
  cacheDelete: cacheDelete,
  clearCache: clearCache,
  readCache: readCache
};
