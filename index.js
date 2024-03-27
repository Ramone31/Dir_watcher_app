
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path'); 
const fs = require('fs'); 
dotenv.config();
var bodyParser = require('body-parser')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;


const pool = new Pool({
  user: 'postgres',//change your username
    host: 'localhost',//change your host
    database: 'dir_watcher',//change your database name
    password: '3110',//your password
    port: 5432,//change your port no which database running port
});
console.log(__dirname)

let interval =  60000; // milliseconds(1minute)
let magicString = process.env.MAGIC_STRING || 'test';

let directory= process.env.directory||path.join(__dirname,'file_dir')

console.log('Monitored Directory:', directory);


async function monitorDirectory() {
  let startTime = new Date();

  try {

   

   
    //const { rows: [{ directory }] } = await pool.query('SELECT directory FROM path_configuration');

    // let directory= process.env.directory||path.join(__dirname,'file_dir')

    // console.log('Monitored Directory:', directory);

    const files = await fs.promises.readdir(directory);

   
    const previousTasks = await pool.query('SELECT * FROM task_monitor ORDER BY start_time DESC LIMIT 1');

    const previousFilesString = previousTasks.rows[0]?.files_added;
    console.log( previousFilesString)

let current_files = files.map((file) => path.basename(file));
let exist_files = [];

previousFilesString.forEach((element) => {
    exist_files.push(element.name);
});


let missing_file = exist_files.filter((element) => !current_files.includes(element));

let new_file = current_files.filter((element) => !exist_files.includes(element));

console.log(new_file)

let deletedFiles  = missing_file.map((fileName) => {
  return { name: fileName };
});

let addedFiles=new_file

    let totalMagicStringCount = 0;

    for (let file of files) {
      let filePath = path.join(directory, file);

      try {
        let fileContent = await fs.promises.readFile(filePath, 'utf8');
        totalMagicStringCount += (fileContent.match(new RegExp(magicString, 'g')) || []).length;
      
      } catch (error) {
        if (error) {
          console.log(error.message)
        } else {
         console.log("something went to wrong")
        }
      }
    }
    let addedFilesJson = addedFiles.map(file => ({ name: file }));

    let saveQuery = `INSERT INTO task_monitor (start_time, end_time, total_runtime, files_added, files_deleted, magic_string_occurrences, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    let saveValues = [startTime, 
      new Date(), 
      new Date() - startTime, 
      JSON.stringify(addedFilesJson),
      JSON.stringify(deletedFiles), 
      totalMagicStringCount, 
      'Success'];
    await pool.query(saveQuery, saveValues);

    console.log(`Task completed successfully. Magic string count: ${totalMagicStringCount}`);
  } catch (error) {
    console.error('Error during monitoring:', error);
  }
}


// app.post('/set_dir', async (req, res) => {
//   const { directory } = req.body;
//   if (!directory) {
//       return res.status(400).json({ error: 'Directory is required' });
//   }

//   try {
      
//      await pool.query('INSERT INTO path_configuration (directory) VALUES ($1) ON CONFLICT (id) DO UPDATE SET directory = $1', [directory]);
//       //console.log(`Directory updated: ${directory}`);
//       res.json({ message: 'Directory updated successfully' });
//   } catch (error) {
//       //console.error('Error updating directory:', error);
//       res.status(500).json({ error: 'Internal server error' });
//   }
// });



app.post('/set_dir', async (req, res) => {
  console.log(req.body,"LLL")
    const { directory } = req.body;
    if (!directory) {
        return res.status(400).json({ error: 'Directory is required' });
    }
  
    try {
      const envFilePath = '.env';

      let key='directory'

      let value=directory

  
      fs.readFile(envFilePath, 'utf8', (err, data) => {
          if (err) {
              console.error('Error reading .env file:', err);
              return;
          }
  
          const lines = data.split('\n');
  
         console.log(lines)
          let updatedContent = lines
              .map((line) => {
                  const [existingKey, existingValue] = line.split('=');
                  if (existingKey.trim() === key.trim()) {
                      return `${key}=${value}`;
                  }
                  return line;
              })
              .join('\n');
          fs.writeFile(envFilePath, updatedContent, 'utf8', (err) => {
              if (err) {
                  console.error('Error writing to .env file:', err);
                  return;
              }
              console.log(`Key '${key}' updated successfully with value '${value}' in .env file.`);
          });
      });
      
        res.json({ message: 'Directory updated successfully' });
    } catch (error) {
      
        res.status(500).json({ error: 'Internal server error' });
    }
  });


app.get('/tasks', async (req, res) => {
  let tasks = await pool.query('SELECT * FROM task_monitor');
  res.json(tasks.rows);
});


setInterval(monitorDirectory, interval);

app.listen(port, () => console.log(`Server listening on port ${port}`));
