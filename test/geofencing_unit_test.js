const test = require('ava');
const geofencing = require('../src/geofencing');
const utils = require('./test_utils');
const chance = require('chance').Chance();
const fs = require('fs');

test.before(t => {
    const rawPoly120 = fs.readFileSync('test/fakes/time_120_poly.json', 'utf8');
    const poly120 = t.context.poly120 = JSON.parse(rawPoly120);
    t.context.geofence120 = {
        range: 120,
        rangeType: 'time',
        shape: poly120
    };

    const rawPoly300 = fs.readFileSync('test/fakes/time_300_poly.json', 'utf8');
    const poly300 = t.context.poly300 = JSON.parse(rawPoly300);
    t.context.geofence300 = {
        range: 300,
        rangeType: 'time',
        shape: poly300
    };
});

test('pointInPolygon point inside polygon', t => {
    const pt = [-93.220024, 36.650717];
    const isPointInPolygon = geofencing.pointInPolygon(pt, t.context.poly300);
    t.assert(isPointInPolygon);
});

test('pointInPolygon point outside polygon', t => {
    const pt = [93.220024, 36.650717];
    const isPointInPolygon = geofencing.pointInPolygon(pt, t.context.poly300);
    t.false(isPointInPolygon);
});

test('intersectEvent event inside all geofences', t => {
    const eventPoint = [-93.220024, 36.650717];
    const geofences = geofencing.intersectEvent([t.context.geofence120, t.context.geofence300], eventPoint);
    t.assert(geofences.every(geofence => geofence.intersectsEvent));
});

test('findInnerGeofence event in inner geofence', t => {
    const eventPoint = [-93.220024, 36.650717];
    const geofences = geofencing.intersectEvent([t.context.geofence120, t.context.geofence300], eventPoint);
    const innerGeofence = geofencing.findInnerGeofence(geofences);
    t.is(innerGeofence, geofences[0]);
});

test('findInnerGeofence event in outer geofence', t => {
    const eventPoint = [-93.218270, 36.622237];
    const geofences = geofencing.intersectEvent([t.context.geofence120, t.context.geofence300], eventPoint);
    const innerGeofence = geofencing.findInnerGeofence(geofences);
    t.is(innerGeofence, geofences[1]);
});

test('findInnerGeofence event outside any geofence', t => {
    const eventPoint = [93.218270, 36.622237];
    const geofences = geofencing.intersectEvent([t.context.geofence120, t.context.geofence300], eventPoint);
    const innerGeofence = geofencing.findInnerGeofence(geofences);
    t.is(innerGeofence, null);
});
