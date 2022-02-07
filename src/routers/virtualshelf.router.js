const VirtualShelf = require('../models/virtualshelf.model');
const Book = require('../models/book.model');
const express = require('express');
const router = new express.Router();

router.get('/shelves', async (req, res) => {
	const filters = {};
	let sort;

	const description = req.query?.description?.toLowerCase();
	const createdAt = req.query?.createdAt
		? Date.parse(req.query.createdAt)
		: null;

	if (description) {
		filters.description = description;
	}

	if (createdAt) {
		filters.createdAt = createdAt;
	}

	sort = req.query?.sort?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
	const limit = req.query.limit ? parseInt(req.query.limit) : null;
	const page = req.query.page ? parseInt(req.query.page) * limit : null;

	try {
		const shelves = await VirtualShelf.findAll({
			order: [['description', sort]],
			limit,
			offset: page,
		});
		const filteredShelves = shelves.filter((shelf) => {
			let isValid = true;
			for (key in filters) {
				if (key === 'description') {
					isValid =
						isValid &&
						shelf[key]?.trim()?.toLowerCase() ===
							filters[key]?.trim()?.toLowerCase();
				}
				if (key === 'createdAt') {
					const date1 = new Date(shelf[key]);
					const date2 = new Date(filters[key]);
					isValid =
						isValid &&
						date1.getFullYear() === date2.getFullYear() &&
						date1.getMonth() === date2.getMonth() &&
						date1.getDay() === date2.getDay();
				}
			}
			return isValid;
		});
		filteredShelves.forEach((shelf) => {
			shelf.dataValues.createdAt = new Date(
				shelf.dataValues.createdAt
			).toLocaleDateString('en-US', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			});
		});
		res.send(filteredShelves);
	} catch (err) {
		console.log(err);
		res.status(500).send({ err });
	}
});

router.get('/shelf/:id', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.id);
		console.log(shelf);
		if (shelf) {
			return res.status(200).send(shelf);
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.post('/shelf', async (req, res) => {
	try {
		const shelf = await VirtualShelf.create({ ...req.body });
		res.status(201).send(shelf);
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.put('/shelf/:id', async (req, res) => {
	try {
		let shelf = await VirtualShelf.findByPk(req.params.id);
		if (!shelf) {
			shelf = await VirtualShelf.create({ ...req.body });
			res.status(201).send(shelf);
		} else {
			const updates = Object.keys(req.body);
			const allowedUpdates = ['description'];
			const isValidUpdate = updates.every((update) =>
				allowedUpdates.includes(update)
			);
			if (!isValidUpdate)
				return res.status(400).send({ message: 'Invalid Updates' });
			updates.forEach((update) => (shelf[update] = req.body[update]));
			await shelf.save();
			res.status(202).send(shelf);
		}
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.delete('/shelves', async (_req, res) => {
	try {
		await VirtualShelf.truncate();
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.delete('/shelf/:id', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.id);
		console.log(shelf);
		if (!shelf) res.status(404).send({ message: 'Shelf not found!' });
		await shelf.destroy();
		res.send(shelf);
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.get('/shelf/:shelfId/books', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.shelfId);
		if (shelf) {
			const books = await shelf.getBooks();
			return res.send(books);
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		res.status(404).send({ err });
	}
});

router.get('/shelf/:shelfId/book/:bookId', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.shelfId);
		if (shelf) {
			const books = await shelf.getBooks({ where: { id: req.params.bookId } });
			const book = books.shift();
			if (book) {
				return res.send(book);
			}
			return res.status(400).send({ message: 'Book not found!' });
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.post('/shelf/:shelfId/book', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.shelfId);
		if (shelf) {
			const book = await Book.create({ shelfId: shelf.id, ...req.body });
			shelf.addBook(book);
			await shelf.save();
			return res.status(201).send(book);
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.put('/shelf/:shelfId/book/:bookId', async (req, res) => {
	try {
		let shelf = await VirtualShelf.findByPk(req.params.shelfId);
		if (shelf) {
			const books = await shelf.getBooks({ where: { id: req.params.bookId } });
			const book = books.shift();
			if (!book) {
				book = await Book.create({ shelfId: shelf.id, ...req.body });
				return res.status(201).send(book);
			} else {
				const updates = Object.keys(req.body);
				const allowedUpdates = ['title', 'genre', 'url'];
				const isValidUpdate = updates.every((update) =>
					allowedUpdates.includes(update)
				);
				if (!isValidUpdate)
					return res.status(400).send({ message: 'Invalid Updates' });
				updates.forEach((update) => (book[update] = req.body[update]));
				await book.save();
				return res.status(202).send(book);
			}
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		console.log(err);
		res.status(500).send({ err });
	}
});

router.delete('/shelf/:shelfId/book/:bookId', async (req, res) => {
	try {
		const shelf = await VirtualShelf.findByPk(req.params.shelfId);
		if (shelf) {
			const books = await shelf.getBooks({ where: { id: req.params.bookId } });
			const book = books.shift();
			if (book) {
				await book.destroy();
				return res.send(book);
			}
			return res.status(400).send({ message: 'Book not found!' });
		}
		res.status(400).send({ message: 'Shelf not found!' });
	} catch (err) {
		res.status(500).send({ err });
	}
});

router.post('/import', async (req, res) => {
	try {
		for (let _shelf of req.body) {
			const shelf = await VirtualShelf.create(_shelf);
			for (let _book of _shelf.books) {
				const book = await Book.create(_book);
				shelf.addBook(book);
			}
			await shelf.save();
		}
	} catch (err) {
		res.status(500).send({ err });
	}
});

module.exports = router;
