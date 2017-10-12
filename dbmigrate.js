/*
 * dbmigrate.js
 * db migrations utility for nodejs (SQLITE, MYSQL)
 * @author: Alexaner Melanchenko http://alexnd.com
 **/

"use strict";

var fs = require('fs');
var L = console.log.bind(console);
var connection = null;

function connect() {
	if (connection) return;
	connection = true;
	if (dbmigrate.cfg.type === 'sqlite') {
		dbmigrate.sqlite3 = require('sqlite3').verbose();
		dbmigrate.db = new sqlite3.Database(dbmigrate.cfg.sqlite.db_filename);
	} else if (dbmigrate.cfg.type === 'mysql') {
		dbmigrate.mysql = require('mysql');
		dbmigrate.db = dbmigrate.mysql.createConnection(dbmigrate.cfg.mysql);
		dbmigrate.db.connect();
	} else {
		console.log('*** type ' + dbmigrate.cfg.type + ' not implemented');
	}
}

function disconnect(cb) {
	if (dbmigrate.cfg.type === 'sqlite') {
		dbmigrate.db.close();
		cb && cb();
	} else if (dbmigrate.cfg.type === 'mysql') {
		dbmigrate.db.end(cb);
	}
}

function query(v, cb) {
	L('***', dbmigrate.cfg.type, 'query', v);
	if (dbmigrate.cfg.type === 'sqlite') {
		dbmigrate.db.run(v, cb);
	} else if (dbmigrate.cfg.type === 'mysql') {
		dbmigrate.db.query(v, function (error, results, fields) {
  			if (error) throw error;
  			console.log('*** results[0]', results[0]);
  			cb && cb();
		});
	} else {
		console.log('*** type ' + dbmigrate.cfg.type + ' not implemented');
	}
}

/*
 * dbmigrate()
 * dbmigrate('t1')
 * dbmigrate(['t1','t2'])
 * dbmigrate({before:{before:'t1', q:['SQL']}, q:['SQL'], after:'t2'})
 **/
function dbmigrate(v) {
	L('*** dbmigrate', v);
	if (typeof v !== 'undefined') {
		if (Object.prototype.toString.call(v) === '[object Array]') {
			for(var i=0; i<v.length; i++) run_q(v[i], v);
		} else if (v !== null && typeof v === 'object') {
			if (v.q0 !== undefined) run_q(v.q0, v);
			if (v.before !== undefined) dbmigrate(v.before);
			if (v.q !== undefined) run_q(v.q, v);
			if (v.q1 !== undefined) run_q(v.q1, v);
			if (v.middle !== undefined) dbmigrate(v.middle);
			if (v.path) run_q(fs.readFileSync(v.path, 'utf8'));
			if (v.q2 !== undefined) run_q(v.q2, v);
			if (v.after !== undefined) dbmigrate(v.after);
			if (v.q3 !== undefined) run_q(v.q3, v);
		} else if (typeof v === 'string' && typeof dbmigrate.cfg.scope[v] !== 'undefined') {
			run_q(dbmigrate.cfg.scope[v], v);
		}
	} else if (dbmigrate.cfg && dbmigrate.cfg.scope && dbmigrate.cfg.migrations) {
		for (var i in dbmigrate.cfg.scope) {
			if (dbmigrate.cfg.scope[i] && dbmigrate.cfg.migrations[i]) run_q(dbmigrate.cfg.migrations[i]);
		}
	}
}

function run_q(v, p) {
	if (Object.prototype.toString.call(v) === '[object Array]') {
		for(var i=0; i<v.length; i++) {
			if (typeof v[i] === 'string') {
				query(v[i]);
			} else if (Object.prototype.toString.call(v[i]) === '[object Array]') {
				run_q(v[i][j]);
			} else if (v[i] !== null && typeof v[i] === 'object') dbmigrate(v[i]);
		}
	} else if (v !== null && typeof v === 'object') {
		dbmigrate(v);
	} else if (typeof v === 'string') {
		query(v);
	} else if (typeof v === 'function') {
		v.call(null, p);
	}
}

//exports to module
if (typeof module == 'object' && module !== null) module.exports = function (cfg) {
    dbmigrate.cfg = cfg;
    dbmigrate.run_q = run_q;
    dbmigrate.disconnect = disconnect;
    connect();
    return dbmigrate;
};

//only for direct cli calls
if (require.main === module) {
	try {
		//TODO: parse argv
		dbmigrate.cfg = require('./migration');
		connect();
		if (dbmigrate.cfg.type === 'sqlite') {
			dbmigrate.db.serialize(function() {
				dbmigrate(dbmigrate.cfg);
			    disconnect(function() {
					if (!dbmigrate.cfg.keepalive) process.exit();
				});
			});
		} else {
			dbmigrate(dbmigrate.cfg);
			disconnect(function() {
				if (!dbmigrate.cfg.keepalive) process.exit();
			});
		}
	} catch (e) {
		if (undefined!==e.stack) console.log(e.stack);
		else if (undefined!==e.error) console.log(e.error);
		else if (undefined!==e.message) console.log(e.message);
		else console.log(e);	
	}
}
