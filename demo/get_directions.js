const https = require("https");
const decodePolyline = require('decode-google-map-polyline');
const key = process.env.YOUR_API_KEY;

const origin = process.argv[2] || '387 Dalton Dr, Branson, MO'; // Customer starting location
const destination = '36.650717,-93.220024';

const url = `https://maps.googleapis.com/maps/api/directions/json?` +
    `origin=${origin}&` +
    `destination=${destination}&` +
    `departure_time=now&` +
    `key=${key}`;

https.get(url, res => {
    res.setEncoding("utf8");
    let response = "";
    res.on("data", data => {
        response += data;
    });
    res.on("end", () => {
        const coordPairs = polylinesToCoordPairs(response);
        coordPairs.forEach(pair => {
            console.log(pair);
        });
    });
});

function polylinesToCoordPairs(response) {
    response = JSON.parse(response);
    const legs = response.routes[0].legs;
    const path = legs.flatMap(leg => {
        return leg.steps.map(step => {
            return step.polyline.points;
        });
    });
    const coordPairs = path.flatMap(segment => {
        const points = decodePolyline(segment);
        return points.map(pt => {
            const pair = pt.lat + ',' + pt.lng;
            return pair;
        });
    });
    return coordPairs;
}
