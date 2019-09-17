module.exports = mysqlPool => {
  const bcrypt = require("bcrypt");
  const listAPIKey = (userId, done) => {
    mysqlPool.query(
      "SELECT keyNumber, keyName FROM apiKey WHERE keyOwner = ?",
      [userId],
      (err, results, fields) => {
        if (err) {
          done(false);
          console.log(err);
        } else {
          done({ data: results });
        }
      }
    );
  };
  const insertAPI = (name, password, owner, done) => {
    const hashedPassword = bcrypt.hashSync(password, 12);
    mysqlPool.query(
      "INSERT INTO apiKey (keyOwner, keyName, keyPassword) VALUES(?, ?, ?)",
      [owner, name, hashedPassword],
      err => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          done(true);
        }
      }
    );
  };
  const isUserExists = (username, done) => {
    mysqlPool.query(
      "SELECT keyName FROM apiKey WHERE keyName = ?",
      [username],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          if (results.length > 0) {
            done(true);
          } else {
            done(false);
          }
        }
      }
    );
  };
  const checkAPIRole = (keyNumber, done) => {
    mysqlPool.query(
      "SELECT permId FROM permGroup WHERE keyNumber = ?",
      [keyNumber],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          const permList = [];
          results.forEach(element => {
            permList.push(element.permId);
          });
          done(permList);
        }
      }
    );
  };

  return {
    listAPIKey: listAPIKey,
    insertAPI: insertAPI,
    isUserExists: isUserExists,
    checkAPIRole: checkAPIRole
  };
};
