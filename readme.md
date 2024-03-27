Dirwatcher is a Node.js application that watches a specified directory for changes and performs actions based on those changes.

1.use db.sql file for create table structure
2.change your database configuration in index.js file and install required npm packages using command npm i 
3.run the application using this command  -- node index.js
4.you can modify file directory using the url localhost:3000/set_dir  and the  payload be like {"directory":"your directory"} || directly replace your path in .env file directory key
5.You also replace the desired string in the.Env file in the MAGIC_STRING key.
