var migration = {
	type: 'sqlite',
	sqlite: {
		db_filename : './test.db'
	},
	migrations : {
		// targets go here...
		users : [
		  "CREATE TABLE IF NOT EXISTS users (" +
			" id INTEGER PRIMARY KEY," +
			" login VARCHAR(24) UNIQUE," +
			" email VARCHAR(64) UNIQUE," +
			" name VARCHAR(64) UNIQUE," +
			" fp VARCHAR(24) UNIQUE," +
			" password VARCHAR(32)," +
			" group_id INTEGER," +
			" created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL," +
			" state INTEGER)"
		],
		users_mod : 'SELECT CURRENT_TIMESTAMP',
		foo : {
		  	//q0
			before:{q:[
				"ALTER TABLE chat_messages RENAME TO chat_messages2"
			]},
			//q: [],
			//q1
			middle:'chat',
			//q2: [],
			after: {q:[
				"CREATE TEMP TABLE v_messages AS"+
				" SELECT M.id,U.id AS user_id,NULL AS to_user_id,NULL AS origin_id,M.message,M.created,M.ts,0 AS state FROM chat_messages2 AS M"+
				" JOIN users AS U ON M.user_id=U.login",
				"INSERT INTO chat_messages SELECT * FROM v_messages",
				"DROP TABLE chat_messages2"
			]},
			q3: {before:'users_mod'}
		}
	},
	scope: {
		'users' : false,
		'users_mod' : true,
		'foo' : false,
	}
};

module.exports = migration;