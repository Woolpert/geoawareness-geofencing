const repository = require('./repository');
const geofenceTriggerPublisher = require('./publisher');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;

/**
 * Intersects event with all geofences belonging to the store and upserts order document.
 * @param {*} evt 
 */
const geofenceEvent = async evt => {
    try {
        const geofencingPromise = new Promise((resolve, reject) => {
            resolve(doGeofencing(evt).then(({ innerGeofence, processedGeofences }) => {
                // remove fields: 
                //   1) avoid duplicating geofence geometry for each order 
                //   2) geofence id should be hidden
                processedGeofences.forEach(geofence => {
                    delete geofence.shape;
                    delete geofence.id;
                });
                if (innerGeofence) {
                    delete innerGeofence.shape;
                    delete innerGeofence.id;
                }
                return { innerGeofence, processedGeofences };
            }));
        });
        const orderPromise = new Promise((resolve, reject) => {
            resolve(repository.getOrder(evt.orderId, evt.storeName).then(order => {
                // handle messages ingested out of order
                if (order &&
                    order.latestEvent &&
                    order.latestEvent.eventTimestamp &&
                    evt.eventTimestamp < order.latestEvent.eventTimestamp) {
                    throw (`Event timestamp ${evt.eventTimestamp} is older than latest event timestamp ${order.latestEvent.eventTimestamp}.`);
                }
                return order || {
                    orderId: evt.orderId,
                    status: [process.env.NEW_EVENT_STATUS || 'open'],
                    storeName: evt.storeName
                };
            }));
        });

        const [{ innerGeofence, processedGeofences }, order] = await Promise.all([geofencingPromise, orderPromise]);

        const priorEvent = order.latestEvent;
        let latestEvent = {
            eventLocation: evt.eventLocation,
            eventTimestamp: evt.eventTimestamp,
            geofences: processedGeofences
        };
        if (innerGeofence) {
            latestEvent = {
                ...latestEvent,
                innerGeofence: innerGeofence
            }
        }
        order.latestEvent = latestEvent;

        await repository.saveOrder(order);
        repository.insertEvent(evt);

        /* 
        // A geofence trigger occurs whenever the state of the prior order event geofences
        // doesn't match the latest order event geofences. This includes the following scenarios:
        // 
        // - upon event processing for a new order
        // - upon geofence boundary crossed
        // 
        // Further, it's possible to generate multiple triggers for the same geofence
        // crossing. This can occur when two (or more) events, occuring close in time,
        // are judged for geofence triggering before the order's "latest event" is updated from 
        // processing the first event.
        //
        // TODO: Fix the multiple trigger condition by implementing [transactions](https://cloud.google.com/datastore/docs/concepts/transactions#datastore-datastore-transactional-update-nodejs)
        */
        if (geofenceTriggered(priorEvent, latestEvent)) {
            console.log('geofence triggered, publishing message for event', latestEvent);
            geofenceTriggerPublisher.publishMessage({
                ...order,
                priorEvent: priorEvent
            });
        }
    } catch (error) {
        console.log('Error occurred during geofencing.', error);
    }
}

const doGeofencing = async evt => {
    const store = await repository.getStore(evt.storeName);
    if (!store) {
        throw new Error(`Store ${evt.storeName} not found.`);
    }
    const geofences = await repository.getGeofencesByStore(store.name);
    if (!geofences || !geofences.length) {
        throw new Error(`No geofences found for store ${store.name}.`);
    }

    const pt = [evt.eventLocation.longitude, evt.eventLocation.latitude];
    const processedGeofences = intersectEvent(geofences, pt);
    const innerGeofence = findInnerGeofence(processedGeofences);

    return { innerGeofence, processedGeofences };
}

/**
 * Tests the intersection of each geofence with the event and writes the result to each geofence. 
 * @param {*} geofences 
 * @param {*} pt 
 */
const intersectEvent = (geofences, pt) => {
    return geofences.map(geofence => {
        return {
            ...geofence,
            intersectsEvent: pointInPolygon(pt, geofence.shape)
        }
    });
}

/**
 * Finds geofence with shortest range from the set of intersecting geofences. 
 * @param {*} geofences 
 */
const findInnerGeofence = geofences => {
    const intersectingGeofences = geofences
        .filter(geofence => geofence.intersectsEvent)
        .sort((first, second) => first.range - second.range);

    return intersectingGeofences[0] || null;
}

/**
 * Determines if event crossed any geofence boundary.
 * @param {*} priorEvt 
 * @param {*} latestEvt
 */
const geofenceTriggered = (priorEvt, latestEvt) => {
    const geofencesEqual =
        priorEvt && priorEvt.geofences && latestEvt && latestEvt.geofences &&
        priorEvt.geofences.length === latestEvt.geofences.length &&
        priorEvt.geofences.every(priorGf => {
            latestGf = latestEvt.geofences.find(gf =>
                gf.rangeType === priorGf.rangeType && gf.range === priorGf.range
            );
            return latestGf && latestGf.intersectsEvent === priorGf.intersectsEvent;
        });
    return !geofencesEqual;
}

const pointInPolygon = (pt, poly) => {
    return booleanPointInPolygon(pt, poly);
}

exports.geofenceEvent = geofenceEvent;
exports.intersectEvent = intersectEvent;
exports.findInnerGeofence = findInnerGeofence;
exports.geofenceTriggered = geofenceTriggered;
exports.pointInPolygon = pointInPolygon;