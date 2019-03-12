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

export const findUnprocessedAttestations = async function() {
  if(!state.conn) {
    await connect();
  }

  const db = state.conn.db(process.env.MONGO_DB);
  return await db.collection(collectionName)
    .find({
      section: 'identity',
      method: 'Attest',
      processed: {
        $exists: false,
      }
    })
    .sort( [['_id', -1]] )
    .toArray()
}

export const processAttestation = async function(attestation) {
  if(!state.conn) {
    await connect();
  }

  const db = state.conn.db(process.env.MONGO_DB);
  return await db.collection(collectionName)
    .update(
      { _id: attestation._id},
      { $set: {
          processed: true,
        }
      }
    );
}

export const processInvalidAttestation = async function(data) {
  if (!state.conn) {
    await connect();
  }

  const db = state.conn.db(process.env.MONGO_DB);
  return await db.collection(collectionName)
    .update(
      { _id: data._id },
      {
        $set: {
          processed: true,
          valid: false,
        }
      }
    );
}