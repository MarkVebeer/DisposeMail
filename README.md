# Nortix Mail
Please star this repo if you find it useful, thank you!
![image](https://github.com/user-attachments/assets/625d9d45-75e9-43f5-8264-57d2ed7ee7d8)

# Purpose 🎯
Whenever you sign up with your email on a website, your email address is stored and sometimes sold to advertisers. This is where you get your bulk of spam emails. Whenever a data breach happens, you also risk having your primary email address leaked and informations stolen.

Using Nortix Mail, you can create disposable email addresses that can be used to sign up to website that requires email verification. This is very useful when you just want to try out new website / services without giving away your real email address. It significantly enhances privacy, security and reduces spam. It's like running your own Gmail server.

# Why it's better than other similar services ⚡
Email servers are notoriously difficult to set up, Nortix Mail aims to make it as simple as possible by making TLS optional and it can automatically detect your domain if you choose to use TLS. If you change your domain, it can automatically detect it and requires no additional configuration. If you want to move the data to another server, just copy the `data` folder.

# Run without docker 🖥️
1. make sure that nodejs & npm is installed
2. run `npm install`
4. run `cd front`
5. run `npm install`
6. run `npm run build`
7. run `cd ..`
8. run `node main.js`

or use the combined command: `npm install && cd front && npm install && npm run build && cd .. && node main.js`  
The http server will be listening on port 80. Make sure that your port 25 is accessible to receive mails

# Run with docker 🐋
1. git clone / download this repo
2. run `docker compose up -d`

In the `docker-compose.yaml` file, port `25:25` is mapped by default. It is recommended to not change this setting if you are using a reverse proxy as some of them cannot forward smtp packets

# Configurations
You can edit `config.json` inside `data/config.json` to change the mail refresh interval, number of emails shown per page, and the domain name used by the service. Set your domain by editing the `DomainName` field.

# Adding TLS / Encryption (optional) 🔒
TLS/SSL certificates are no longer required or used for domain detection. If you wish to add encryption, you must manually configure your reverse proxy or SMTP relay to handle TLS.

# Is it safe if I don't use TLS? 🔍
The current mail transfer protocol is very old and by default it doesn't require TLS to function. This means that when another server sends an email to your server, anyone in between can theoretically read the mail if they actively try to intercept. However, this is unlikely to happen as the people who have this capability are mostly ISPs and hosting providers. For better security, setting up TLS is still recommended.

# Contributing 🤝
This repository currently doesn't accept any pull request. However, you can open an issue if you want to request a feature, report bugs or ask me a question.
