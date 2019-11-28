const express = require('express');
const dbConnection = require('./dbConnection.js');
const index = require('./index');

const app = express();

app.listen(3000, async() => {
    console.log('server is listening on port 3000');
    await dbConnection.db();
    index.getData('https://medium.com');
})