const Sequelize = require('sequelize');
const dbConfig = require('../config/db.config');
const logger = require('./log/logger');
const UserUsageModel = require('./models/ipfs-proxy-app-usage.model');
const UserAppUsageModel = require('./models/ipfs-proxy-usage-record.model');

const sequelize = new Sequelize(dbConfig.DB_NAME, dbConfig.DB_USER, dbConfig.DB_PASSWORD, {
  host: dbConfig.DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connect = async () => {
  try {
    await sequelize.sync( {force: true});

    logger.log('Connection to the database has been established successfully.');
  }
  catch (error) {
    logger.error(error.message);
    process.exit(-1);
  }
};

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.UserUsage = require("./models/ipfs-proxy-app-usage.model")(sequelize, Sequelize);
db.UserAppUsage = require("./models/ipfs-proxy-usage-record.model")(sequelize, Sequelize);

module.exports = db;
