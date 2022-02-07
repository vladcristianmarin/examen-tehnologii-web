import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Toolbar } from 'primereact/toolbar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import useHttp from '../hooks/use-http';
import './ShelvesTable.css';

const SERVER = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
// const SERVER = `${window.location.protocol}//${window.location.hostname}:5001`;

const ShelvesTable = () => {
	const baseShelf = {
		id: null,
		description: '',
		createdAt: '',
	};

	const [shelves, setShelves] = useState(null);
	const [shelf, setShelf] = useState(baseShelf);
	const [shelfDialog, setShelfDialog] = useState(false);
	const [deleteShelfDialog, setDeleteShelfDialog] = useState(false);
	const [deleteShelvesDialog, setDeleteShelvesDialog] = useState(false);
	const [selectedShelves, setSelectedShelves] = useState(null);
	const [submitted, setSubmitted] = useState(false);
	const [globalFilter, setGlobalFilter] = useState(null);
	const toast = useRef(null);
	const dt = useRef(null);
	const { sendRequest } = useHttp();
	const history = useHistory();

	useEffect(() => {
		sendRequest(
			{
				url: `${SERVER}/shelves`,
			},
			(data) => {
				setShelves(data);
				console.log(data);
			}
		);
	}, [sendRequest]);

	const openNew = () => {
		setShelf(baseShelf);
		setSubmitted(false);
		setShelfDialog(true);
	};

	const hideDialog = () => {
		setSubmitted(false);
		setShelfDialog(false);
	};

	const hideDeleteShelfDialog = () => {
		setDeleteShelfDialog(false);
	};

	const hideDeleteShelvesDialog = () => {
		setDeleteShelvesDialog(false);
	};

	const saveShelf = () => {
		setSubmitted(true);
		if (shelf.description.trim()) {
			let shelvesCopy = [...shelves];
			let shelfCopy = { ...shelf };
			if (shelf.id) {
				const index = findIndexById(shelf.id);
				shelvesCopy[index] = shelfCopy;
				sendRequest(
					{
						url: `${SERVER}/shelf/${shelf.id}`,
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: { description: shelf.description },
					},
					(_data) => {
						toast.current.show({
							severity: 'success',
							summary: 'Successful',
							detail: 'Shelf Updated',
							life: 3000,
						});
					}
				);
			} else {
				sendRequest(
					{
						url: `${SERVER}/shelf`,
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: { description: shelf.description },
					},
					(data) => {
						shelvesCopy.push(data);
						toast.current.show({
							severity: 'success',
							summary: 'Successful',
							detail: 'Shelf Created',
							life: 3000,
						});
					}
				);
			}
			setShelves(shelvesCopy);
			setShelfDialog(false);
			setShelf(baseShelf);
		}
	};

	const findIndexById = (id) => {
		let index = -1;
		for (let i = 0; i < shelves.length; i++) {
			if (shelves[i].id === id) {
				index = i;
				break;
			}
		}

		return index;
	};

	const editShelf = (shelf) => {
		setShelf({ ...shelf });
		setShelfDialog(true);
	};

	const confirmDeleteShelf = (shelf) => {
		setShelf({ ...shelf });
		setDeleteShelfDialog(true);
	};

	const deleteShelf = () => {
		let shelvesCopy = shelves.filter((val) => val.id !== shelf.id);
		setShelves(shelvesCopy);
		setDeleteShelfDialog(false);
		const idToDelete = shelf.id;
		setShelf(baseShelf);
		console.log(idToDelete);
		sendRequest(
			{ url: `${SERVER}/shelf/${idToDelete}`, method: 'DELETE' },
			(_data) => {
				toast.current.show({
					severity: 'success',
					summary: 'Successful',
					detail: 'Shelf Deleted',
					life: 3000,
				});
			}
		);
	};

	const confirmDeleteSelected = () => {
		setDeleteShelvesDialog(true);
	};

	const deleteSelectedShelves = () => {
		let shelvesCopy = shelves.filter((val) => !selectedShelves.includes(val));
		selectedShelves.forEach((shelf) =>
			sendRequest({ url: `${SERVER}/shelf/${shelf.id}`, method: 'DELETE' })
		);
		setShelves(shelvesCopy);
		setDeleteShelvesDialog(false);
		setSelectedShelves(null);
		toast.current.show({
			severity: 'success',
			summary: 'Successful',
			detail: 'Shelves Deleted',
			life: 3000,
		});
	};

	const onInputChange = (e, field) => {
		const value = (e.target && e.target.value) || '';
		let shelfCopy = { ...shelf };
		shelfCopy[`${field}`] = value;
		setShelf(shelfCopy);
	};

	const importCSV = (e) => {
		const file = e.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			const csv = e.target.result;
			const data = csv.split('\n');

			const cols = data[0].replace(/['"]+/g, '').split(',');
			data.shift();
			const importedData = data.map((d) => {
				d = d.split(',');
				return cols.reduce((obj, c, i) => {
					obj[c] = d[i].replace(/['"]+/g, '');
					return obj;
				}, {});
			});

			const shelvesCopy = [...shelves, ...importedData];

			setShelves(shelvesCopy);
		};

		reader.readAsText(file, 'UTF-8');
	};

	const exportCSV = () => {
		dt.current.exportCSV();
	};

	const leftToolbarTemplate = () => {
		return (
			<React.Fragment>
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
					disabled={!selectedShelves || !selectedShelves.length}
				/>
			</React.Fragment>
		);
	};

	const actionBodyTemplate = (rowData) => {
		return (
			<React.Fragment>
				<Button
					icon='pi pi-book'
					className='p-button-rounded p-button-info mr-2'
					onClick={() => history.push(`/shelf/${rowData.id}/books`)}
				/>
				<Button
					icon='pi pi-pencil'
					className='p-button-rounded p-button-success mr-2'
					onClick={() => editShelf(rowData)}
				/>
				<Button
					icon='pi pi-trash'
					className='p-button-rounded p-button-warning'
					onClick={() => confirmDeleteShelf(rowData)}
				/>
			</React.Fragment>
		);
	};

	const rightToolbarTemplate = () => {
		return (
			<React.Fragment>
				<FileUpload
					mode='basic'
					name='demo[]'
					auto
					url='https://primefaces.org/primereact/showcase/upload.php'
					accept='.csv'
					chooseLabel='Import'
					className='mr-2 inline-block'
					onUpload={importCSV}
				/>
				<Button
					label='Export'
					icon='pi pi-upload'
					className='p-button-help'
					onClick={exportCSV}
				/>
			</React.Fragment>
		);
	};

	const header = (
		<div className='table-header'>
			<h5 className='mx-0 my-1'>Manage the Virtual Shelves</h5>
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

	const shelfDialogFooter = (
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
				onClick={saveShelf}
			/>
		</>
	);

	const deleteShelfDialogFooter = (
		<>
			<Button
				label='No'
				icon='pi pi-times'
				className='p-button-text'
				onClick={hideDeleteShelfDialog}
			/>
			<Button
				label='Yes'
				icon='pi pi-check'
				className='p-button-text'
				onClick={deleteShelf}
			/>
		</>
	);

	const deleteShelvesDialogFooter = (
		<>
			<Button
				label='No'
				icon='pi pi-times'
				className='p-button-text'
				onClick={hideDeleteShelvesDialog}
			/>
			<Button
				label='Yes'
				icon='pi pi-check'
				className='p-button-text'
				onClick={deleteSelectedShelves}
			/>
		</>
	);

	return (
		<div className='shelves-table'>
			<Toast ref={toast} />
			<div className='card'>
				<Toolbar
					className='mb-4'
					left={leftToolbarTemplate}
					right={rightToolbarTemplate}
				/>
				<DataTable
					ref={dt}
					value={shelves}
					selection={selectedShelves}
					onSelectionChange={(e) => setSelectedShelves(e.value)}
					dataKey='id'
					paginator
					rows={10}
					rowsPerPageOptions={[5, 10, 25]}
					paginatorTemplate='FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
					currentPageReportTemplate='Showing {first} to {last} of {totalRecords} shelves'
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
						field='description'
						header='Description'
						sortable
						style={{ minWidth: '16rem' }}></Column>
					<Column
						field='createdAt'
						header='Date created'
						sortable
						style={{ minWidth: '10rem' }}></Column>
					<Column
						body={actionBodyTemplate}
						exportable={false}
						style={{ minWidth: '8rem' }}></Column>
				</DataTable>
			</div>
			<Dialog
				visible={shelfDialog}
				style={{ width: '450px' }}
				header='Shelf Details'
				modal
				className='p-fluid'
				footer={shelfDialogFooter}
				onHide={hideDialog}>
				<div className='field'>
					<label htmlFor='description'>Description</label>
					<InputTextarea
						id='description'
						value={shelf.description}
						onChange={(e) => onInputChange(e, 'description')}
						required
						className={classNames({
							'p-invalid': submitted && !shelf.description,
						})}
						rows={3}
						cols={20}
					/>
					{submitted && !shelf.description && (
						<small className='p-error'>Description is required.</small>
					)}
				</div>
			</Dialog>
			<Dialog
				visible={deleteShelfDialog}
				style={{ width: '450px' }}
				header='Confirm'
				modal
				footer={deleteShelfDialogFooter}
				onHide={hideDeleteShelfDialog}>
				<div className='confirmation-content'>
					<i
						className='pi pi-exclamation-triangle mr-3'
						style={{ fontSize: '2rem' }}
					/>
					{shelf && (
						<span>
							Are you sure you want to delete shelf with id <b>{shelf.id}</b>?
						</span>
					)}
				</div>
			</Dialog>

			<Dialog
				visible={deleteShelvesDialog}
				style={{ width: '450px' }}
				header='Confirm'
				modal
				footer={deleteShelvesDialogFooter}
				onHide={hideDeleteShelvesDialog}>
				<div className='confirmation-content'>
					<i
						className='pi pi-exclamation-triangle mr-3'
						style={{ fontSize: '2rem' }}
					/>
					{shelf && (
						<span>Are you sure you want to delete the selected shelves?</span>
					)}
				</div>
			</Dialog>
		</div>
	);
};

export default ShelvesTable;
