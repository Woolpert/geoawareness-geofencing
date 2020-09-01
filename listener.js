const geofencing = require('./src/geofencing');
const subscriptionName = process.env.INGEST_SUBSCRIPTION_NAME || 'geoawareness-geofencing-service';

const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

function listenForMessages() {
    const subscription = pubSubClient.subscription(subscriptionName);

    const messageHandler = message => {
        console.log(`\nReceived message ${message.id}:`);
        console.log(`\tData: ${message.data}`);
        console.log(`\tAttributes: ${message.attributes}`);

        const evt = JSON.parse(message.data);
        geofencing.geofenceEvent(evt);

        message.ack();
    };
    subscription.on('message', messageHandler);
}

listenForMessages();
console.log(`Listening for messages on subscription ${subscriptionName}.`);