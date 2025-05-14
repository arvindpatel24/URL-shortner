const express = require("express");
const {Client} = require("pg");
const HashRing = require("hashring");
const crypto = require("crypto");
const SnowflakeId = require('snowflake-id');
const Base62 = require('base62')

const app = express();
app.use(express.json());
const clients = {
    "5432" : new Client ({
        "host": "192.168.1.3",
        "port": "5432",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    }),
    "5433" : new Client ({
        "host": "192.168.1.3",
        "port": "5433",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    }),
    "5434" : new Client ({
        "host": "192.168.1.3",
        "port": "5434",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    })
}

async function connect() {
    await clients["5432"].connect();
    await clients["5433"].connect();
    await clients["5434"].connect();
    await createIndexIfNotExists(clients["5432"], 'URL_TABLE', 'shorturl', 'shard_idx');
    await createIndexIfNotExists(clients["5433"], 'URL_TABLE', 'shorturl', 'shard_idx');
    await createIndexIfNotExists(clients["5434"], 'URL_TABLE', 'shorturl', 'shard_idx');
}
connect();

const hr = new HashRing();
hr.add("5432");
hr.add("5433");
hr.add("5434");


app.get("/", async (req, res) => {
    const shortUrl = req.query.url;
    const dbServer = hr.get(shortUrl);
    const result = await clients[dbServer].query("SELECT * FROM URL_TABLE WHERE shorturl = $1", [shortUrl]);
    if(result.rowCount > 0) {
        res.status(200).json({
            longUrl : result.rows[0].longurl
        })
    } else{
        res.sendStatus(404);
    }


})

app.post("/", async (req, res) => {
    const url = req.query.url;

    const hash = crypto.createHash("sha256").update(url).digest('base64');
    const shortUrl = hash.substring(0,7);

    // Using Snowflake id generator and then doing base62 encoding, but not find solution with multiple shards.
    // const snowflakeId = generateSnowflakeId();
    // const shortUrl = encodeBase62(snowflakeId);

    // console.log("Snowflake ID:", snowflakeId);
    // console.log("Base62 Encoded ID:", shortUrl);
    

    const dbServer = hr.get(shortUrl);
    console.log(shortUrl, dbServer);
    try {
        await clients[dbServer].query("INSERT INTO URL_TABLE (shorturl, longurl) VALUES ($1, $2)", [shortUrl, url]);
        res.status(200).json({shorUrl: shortUrl});
    } catch (err) {
        res.status(400).json({error: err.detail})
    }
    
    

})


function generateSnowflakeId() {
    const time = (new Date()).getTime().toString() // + Math.random().toString();
    const randomSeed = Math.floor((Math.random() * 100)).toString();
    return time + randomSeed;
}

function encodeBase62(id) {
    return Base62.encode(id);
}

// Create Index on all shardes
async function createIndexIfNotExists(client, tableName, columnName, indexName) {
    try {
        const queryText = `
            CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnName});
        `;
        await client.query(queryText);
        // console.log(`Index ${indexName} created (if it didn't exist) on ${tableName}`);
    } finally {
        
    }
}


app.listen(4000, () => {
    console.log("Server is running...");
});