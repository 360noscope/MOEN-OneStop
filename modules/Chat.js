const mysqlPool = require("./Database");
const Promise = require("promise");
const Cacher = require("./Cacher");

const chatRecord = (owner, msgBlock) => {
  return new Promise((resolve, reject) => {
    const chatKey = "chat:" + owner;
    let msgtoDB = [];
    Cacher.cacheRetreive(chatKey)
      .then(chatCache => {
        if (chatCache) {
          Object.keys(chatCache).forEach(key => {
            chatCache[key].push(msgBlock);
            msgtoDB.push([
              msgBlock.owner,
              key,
              msgBlock.text,
              msgBlock.timeStamp
            ]);
          });
          Cacher.cacheUpdate(chatKey, chatCache);
        } else {
          let msgObj = {};
          Object.keys(msgBlock).forEach(key => {
            if (!msgObj.hasOwnProperty(key)) {
              msgObj[key] = [];
            }
            msgtoDB.push([
              msgBlock.owner,
              key,
              msgBlock.text,
              msgBlock.timeStamp
            ]);
            msgObj[key].push(msgBlock[key]);
          });
          Cacher.cacheUpdate(chatkey, msgObj);
        }
        //timestamp from to message

        mysqlPool.query(
          "INSERT INTO chat_log (from, to, messasge, timestamp) VALUES ?",
          msgtoDB,
          err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      })
      .catch(err => {
        reject(err);
      });
  });
};

module.exports = {
  chatRecord: chatRecord
};
