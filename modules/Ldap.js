const settingEnv = process.env;
const mysqlPool = require("./Database");
const ldap = require("ldapjs");
const converter = require("./LdapConvert");
const Promise = require("promise");

const ldapClient = ldap.createClient({
  url: `ldaps://${settingEnv.LDAP_SERVER}`,
  tlsOptions: { rejectUnauthorized: false }
});

const bindClient = () => {
  return new Promise((resolve, reject) => {
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const unbindClient = () => {
  return new Promise((resolve, reject) => {
    ldapClient.unbind(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

//sub method need to bind client from another function!!
const listUser = () => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: "sub",
      filter: "(&(objectCategory=person)(objectClass=user))"
    };
    ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
      if (err) {
        reject(err);
      } else {
        const userResult = {};
        search.on("searchEntry", entry => {
          let userOU, processGroup, uniqueGroup;
          const userObject = entry.object;
          const splitedDN = userObject.distinguishedName.split(",");
          const userGroups = userObject.memberOf;
          if (splitedDN.find(word => word.includes("OU")) != null) {
            userOU = splitedDN.find(word => word.includes("OU")).split("=")[1];
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
                processGroup.push(userGroups.split(",")[0].split("=")[1]);
              }
            } else {
              userGroups.forEach(groupRow => {
                if (
                  !groupRow.includes("CN=Builtin") &&
                  !groupRow.includes("CN=Users") &&
                  !groupRow.includes("OU=MOEN-WIFI-Group") &&
                  !groupRow.includes("CN=WIFI-STAFF")
                ) {
                  processGroup.push(groupRow.split(",")[0].split("=")[1]);
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
          userResult[converter.GUIDtoUUID(userObject.objectGUID)] = requiredObj;
        });
        search.on("end", () => {
          resolve(userResult);
        });
      }
    });
  });
};
const listOU = () => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: "sub",
      filter:
        "(&(objectCategory=OrganizationalUnit)(|(OU=MOEN-*)(OU=Outsource)))"
    };
    ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
      if (err) {
        reject(err);
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
          resolve(OUList);
        });
      }
    });
  });
};
const resolveOU = uuid => {
  return new Promise((resolve, reject) => {
    listOU()
      .then(search_result => {
        search_result.forEach(item => {
          if (item.UUID == uuid) {
            resolve(item.name);
          }
        });
      })
      .catch(err => {
        reject(err);
      });
  });
};
const listGroup = () => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: "sub",
      filter: "(&(objectClass=Group))"
    };
    ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
      if (err) {
        reject(err);
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
          resolve(groupResult);
        });
      }
    });
  });
};
const resolveWorkgroup = uuid => {
  return new Promise((resolve, reject) => {
    listGroup()
      .then(search_result => {
        search_result.forEach(item => {
          if (item.UUID == uuid) {
            resolve(item.name);
          }
        });
      })
      .catch(err => {
        reject(err);
      });
  });
};

