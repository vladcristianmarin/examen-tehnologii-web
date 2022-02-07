const { sequelize } = require('../database/db');
const { DataTypes } = require('sequelize');

const Book = sequelize.define('Book', {
	id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
	},
	title: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			hasMinLength(val) {
				if (val.length < 5) {
					throw new Error('Title is too short!');
				}
			},
		},
	},
	genre: {
		type: DataTypes.ENUM(
			'mystery',
			'romance',
			'historical',
			'bildungsroman',
			'comedy',
			'tragedy'
		),
		allowNull: false,
	},
	url: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			isUrl: true,
		},
	},
	shelfId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

Book.associate = () => {
	const { VirtualShelf } = sequelize.models;
	Book.belongsTo(VirtualShelf, { foreignKey: 'shelfId' });
};

module.exports = Book;
