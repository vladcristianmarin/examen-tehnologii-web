import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { RadioButton } from 'primereact/radiobutton';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import useHttp from '../hooks/use-http';
import './BooksTable.css';

// const SERVER = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
const SERVER = `${window.location.protocol}//${window.location.hostname}:5001`;

const BookTable = () => {
	const params = useParams();
	const { shelfId } = params;
	const baseBook = {
		id: null,
		bookId: null,
		title: '',
		genre: 'mystery',
		url: '',
	};

	const [books, setBooks] = useState(null);
	const [book, setBook] = useState(baseBook);
	const [bookDialog, setBookDialog] = useState(false);
	const [deleteBookDialog, setDeleteBookDialog] = useState(false);
	const [deleteBooksDialog, setDeleteBooksDialog] = useState(false);
	const [selectedBooks, setSelectedBooks] = useState(null);
	const [submitted, setSubmitted] = useState(false);
	const [globalFilter, setGlobalFilter] = useState(null);
	const toast = useRef(null);
	const dt = useRef(null);
	const { sendRequest } = useHttp();
	const history = useHistory();

	useEffect(() => {
		setBooks([]);
		sendRequest(
			{
				url: `${SERVER}/shelf/${shelfId}/books`,
			},
			(data) => {
				console.log(data);
				setBooks(data);
			}
		);
	}, [sendRequest, shelfId]);

	const openNew = () => {
		setBook(baseBook);
		setSubmitted(false);
		setBookDialog(true);
	};

	const hideDialog = () => {
		setSubmitted(false);
		setBookDialog(false);
	};

	const hideDeleteBookDialog = () => {
		setDeleteBookDialog(false);
	};

	const hideDeleteBooksDialog = () => {
		setDeleteBooksDialog(false);
	};

	const saveBook = () => {
		setSubmitted(true);
		if (book.title.trim()) {
			let booksCopy = [...books];
			let bookCopy = { ...book };
			if (book.id) {
				const index = findIndexById(book.id);
				booksCopy[index] = bookCopy;
				sendRequest(
					{
						url: `${SERVER}/shelf/${shelfId}/book/${book.id}`,
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: { title: book.title, genre: book.genre, url: book.url },
					},
					(_data) => {
						toast.current.show({
							severity: 'success',
							summary: 'Successful',
							detail: 'Book Updated',
							life: 3000,
						});
					}
				);
			} else {
				sendRequest(
					{
						url: `${SERVER}/shelf/${shelfId}/book`,
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: { title: book.title, genre: book.genre, url: book.url },
					},
					(data) => {
						booksCopy.push(data);
						toast.current.show({
							severity: 'success',
							summary: 'Successful',
							detail: 'Book Created',
							life: 3000,
						});
					}
				);
			}
			setBooks(booksCopy);
			setBookDialog(false);
			setBook(baseBook);
		}
	};

	const findIndexById = (id) => {
		let index = -1;
		for (let i = 0; i < books.length; i++) {
			if (books[i].id === id) {
				index = i;
				break;
			}
		}

		return index;
	};

	const editBook = (book) => {
		setBook({ ...book });
		setBookDialog(true);
	};

	const confirmDeleteBook = (book) => {
		setBook({ ...book });
		setDeleteBookDialog(true);
	};

	const deleteBook = () => {
		let booksCopy = books.filter((val) => val.id !== book.id);
		setBooks(booksCopy);
		setDeleteBookDialog(false);
		const idToDelete = book.id;
		setBook(baseBook);
		console.log(idToDelete);
		sendRequest(
			{
				url: `${SERVER}/shelf/${shelfId}/book/${idToDelete}`,
				method: 'DELETE',
			},
			(_data) => {
				toast.current.show({
					severity: 'success',
					summary: 'Successful',
					detail: 'Book Deleted',
					life: 3000,
				});
			}
		);
	};

	const confirmDeleteSelected = () => {
		setDeleteBooksDialog(true);
	};

	const deleteSelectedBooks = () => {
		let booksCopy = books.filter((val) => !selectedBooks.includes(val));
		selectedBooks.forEach((book) =>
			sendRequest({
				url: `${SERVER}/shelf/${shelfId}/book/${book.id}`,
				method: 'DELETE',
			})
		);
		setBooks(booksCopy);
		setDeleteBooksDialog(false);
		setSelectedBooks(null);
		toast.current.show({
			severity: 'success',
			summary: 'Successful',
			detail: 'Books Deleted',
			life: 3000,
		});
	};

	const onInputChange = (e, field) => {
		const value = (e.target && e.target.value) || '';
		let bookCopy = { ...book };
		bookCopy[`${field}`] = value;
		setBook(bookCopy);
	};

	const onGenreChange = (e) => {
		let bookCopy = { ...book };
		bookCopy.genre = e.value;
		setBook(bookCopy);
	};

	const leftToolbarTemplate = () => {
		return (
			<React.Fragment>
				<Button
					label='Back'
					icon='pi pi-arrow-left'
					className='p-button-help mr-2'
					onClick={() => history.push('/shelves')}
				/>
				<Button
					label='New'
					icon='pi pi-plus'
					className='p-button-success mr-2'
					onClick={openNew}
				/>
				<Button
					label='Delete'
					icon='pi pi-trash'
					className='p-button-danger'
					onClick={confirmDeleteSelected}
					disabled={!selectedBooks || !selectedBooks.length}
				/>
			</React.Fragment>
		);
	};

	const actionBodyTemplate = (rowData) => {
		return (
			<React.Fragment>
				<Button
					icon='pi pi-pencil'
					className='p-button-rounded p-button-success mr-2'
					onClick={() => editBook(rowData)}
				/>
				<Button
					icon='pi pi-trash'
					className='p-button-rounded p-button-warning'
					onClick={() => confirmDeleteBook(rowData)}
				/>
			</React.Fragment>
		);
	};

	const header = (
		<div className='table-header'>
			<h5 className='mx-0 my-1'>{`List of the books from shelf ${shelfId}`}</h5>
			<span className='p-input-icon-left'>
				<i className='pi pi-search' />
				<InputText
					type='search'
					onInput={(e) => setGlobalFilter(e.target.value)}
					placeholder='Search...'
				/>
			</span>
		</div>
	);

	const bookDialogFooter = (
		<>
			<Button
				label='Cancel'
				icon='pi pi-times'
				className='p-button-text'
				onClick={hideDialog}
			/>
			<Button
				label='Save'
				icon='pi pi-check'
				className='p-button-text'
				onClick={saveBook}
			/>
		</>
	);

	const deleteBookDialogFooter = (
		<>
			<Button
				label='No'
				icon='pi pi-times'
				className='p-button-text'
				onClick={hideDeleteBookDialog}
			/>
			<Button
				label='Yes'
				icon='pi pi-check'
				className='p-button-text'
				onClick={deleteBook}
			/>
		</>
	);

	const deleteBooksDialogFooter = (
		<>
			<Button
				label='No'
				icon='pi pi-times'
				className='p-button-text'
				onClick={hideDeleteBooksDialog}
			/>
			<Button
				label='Yes'
				icon='pi pi-check'
				className='p-button-text'
				onClick={deleteSelectedBooks}
			/>
		</>
	);

	return (
		<div className='books-table'>
			<Toast ref={toast} />

			<div className='card'>
				<Toolbar className='mb-4' left={leftToolbarTemplate} />
				<DataTable
					ref={dt}
					value={books}
					selection={selectedBooks}
					onSelectionChange={(e) => setSelectedBooks(e.value)}
					dataKey='id'
					paginator
					rows={10}
					rowsPerPageOptions={[5, 10, 25]}
					paginatorTemplate='FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
					currentPageReportTemplate='Showing {first} to {last} of {totalRecords} books'
					globalFilter={globalFilter}
					header={header}
					responsiveLayout='scroll'>
					<Column
						selectionMode='multiple'
						headerStyle={{ width: '3rem' }}
						exportable={false}></Column>
					<Column
						field='id'
						header='Id'
						sortable
						style={{ minWidth: '12rem' }}></Column>
					<Column
						field='title'
						header='Title'
						sortable
						style={{ minWidth: '12rem' }}></Column>
					<Column
						field='genre'
						header='Genre'
						sortable
						style={{ minWidth: '12rem' }}></Column>
					<Column
						field='url'
						header="Book's URL"
						body={(rowData) => (
							<a href={rowData.url} target='_blank' rel='noreferrer'>
								{rowData.url}
							</a>
						)}
						sortable
						style={{ minWidth: '16rem' }}></Column>
					<Column
						body={actionBodyTemplate}
						exportable={false}
						style={{ minWidth: '8rem' }}></Column>
				</DataTable>
			</div>
			<Dialog
				visible={bookDialog}
				style={{ width: '450px' }}
				header='Shelf Details'
				modal
				className='p-fluid'
				footer={bookDialogFooter}
				onHide={hideDialog}>
				<div className='field'>
					<label htmlFor='title'>Title</label>
					<InputText
						id='title'
						value={book.title}
						onChange={(e) => onInputChange(e, 'title')}
						required
						rows={3}
						cols={20}
						className={classNames({
							'p-invalid': submitted && !book.title,
						})}
					/>
					{submitted && !book.title && (
						<small className='p-error'>Title is required.</small>
					)}
				</div>
				<div className='field'>
					<label htmlFor='url'>URL</label>
					<InputText
						id='url'
						value={book.url}
						onChange={(e) => onInputChange(e, 'url')}
						required
						rows={3}
						cols={20}
						className={classNames({
							'p-invalid': submitted && !book.url,
						})}
					/>
					{submitted && !book.url && (
						<small className='p-error'>URL is required.</small>
					)}
				</div>

				<div className='field'>
					<label className='mb-3'>Genre</label>
					<div className='formgrid grid'>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre1'
								name='genre'
								value='mystery'
								onChange={onGenreChange}
								checked={book.genre === 'mystery'}
							/>
							<label htmlFor='genre1'>Mystery</label>
						</div>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre2'
								name='genre'
								value='romance'
								onChange={onGenreChange}
								checked={book.genre === 'romance'}
							/>
							<label htmlFor='genre2'>Romance</label>
						</div>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre3'
								name='genre'
								value='historical'
								onChange={onGenreChange}
								checked={book.genre === 'historical'}
							/>
							<label htmlFor='genre3'>Historical</label>
						</div>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre4'
								name='genre'
								value='bildungsroman'
								onChange={onGenreChange}
								checked={book.genre === 'bildungsroman'}
							/>
							<label htmlFor='genre4'>Bildungsroman</label>
						</div>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre5'
								name='genre'
								value='comedy'
								onChange={onGenreChange}
								checked={book.genre === 'comedy'}
							/>
							<label htmlFor='genre5'>Comedy</label>
						</div>
						<div className='field-radiobutton col-6'>
							<RadioButton
								inputId='genre6'
								name='genre'
								value='tragedy'
								onChange={onGenreChange}
								checked={book.genre === 'tragedy'}
							/>
							<label htmlFor='genre6'>Tragedy</label>
						</div>
					</div>
				</div>
			</Dialog>
			<Dialog
				visible={deleteBookDialog}
				style={{ width: '450px' }}
				header='Confirm'
				modal
				footer={deleteBookDialogFooter}
				onHide={hideDeleteBookDialog}>
				<div className='confirmation-content'>
					<i
						className='pi pi-exclamation-triangle mr-3'
						style={{ fontSize: '2rem' }}
					/>
					{book && (
						<span>
							Are you sure you want to delete <b>{book.title}</b>?
						</span>
					)}
				</div>
			</Dialog>

			<Dialog
				visible={deleteBooksDialog}
				style={{ width: '450px' }}
				header='Confirm'
				modal
				footer={deleteBooksDialogFooter}
				onHide={hideDeleteBooksDialog}>
				<div className='confirmation-content'>
					<i
						className='pi pi-exclamation-triangle mr-3'
						style={{ fontSize: '2rem' }}
					/>
					{book && (
						<span>Are you sure you want to delete the selected books?</span>
					)}
				</div>
			</Dialog>
		</div>
	);
};

export default BookTable;
