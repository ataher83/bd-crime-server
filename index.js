const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      // 'https://natural-agro.web.app'
    ],
    credentials: true,
  }),
);
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdhq5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with MongoClientOptions to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();


    const informationsCollection = client.db('bd-crime').collection('informations');


    app.get('/informations', async (req, res) => {
      const { search, crimeFilter, professionFilter, minPrice, maxPrice, sortPrice, sortDate } = req.query;
      const query = {};
    
      if (search) query.criminalName = { $regex: search, $options: 'i' };
      if (crimeFilter) query.crimeType = crimeFilter;
      if (professionFilter) query.criminalProfession = professionFilter;
      if (minPrice || maxPrice) query.productPrice = { 
        ...(minPrice && { $gte: parseInt(minPrice, 10) }), 
        ...(maxPrice && { $lte: parseInt(maxPrice, 10) }) 
      };
    
      // Set default date sorting to "Newest First"
      const sortCriteria = {
        currentDateAndTime: sortDate === 'oldest' ? 1 : -1 // Default to newest if not specified
      };
    
      // Apply price sorting only if sortPrice is provided
      if (sortPrice) {
        sortCriteria.productPrice = sortPrice === 'asc' ? 1 : -1;
      }
    
      try {
        // Fetch the products and sort them
        const informations = await informationsCollection.find(query).sort(sortCriteria).toArray();
    
        // Ensure price sorting is numerical, not lexicographical
        if (sortPrice) {
          products.sort((a, b) => {
            const priceA = Number(a.productPrice);
            const priceB = Number(b.productPrice);
            return sortPrice === 'asc' ? priceA - priceB : priceB - priceA;
          });
        }
    
        res.send(informations);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch informations' });
      }
    });
    
    

    // Save a New information in DB
    app.post('/informations', async (req, res) => {
      const newInformation = req.body;
      try {
        const result = await informationsCollection.insertOne(newInformation);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to save information', error });
      }
    });


    // Ping MongoDB to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('BD Crime Server is running');
});

app.listen(port, () => {
  console.log(`BD Crime Server is running on port: ${port}`);
});
