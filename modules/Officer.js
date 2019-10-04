module.exports = mysqlPool => {
  const listOfficer = done => {
    mysqlPool.query(
      "SELECT moen_officer.citizenId, moen_officer.en_prefix, moen_officer.th_prefix, " +
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

  const listSection = done => {
    mysqlPool.query(
      "SELECT sectionId, sectionName FROM moen_section",
      (err, results, fields) => {
        if (err) {
          console.log("[System] " + err);
        } else {
          done(results);
        }
      }
    );
  };

  const listDept = (sect, done) => {
    mysqlPool.query(
      "SELECT deptUUID, deptName FROM moen_department WHERE sectionID = ?",
      [sect],
      (err, results, fields) => {
        if (err) {
          console.log("[System] " + err);
        } else {
          done(results);
        }
      }
    );
  };

  const listWorkgroup = (deptUUID, done) => {
    mysqlPool.query(
      "SELECT groupUUID, groupName FROM moen_workgroup WHERE departmentUUID = ?",
      [deptUUID],
      (err, results, fields) => {
        if (err) {
          console.log("[System] " + err);
        } else {
          done(results);
        }
      }
    );
  };

  return {
    listOfficer: listOfficer,
    listSection: listSection,
    listWorkgroup:listWorkgroup,
    listDept: listDept
  };
};
