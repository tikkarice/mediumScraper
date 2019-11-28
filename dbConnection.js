const MongoClient = require('mongodb').MongoClient;
let dbInstance = null;

const db = async () => {
    const url = 'mongodb://localhost:27017';
    const dbName = 'medium';
    const connection = await MongoClient.connect(url, {useNewUrlParser: true});
    if (connection) {
        dbInstance = connection.db(dbName);
        return {status: 'ok', msg: 'connected'};
    }
    return{status: 'fail', msg: 'unable to connect'};
}

const get = () => {
    return dbInstance;
}

module.exports = {
    db: db,
    get: get
}