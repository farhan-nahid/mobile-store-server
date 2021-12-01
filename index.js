const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
/* const admin = require('firebase-admin');
const serviceAccount = require('./mobile--store-firebase-adminsdk.json'); */
require('dotenv').config();

/* admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
}); */

const app = express();
const port = process.env.PORT || 5000;

// USE MIDDLEWARE

app.use(cors());
app.use(express.json());

// CONNECT WITH MONGODB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2xoju.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    client.connect();
    const database = client.db(`${process.env.DB_NAME}`);
    const mobileCollection = database.collection('all_mobile');
    console.log('database Connect Successfully');
  } finally {
    // client.close()
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('Welcome to Mobile Store Server API'));
app.listen(port, () => console.log(`Server Running on localhost:${port}`));
