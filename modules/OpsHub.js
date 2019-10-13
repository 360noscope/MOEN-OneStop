const settingEnv = process.env;
const mysqlPool = require("./Database");
//API Page section
const Api = require("./Api");
const listAPIKey = Api.listAPIKey;
const insertAPI = (name, password, owner, done) => {
  Api.insertAPI(name, password, owner, done);
};
const isUserExists = (username, done) => {
  Api.isUserExists(username, done);
};
const checkAPIUserRole = Api.checkAPIRole;

//Authentication section
const Auth = require("./Auth");
const webLogin = Auth.webLogin;
const apiLogin = Auth.apiLogin;

//LDAP section
const Ldap = require("./Ldap");
const getUserList = Ldap.getUserList;
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
  checkAPIUserRole: checkAPIUserRole,
  listAPIKey: listAPIKey,
  insertAPI: insertAPI,
  webLogin: webLogin,
  apiLogin: apiLogin,
  ldapLogin: ldapLogin,
  getUserList: getUserList,
  listOU: listOU,
  listGroup: listGroup,
  searchUser: searchUser
};
