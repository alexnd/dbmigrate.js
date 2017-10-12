var dbmigrate = require('./dbmigrate.js')({
	type: 'mysql',
	mysql: {
		host: 'localhost',
		user: 'root',
		password: 'rootroot',
		database: 'test'
	}
});

dbmigrate({path:'db.sql'});

//process.exit();