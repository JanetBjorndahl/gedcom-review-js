# GEDCOM review client

## Install Vue
```
npm install vue
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
First, sign into WeRelate and get the values of three cookies:
* wikidb_session
* wikidbUser
* wikidbUserName

and copy them into vue.config.js.

Next
```
npm run serve
```

### Deploy
```
npm run build
scp -r dist/* admin@<IP>:gedcom-review-js
ssh admin@<IP>
sudo cp -r ~/gedcom-review-js/* /var/www/html/gedcom-review/
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
