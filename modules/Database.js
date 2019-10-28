const mysql = require("mysql2");
const settingEnv = process.env;
const mysqlPool = mysql.createPool({
  connectionLimit: 10,
  host: settingEnv.MARIA_HOST,
  user: settingEnv.MARIA_USERNAME,
  password: settingEnv.MARIA_PASSWORD,
  database: settingEnv.MARIA_DB,
  port: settingEnv.MARIA_PORT
});

module.exports = mysqlPool;
