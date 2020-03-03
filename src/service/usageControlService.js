const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_DB, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: "mysql",
});

module.exports = {
  updateUsage: async function(user, app, hash, dataSize) {
    console.debug("updateUsage",user, app, hash, dataSize);
    var insertQuery = "INSERT INTO `ipfs_proxy_usage_record` (`address`, `app`, `hash`, `size`, `status`) VALUES (?, ?, ?, ?, ?)";
    return sequelize.query(insertQuery, {
      replacements: [user, app, hash, dataSize, 0],
      type: Sequelize.QueryTypes.UPDATE
    }).then(() => {
      //auto insert into table if app not exists, or update usage if exists
      var updateAppUsage = "UPDATE `ipfs_proxy_app_usage` SET `usage` = `usage` + ? WHERE `app` = ?";
      return sequelize.query(updateAppUsage, {
        replacements: [dataSize, app],
        type: Sequelize.QueryTypes.UPDATE
      })
    });

  },

  isOverUsageLimitation: async function(user, app, dataSize) {
    console.debug("isOverUsageLimitation", user, app, dataSize);
    var query = "SELECT * FROM `ipfs_proxy_app_usage` WHERE `app` = ?";
    return this.getCurrentAppUsage(app).then(item => {
      if (item == null) {
        return true;
      }
      return (item.usage + dataSize) >= item.limitation;
    });
  },

  getCurrentAppUsage: async function(app) {
    console.debug("getCurrentAppUsage", app);
    var query = "SELECT * FROM `ipfs_proxy_app_usage` WHERE `app` = ?";
    return sequelize.query(query, {
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
    console.debug("getUserAppUsage", user, app);
    var query = "SELECT SUM(`size`) as `usage` FROM `ipfs_proxy_usage_record` WHERE `address` = ? AND `app` = ? AND `status` = 0";
    return sequelize.query(query, {
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
    console.debug("getUserUsage", user);
    var query = "SELECT `app`, SUM(`size`) as `usage` FROM `ipfs_proxy_usage_record` WHERE `address` = ? AND `status` = 0 GROUP BY `app`";
    return sequelize.query(query, {
      replacements: [user],
      type: Sequelize.QueryTypes.SELECT
    });
  },

  updateAppUsageLimitation: async function(app, newValue) {
    console.debug("updateAppUsageLimitation", app, newValue);
    var query = "INSERT INTO `ipfs_proxy_app_usage` (`app`, `usage`, `limitation`) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE `limitation` = ?";
    return sequelize.query(query, {
      replacements: [app, newValue],
      type: Sequelize.QueryTypes.SELECT
    }).then(() => {
      return this.getCurrentAppUsage(app);
    });
  },
};