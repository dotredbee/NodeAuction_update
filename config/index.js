const dotenv = require('dotenv')
const config = dotenv.config()

if(config.error)
    throw new Error("Couldn't find .env file")

process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() === "production") ? "production" : (process.env.NODE_ENV || "development");

console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV === "production") module.exports = require('./prod')
else if(process.env.NODE_ENV === "development") module.exports = require('./dev')
else module.exports = require('./tst')