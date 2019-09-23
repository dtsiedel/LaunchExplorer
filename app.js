const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');

const port = 3000;

// read synchronously since this is only during startup. Strip newline.
var token = fs.readFileSync('token.txt', 'utf8');
token = token.replace(/\r?\n|\r/g, "");
var app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

app.get('/cesiumToken', (req, res) => {
    res.send(token);
});

app.listen(port, () => console.log(`Started server on port ${port}`));
