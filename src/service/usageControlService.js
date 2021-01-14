const t = require('@iceteachain/common/src/ecc');
const Sequelize = require('sequelize');
const logger = require('../log/logger');
const db = require('../sequelize-ipfs');

module.exports = {
    updateUsage: async function (user, app, hash, dataSize) {
        logger.info("updateUsage", user, app, hash, dataSize);
        const t = await db.sequelize.transaction();
        try {
            await db.UserAppUsage.create({
                address: user,
                app: app,
                hash: JSON.stringify(hash),
                size: dataSize,
                status: 0
            }, { transaction: t });

            await db.UserUsage.increment(
                {
                    usage: +dataSize
                },
                {
                    where: {
                        app: app
                    }
                }, { transaction: t });
            await t.commit();
        } catch (error) {

            logger.error("Error transaction update usage: " + error);
            await t.rollback();
        }
    },

    isOverUsageLimitation: async function (user, app, dataSize) {
        logger.info("isOverUsageLimitation", user, app, dataSize);
        const record = await db.UserUsage.findOne({
            where: {
                app: app
            }
        });
        if (record) {
            return (record.usage + dataSize) > record.limitation;
        }
        return true;
    },

    getAppUsage: async function (app) {
        logger.info("getCurrentAppUsage", app);
        const record = await db.UserUsage.findOne({
            where: {
                app: app
            }
        });
        return record;
    },

    getUserAppUsage: async function (user, app) {
        logger.info("getUserAppUsage", user, app);
        const usage = await db.UserAppUsage.sum('size',
            {
                where: {
                    address: user,
                    status: 0
                }
            }
        );
        if (usage)
            return usage;
        return 0;
    },

    getUserUsage: async function (user) {
        logger.info("getUserUsage", user);
        const usage = await db.UserAppUsage.sum('size',
            {
                where: {
                    address: user,
                    status: 0
                }
            }
        );
        if (usage)
            return usage;
        return 0;
    },

    updateQuotaAppUsage: async function (app, quota) {
        logger.info("updateQuotaAppUsage: " + app + " quota: " + quota)
        try {
            const record = await db.UserUsage.upsert(
                {
                    app: app,
                    limitation: quota
                },
                {
                    where: {
                        app: app
                    }
                }
            );
            return quota;
        } catch (error) {
            logger.error("Update quota app usage: " + error);
        }
    },

    closeConnection: async function () {
        db.close();
    }
};