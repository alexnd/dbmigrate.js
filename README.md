# dbmigrate.js

DB migrations utility for nodejs

```npm i --save dbmigrate.js```

It keeps main principle - to be as simple as possible.
So, main two scenarios of use this module:
- import from **npm** then run ```dbmigrate``` method with custom argument
- create **npm target** for cli use like ```node ./node_modules/dbmigrate/dbmigrate.js``` and keep the running configuration in ```./migration.js```

Supports SQLite, MySQL(in progress)

This module does not solve up-and-down tracking task like [dbmigrate]( https://www.npmjs.com/package/dbmigrate). It just provide a way to run manually controlled maps of queries with filesystem parsing sql support.

## Main concepts ##

Migration target can be one of 3 types:

* String - 1 SQL query
* Array - Chain of SQL queries
* Object - another migration, where special 'instructions' determined (following in priority order):
  - **q0** - SQL (string/array), or migration (object)
  - **before** - migration id (string), or migration (object)
  - **q** - SQL (string/array), or migration (object)
  - **q1** - SQL (string/array), or migration (object)
  - **path** - special one - reads sql as string from file
  - **middle** - migration id (string), or migration (object)
  - **q2** - SQL (string/array), or migration (object)
  - **after** - migration id (string), or migration (object)
  - **q3** - SQL (string/array), or migration (object)

Example:

```
var migration = {
	//q0 - skip
	
	//(1) SQL will be run first
	before:{q:"ALTER TABLE chat_messages RENAME TO chat_messages2"},
	
	//skip
	//q: [],
	//q1
	
	//(2) second, run another migration - m.chat
	middle:'chat',
	
	//skip
	//q2: [],
	
	//(3) third, after m.chat run couple of queries...
	after: {q:[
		"CREATE TEMP TABLE v_messages AS"+
		" SELECT M.id,U.id AS user_id,NULL AS to_user_id,M.message,M.created,M.ts,0 AS state FROM chat_messages2 AS M"+
		" JOIN users AS U ON M.user_id=U.login",
		"INSERT INTO chat_messages SELECT * FROM v_messages",
		"DROP TABLE chat_messages2"
	]},
	
	//(4) last one, run final target
	q3: {before:'fooBar'}
};

var dbmigrate = require('dbmigrate.js');

dbmigrate(migration);
```

## Usage ##

You can run ```dbmigrate``` in few modes:

 * ```dbmigrate()``` - run all enabled targets defined in ```dbmigrate.cfg.migrations``` and enabled in ```dbmigrate.cfg.scope```
 * ```dbmigrate('t1')``` - run only one target *t1*
 * ```dbmigrate(['t1','t2'])``` - run list of targets (*m.t1, m.t2*)
 * ```dbmigrate({before:{before:'t1', q:['SQL']}, q:['SQL'], after:'t2'})``` - run inline migration

You can even leave ```dbmigrate``` var in memory and repeatedly run one or another target.

## Running as npm script ##

```node ./node_modules/dbmigrate/dbmigrate.js```

It reads ```./migration.js``` as configuration by default, argv support is good issue to be implemented in future.

## Target configuration object ##

This object contains the next key vars:

* ```migrations``` - map of all available atomic db changes, ie *targets* ( ```target_id : Array|String|Object``` )

Create targets:

```
migrations : {
	foo : [
		"QUERY1",
		"QUERY2",
		...
		]
	},
	baz : 'SQL...',
	...
```

* ```scope``` - map of currently enabled targets ( ```target_id : boolean``` )

Set current active targets:

```
scope : {
	'foo' : true,
	'baz' : false,
	...
};
```

* ```type```

To handle db connection you should set ```type``` with ```sqlite``` or ```mysql```, which you need also to install from **npm** as requirements to your package.json 

```
type : 'mysql|sqlite'
```

* Db-specific configuration objects:
```
mysql : Object
sqlite : Object
```

## MySQL ##

Install ```mysql``` as ```npm i --save mysql```

```
mysql : { host, user, password, ... } // see mysql module manual mysql.createConnection for details
```

See [doc](https://dev.mysql.com/doc/) for mysql questions

## SQLite ##

Install ```sqlite3``` as ```npm i --save sqlite3```

To configure path to SQLite file, there ```sqlite``` var performed:

```
sqlite : {'db_filename': 'path/to/file.db'};
```

SQLite queries:
```
CREATE TABLE [IF NOT EXISTS] name ( col-name [type-name] [col-constraint], ... )

ALTER TABLE [db.]tbl ADD COLUMN col-name [type-name] [col-constraint] [forign-key-exp]
#  type-names:
#  - NULL. The value is a NULL value.
#  - INTEGER. The value is a signed integer, stored in 1, 2, 3, 4, 6, or 8 bytes depending on the magnitude of the value.
#  - REAL. The value is a floating point value, stored as an 8-byte IEEE floating point number.
#  - TEXT. The value is a text string, stored using the database encoding (UTF-8, UTF-16BE or UTF-16LE).
#  - BLOB. The value is a blob of data, stored exactly as it was input.
#  col-constraints:
#  - PRIMARY KEY [ASC | DESC] [AUTOINCREMENT]
#  - NOT NULL
#  - UNIQUE
#  - CHECK (expr)
#  - DEFAULT val [(expr)]
#  - COLLATE coll-name
ALTER TABLE [db.]tbl RENAME TO tbl2
```

Fill free to support this module, contact me ;)

(c) 2015-2017 Alexander Melanchenko http://alexnd.com
