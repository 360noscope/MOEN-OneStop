const settingEnv = process.env;
const ldap = require("ldapjs");
const bcrypt = require("bcrypt");
const Promise = require("promise");
const mysqlPool = require("./Database");
const converter = require("./LdapConvert");
const auth = require("./Auth");

const ldapClient = ldap.createClient({
  url: `ldaps://${settingEnv.LDAP_SERVER}`,
  tlsOptions: { rejectUnauthorized: false }
});

const ldapBind = (username, password) => {
  return new Promise((resolve, reject) => {
    ldapClient.bind(`${username}@energy.local`, password, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const ldapSearch = username => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: "sub",
      filter: `(userPrincipalName=${username}@energy.local)`
    };
    ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
      if (err) {
        reject(err);
      } else {
        search.on("searchEntry", entry => {
          const user = entry.object;
          const ouInfo = user.distinguishedName.split(",")[1].split("=")[1];
          const groupList = [];
          if (typeof user.memberOf == "string") {
            groupList.push(user.memberOf.split(",")[0].split("=")[1]);
          } else {
            user.memberOf.forEach((item, index) => {
              groupList.push(item.split(",")[0].split("=")[1]);
            });
          }
          const adminRight =
            groupList.includes("Administrators") ||
            groupList.includes("Domain Admins");
          mysqlPool.query(
            "SELECT moen_officer.th_firstname, moen_officer.th_lastname, moen_officer.photoRaw, moen_department.deptName " +
              "FROM moen_officer " +
              "JOIN moen_workgroup ON moen_officer.workgroupUUID = moen_workgroup.groupUUID " +
              "JOIN moen_department ON moen_workgroup.departmentUUID = moen_department.deptUUID " +
              "WHERE moen_officer.AD_UUID = ?",
            [converter.GUIDtoUUID(user.objectGUID)],
            (err, results, fields) => {
              if (err) {
                reject(err);
              } else {
                const dbUser = results[0];
                resolve({
                  UUID: converter.GUIDtoUUID(user.objectGUID),
                  OU: dbUser.deptName,
                  firstname: dbUser.th_firstname,
                  lastname: dbUser.th_lastname,
                  picture: dbUser.photoRaw,
                  isAdmin: adminRight
                });
              }
            }
          );
        });
      }
    });
  });
};

const webLogin = (username, password) => {
  return new Promise((resolve, reject) => {
    ldapBind(username, password)
      .then(() => {
        return ldapSearch(username);
      })
      .then(user => {
        resolve(user);
      })
      .catch(err => {
        reject(err);
      });
  });
};

const apiLogin = (username, password, done) => {
  mysqlPool.query(
    "SELECT keyPassword, keyNumber FROM apiKey WHERE keyName = ?",
    [username],
    (err, results, fields) => {
      if (err) {
        console.log(err);
        done(false);
      } else {
        if (results.length > 0) {
          if (bcrypt.compareSync(password, results[0].keyPassword)) {
            done(results[0]["keyNumber"]);
          } else {
            done(false);
          }
        } else {
          done(false);
        }
      }
    }
  );
};

const searchCitizen = (uuid, done) => {
  mysqlPool.query(
    "SELECT citizenId FROM moen_officer WHERE AD_UUID = ?",
    [uuid],
    (err, results, fields) => {
      if (err) {
        console.log(err);
        done(false);
      } else {
        done(results[0]["citizenId"]);
      }
    }
  );
};

const ldapLogin = (username, password, done) => {
  const ldapClient = ldap.createClient({
    url: `ldaps://${settingEnv.LDAP_SERVER}`,
    tlsOptions: { rejectUnauthorized: false }
  });
  const searchOptions = {
    scope: "sub",
    filter: `(userPrincipalName=${username}@energy.local)`
  };
  ldapClient.bind(`${username}@energy.local`, password, err => {
    if (err) {
      if (err.code == 49) {
        done(false);
      } else {
        console.log(err);
      }
    } else {
      ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
        if (err) {
          console.log(err);
        } else {
          search.on("searchEntry", entry => {
            const user = entry.object;
            const ouInfo = user.distinguishedName.split(",")[1].split("=")[1];
            const groupList = [];
            if (typeof user.memberOf == "string") {
              groupList.push(user.memberOf.split(",")[0].split("=")[1]);
            } else {
              user.memberOf.forEach((item, index) => {
                groupList.push(item.split(",")[0].split("=")[1]);
              });
            }
            searchCitizen(converter.GUIDtoUUID(user.objectGUID), result => {
              const adminRight =
                groupList.includes("Administrators") ||
                groupList.includes("Domain Admins");
              const userObject = {
                UUID: converter.GUIDtoUUID(user.objectGUID),
                citizenId: result,
                OU: ouInfo,
                firstname: user.givenName,
                lastname: user.sn,
                isAdmin: adminRight
              };
              done(userObject);
            });
          });
        }
      });
    }
  });
};

module.exports = {
  webLogin: webLogin,
  apiLogin: apiLogin,
  ldapLogin: ldapLogin
};
