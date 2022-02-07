import './Layout.css';

const Layout = (props) => {
	return (
		<div className='container'>
			<nav>
				<h1 className='heading'>Books management app</h1>
			</nav>
			<main>{props.children}</main>
		</div>
	);
};

export default Layout;
