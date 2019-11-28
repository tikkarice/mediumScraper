const cheerio = require('cheerio');
const request = require('request');
const queryString = require('query-string');
const dbConnection = require('./dbConnection');

/******************************** getting raw html ***********************************************/
const getData = async (url) => {
    request(url, async (error, response, html) => {
    if(!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        await collectLinks($, url);
    }
})
}
/************************************** parsing queryParams ************************************/
const getQryParams = (link) => {
    const splitByqusmark = link.split("?");
    console.log('....',splitByqusmark);
    if (splitByqusmark.length > 1) {
        const queryParam = queryString.parse(splitByqusmark[1]);
        return queryParam;
    }
}
/************************************** processing each urls's hyperlinks **********************/
const collectLinks = async ($, url) => {
    const db = dbConnection.get();
    let validLinks = [];
    const links = $("a[href^='http']");
    for (let i = 0; i < links.length; i++) {
        const link = $(links[i]).attr('href');
        const splitlink = link.split("//");
        // condition to consider only those internal hyperlinks which belong to medium
        if (splitlink[1].split("/")[0] == 'medium.com') {
            const checkIfExists = await db.collection('urls').findOne({url: link});
            if (!checkIfExists && url == 'https://medium.com') {
                const obj = {};
                //check for query params
                const queryParam = getQryParams(link);
                //process.exit();
                obj.url = link;
                if (queryParam) {
                    obj.queryParam = queryParam;
                }
                obj.isProcessed = 0;// for the first time this flag will have value 0
            
            const qry = await db.collection('urls').insertOne(obj);
        } else if (!checkIfExists && url != 'https://medium.com') {
            const obj = {};
            //check for query params
            const queryParam = getQryParams(link);
            obj.url = link; 
            if (queryParam) {
                obj.queryParam = queryParam;
            }
            obj.isProcessed = 1;
            const qry = await db.collection('urls').insertOne(obj);
        } 
        }    
    }; 
    await processDBstoredUrls();
}

const processDBstoredUrls = async () => {
    const db = dbConnection.get();
    const DBdata = await db.collection('urls').findOne({isProcessed:0});
    if (DBdata) {
        await getData(DBdata.url);
        const updtFlag = await db.collection('urls').updateOne({_id:DBdata._id}, {$set: {isProcessed:1}});
    }
}

module.exports ={
    getData
}

/****
 * 1) first getting the html of base url("https://medium.com") and taking out all its hyperlinks and
 * storing each of these hyperlinks in DB with the flag isProcessed=0
 * 
 * 2) next time taking first isProcessed=0 document from the DB and getting all its sub hyperlinks
 * and storing all those sub hyperlinks in DB with the flag isProcessed=1 and also updating those
 * sub hyperlink's parent Url flag (that is isProcessed = 1) 
 * 
 * 3) repeating step 2, till all documents in DB will have isProcessed flag's value 1
 * 
 */