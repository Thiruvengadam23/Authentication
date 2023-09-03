const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DataBase error ${e.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

app.listen(3000, () => {
  console.log("Server is running");
});

//CREATE NEW USER

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  let dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    if (password.length > 4) {
      const newUserQuery = `INSERT INTO 
      user (username,name,password,gender,location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}',
            );`;
      await db.run(newUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//POST LOGIN

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userExistQuery = `SELECT * FROM user WHERE username='${username}'`;
  const userExist = await db.get(userExistQuery);
  if (userExist === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, userExist.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//CHANGE PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const checkUser = await db.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      checkUser.password
    );
    if (isPasswordMatch === true) {
      if (newPassword.length > 4) {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user
                SET password='${newHashedPassword}'
                WHERE username='${username}'`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
