var express = require('express');
var bodyParser = require('body-parser');
var app = express().use(bodyParser.json());

app.use(express.static('public'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.json({message: 'API Example App'})
})

module.exports = app