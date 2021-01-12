module.exports = (sequelize, Sequelize) => {
    const IpfsProxyUsageRecord = sequelize.define("ipfs_proxy_usage_records", {
      id: {
        type: Sequelize.INTEGER, 
        autoIncrement: true,
        primaryKey: true
      },
      address: {
        type: Sequelize.STRING
      },
      app: {
        type: Sequelize.STRING
      },
      hash: {
          type: Sequelize.STRING
      },
      size: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.TINYINT
      },
      timestamp: {
        type: Sequelize.DATE
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
  
    return IpfsProxyUsageRecord;
  };