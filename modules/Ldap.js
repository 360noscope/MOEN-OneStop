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
                });
              }
            }
          );
        }
      }
    );
  };

  const resolveOU = (uuid, done) => {
    listOU(search_result => {
      search_result.forEach(item => {
        if (item.UUID == uuid) {
          done(item.name);
        }
      });
    });
  };

  const resolveWorkgroup = (uuid, done) => {
    listGroup(search_result => {
      search_result.forEach(item => {
        if (item.UUID == uuid) {
          done(item.name);
        }
      });
    });
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

  const searchUserUUID = (firstname, lastname, done) => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    let dnString = "dc=energy,dc=local";
    const searchOptions = {
      scope: "sub",
      filter: `(&(objectCategory=person)(objectClass=user)(cn=${firstname} ${lastname}))`
    };
    ldapClient.bind(
      `${settingEnv.AD_API_ACCOUNT}@energy.local`,
      settingEnv.AD_API_PASSWORD,
      err => {
        if (err) {
        } else {
          ldapClient.search(dnString, searchOptions, (err, search) => {
            const userList = [];
            if (err) {
              console.log(err);
              done(false);
            } else {
              search.on("searchEntry", entry => {
                const userObj = entry.object;
                userList.push({
                  name: userObj.cn,
                  UUID: converter.GUIDtoUUID(userObj.objectGUID)
                });
              });
              search.on("end", () => {
                done(userList[0]);
              });
            }
          });
        }
      }
    );
  };

  const searchGroupUUID = (groupName, done) => {
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
            filter: `(&(objectClass=Group)(cn=${groupName}))`
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
                  groupResult.push({
                    name: groupObj.cn,
                    UUID: converter.GUIDtoUUID(groupObj.objectGUID)
                  });
                });
                search.on("end", () => {
                  done(groupResult[0]);
                });
              }
            }
          );
        }
      }
    );
  };

  const encodePassword = password => {
    return new Buffer('"' + password + '"', "utf16le").toString();
  };

  const addUser = (userData, done) => {
    const ldapClient = ldap.createClient({
      url: `ldaps://${settingEnv.LDAP_SERVER}`,
      tlsOptions: { rejectUnauthorized: false }
    });
    const newDN = `cn=${userData.Eng_firstname} ${userData.Eng_lastname},ou=${userData.department},dc=energy,dc=local`;
    const newUser = {
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
                  ldapClient.unbind(binderr => {
                    if (err) {
                      console.log(binderr);
                      console.log(err);
                    }
                    done(false);
                  });
                } else {
                  const groupDn = `CN=${userData.workgroup},OU=${userData.department},DC=energy,DC=local`;
                  const wifiGroupDn =
                    "CN=WIFI-STAFF,OU=MOEN-WIFI-Group,DC=energy,DC=local";
                  const change = new ldap.Change({
                    operation: "add",
                    modification: {
                      member: [newDN]
                    }
                  });
                  ldapClient.modify(groupDn, change, (moderr, res) => {
                    if (moderr) {
                      ldapClient.unbind(err => {
                        done(moderr);
                      });
                    } else {
                      ldapClient.modify(wifiGroupDn, change, (moderr2, res) => {
                        if (moderr2) {
                          ldapClient.unbind(err => {
                            done(moderr2);
                          });
                        } else {
                          searchUserUUID(
                            userData.Eng_firstname,
                            userData.Eng_lastname,
                            user_search_result => {
                              searchGroupUUID(
                                userData.workgroup,
                                group_search_result => {
                                  ldapClient.unbind(err => {
                                    if (err) {
                                      console.log(err);
                                    }
                                    const mail = `${
                                      userData.Eng_firstname
                                    }${userData.Eng_lastname.substring(
                                      0,
                                      2
                                    )}@energy.go.th`;

                                    Object.keys(userData).forEach(
                                      (key, index) => {
                                        if (!userData[key]) {
                                          userData[key] = null;
                                        }
                                      }
                                    );

                                    mysqlPool.query(
                                      "INSERT INTO moen_officer (citizenId, AD_UUID, en_prefix, en_firstname, en_lastname, th_prefix, " +
                                        "th_firstname, th_lastname, workgroupUUID, eMail, empTypeiD, PositioniD, LeveliD, Mobile, Tel, Birthday, " +
                                        "photoRaw, addHouseNo, addVillageNo, addTambol, addAmphur, addProvince) " +
                                        "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                      [
                                        userData.Id,
                                        user_search_result.UUID,
                                        userData.Eng_prefix,
                                        userData.Eng_firstname,
                                        userData.Eng_lastname,
                                        userData.Th_prefix,
                                        userData.Th_firstname,
                                        userData.Th_lastname,
                                        group_search_result.UUID,
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
                                        userData.Province
                                      ],
                                      err => {
                                        if (err) {
                                          console.log(err);
                                        } else {
                                          const selected_system =
                                            userData.selected_system;
                                          const test = mysqlPool.query(
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
                                                console.log(err);
                                              }
                                              done(test.sql);
                                            }
                                          );
                                        }
                                      }
                                    );
                                  });
                                }
                              );
                            }
                          );
                        }
                      });
                    }
                  });
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
    searchUser: searchUser,
    searchUserUUID: searchUserUUID,
    searchGroupUUID: searchGroupUUID,
    resolveOU: resolveOU,
    resolveWorkgroup: resolveWorkgroup
  };
};
