const Sequelize = require('sequelize');
const dbConfig = require('../../config/db.config');
const logger = require('../log/logger');
const db = require('../sequelize-ipfs');

module.exports = {
  updateUsage: async function(user, app, hash, dataSize) {
    logger.info("updateUsage",user, app, hash, dataSize);
    var insertQuery = "INSERT INTO `ipfs_proxy_usage_records` (`address`, `app`, `hash`, `size`, `status`) VALUES (?, ?, ?, ?, ?)";
    return db.sequelize.query(insertQuery, {
      replacements: [user, app, hash, dataSize, 0],
      type: Sequelize.QueryTypes.INSERT
    }).then(() => {
      //auto insert into table if app not exists, or update usage if exists
      var updateAppUsage = "UPDATE `ipfs_proxy_app_usages` SET `usage` = `usage` + ? WHERE `app` = ?";
      return db.sequelize.query(updateAppUsage, {
        replacements: [dataSize, app],
        type: Sequelize.QueryTypes.UPDATE
      })
    });
  },

  isOverUsageLimitation: async function(user, app, dataSize) {
    logger.info("isOverUsageLimitation", user, app, dataSize);
    var query = "SELECT * FROM `ipfs_proxy_app_usages` WHERE `app` = ?";
    return this.getAppUsage(app).then(item => {
      if (item == null) {
        return true;
      }
      return (item.usage + dataSize) >= item.limitation;
    });
  },

  getAppUsage: async function(app) {
    logger.info("getCurrentAppUsage", app);
    var query = "SELECT * FROM `ipfs_proxy_app_usages` WHERE `app` = ?";
    return db.sequelize.query(query, {
      replacements: [app],
      type: Sequelize.QueryTypes.SELECT
    }).then(result => {
      for (const item of result) {
        return item;
      }
      return null;
    });
  },

  getUserAppUsage: async function(user, app) {
    logger.info("getUserAppUsage", user, app);
    var query = "SELECT SUM(`size`) as `usage` FROM `ipfs_proxy_usage_records` WHERE `address` = ? AND `app` = ? AND `status` = 0";
    return db.sequelize.query(query, {
      replacements: [user, app],
      type: Sequelize.QueryTypes.SELECT
    }).then(result => {
      for (const item of result) {
        return item.usage;
      }
      return 0;
    });
  },

  getUserUsage: async function(user) {
    logger.info("getUserUsage", user);
    var query = "SELECT `app`, SUM(`size`) as `usage` FROM `ipfs_proxy_usage_records` WHERE `address` = ? AND `status` = 0 GROUP BY `app`";
    return db.sequelize.query(query, {
      replacements: [user],
      type: Sequelize.QueryTypes.SELECT
    });
  },

  updateAppUsageLimitation: async function(app, newValue) {
    logger.info("updateAppUsageLimitation", app, newValue);
    var query = "INSERT INTO `ipfs_proxy_app_usages` (`app`, `usage`, `limitation`) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE `limitation` = ?";
    return db.sequelize.query(query, {
      replacements: [app, newValue, newValue],
      type: Sequelize.QueryTypes.UPDATE
    }).then(() => {
      return this.getAppUsage(app);
    });
  },

  closeConnection: async function() {
    db.close();
  }
};