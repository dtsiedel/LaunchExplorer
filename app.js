const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const port = 3000;

// read synchronously since this is only during startup. Strip newline.
var token = fs.readFileSync('token.txt', 'utf8');
token = token.replace(/\r?\n|\r/g, "");
var app = express();

const launchHost = 'launchlibrary.net';
const launchVersion = '1.4';
const launchEndpoint = 'launch';
const launchCount = '10';
const launchPath = `/${launchVersion}/${launchEndpoint}/next/${launchCount}`

const launchOptions = {
    host: launchHost,
    port: 443,
    path: launchPath,
    method: 'GET'
}

// Fetches the launch list from LaunchLibrary and returns it. Depends on
// state of variable launchOptions.
function fetchLaunches(callback) {
    return https.get(launchOptions, (response) => {
        var body = '';
        response.on('data', (d) => { body += d; });
        response.on('end', () => {
            callback(JSON.parse(body));
        });
    });
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

app.get('/cesiumToken', (req, res) => {
    res.send(token);
});

app.get('/launches', (req, res) => {
    fetchLaunches((launches) => res.json(launches));
});

app.listen(port, () => console.log(`Started server on port ${port}`));
