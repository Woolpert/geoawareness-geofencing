const chance = require('chance').Chance();
const fs = require('fs');

const createStore = storeName => {
    return {
        name: storeName,
        location: {
            longitude: -93.220024,
            latitude: 36.650717
        },
        address: '504 Veterans Blvd, Branson, MO 65616'
    };
}

const createGeofences = () => {
    const geofences = [];

    let rawPoly = fs.readFileSync('test/fakes/time_120_poly.json', 'utf8');
    let poly = JSON.parse(rawPoly);
    let geofence = createGeofence(120, poly);
    geofences.push(geofence);

    rawPoly = fs.readFileSync('test/fakes/time_300_poly.json', 'utf8');
    poly = JSON.parse(rawPoly);
    geofence = createGeofence(300, poly);
    geofences.push(geofence);

    rawPoly = fs.readFileSync('test/fakes/time_600_poly.json', 'utf8');
    poly = JSON.parse(rawPoly);
    geofence = createGeofence(600, poly);
    geofences.push(geofence);

    return geofences;
}

const createGeofence = (range, poly) => {
    return {
        range: range,
        rangeType: 'time',
        shape: poly
    };
}

const createOrder = storeName => {
    return {
        orderId: chance.integer(),
        storeName: storeName,
        status: [
            'open'
        ]
    };
}

const createOrders = storeName => {
    return [
        {
            orderId: chance.integer(),
            storeName: storeName,
            status: [
                'open'
            ]
        },
        {
            orderId: chance.integer(),
            storeName: storeName,
            status: [
                'open'
            ]
        },
        {
            orderId: chance.integer(),
            storeName: storeName,
            status: [
                'closed'
            ]
        }
    ];
}

const createEvent = (storeName, orderId) => {
    return {
        orderId: orderId,
        eventLocation: {
            longitude: -93.24011,
            latitude: 36.65083
        },
        eventTimestamp: 1593563187,
        storeName: storeName
    };
}

const createOrderEvent = () => {
    return {
        eventLocation: {
            longitude: -93.24011,
            latitude: 36.65083
        },
        eventTimestamp: 1593563187,
    };
}

const createLatestEvent = () => {
    return {
        ...createOrderEvent(),
        innerGeofence: {
            rangeType: 'time',
            range: 120,
            intersectsEvent: true
        },
        geofences: [
            {
                rangeType: 'time',
                range: 120,
                intersectsEvent: true
            },
            {
                rangeType: 'time',
                range: 300,
                intersectsEvent: true
            },
            {
                rangeType: 'time',
                range: 600,
                intersectsEvent: true
            }
        ]
    }
}

exports.createStore = createStore;
exports.createGeofences = createGeofences;
exports.createOrders = createOrders;
exports.createOrder = createOrder;
exports.createEvent = createEvent;
exports.createOrderEvent = createOrderEvent;
exports.createLatestEvent = createLatestEvent;