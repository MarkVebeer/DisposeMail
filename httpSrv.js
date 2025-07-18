"use strict";
import express from 'express'
import compression from 'compression'
import config from './config.js'
import session from 'express-session'
import database from './database.js'
import bcrypt from 'bcrypt';

let mod = {

	start: function(db, domainName, port){

		const app = express();

		app.use(express.json());
		app.use(compression());
		app.use(express.static('./front/html/dist'));

		// Session setup
		app.use(session({
			secret: 'changeme-very-secret',
			resave: false,
			saveUninitialized: false,
			cookie: { secure: false } // set to true if using HTTPS
		}));

		let refreshInterval = config.getConfig("MailRefreshInterval");

		// Registration endpoint
		app.post('/register', (req, res) => {
			const { username, email, password } = req.body;
			if (!username || !email || !password) {
				return res.status(400).json({ error: 'Missing fields' });
			}
			if (database.getUserByUsername(db, username) || database.getUserByEmail(db, email)) {
				return res.status(409).json({ error: 'Username or email already exists' });
			}
			const ok = database.createUser(db, username, email, password, 0);
			if (ok) {
				return res.status(201).json({ success: true });
			} else {
				return res.status(500).json({ error: 'Failed to create user' });
			}
		});

		// Login endpoint
		app.post('/login', (req, res) => {
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({ error: 'Missing fields' });
			}
			// Admin login via config
			const adminUser = config.getConfig('AdminUsername');
			const adminPass = config.getConfig('AdminPassword');
			if (username === adminUser && password === adminPass) {
				// Simulate DB user object for session
				req.session.userId = 0;
				req.session.isAdmin = true;
				return res.json({ success: true, isAdmin: true });
			}
			// Normal user login
			const user = database.getUserByUsername(db, username);
			if (!user || !database.checkPassword(user, password)) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}
			req.session.userId = user.id;
			req.session.isAdmin = !!user.is_admin;
			return res.json({ success: true, isAdmin: !!user.is_admin });
		});

		// Logout endpoint
		app.post('/logout', (req, res) => {
			req.session.destroy(() => {
				res.json({ success: true });
			});
		});

		// /me endpoint for auth check
		app.post('/me', (req, res) => {
			if (!req.session.userId && !req.session.isAdmin) {
				return res.status(401).json({ error: 'Not authenticated' });
			}
			if (req.session.isAdmin && req.session.userId === 0) {
				// Return admin info as if it were a user
				return res.json({ id: 0, username: config.getConfig('AdminUsername'), isAdmin: true });
			}
			const user = database.getUserById(db, req.session.userId);
			if (!user) {
				return res.status(401).json({ error: 'Not authenticated' });
			}
			res.json({ id: user.id, username: user.username, isAdmin: !!user.is_admin });
		});

		app.post('/addresses', (req, res) => {
			if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
			try {
				let rows = database.getAddressesByUser(db, req.session.userId);
				res.json({addresses: rows, refreshInterval: refreshInterval});
			} catch(err) {
				console.log("DB get addresses fail")
				console.log(err)
			}
		});

		app.post('/domain', (req, res) => {

			if (domainName){

				return res.status(200).send(domainName);

			}else{

				return res.status(200).send(req.headers.host.split(':')[0]);

			}

		})

		app.post('/addAddress', (req, res) => {
			if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
			const json = req.body;
			try {
				if (database.addressExists(db, json.address)) {
					return res.status(200).send("exist");
				}
				const ok = database.addAddress(db, json.address, req.session.userId, json.keep ? 1 : 0);
				if (ok) {
					return res.status(200).send("done");
				} else {
					return res.status(500).send("fail");
				}
			} catch(err) {
				console.log("DB add addresses fail")
				console.log(err)
			}
		});

		app.post('/setAddressKeep', (req, res) => {
			if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
			const { address, keep } = req.body;
			try {
				database.setAddressKeep(db, address, req.session.userId, keep ? 1 : 0);
				return res.status(200).send("done");
			} catch(err) {
				console.log("DB set keep fail")
				console.log(err)
				return res.status(500).send("fail");
			}
		});

		app.post('/deleteAddress', (req, res) => {
			if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
			const json = req.body;
			try {
				database.deleteAddress(db, json.address, req.session.userId);
				database.deleteMailsForAddress(db, json.address);
				return res.status(200).send("done");
			} catch(err) {
				console.log("DB delete address fail")
				console.log(err)
			}
		});

		app.post('/deleteEmails', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);
				return res.status(200).send("done");

			} catch(err) {

				console.log("DB delete address fail")
				console.log(err)

			}

		})



		app.post('/mails', (req, res) => {

			const json = req.body;

			try {

				let rows = db.prepare("SELECT id, sender, subject FROM mail WHERE recipient = @recipient ORDER BY id DESC LIMIT @mailCount OFFSET (@page-1)*@mailCount").all({recipient: json.addr, page: json.page, mailCount: config.getConfig('MailCountPerPage')});
				res.json(rows);

			} catch(err) {

				console.log("DB get mails fail")
				console.log(err)

			}

		});

		app.post('/mailData', (req, res) => {

			const json = req.body;

			try {

				let rows = db.prepare("SELECT sender, subject, content FROM mail WHERE id = ?").all(json.id);
				res.json(rows[0])

			} catch(err) {

				console.log("DB get mail data fail")
				console.log(err)

			}

		});

		app.post('/deleteMail', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM mail WHERE id = ?").run(json.id);
				res.status(200).send();

			} catch(err) {

				console.log("DB delete mail fail")
				console.log(err)

			}

		})

		// Debug session endpoint
		app.get('/debug-session', (req, res) => {
			res.json({
				session: req.session,
				cookies: req.headers.cookie
			});
		});

		// Admin endpoints
		function requireAdmin(req, res, next) {
			if (!req.session.isAdmin) {
				return res.status(403).json({ error: 'Admin only' });
			}
			next();
		}

		app.post('/admin/users', requireAdmin, (_req, res) => {
			const users = db.prepare('SELECT id, username, is_admin FROM users').all();
			res.json({ users });
		});

		app.post('/admin/deleteUser', requireAdmin, (req, res) => {
			const { id } = req.body;
			if (!id) return res.status(400).json({ error: 'Missing user id' });
			try {
				// Delete all addresses and mails for this user
				const addresses = database.getAddressesByUser(db, id);
				for (const address of addresses) {
					database.deleteMailsForAddress(db, address.addr);
					database.deleteAddress(db, address.addr, id);
				}
				db.prepare('DELETE FROM users WHERE id = ?').run(id);
				res.json({ success: true });
			} catch (err) {
				res.status(500).json({ error: 'Failed to delete user' });
			}
		});

		app.post('/admin/changePassword', requireAdmin, (req, res) => {
			const { id, password } = req.body;
			if (!id || !password) return res.status(400).json({ error: 'Missing fields' });
			const hash = bcrypt.hashSync(password, 10);
			try {
				db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
				res.json({ success: true });
			} catch (err) {
				res.status(500).json({ error: 'Failed to change password' });
			}
		});

		app.post('/admin/registerUser', requireAdmin, (req, res) => {
			const { username, password, isAdmin } = req.body;
			if (!username || !password) {
				return res.status(400).json({ error: 'Missing fields' });
			}
			if (database.getUserByUsername(db, username)) {
				return res.status(409).json({ error: 'Username already exists' });
			}
			const ok = database.createUser(db, username, password, isAdmin ? 1 : 0);
			if (ok) {
				return res.status(201).json({ success: true });
			} else {
				return res.status(500).json({ error: 'Failed to create user' });
			}
		});

		app.use((err, req, res, next) => {
			console.error(err)
		});

		app.listen(port, () => {
			console.log('http server listening at port: ' + port);	
		})
		
	}

}


export default mod;
