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
                this._promisifiedRun(0, 'CREATE TABLE IF NOT EXISTS follows (id INTEGER, followed_id INTEGER);')
                    .then(resolve).catch(reject);
            });
            this._db[1] = new sqlite3.Database(DB_PATH[1], (err) => {
                if (err) console.error(err);
                this._promisifiedRun(1, 'CREATE TABLE IF NOT EXISTS follows (id INTEGER, followed_id INTEGER);')
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

    getFriendsById(userId) {
        const stmt = 'SELECT followed_id FROM follows WHERE id=?';
        return this._promisifiedAll(userId % 2, stmt, [userId]);
    }
    
    follow(user, followedUser) {
        followedUser = +followedUser;
        const stmt = `INSERT INTO follows (id, followed_id)
            SELECT ?, ? WHERE NOT EXISTS (SELECT * FROM follows WHERE id=? AND followed_id=?)`;
        return this._promisifiedRun(user % 2, stmt, [user, followedUser, user, followedUser]);
    }
    
    unfollow(user, followedUser) {
        followedUser = +followedUser;
        const stmt = 'DELETE FROM follows WHERE id=? AND followed_id=?';
        return this._promisifiedRun(user % 2, stmt, [user, followedUser]);
    }
}

module.exports = DatabaseWrapper;
