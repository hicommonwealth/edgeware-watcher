// a simple mongodb js client

import mdb from 'mongodb';
const client = mdb.MongoClient;

require('dotenv').config();

const state = {
    conn: null
}

// build the connection string (server path)
const connectionUrl = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;
const collectionName = process.env.MONGO_COLLECTION;

// connect to mongo server and store the connection object
var connect = async function(url = connectionUrl) {
    console.log(connectionUrl);
    return new Promise((resolve, reject) => {
        client.connect(url, function (err, resp) {
            if (!err) {
                console.log("Connected to MongoDB server", url)
                state.conn = resp
                resolve(true)
            } else {
                reject(err)
            }
        })
    })
}

// close the connection
var close = function() {
    state.conn.close()
}

// insert an object
var insert = async function(data) {
    if(!state.conn) {
        await connect();
    }

    const db = state.conn.db(process.env.MONGO_DB);
    await db.collection(collectionName).insertOne(data);
}

var findUnprocessedAttestations = async function() {
    if(!state.conn) {
        await connect();
    }

    const db = state.conn.db(process.env.MONGO_DB);
    return await db.collection(collectionName)
        .find({ section: 'identity', processed: {
            $exists: true,
        }})
        .sort( [['_id', -1]] )
        .toArray()
}

var processAttestation = async function(attestation) {
    if(!state.conn) {
        await connect();
    }

    const db = state.conn.db(process.env.MONGO_DB);
    return await db.collection(collectionName)
        .update(
          {_id: attestation._id},
          { $set: {
              processed: true,
            }
          }
        );
}

module.exports = { connect, close, insert }