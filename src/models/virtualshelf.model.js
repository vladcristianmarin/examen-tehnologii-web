const { sequelize } = require('../database/db');
const { DataTypes } = require('sequelize');

const VirtualShelf = sequelize.define(
	'VirtualShelf',
	{
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				hasMinLength(val) {
					if (val.length < 3) {
						throw new Error('Description is too short!');
					}
				},
			},
		},
	},
	{ timestamps: true }
);

VirtualShelf.associate = () => {
	const { Book } = sequelize.models;
	VirtualShelf.hasMany(Book, { foreignKey: 'shelfId', onDelete: 'CASCADE' });
};

module.exports = VirtualShelf;
