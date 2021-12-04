const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// FIREBASE Service Account

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// USE MIDDLEWARE

app.use(cors());
app.use(express.json());

// CONNECT WITH MONGODB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2xoju.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyJwtToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const jwt = req.headers.authorization.split(' ')[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(jwt);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }

  next();
}

async function run() {
  try {
    client.connect();
    const database = client.db(`${process.env.DB_NAME}`);
    const mobileCollection = database.collection('all_mobile');
    const reviewsCollection = database.collection('reviews');
    const orderCollection = database.collection('orders');
    const usersCollection = database.collection('users');

    // GET all products data

    app.get('/all-products', async (req, res) => {
      const cursor = mobileCollection.find({});
      const products = await cursor.toArray();
      res.json(products);
    });

    // GET a single place by ID

    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const mobile = await mobileCollection.findOne(query);
      res.send(mobile);
    });

    // GET all reviews data

    app.get('/all-reviews', async (req, res) => {
      const cursor = reviewsCollection.find({});
      const allReviews = await cursor.toArray();
      res.json(allReviews);
    });

    // GET all orders data

    app.get('/all-orders', async (req, res) => {
      let query = {};
      const email = req.query.email;
      console.log(email);
      if (email) {
        query = { email };
      }
      const cursor = orderCollection.find(query);
      const allOrders = await cursor.toArray();
      res.json(allOrders);
    });

    // GET admin or not

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'Admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // POST a single product

    app.post('/add-product', async (req, res) => {
      const mobile = req.body;
      const result = await mobileCollection.insertOne(mobile);
      res.json(result);
    });

    // POST a order

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    // POST a single review

    app.post('/add-reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.json(result);
    });

    // POST a user

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // PUT user

    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { user: user.email };
      const option = { upsert: true };
      const updateUser = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateUser,
        option
      );
      res.json(result);
    });

    // PUT admin & check with JWT Token  he/she is admin or not ?

    app.put('/users/admin', verifyJwtToken, async (req, res) => {
      const newAdmin = req.body;
      const email = req.decodedEmail;
      if (email) {
        const requester = await usersCollection.findOne({ email });
        if (requester.role === 'Admin') {
          const filter = { email: newAdmin.email };
          const updateUser = { $set: { role: 'Admin' } };
          const result = await usersCollection.updateOne(filter, updateUser);
          res.json(result);
        }
      } else {
        req
          .status(403)
          .json({ message: 'You do not have access to make admin' });
      }
    });

    // PUT order status

    app.put('/order/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const filter = { _id: ObjectId(id) };
      const updatingStatus = {
        $set: {
          status: status,
        },
      };
      const result = await orderCollection.updateOne(filter, updatingStatus);
      res.json(result);
    });

    // DELETE a single product by ID

    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await mobileCollection.deleteOne(query);
      res.json(result);
    });

    // DELETE a single order by ID

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
    // client.close()
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('Welcome to Mobile Store Server API'));
app.listen(port, () => console.log(`Server Running on localhost:${port}`));
