const mysqlPool = require("./Database");
const Promise = require("promise");
const Cacher = require("./Cacher");
const CronJob = require("cron").CronJob;
const crypto = require("crypto");

const chatFlushJob = new CronJob("0 */1 * * * *", () => {
  Cacher.readCache(2)
    .then(chatCache => {
      if (chatCache.length > 0) {
        let chatList = [];
        chatCache.forEach(chBlock => {
          const msgId = crypto.randomBytes(10).toString("hex");
          let localBull = chBlock["local"] ? 1 : 0;
          chatList.push([
            msgId,
            chBlock.timeStamp,
            chBlock.owner,
            chBlock.destClient,
            chBlock.text,
            localBull
          ]);
        });
        mysqlPool.query(
          "INSERT INTO chat_log (`msgId`, `msgtime`, `fromUser`, `toUser`, `message`, `local`) VALUES ?",
          [chatList],
          err => {
            if (err) {
              console.error("[System] " + err);
            } else {
              console.log("[System] Recorded chat history!!");
            }
          }
        );
      }
      return Cacher.clearCache(2);
    })
    .then(() => {
      console.log("[System] Flush chat cache!!");
    })
    .catch(err => {
      console.error("[System] error " + err);
    });
});
chatFlushJob.start();

const chatRecord = (owner, msgBlock) => {
  return new Promise((resolve, reject) => {
    const chatKey = "chat:" + owner;
    Cacher.cacheRetreive(chatKey, 2)
      .then(chatCache => {
        let finalChatData = [];
        if (chatCache) {
          finalChatData = chatCache;
          finalChatData.push(msgBlock);
        } else {
          finalChatData.push(msgBlock);
        }
        return Cacher.cacheUpdate(chatKey, 2, finalChatData);
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
};

const chatRead = (owner, destination) => {
  return new Promise((resolve, reject) => {
    const chatKey = "chat:" + owner;
    Cacher.cacheRetreive(chatKey, 3)
      .then(chatData => {
        if (chatData != false) {
          let chatResult = [];
          chatData.forEach(chBlock => {
            if (chBlock.destClient == destination) {
              chatResult.push(chBlock);
            }
          });
          resolve(chatResult);
        } else {
          mysqlPool.query(
            "SELECT msgtime, fromUser, toUser, message, local FROM chat_log WHERE fromUser = ? AND toUser = ?",
            [owner, destination],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                if (results.length > 0) {
                  let chBlock = [];
                  results.forEach(ch => {
                    chBlock.push({
                      owner: ch.fromUser,
                      text: ch.message,
                      timeStamp: ch.msgtime,
                      destClient: ch.toUser,
                      local: Boolean(ch.local)
                    });
                  });
                  Cacher.cacheUpdate(chatKey, 3, chBlock);
                  resolve(results);
                } else {
                  resolve(false);
                }
              }
            }
          );
        }
      })
      .catch(err => {
        console.error("[System] " + err);
        reject(err);
      });
  });
};

const uuidTranslator = uuid => {
  return new Promise((resolve, reject) => {
    const uuidKey = uuid + ":name";
    Cacher.cacheRetreive(uuidKey, 1).then(name => {
      if (name != false) {
        resolve(name);
      } else {
        mysqlPool.query(
          "SELECT th_prefix, th_firstname, th_lastname FROM moen_officer WHERE AD_UUID = ?",
          [uuid],
          (err, results) => {
            if (err) {
              reject(err);
            } else {
              const fullname =
                results[0].th_prefix +
                " " +
                results[0].th_firstname +
                " " +
                results[0].th_lastname;
              Cacher.cacheUpdate(uuidKey, 1, fullname);
              resolve(fullname);
            }
          }
        );
      }
    });
  });
};

module.exports = {
  chatRecord: chatRecord,
  chatRead: chatRead,
  uuidTranslator: uuidTranslator
};