const searchUser = (conditions, done) => {
  let dnString = "dc=energy,dc=local";
  let searchFilter = "(&(objectCategory=person)(objectClass=user)@conditions)";
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

const clientAdd = (userDN, userObject) => {
  return new Promise((resolve, reject) => {
    ldapClient.add(userDN, userObject, err => {
      if (err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
};

const clientUpdatePassword = userData => {
  return new Promise((resolve, reject) => {
    const password =
      userData.Eng_firstname.substring(0, 1).toUpperCase() +
      userData.Eng_lastname.substring(0, 1).toLowerCase() +
      "@" +
      userData.Id.substring(8, 13);
    ldapClient.modify(
      newDN,
      [
        new ldap.Change({
          operation: "add",
          modification: {
            unicodePwd: new Buffer('"' + password + '"', "utf16le").toString()
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
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const clientUpdateGroup = (groupDN, userDN) => {
  return new Promise((resolve, reject) => {
    const change = new ldap.Change({
      operation: "add",
      modification: {
        member: [userDN]
      }
    });
    ldapClient.modify(groupDN, change, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const searchUserUUID = userData => {
  return new Promise((resolve, reject) => {
    let dnString = "dc=energy,dc=local";
    const searchOptions = {
      scope: "sub",
      filter: `(&(objectCategory=person)(objectClass=user)(cn=${userData.Eng_firstname} ${userData.Eng_lastname}))`
    };
    ldapClient.search(dnString, searchOptions, (err, search) => {
      if (err) {
        reject(err);
      } else {
        let uuid;
        search.on("searchEntry", entry => {
          const userObj = entry.object;
          uuid = converter.GUIDtoUUID(userObj.objectGUID);
        });
        search.on("end", () => {
          resolve(uuid);
        });
      }
    });
  });
};

const searchGroupUUID = userData => {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: "sub",
      filter: `(&(objectClass=Group)(cn=${userData.workgroup}))`
    };
    ldapClient.search("dc=energy,dc=local", searchOptions, (err, search) => {
      if (err) {
        reject(err);
      } else {
        const groupResult = [];
        search.on("searchEntry", entry => {
          const groupObj = entry.object;
          groupResult.push({
            name: groupObj.cn,
            UUID: converter.GUIDtoUUID(groupObj.objectGUID)
          });
        });
        search.on("end", () => {
          resolve(groupResult[0]);
        });
      }
    });
  });
};

const clientDatabaseUpdate = userData => {
  return new Promise((resolve, reject) => {
    const mail = `${userData.Eng_firstname}${userData.Eng_lastname.substring(
      0,
      2
    )}@energy.go.th`;

    Object.keys(userData).forEach((key, index) => {
      if (!userData[key]) {
        userData[key] = null;
      }
    });
    mysqlPool.query(
      "INSERT INTO moen_officer (citizenId, AD_UUID, en_prefix, en_firstname, en_lastname, th_prefix, " +
        "th_firstname, th_lastname, workgroupUUID, eMail, empTypeiD, PositioniD, LeveliD, Mobile, Tel, Birthday, " +
        "photoRaw, addHouseNo, addVillageNo, addTambol, addAmphur, addProvince, sex, empJob) " +
        "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userData.Id,
        userData.UserUUID,
        userData.Eng_prefix,
        userData.Eng_firstname,
        userData.Eng_lastname,
        userData.Th_prefix,
        userData.Th_firstname,
        userData.Th_lastname,
        userData.workgroup,
        mail,
        userData.employee_type,
        userData.employee_position,
        userData.employee_level,
        userData.employee_mobile,
        userData.employee_tel,
        userData.BDate,
        userData.Picture,
        userData.House_no,
        userData.Village_no,
        userData.Tumbol,
        userData.Ampur,
        userData.Province,
        userData.Sex,
        userData.empJob
      ],
      err => {
        if (err) {
          reject(err);
        } else {
          const selected_system = userData.selected_system;
          mysqlPool.query(
            "INSERT INTO moen_App (CitizenID, Email, Eleave, eOffice, eDocPR, eKeep, eCir, Saraban, Vpn, Car) " +
              "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              userData.Id,
              selected_system.emailSys,
              selected_system.eleaveSys,
              selected_system.eMeetSys,
              selected_system.edocPRSys,
              selected_system.ekeepSys,
              selected_system.ecirSys,
              selected_system.sarabunSys,
              selected_system.vpnSys,
              selected_system.carSys
            ],
            err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        }
      }
    );
  });
};

const insertUser = userData => {
  return new Promise((resolve, reject) => {
    const userObject = {
      cn: `${userData.Eng_firstname} ${userData.Eng_lastname}`,
      sn: userData.Eng_lastname,
      sAMAccountName: `${userData.Eng_firstname.toLowerCase()}${userData.Eng_lastname.substring(
        0,
        2
      ).toLowerCase()}`,
      mail: `${userData.Eng_firstname}${userData.Eng_lastname.substring(
        0,
        2
      )}@energy.go.th`,
      givenName: userData.Eng_firstname,
      distinguishedName: `CN=${userData.Eng_firstname}${userData.Eng_lastname},OU=${userData.department},DC=energy,DC=local`,
      userPrincipalName: `${userData.Eng_firstname.toLowerCase()}${userData.Eng_lastname.substring(
        0,
        2
      )}@energy.local`,
      objectCategory: "CN=Person,CN=Schema,CN=Configuration,DC=energy,DC=local",
      objectClass: ["top", "person", "organizationalPerson", "user"]
    };
    let workgroup, department, userDN;
    bindClient()
      .then(() => {
        return resolveWorkgroup(userData.workgroup);
      })
      .then(workgroupName => {
        workgroup = workgroupName;
        return resolveOU(userData.department);
      })
      .then(departmentName => {
        department = departmentName;
        userDN = `cn=${userData.Eng_firstname} ${userData.Eng_lastname},ou=${department},dc=energy,dc=local`;
      })
      .then(() => {
        return clientAdd(userDN, userObject);
      })
      .then(() => {
        return clientUpdatePassword(userData);
      })
      .then(() => {
        const wifigroupDN =
          "CN=WIFI-STAFF,OU=MOEN-WIFI-Group,DC=energy,DC=local";
        return clientUpdateGroup(wifigroupDN, userDN);
      })
      .then(() => {
        const workgroupDN = `CN=${workgroup},OU=${department},DC=energy,DC=local`;
        return clientUpdateGroup(workgroupDN, userDN);
      })
      .then(() => {
        return searchUserUUID(userData);
      })
      .then(userUUID => {
        userData.UserUUID = userUUID;
        return clientDatabaseUpdate(userData);
      })
      .then(() => {
        ldapClient.unbind();
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
};
//end sub method section

const getUserList = () => {
  return new Promise((resolve, reject) => {
    bindClient()
      .then(() => {
        return listUser();
      })
      .then(search_result => {
        ldapClient.unbind();
        resolve(search_result);
      })
      .catch(err => {
        reject(err);
      });
  });
};

const getGroupList = () => {
  return new Promise((resolve, reject) => {
    bindClient()
      .then(() => {
        return listGroup();
      })
      .then(search_result => {
        ldapClient.unbind();
        resolve(search_result);
      })
      .catch(err => {
        reject(err);
      });
  });
};

const getOUList = () => {
  return new Promise((resolve, reject) => {
    bindClient()
      .then(() => {
        return listOU();
      })
      .then(search_result => {
        ldapClient.unbind();
        resolve(search_result);
      })
      .catch(err => {
        reject(err);
      });
  });
};

module.exports = {
  getUserList: getUserList,
  getOUList: getOUList,
  insertUser: insertUser,
  getGroupList: getGroupList,
  searchUser: searchUser,
  searchUserUUID: searchUserUUID,
  searchGroupUUID: searchGroupUUID,
  resolveOU: resolveOU,
  resolveWorkgroup: resolveWorkgroup
};
