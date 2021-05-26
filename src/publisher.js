const topicName = process.env.GEOFENCE_TRIGGER_TOPIC_NAME || 'geoawareness-geofence-trigger';

const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

async function publishMessage(evt) {
    const data = JSON.stringify(evt);
    const dataBuffer = Buffer.from(data);
    const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published.`);
}

exports.publishMessage = publishMessage;