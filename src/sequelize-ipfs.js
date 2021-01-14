const Sequelize = require('sequelize');
const logger = require('./log/logger');
require('dotenv').config();
const UserUsageModel = require('./models/ipfs-proxy-app-usage.model');
const UserAppUsageModel = require('./models/ipfs-proxy-usage-record.model');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || '127.0.0.1',
  dialect: 'mysql',
  port: process.env.DB_PORT,
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
