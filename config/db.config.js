module.exports = {
    DB_HOST: "127.0.0.1",
    DB_USER: "icetea",
    DB_PASSWORD: "abc@12345678",
    DB_NAME: "icetea",
    dialect: "mysql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};