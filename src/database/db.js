const { Sequelize } = require('sequelize');

let sequelize;
if (process.env.NODE_ENV === 'dev') {
	sequelize = new Sequelize(
		process.env.DB_NAME,
		process.env.DB_USER,
		process.env.DB_PASS,
		{
			dialect: 'mariadb',
			dialectOptions: {
				charset: 'utf8mb4',
			},
			// logging: false,
		}
	);
}

if (process.env.NODE_ENV === 'production') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres',
		protocol: 'postgres',
		dialectOptions: {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		},
	});
}

const init = async () => {
	try {
		await sequelize.authenticate();
		console.log('Connection has been established successfully.');
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	}
	require('../models/virtualshelf.model');
	require('../models/book.model');
	await sequelize.sync();
	const db = sequelize.models;
	Object.keys(db).forEach((model) => {
		if (db[model].associate) {
			db[model].associate(db);
		}
	});
	console.log('Models Synchronized!');
};

module.exports = { sequelize, init };
