const fs = require('fs');
const chance = require('chance').Chance();

const topicName = process.env.INGEST_TOPIC_NAME || 'geoawareness-ingest';
const interval = 1; // seconds between publish events
const skipVertices = 2;

const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

function createEvent(line, orderId) {
    const evt = {
        orderId: orderId,
        eventLocation: {
            longitude: line.split(',')[1],
            latitude: line.split(',')[0]
        },
        eventTimestamp: parseInt(Date.now() / 1000),
        storeName: 'Carmelit'
    };
    return evt;
}

async function publishMessage(data) {
    const dataBuffer = Buffer.from(data);
    const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published.`);
}

function playRoute(routeFile) {
    const route = fs.readFileSync(routeFile, 'utf8');
    const coords = route.split(/\r?\n/);
    const orderId = chance.first();

    let counter = 0;
    const timer = setInterval(() => {
        const line = coords[counter];
        const evt = createEvent(line, orderId);
        console.log(evt);

        publishMessage(JSON.stringify(evt)).catch(console.error);

        counter += skipVertices;
        if (counter === coords.length) {
            clearInterval(timer);
        }
    }, interval * 1000);
}

playRoute('demo/dalton_dr_route.coords');
playRoute('demo/fox_ridge_rd_route.coords');
playRoute('demo/walnut_st_route.coords');
