const dotenv = require('dotenv')
const config = dotenv.config()

if(config.error)
    throw new Error("Couldn't find .env file")

process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() === "production") ? "production" : "development";

console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV === "production") module.exports = require('./prod')
else module.exports = require('./dev')