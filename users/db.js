const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const {DB_PATH} = require('./config');

class DatabaseWrapper {
    constructor() {
        this.init = new Promise(((resolve, reject) => {
            this._db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) console.error(err);
                this._promisifiedRun(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT, password TEXT);`)
                    .then(resolve).catch(reject);
            });
        }));
    }

    _promisifiedDbFun(fun) {
        return (stmt, paramsValues) =>
            util.promisify(fun).bind(this._db)(stmt, paramsValues);
    }

    _promisifiedRun(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.run)(stmt, paramsValues);
    }

    _promisifiedGet(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.get)(stmt, paramsValues);
    }

    _promisifiedAll(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.all)(stmt, paramsValues);
    }

    getUsersByName(username) {
        const stmt = 'SELECT * FROM users WHERE username=?';
        return this._promisifiedAll(stmt, [username]);
    }
    
    getUserById(id) {
      const stmt = 'SELECT id, username FROM users WHERE id=?';
      return this._promisifiedGet(stmt, [id]);
    }
    
    createUser(username, password) {
        const stmt = 'INSERT INTO users (username, password) VALUES (?, ?);';
        return this._promisifiedRun(stmt, [username, password]);
    }
    
    getAllUsers() {
        const stmt = 'SELECT id, username from users';
        return this._promisifiedAll(stmt);
    }
}

module.exports = DatabaseWrapper;
