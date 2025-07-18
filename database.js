"use strict";
import sqlite3 from 'better-sqlite3';
import bcrypt from 'bcrypt';

let database = {

	init: function(){

		try {

			const db = new sqlite3('./data/data.db');
			db.exec(`CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				is_admin INTEGER NOT NULL DEFAULT 0
			)`);

			// Address table: addr is globally unique, each address belongs to a user
			db.exec(`CREATE TABLE IF NOT EXISTS address (
				addr TEXT NOT NULL UNIQUE,
				user_id INTEGER NOT NULL,
				keep INTEGER NOT NULL DEFAULT 0,
				FOREIGN KEY(user_id) REFERENCES users(id)
			)`);

			let res = db.prepare("SELECT COUNT(*) as count FROM address").get();

			if (res.count == 0){
				//generate random username for the first user (admin)
				const letters = 'abcdefghijklmnopqrstuvwxyz';
				let uname = '';
				for (let i = 0; i < 3; i++) {
					const randomIndex = Math.floor(Math.random() * letters.length);
					uname += letters[randomIndex];
				}
				uname += Math.floor(Math.random() * 10).toString();
				uname += Math.floor(Math.random() * 10).toString();
				const admin = this.getUserByUsername(db, 'admin');
				if (admin) {
					db.prepare("INSERT INTO address (addr, user_id) VALUES (?, ?)").run(uname, admin.id);
				}
			}

			db.exec("CREATE TABLE IF NOT EXISTS mail (id TEXT NOT NULL, recipient TEXT NOT NULL, sender TEXT NOT NULL, subject TEXT NOT NULL, content TEXT NOT NULL)");

			return db;

		} catch(err) {

			console.log("DB init fail")
			console.log(err);
			process.exit();

		}

	},

	createUser: function(db, username, password, is_admin = 0) {
		const hash = bcrypt.hashSync(password, 10);
		try {
			db.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)").run(username, hash, is_admin);
			return true;
		} catch (err) {
			console.log("Create user error", err);
			return false;
		}
	},

	getUserByUsername: function(db, username) {
		return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
	},

	getUserById: function(db, id) {
		return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
	},

	checkPassword: function(user, password) {
		return bcrypt.compareSync(password, user.password_hash);
	},

	ensureDefaultAdmin: function(db) {
		// No-op: admin is now handled via config, not database
	},

	// Address helpers
	addAddress: function(db, addr, user_id, keep = 0) {
		try {
			db.prepare("INSERT INTO address (addr, user_id, keep) VALUES (?, ?, ?)").run(addr, user_id, keep);
			return true;
		} catch (err) {
			return false;
		}
	},
	getAddressesByUser: function(db, user_id) {
		return db.prepare("SELECT addr, keep FROM address WHERE user_id = ?").all(user_id);
	},
	setAddressKeep: function(db, addr, user_id, keep) {
		return db.prepare("UPDATE address SET keep = ? WHERE addr = ? AND user_id = ?").run(keep, addr, user_id);
	},
	deleteAddress: function(db, addr, user_id) {
		return db.prepare("DELETE FROM address WHERE addr = ? AND user_id = ?").run(addr, user_id);
	},
	addressExists: function(db, addr) {
		return db.prepare("SELECT 1 FROM address WHERE addr = ?").get(addr) !== undefined;
	},
	deleteMailsForAddress: function(db, addr) {
		return db.prepare("DELETE FROM mail WHERE recipient = ?").run(addr);
	},
	getInactiveAddresses: function(db, days = 7) {
		const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
		return db.prepare(`
			SELECT a.addr, a.user_id FROM address a
			WHERE a.keep = 0 AND NOT EXISTS (
				SELECT 1 FROM mail m WHERE m.recipient = a.addr AND CAST(substr(m.id, 1, 13) AS INTEGER) > ?
			)
		`).all(cutoff);
	}

}

export default database;
