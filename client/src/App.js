import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import ShelvesTable from './pages/ShelvesTable';
import BookTable from './pages/BooksTable';
import Layout from './components/Layout';

const App = (props) => {
	return (
		<Layout>
			<Switch>
				<Redirect path='/' exact to='/shelvestable' />
				<Route path='/shelvestable' exact>
					<ShelvesTable />
				</Route>
				<Route path='/shelfsbooks/:shelfId/books'>
					<BookTable />
				</Route>
				{/* <Route path='*'>
				<NotFound />
			</Route> */}
			</Switch>
		</Layout>
	);
};

export default App;
