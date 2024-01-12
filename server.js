const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middle-wires
const corsOpts = {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type',]
}
app.use(cors(corsOpts));
app.use(express.json()) // body parser

// JWT verifier
function jwtVerifier(req, res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const accessToken = authHeaders.split(' ')[1];

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log('jwt Error:', err);
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })

}

// MongoDB connection string code
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vugesio.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const servicesCollection = client.db("geniusCar").collection("services");
        const orderCollection = client.db("geniusCar").collection("orders");

        //AUTHENTICATION WITH JWT
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.send({ accessToken })
        })

        // To get all services data
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        // Single service data
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const singleService = await servicesCollection.findOne(query);
            res.send(singleService);
        })

        // Getting data from clientSide and sending to database
        app.post('/service', async (req, res) => {
            const newSevice = req.body;
            const result = await servicesCollection.insertOne(newSevice);
            res.send(result);
        })

        // Deleting service from database
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.send(result);
        })

        // Getting order data from clientSide
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // Getting order data by email
        app.get('/orders', jwtVerifier, async (req, res) => {
            const userEmail = req.query;
            const decodedEmail = req.decoded.email;
            if (userEmail.email === decodedEmail) {
                const cursor = orderCollection.find(userEmail);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Genius Car Service Server is running");
})

app.listen(port, () => {
    // console.log("Listening to port:", port);
})

// Export the Express API
module.exports = app;