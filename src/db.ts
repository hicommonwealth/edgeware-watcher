require('dotenv').config();

import mdb from 'mongodb';
const client = mdb.MongoClient;

const state = {
  conn: null
}

// build the connection string (server path)
const connectionUrl = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;
const collectionName = process.env.MONGO_COLLECTION;

// connect to mongo server and store the connection object
export const connect = async function(url = connectionUrl) {
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
export const close = function() {
  state.conn.close()
}

// insert an object
export const insert = async function(data) {
  if(!state.conn) {
    await connect();
  }

  const db = state.conn.db(process.env.MONGO_DB);
  await db.collection(collectionName).insertOne(data);
}

export const find = async function(recordKey) {
  if (!state.conn) {
    await connect();
  }


  const db = state.conn.db(process.env.MONGO_DB);
  await db.collection(collectionName).find(recordKey);
}

export const exists = async function(recordKey) {
  if (!state.conn) {
    await connect();
  }

  const db = state.conn.db(process.env.MONGO_DB);
  console.log(`Checking existance of ${JSON.stringify(recordKey)}`);
  const res = await db.collection(collectionName).find(recordKey).toArray();
  return (res.length > 0);
}