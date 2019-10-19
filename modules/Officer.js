const mysqlPool = require("./Database");
const Promise = require("promise");

const listOfficer = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT moen_officer.citizenId, moen_officer.AD_UUID, moen_officer.en_prefix, moen_officer.th_prefix, " +
        "moen_officer.en_firstname, moen_officer.en_lastname, moen_officer.th_firstname, " +
        "moen_officer.th_lastname, moen_workgroup.groupName, moen_emptype.typeName, " +
        "moen_empposition.PositionName, moen_department.deptName, moen_section.sectionName " +
        "FROM moen_officer " +
        "JOIN moen_workgroup ON moen_officer.workgroupUUID = moen_workgroup.groupUUID " +
        "JOIN moen_emptype ON moen_officer.empTypeiD = moen_emptype.typeId " +
        "JOIN moen_empposition ON moen_officer.PositioniD = moen_empposition.PositionId " +
        "JOIN moen_department ON moen_workgroup.departmentUUID = moen_department.deptUUID " +
        "JOIN moen_section ON moen_department.sectionID = moen_section.sectionId",
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          const officerList = { data: [] };
          results.forEach(element => {
            const thaiName = `${element.th_prefix} ${element.th_firstname} ${element.th_lastname}`;
            const engName = `${element.en_prefix} ${element.en_firstname} ${element.en_lastname}`;
            officerList["data"].push({
              id: element.AD_UUID,
              th_name: thaiName,
              en_name: engName,
              type: element.typeName,
              position: element.PositionName,
              department: element.deptName,
              section: element.sectionName,
              workgroup: element.groupName
            });
          });
          resolve(officerList);
        }
      }
    );
  });
};
const listSection = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT sectionId, sectionName FROM moen_section",
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listDept = params => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT deptUUID, deptName FROM moen_department WHERE sectionID = ?",
      [params["sectionid"]],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listWorkgroup = params => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT groupUUID, groupName FROM moen_workgroup WHERE departmentUUID = ?",
      [params["deptuuid"]],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listEmployeeType = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT typeId, typeName FROM moen_emptype",
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listEmployeeJob = params => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT empTypeLevelId, empTypeLevelName FROM moen_emptypelevel WHERE empTypeId = ?",
      [params["typeId"]],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listEmployeeLevel = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT levelId, levelName FROM moen_emplevel",
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const listEmployeePosition = () => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT PositionId, PositionName FROM moen_empposition",
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};
const resolveOfficer = params => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT moen_officer.citizenId, moen_officer.en_prefix, moen_officer.en_firstname, moen_officer.en_lastname, " +
        "moen_officer.th_prefix, moen_officer.th_firstname, moen_officer.th_lastname, moen_officer.eMail, moen_officer.Mobile, " +
        "moen_officer.Tel, moen_officer.Birthday, moen_officer.photoRaw, moen_officer.addHouseNo, moen_officer.addVillageNo, " +
        "moen_officer.addTambol, moen_officer.addAmphur, moen_officer.addProvince, moen_App.Email, moen_App.Eleave, moen_App.eOffice, " +
        "moen_officer.workgroupUUID, moen_officer.empTypeiD, moen_officer.PositioniD, moen_officer.LeveliD, moen_officer.sex, moen_officer.empJob, " +
        "moen_App.eDocPR, moen_App.eKeep, moen_App.eCir, moen_App.Saraban, moen_App.Vpn, moen_App.Car, moen_section.sectionId, moen_department.deptUUID " +
        "FROM moen_officer " +
        "JOIN moen_App ON moen_officer.citizenId = moen_App.citizenId " +
        "JOIN moen_workgroup ON moen_officer.workgroupUUID = moen_workgroup.groupUUID " +
        "JOIN moen_department ON moen_department.deptUUID = moen_workgroup.departmentUUID " +
        "JOIN moen_section ON moen_section.sectionId = moen_department.sectionID " +
        "WHERE moen_officer.AD_UUID = ?",
      [params["uuid"]],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          const thai_name =
            results[0].th_prefix +
            " " +
            results[0].th_firstname +
            " " +
            results[0].th_lastname;
          const eng_name =
            results[0].en_prefix +
            " " +
            results[0].en_firstname +
            " " +
            results[0].en_lastname;
          const sexName = { 1: "ชาย", 2: "หญิง" };
          const selected_field = {
            person_data: {
              identityID: results[0].citizenId,
              en_prefix: results[0].en_prefix,
              en_firstname: results[0].en_firstname,
              en_lastname: results[0].en_lastname,
              engName: eng_name,
              th_prefix: results[0].th_prefix,
              th_firstname: results[0].th_firstname,
              th_lastname: results[0].th_lastname,
              thaiName: thai_name,
              email: results[0].eMail,
              userMobile: results[0].Mobile,
              userTel: results[0].Tel,
              birthDate: results[0].Birthday,
              photo: results[0].photoRaw,
              houseNo: results[0].addHouseNo,
              villageNo: results[0].addVillageNo,
              tambol: results[0].addTambol,
              amphur: results[0].addAmphur,
              province: results[0].addProvince,
              sexId: results[0].sex,
              sex: sexName[results[0].sex]
            },
            office: {
              section: results[0].sectionId,
              workgroup: results[0].workgroupUUID,
              emptype: results[0].empTypeiD,
              emplevel: results[0].LeveliD,
              emppos: results[0].PositioniD,
              department: results[0].deptUUID,
              empjob: results[0].empJob
            },
            app: {
              emailsys: results[0].Email,
              leavesys: results[0].Eleave,
              eMeetsys: results[0].eOffice,
              eDocPRsys: results[0].eDocPR,
              eDocKeepsys: results[0].eKeep,
              eDocCirsys: results[0].eCir,
              esarabunsys: results[0].Saraban,
              vpnsys: results[0].Vpn,
              carsys: results[0].Car
            }
          };
          resolve(selected_field);
        }
      }
    );
  });
};
const listUserContacts = uuid => {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      "SELECT th_prefix, AD_UUID, th_firstname, th_lastname, en_firstname, en_lastname, photoRaw FROM moen_officer WHERE AD_UUID != ?",
      [uuid],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};

module.exports = {
  listOfficer: listOfficer,
  listSection: listSection,
  listWorkgroup: listWorkgroup,
  listDept: listDept,
  listEmployeeType: listEmployeeType,
  listEmployeeJob: listEmployeeJob,
  listEmployeeLevel: listEmployeeLevel,
  listEmployeePosition: listEmployeePosition,
  resolveOfficer: resolveOfficer,
  listUserContacts: listUserContacts
};
