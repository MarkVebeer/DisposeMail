"use strict";
import smtpSrv from './smtpSrv.js'
import httpSrv from './httpSrv.js'
import config from './config.js'
import database from './database.js'

config.init();
let db = database.init();
database.ensureDefaultAdmin(db);
let domainName = config.getConfig('DomainName');
let httpPort = config.getConfig('HttpPort') || 80;

smtpSrv.start(db, 25);
httpSrv.start(db, domainName, httpPort);

function cleanupInactiveAddresses() {
  const inactive = database.getInactiveAddresses(db, 7);
  for (const addr of inactive) {
    database.deleteMailsForAddress(db, addr.addr);
    database.deleteAddress(db, addr.addr, addr.user_id);
    console.log(`Auto-deleted inactive address: ${addr.addr}`);
  }
}
setInterval(cleanupInactiveAddresses, 24 * 60 * 60 * 1000); // Run daily
cleanupInactiveAddresses(); // Run once on startup
