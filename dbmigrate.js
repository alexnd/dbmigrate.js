/*
 * dbmigrate.js
 * db migrations utility from nodejs (now only SQLITE support)
 * @author: Alexaner Melanchenko <info@alexnd.com>
 *
 * SQLITE QUERIES:
 *
 * CREATE TABLE [IF NOT EXISTS] name ( col-name [type-name] [col-constraint], ... )
 *
 * ALTER TABLE [db.]tbl ADD COLUMN col-name [type-name] [col-constraint] [forign-key-exp]
 *  type-names:
 *  - NULL. The value is a NULL value.
 *  - INTEGER. The value is a signed integer, stored in 1, 2, 3, 4, 6, or 8 bytes depending on the magnitude of the value.
 *  - REAL. The value is a floating point value, stored as an 8-byte IEEE floating point number.
 *  - TEXT. The value is a text string, stored using the database encoding (UTF-8, UTF-16BE or UTF-16LE).
 *  - BLOB. The value is a blob of data, stored exactly as it was input.
 *  col-constraints:
 *  - PRIMARY KEY [ASC | DESC] [AUTOINCREMENT]
 *  - NOT NULL
 *  - UNIQUE
 *  - CHECK (expr)
 *  - DEFAULT val [(expr)]
 *  - COLLATE coll-name
 * ALTER TABLE [db.]tbl RENAME TO tbl2
 **/

"use strict";

//quickfix the node env
//module.paths.push('/usr/local/lib/node_modules');
//module.paths.push('/usr/local/share/npm/lib/node_modules');
//module.paths.push('/usr/lib/node_modules');
//module.paths.push('/Users/root/AppData/Roaming/npm/node_modules');

var cfg = {'db_filename' : './test.db'};
//var cfg = require('./cfg');
var migrations = {
	'users' : false,
	'users_mod' : true,
	'foo' : false,
};

var m = {};

// targets go here...

m.users = [
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
];

m.users_mod = '';

m.foo = [
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
];

// implementation

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(cfg.db_filename);

/*
 * migration_run()
 * migration_run('t1')
 * migration_run(['t1','t2'])
 * migration_run({before:{before:'t1', q:['SQL']}, q:['SQL'], after:'t2'})
 **/
function migration(v) {
	if (undefined!==v) {
		if (Object.prototype.toString.call(v) === '[object Array]') {
			for(var i=0; i<v.length; i++) run_q(v[i], v);
		} else if (v !== null && 'object' == typeof v) {
			if (undefined!==v.q0) run_q(v.q0, v);
			if (undefined!==v.before) migration(v.before);
			if (undefined!==v.q) run_q(v.q, v);
			if (undefined!==v.q1) run_q(v.q1, v);
			if (undefined!==v.middle) migration(v.middle);
			if (undefined!==v.q2) run_q(v.q2, v);
			if (undefined!==v.after) migration(v.after);
			if (undefined!==v.q3) run_q(v.q3, v);
		} else if ('string' == typeof v && undefined!==m[v]) {
			run_q(m[v], v);
		}
	} else {
		for (var i in m) {
			if (undefined!==migrations[i] && migrations[i] && undefined!==m[i]) run_q(m[i]);
		}
	}
}

function run_q(v, p) {
	if (Object.prototype.toString.call(v) === '[object Array]') {
		for(var i=0; i<v.length; i++) {
			if ('string' == typeof v[i]) db.run(v[i]);
			else if (Object.prototype.toString.call(v[i]) === '[object Array]') {
				run_q(v[i][j]);
			} else if (v[i] !== null && 'object' == typeof v[i]) migration(v[i]);
		}
	} else if (v !== null && 'object' == typeof v) {
		migration(v);
	} else if ('string' == typeof v) {
		db.run(v);
	} else if ('function' == typeof v) {
		v.call(null, p);
	}
}

try {
	db.serialize( function() {
		migration();
	});
	db.close();
} catch (_) {
	if (undefined!==_.error) console.log(_);
	else if (undefined!==_.message) console.log(_.message);
	else console.log(_);
	if (undefined!==_.stack) console.log(_.stack);
}

//TODO: exports to module
