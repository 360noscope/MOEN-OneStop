/**@module OpsHub */
module.exports = settingEnv => {
  const mysql = require("mysql2");
  const mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: settingEnv.MARIA_HOST,
    user: settingEnv.MARIA_USERNAME,
    password: settingEnv.MARIA_PASSWORD,
    database: settingEnv.MARIA_DB,
    port: settingEnv.MARIA_PORT,
    multipleStatements: true
  });

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
  const Auth = require("./Auth")(settingEnv, mysqlPool);
  const webLogin = (username, password, done) => {
    Auth.webLogin(username, password, done);
  };
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
  const ldapLogin = (username, password, done) => {
    Auth.ldapLogin(username, password, done);
  };

  //LDAP section
  const Ldap = require("./Ldap")(settingEnv, mysqlPool);
  const listUser = done => {
    Ldap.listUser(done);
  };
  const listOU = done => {
    Ldap.listOU(done);
  };
  const listGroup = done => {
    Ldap.listGroup(done);
  };
  const searchUser = (conditions, done) => {
    Ldap.searchUser(conditions, done);
  };
  const addUser = (userData, done) => {
    Ldap.addUser(userData, done);
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
  const insertEmployee = (employee_data, done) => {
    Ldap.resolveWorkgroup(employee_data.workgroup, workgroup => {
      employee_data.workgroup = workgroup;
      Ldap.resolveOU(employee_data.department, OU => {
        employee_data.department = OU;
        employee_data.password =
          employee_data.Eng_firstname.substring(0, 1).toUpperCase() +
          employee_data.Eng_lastname.substring(0, 1).toLowerCase() +
          "@" +
          employee_data.Id.substring(8, 13);
        Ldap.addUser(employee_data, done);
      });
    });
  };

  return {
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
    listUser: listUser,
    listOU: listOU,
    listGroup: listGroup,
    searchUser: searchUser,
    addUser: addUser
  };
};
