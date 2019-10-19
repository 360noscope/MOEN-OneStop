const settingEnv = process.env;
const mysqlPool = require("./Database");
//API Page section
const Api = require("./Api")(mysqlPool);
const listAPIKey = (userId, done) => {
  Api.listAPIKey(userId, done);
};
const insertAPI = (name, password, owner, done) => {
  Api.insertAPI(name, password, owner, done);
};
const isUserExists = (username, done) => {
  Api.isUserExists(username, done);
};
const checkAPIUserRole = (keyNumber, done) => {
  Api.checkAPIUserRole(keyNumber, done);
};

//Authentication section
const Auth = require("./Auth");
const webLogin = Auth.webLogin;
const apiLogin = (username, password, done) => {
  Auth.apiLogin(username, password, loginResult => {
    if (loginResult != false) {
      Api.checkAPIRole(loginResult, permResult => {
        done({ keyNumber: loginResult, permList: permResult });
      });
    } else {
      done(false);
    }
  });
};

//LDAP section
const Ldap = require("./Ldap");
const listUser = Ldap.listUser;
const listOU = Ldap.listOU;
const listGroup = Ldap.listGroup;
const ldapLogin = Ldap.ldapLogin;
const searchUser = (conditions, done) => {
  Ldap.searchUser(conditions, done);
};

//Officer Page section
const Officer = require("./Officer");
const listOfficer = Officer.listOfficer;
const listSection = Officer.listSection;
const listDept = Officer.listDept;
const listWorkgroup = Officer.listWorkgroup;
const listEmployeeType = Officer.listEmployeeType;
const listEmployeeJob = Officer.listEmployeeJob;
const listEmployeeLevel = Officer.listEmployeeLevel;
const listEmployeePosition = Officer.listEmployeePosition;
const resolveOfficer = Officer.resolveOfficer;
const insertEmployee = Ldap.insertUser;
const listUserContacts = Officer.listUserContacts;

module.exports = {
  listOfficer: listOfficer,
  listSection: listSection,
  listDept: listDept,
  listWorkgroup: listWorkgroup,
  listEmployeeType: listEmployeeType,
  listEmployeeJob: listEmployeeJob,
  listEmployeeLevel: listEmployeeLevel,
  listEmployeePosition: listEmployeePosition,
  insertEmployee: insertEmployee,
  isUserExists: isUserExists,
  resolveOfficer: resolveOfficer,
  listUserContacts: listUserContacts,
  checkAPIUserRole: checkAPIUserRole,
  listAPIKey: listAPIKey,
  insertAPI: insertAPI,
  webLogin: webLogin,
  apiLogin: apiLogin,
  ldapLogin: ldapLogin,
  listUser: listUser,
  listOU: listOU,
  listGroup: listGroup,
  searchUser: searchUser
};
