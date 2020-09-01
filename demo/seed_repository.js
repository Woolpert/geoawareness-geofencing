const repository = require('../src/repository');
const utils = require('../test/test_utils');

const storeName = 'Carmelit';
const seedStore = async () => {
    await repository.deleteStore(storeName);
    let store = {
        name: storeName,
        location: {
            longitude: -93.220024,
            latitude: 36.650717
        },
        address: '504 Veterans Blvd, Branson, MO 65616'
    }
    await repository.insertStore(store);

    await repository.deleteStore('Napoli');
    store = {
        name: 'Napoli',
        location: {
            latitude: 37.162649,
            longitude: -93.30884
        },
        address: '3600 S Fort Ave, Springfield, MO 65807'
    }
    await repository.insertStore(store);

    await repository.deleteStore('Montmartre');
    store = {
        name: 'Montmartre',
        location: {
            latitude: 36.126373,
            longitude: -94.159907
        },
        address: '202 W Joyce Blvd, Fayetteville, AR 72703'
    }
    await repository.insertStore(store);
}

const seedGeofences = async () => {
    let geofences = [];
    try {
        geofences = await repository.getGeofencesByStore(storeName);
        if (geofences && geofences.length) {
            await repository.deleteGeofences(geofences.map(geofence => geofence.id), storeName);
        }
        const seedGeofences = utils.createGeofences();
        await repository.insertGeofences(seedGeofences, storeName);
    } catch (error) {
        console.log(error);
    }
}

const seedOrders = async () => {
    let orders = [];
    try {
        orders = await repository.getOrdersByStore(storeName);
        if (orders && orders.length) {
            await repository.deleteOrders(orders.map(order => order.orderId), storeName);
        }
        const seedOrders = utils.createOrders(storeName);
        await repository.saveOrders(seedOrders);
    } catch (error) {
        console.log(error);
    }
}

const doSeeding = async () => {
    await seedStore();
    await seedGeofences();

    // Enable this to seed orders:
    // await seedOrders();

    console.log('Seeding script finished.');
}

doSeeding();