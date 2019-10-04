module.exports = (settingEnv, mysqlPool) => {
  const ldap = require("ldapjs");
  const converter = require("./LdapConvert");
  const ssha = require("node-ssha256");
  const Promise = require("promise");
  const listUser = done => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter: "(&(objectCategory=person)(objectClass=user))"
          };
          ldapClient.search(
            "dc=energy,dc=local",
            searchOptions,
            (err, search) => {
              if (err) {
                console.log(err);
              } else {
                const userResult = {};
                search.on("searchEntry", entry => {
                  let userOU, processGroup, uniqueGroup;
                  const userObject = entry.object;
                  const splitedDN = userObject.distinguishedName.split(",");
                  const userGroups = userObject.memberOf;
                  if (splitedDN.find(word => word.includes("OU")) != null) {
                    userOU = splitedDN
                      .find(word => word.includes("OU"))
                      .split("=")[1];
                  }
                  if (userGroups != null) {
                    processGroup = [];
                    if (typeof userGroups == "string") {
                      if (
                        !userGroups.includes("CN=Builtin") &&
                        !userGroups.includes("CN=Users") &&
                        !userGroups.includes("OU=MOEN-WIFI-Group") &&
                        !userGroups.includes("CN=WIFI-STAFF")
                      ) {
                        processGroup.push(
                          userGroups.split(",")[0].split("=")[1]
                        );
                      }
                    } else {
                      userGroups.forEach(groupRow => {
                        if (
                          !groupRow.includes("CN=Builtin") &&
                          !groupRow.includes("CN=Users") &&
                          !groupRow.includes("OU=MOEN-WIFI-Group") &&
                          !groupRow.includes("CN=WIFI-STAFF")
                        ) {
                          processGroup.push(
                            groupRow.split(",")[0].split("=")[1]
                          );
                        }
                      });
                    }
                  }
                  if (Array.from(new Set(processGroup)).length > 0) {
                    uniqueGroup = Array.from(new Set(processGroup));
                  }
                  const requiredObj = {
                    userFullname: userObject.name,
                    account: userObject.sAMAccountName,
                    groups: uniqueGroup
                  };
                  if (userOU != null) {
                    requiredObj["OU"] = userOU;
                  }
                  userResult[
                    converter.GUIDtoUUID(userObject.objectGUID)
                  ] = requiredObj;
                });
                search.on("end", () => {
                  done(userResult);
                  /*resolveOUName(userResult, results => {
                    resolveWorkgroup(results, workgroupRes => {
                      done(workgroupRes);
                    });
                  });*/
                });
              }
            }
          );
        }
      }
    );
  };

  const promiseOUName = uuid => {
    return new Promise((resolve, reject) => {
      let deptList = {};
      mysqlPool.query(
        "SELECT deptName, deptUUID FROM moen_department WHERE deptUUID IN (?)",
        [uuid],
        (err, results, fields) => {
          if (err) {
            console.log(err);
            reject();
          } else {
            results.forEach(row => {
              deptList[row.deptUUID] = row.deptName;
            });
            resolve(deptList);
          }
        }
      );
    });
  };

  const promiseGroupName = uuid => {
    return new Promise((resolve, reject) => {
      let groupList = {};
      mysqlPool.query(
        "SELECT groupName, groupUUID FROM moen_workgroup WHERE groupUUID IN (?)",
        [uuid],
        (err, results, fields) => {
          if (err) {
            console.log(err);
            reject();
          } else {
            results.forEach(row => {
              groupList[row.groupUUID] = row.groupName;
            });
            resolve(groupList);
          }
        }
      );
    });
  };

  const resolveOUName = (userList, done) => {
    let ouObject = {},
      searchTest = [],
      ouFilter = "";
    //creating OU filter
    Object.keys(userList).forEach((key, index) => {
      if (
        userList[key].hasOwnProperty("OU") &&
        !ouObject.hasOwnProperty(userList[key]["OU"])
      ) {
        ouObject[userList[key]["OU"]] = "";
        ouFilter += `(ou=${userList[key]["OU"]})`;
        if (index < 0 && index < Object.keys(userList).length - 1) {
          ouFilter += ",";
        }
      }
    });

    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter: `(&(|${ouFilter})(objectClass=organizationalunit))`
          };
          ldapClient.search(
            "dc=energy,dc=local",
            searchOptions,
            (err, search) => {
              if (err) {
                console.log(err);
              } else {
                search.on("searchEntry", entry => {
                  const singleObject = entry.object;
                  ouObject[singleObject["ou"]] = converter.GUIDtoUUID(
                    singleObject["objectGUID"]
                  );
                  searchTest.push(
                    converter.GUIDtoUUID(singleObject["objectGUID"])
                  );
                });
                search.on("end", () => {
                  promiseOUName(searchTest).then(result => {
                    Object.keys(ouObject).forEach((key, index) => {
                      ouObject[key] = result[ouObject[key]];
                    });
                    Object.keys(userList).forEach((key, index) => {
                      userList[key]["department"] =
                        ouObject[userList[key]["OU"]];
                    });
                    done(userList);
                  });
                });
              }
            }
          );
        }
      }
    );
  };

  const resolveWorkgroup = (userList, done) => {
    let groupObject = {};
    Object.keys(userList).forEach((key, index) => {
      let groupFilter = "",
        groupSearch = [],
        groupCounter = 0;
      const groupList = userList[key]["groups"];
      groupList.forEach(group => {
        groupFilter += `(CN=${group})`;
        if (groupCounter < 0 && groupCounter < groupList.length - 1) {
          groupFilter += ",";
        }
        groupCounter += 1;
      });
      const ldapClient = ldap.createClient({
        url: `ldaps://${settingEnv.LDAP_SERVER}`,
        tlsOptions: { rejectUnauthorized: false }
      });
      ldapClient.bind(
        `${settingEnv.AD_API_ACCOUNT}@energy.local`,
        settingEnv.AD_API_PASSWORD,
        err => {
          if (err) {
          } else {
            const searchOptions = {
              scope: "sub",
              filter: `(&(objectClass=Group)${groupFilter})`
            };
            ldapClient.search(
              "dc=energy,dc=local",
              searchOptions,
              (err, search) => {
                if (err) {
                  console.log(err);
                } else {
                  search.on("searchEntry", entry => {
                    const singleObj = entry.object;
                    groupObject[singleObj.cn] = converter.GUIDtoUUID(
                      singleObj.objectGUID
                    );
                    console.log(groupObject);
                    groupSearch.push(
                      converter.GUIDtoUUID(singleObj.objectGUID)
                    );
                  });
                  search.on("end", () => {
                    promiseGroupName(groupSearch).then(rows => {
                      /* Object.keys(groupObject).forEach((key, index) => {
                        groupObject[key] = rows[groupObject[key]];
                      });*/
                    });
                  });
                }
              }
            );
          }
        }
      );
    });
    done(groupObject);
  };

  const listOU = done => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter:
              "(&(objectCategory=OrganizationalUnit)(|(OU=MOEN-*)(OU=Outsource)))"
          };
          ldapClient.search(
            "dc=energy,dc=local",
            searchOptions,
            (err, search) => {
              if (err) {
                console.log(err);
              } else {
                const OUList = [];
                search.on("searchEntry", entry => {
                  const ouObj = entry.object;
                  OUList.push({
                    name: ouObj.name,
                    UUID: converter.GUIDtoUUID(ouObj.objectGUID)
                  });
                });
                search.on("end", () => {
                  done(OUList);
                });
              }
            }
          );
        }
      }
    );
  };

  const listGroup = done => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter: "(&(objectClass=Group))"
          };
          ldapClient.search(
            "dc=energy,dc=local",
            searchOptions,
            (err, search) => {
              if (err) {
                console.log(err);
              } else {
                const groupResult = [];
                search.on("searchEntry", entry => {
                  const groupObj = entry.object;
                  if (
                    groupObj.distinguishedName.includes("OU=MOEN-") ||
                    groupObj.distinguishedName.includes("OU=Outsource")
                  ) {
                    groupResult.push({
                      name: groupObj.cn,
                      UUID: converter.GUIDtoUUID(groupObj.objectGUID)
                    });
                  }
                });
                search.on("end", () => {
                  done(groupResult);
                });
              }
            }
          );
        }
      }
    );
  };

  const searchUser = (conditions, done) => {
    let dnString = "dc=energy,dc=local";
    let searchFilter =
      "(&(objectCategory=person)(objectClass=user)@conditions)";
    if (Object.keys(conditions).length > 0) {
      searchFilter = searchFilter.replace("@conditions", "(@condition)");
      let conditionStr = "";
      Object.keys(conditions).forEach((key, index) => {
        if (index > 0 && index != Object.keys(conditions).length - 1) {
          conditionStr += ",";
        }
        if (key == "ou") {
          conditionStr += `ou=${conditions["ou"]}`;
        } else if (key == "group") {
          conditionStr += `memberOf=cn=${conditions["group"]}`;
        } else if (key == "name") {
          conditionStr += `cn=${conditions["name"]}`;
        }
      });
      searchFilter = searchFilter.replace("@condition", conditionStr);
    } else {
      searchFilter = searchFilter.replace("@conditions", "");
    }
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter: searchFilter
          };
          ldapClient.search(dnString, searchOptions, (err, search) => {
            const userList = [];
            if (err) {
              console.log(err);
              done(false);
            } else {
              search.on("searchEntry", entry => {
                const userObj = entry.object;
                userList.push(userObj);
              });
              search.on("end", () => {
                done(userList);
              });
            }
          });
        }
      }
    );
  };

  const encodePassword = password => {
    var newPassword = "";
    password = '"' + password + '"';
    for (var i = 0; i < password.length; i++) {
      newPassword += String.fromCharCode(
        password.charCodeAt(i) & 0xff,
        (password.charCodeAt(i) >>> 8) & 0xff
      );
    }
    return newPassword;
  };

  const addUser = (userData, done) => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    const newDN = `cn=${userData.firstname} ${userData.lastname},ou=${userData.workgroup},dc=energy,dc=local`;
    const newUser = {
      cn: `${userData.firstname} ${userData.lastname}`,
      sn: userData.lastname,
      sAMAccountName: `${userData.firstname}${userData.lastname.substring(
        0,
        2
      )}`,
      mail: `${userData.firstname}${userData.lastname.substring(
        0,
        2
      )}@energy.go.th`,
      givenName: userData.firstname,
      distinguishedName: `CN=${userData.firstname}${userData.lastname},OU=${userData.workgroup},DC=energy,DC=local`,
      userPrincipalName: `${userData.firstname}${userData.lastname.substring(
        0,
        2
      )}@energy.local`,
      objectCategory: "CN=Person,CN=Schema,CN=Configuration,DC=energy,DC=local",
      objectClass: ["top", "person", "organizationalPerson", "user"]
    };
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        ldapClient.add(newDN, newUser, err => {
          if (err) {
            console.log(err);
            done(err);
          } else {
            ldapClient.modify(
              newDN,
              [
                new ldap.Change({
                  operation: "add",
                  modification: {
                    unicodePwd: encodePassword(userData.password)
                  }
                }),
                new ldap.Change({
                  operation: "replace",
                  modification: {
                    userAccountControl: 544
                  }
                })
              ],
              err => {
                if (err) {
                  console.log(err);
                  done(false);
                } else {
                  done();
                }
              }
            );
          }
        });
      }
    );
  };

  return {
    listUser: listUser,
    listOU: listOU,
    addUser: addUser,
    listGroup: listGroup,
    searchUser: searchUser
  };
};
