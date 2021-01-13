module.exports = (sequelize, Sequelize) => {
    const IpfsProxyAppUsage = sequelize.define("ipfs_proxy_app_usages", {
      app: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      usage: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      limitation: {
        type: Sequelize.BIGINT
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()')
      }
    });
  
    return IpfsProxyAppUsage;
  };