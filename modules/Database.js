const mysql = require("mysql2");

module.exports = settingEnv => {
  const mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: settingEnv.MARIA_HOST,
    user: settingEnv.MARIA_USERNAME,
    password: settingEnv.MARIA_PASSWORD,
    database: settingEnv.MARIA_DB,
    port: settingEnv.MARIA_PORT
  });
  const listOfficer = done => {
    mysqlPool.query(
      "SELECT moen_officer.citizenId, moen_officer.en_prefix, moen_officer.th_prefix, " +
        "moen_officer.en_firstname, moen_officer.en_lastname, moen_officer.th_firstname, " +
        "moen_officer.th_lastname, moen_workgroup.groupName, moen_emptype.typeName, " +
        "moen_empposition.PositionName, moen_department.deptName, moen_section.sectionName " +
        "FROM moen_officer " +
        "JOIN moen_workgroup ON moen_officer.workgroupId = moen_workgroup.groupId " +
        "JOIN moen_emptype ON moen_officer.empTypeId = moen_emptype.typeId " +
        "JOIN moen_empposition ON moen_officer.posId = moen_empposition.PositionId " +
        "JOIN moen_department ON moen_workgroup.departmentId = moen_department.deptId "+
        "JOIN moen_section ON moen_department.sectionID = moen_section.sectionId",
      (err, results, fields) => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          const officerList = { data: [] };
          results.forEach(element => {
            const thaiName = `${element.th_prefix} ${element.th_firstname} ${element.th_lastname}`;
            const engName = `${element.en_prefix} ${element.en_firstname} ${element.en_lastname}`;
            officerList["data"].push({
              id: element.citizenId,
              th_name: thaiName,
              en_name: engName,
              type: element.typeName,
              position: element.PositionName,
              department: element.deptName,
              section: element.sectionName,
              workgroup: element.groupName
            });
          });
          done(officerList);
        }
      }
    );
  };

  return { listOfficer: listOfficer };
};
