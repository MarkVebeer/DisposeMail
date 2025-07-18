# DisposeMail, a Nortix Mail fork

# Run without docker 
1. make sure that nodejs & npm is installed
2. run `npm install`
4. run `cd front`
5. run `npm install`
6. run `npm run build`
7. run `cd ..`
8. run `node main.js`

or use the combined command: `npm install && cd front && npm install && npm run build && cd .. && node main.js`  
The http server will be listening on port 80(you can change that in config.json). Make sure that your port 25 is accessible to receive mails

# Run with docker  
(not tested since the fork and changes, if you have problems and you manange to fix the docker file make sure to PR)
1. git clone / download this repo
2. run `docker compose up -d`

In the `docker-compose.yaml` file, port `25:25` is mapped by default. It is recommended to not change this setting if you are using a reverse proxy as some of them cannot forward smtp packets

# Configurations
You can edit `config.json` inside `data/config.json` to change the http port, mail refresh interval, number of emails shown per page, and the domain name used by the service and the admin logins.

# Adding TLS / Encryption (optional) 
TLS/SSL certificates are no longer required or used for domain detection. If you wish to add encryption, you must manually configure your reverse proxy or SMTP relay to handle TLS.

# Is it safe if I don't use TLS? 
The current mail transfer protocol is very old and by default it doesn't require TLS to function. This means that when another server sends an email to your server, anyone in between can theoretically read the mail if they actively try to intercept. However, this is unlikely to happen as the people who have this capability are mostly ISPs and hosting providers. For better security, set up tls if you mind this XD.

# Contributing 
This repository accepts pull request. Feel free to contribute!
