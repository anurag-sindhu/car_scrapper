# Recursively crawl popular blogging website https://medium.com using Node.js and harvest all
possible hyperlinks that belong to medium.com and store them in MYSQL

<MYSQL installed is required>

* check your mysql config in default.json config file
* npm i // to install project dependencies
* npm app.js // to run server, also, it will do all the formalities of mysql(creating schema and tables)

# DB
    # Mysql
        Note: 
            As soon as app.js runs (Fully Automate):
                1. Connection will be made (make sure right db config available in default.json)
                2. A Database of name 'test' will be created (Please change the name in default.json if any chance you already have the same schema in your machine)
                3. Tables will be created (list will be picked from default.json)
        
     



