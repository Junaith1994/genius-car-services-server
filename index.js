const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middle-wires
app.use(cors());
app.use(express.json()) // body parser

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
        const servicesCollection = await client.db("geniusCar").collection("services");

        // To get all services data
        app.get('/service', async (req, res) => {
            const cursor = servicesCollection.find();
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
    console.log("Listening to port:", port);
})