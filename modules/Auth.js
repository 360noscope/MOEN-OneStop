const ldap = require("ldapjs");
const converter = require("./LdapConvert");
module.exports = settingEnv => {
  const login = (username, password, done) => {
    const ldapClient = ldap.createClient({
      url: `ldap://${settingEnv.LDAP_SERVER}`
    });
    const searchOptions = {
      scope: "sub",
      filter: `(userPrincipalName=${username}@energy.local)`
    };
    ldapClient.bind(`${username}@energy.local`, password, err => {
      if (err) {
        if (err.code == 49) {
          done({ authSuccess: false });
        } else {
          console.log(err);
        }
      } else {
        ldapClient.search(
          "dc=energy,dc=local",
          searchOptions,
          (err, search) => {
            if (err) {
              console.log(err);
            } else {
              search.on("searchEntry", entry => {
                const user = entry.object;
                const ouInfo = user.distinguishedName
                  .split(",")[1]
                  .split("=")[1];
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
                done({
                  authSuccess: true,
                  UUID: converter.GUIDEncrypt(
                    converter.GUIDtoUUID(user.objectGUID)
                  ),
                  OU: ouInfo,
                  firstname: user.givenName,
                  lastname: user.sn,
                  isAdmin: adminRight
                });
              });
            }
          }
        );
      }
    });
  };
  return { login: login };
};
