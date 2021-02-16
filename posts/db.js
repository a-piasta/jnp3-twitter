const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const DB_PATH = config.paths;

class DatabaseWrapper {
    constructor() {
        this.init = new Promise(((resolve, reject) => {
            this._db = [];
            this._db[0] = new sqlite3.Database(DB_PATH[0], (err) => {
                if (err) console.error(err);
                this._promisifiedRun(0, 'CREATE TABLE IF NOT EXISTS posts (user_id INTEGER, title TEXT, message TEXT);')
                    .then(resolve).catch(reject);
            });
            this._db[1] = new sqlite3.Database(DB_PATH[1], (err) => {
                if (err) console.error(err);
                this._promisifiedRun(1, 'CREATE TABLE IF NOT EXISTS posts (user_id INTEGER, title TEXT, message TEXT);')
                    .then(resolve).catch(reject);
            });
        }));
    }

    _promisifiedDbFun(num, fun) {
        return (stmt, paramsValues) =>
            util.promisify(fun).bind(this._db[num])(stmt, paramsValues);
    }

    _promisifiedRun(num, stmt, paramsValues=[]) {
        return this._promisifiedDbFun(num, this._db[num].run)(stmt, paramsValues);
    }

    _promisifiedGet(num, stmt, paramsValues=[]) {
        return this._promisifiedDbFun(num, this._db[num].get)(stmt, paramsValues);
    }

    _promisifiedAll(num, stmt, paramsValues=[]) {
        return this._promisifiedDbFun(num, this._db[num].all)(stmt, paramsValues);
    }
    
    createPost(post) {
        const stmt = 'INSERT INTO posts (user_id, title, message) VALUES (?, ?, ?);';
        return this._promisifiedRun(post.user % 2, stmt, [post.user, post.title, post.message]);
    }
    
    getPostsByUser(id) {
        const stmt = 'SELECT title, message FROM posts WHERE user_id=?;';
        return this._promisifiedAll(id % 2, stmt, [id]);
    }
}

module.exports = DatabaseWrapper;
