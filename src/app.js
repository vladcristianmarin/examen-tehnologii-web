const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database/db');

const shelfRouter = require('./routers/virtualshelf.router');

const app = express();

app.use(cors());
app.use(express.json());
app.use(shelfRouter);

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../client/build')));
}

db.init();

module.exports = app;
