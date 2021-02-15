const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const {DB_PATH} = require('./config');

class DatabaseWrapper {
    constructor() {
        this.init = new Promise(((resolve, reject) => {
            this._db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) console.error(err);
                this._promisifiedRun('CREATE TABLE IF NOT EXISTS posts (user_id INTEGER, title TEXT, message TEXT);')
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
    
    createPost(post) {
        const stmt = 'INSERT INTO posts (user_id, title, message) VALUES (?, ?, ?);';
        return this._promisifiedRun(stmt, [post.user, post.title, post.message]);
    }
    
    getPostsByUser(id) {
        const stmt = 'SELECT title, message FROM posts WHERE user_id=?;';
        return this._promisifiedAll(stmt, [id]);
    }
}

module.exports = DatabaseWrapper;
