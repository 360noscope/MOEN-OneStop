const redis = require("redis");
const redisClient = redis.createClient(6379);
const Promise = require("promise");

const cacheUpdate = (key, data) => {
  return new Promise((resolve, reject) => {
    redisClient.setex(key, 3600, JSON.stringify(data));
    resolve();
  });
};

const cacheRetreive = key => {
  return new Promise((resolve, reject) => {
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
  });
};

const cacheDelete = key => {
  return new Promise((resolve, reject) => {
    redisClient.del(key);
    resolve();
  });
};

module.exports = {
  cacheUpdate: cacheUpdate,
  cacheRetreive: cacheRetreive,
  cacheDelete: cacheDelete
};
