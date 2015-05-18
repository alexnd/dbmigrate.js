# dbmigrate.js

DB migrations utility from nodejs

For now only SQLite support

This script contains of 3 key vars:

**```m```** - map of all available atomic db changes, ie *targets* ( ```target_id : Array/String/Object def``` )

**```migrations```** - map of enabled targets ( ```target_id : Boolean status``` )

**```migration()```** - entrypoint to run, takes optional 1 param

## Usage ##

Create targets:

```
m.foo = [
"QUERY1",
"QUERY2",
...
];

m.baz = ...
```

Set current active targets:

```
var migrations = {
	'foo' : true,
	'baz' : false,
...
};
```

Run

```
node dbmigrate.js
```

## Advanced targets ##

Migration target can be one of 3 types:

* String - 1 SQL query
* Array - Chain of SQL queries
* Object - another migration, where special 'instructions' determined (following in priority order):
  - **q0** - SQL (string/array), or migration (object)
  - **before** - migration id (string), or migration (object)
  - **q** - SQL (string/array), or migration (object)
  - **q1** - SQL (string/array), or migration (object)
  - **middle** - migration id (string), or migration (object)
  - **q2** - SQL (string/array), or migration (object)
  - **after** - migration id (string), or migration (object)
  - **q3** - SQL (string/array), or migration (object)

Example:

```
m.bz = {
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
```

You can run **migration()** in few modes:

 * ```migration()``` - run all enabled targets defined in **migrations**
 * ```migration('t1')``` - run only one target *m.t1*
 * ```migration(['t1','t2'])``` - run list of targets (*m.t1, m.t2*)
 * ```migration({before:{before:'t1', q:['SQL']}, q:['SQL'], after:'t2'})``` - run inline migration

To configure path to SQLite file, there ```cfg``` var performed:

```cfg = {'db_filename': 'path/to/file.db'};```

or, it can be external def, loaded from js file:

```var cfg = require('./cfg');```

(c) 2015 Alexander Melanchenko <info@alexnd.com>
