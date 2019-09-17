const ldap = require("ldapjs");
const converter = require("./LdapConvert");
const jwt = require("jsonwebtoken");
module.exports = settingEnv => {
  const listUser = (ADToken, done) => {
    const decryptedToken = jwt.verify(ADToken, settingEnv.API_SECRET);
    const ldapClient = ldap.createClient({
      url: `ldap://${settingEnv.LDAP_SERVER}`
    });
    ldapClient.bind(
      `${decryptedToken.LdapUsername}@energy.local`,
      decryptedToken.LdapPassword,
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
                const userResult = [];
                search.on("searchEntry", entry => {
                  userResult.push(entry.object);
                });
                search.on("end", () => {
                  const finalList = [];
                  userResult.forEach(elementChild => {
                    const fullName = elementChild.name;
                    const username = elementChild.sAMAccountName;
                    const uuid = converter.GUIDtoUUID(elementChild.objectGUID);
                    const dtn = elementChild.distinguishedName.split(",");
                    const gtn = elementChild.memberOf;
                    let OU, group, uniqueGroup;
                    if (dtn.find(word => word.includes("OU")) != null) {
                      OU = dtn.find(word => word.includes("OU")).split("=")[1];
                    }
                    if (gtn != null) {
                      group = [];
                      if (typeof gtn == "string") {
                        gtn.split(",").forEach(ele1 => {
                          if (ele1.includes("CN")) {
                            group.push(ele1.split("=")[1]);
                          }
                        });
                      } else {
                        gtn.forEach(ele2 => {
                          ele2.split(",").forEach(ele3 => {
                            if (ele3.includes("CN")) {
                              group.push(ele3.split("=")[1]);
                            }
                          });
                        });
                      }
                    }
                    if (Array.from(new Set(group)).length > 0) {
                      uniqueGroup = Array.from(new Set(group));
                    }
                    const userObject = {
                      userFullname: fullName,
                      account: username,
                      userUUID: uuid,
                      userOU: OU,
                      userGroup: uniqueGroup
                    };
                    if (
                      uniqueGroup != null &&
                      !uniqueGroup.includes("Builtin")
                    ) {
                      finalList.push(userObject);
                    }
                  });
                  done(finalList);
                });
              }
            }
          );
        }
      }
    );
  };

  const listOU = (ADToken, done) => {
    const decryptedToken = jwt.verify(ADToken, settingEnv.API_SECRET);
    const ldapClient = ldap.createClient({
      url: `ldap://${settingEnv.LDAP_SERVER}`
    });
    ldapClient.bind(
      `${decryptedToken.LdapUsername}@energy.local`,
      decryptedToken.LdapPassword,
      err => {
        if (err) {
        } else {
          const searchOptions = {
            scope: "sub",
            filter: "(&(objectCategory=OrganizationalUnit))"
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
                  OUList.push(entry.object);
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

  return { listUser: listUser, listOU: listOU };
};
