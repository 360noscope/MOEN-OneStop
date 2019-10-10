const express = require("express");
const app = express(); // create express app

const fetch = require("node-fetch");
const redis = require("redis");

const client = redis.createClient(6379); //connect redis client with local instance.

// echo redis errors to the console
client.on("error", err => {
  console.log("Error " + err);
});

// get user list
app.get("/user-list", (req, res) => {
  const todoRedisKey = "user:userList";
  // Try fetching the result from Redis first in case we have it cached
  return client.get(todoRedisKey, (err, users) => {
    // If that key exists in Redis store
    if (users) {
      console.log("fetching data from cache-----");
      return res.json({ source: "cache", data: JSON.parse(users) });
    } else {
      // Key does not exist in Redis store
      console.log("fetching data from api-----");
      // Fetch directly from remote api
      fetch("https://jsonplaceholder.typicode.com/todos")
        .then(response => response.json())
        .then(users => {
          // Save the API response in Redis store, data expire time in 3600 seconds, it means one hour
          client.setex(todoRedisKey, 3600, JSON.stringify(users));

          // Send JSON response to client
          return res.json({ source: "api", data: users });
        })
        .catch(error => {
          // log error message
          console.log(error);
          // send error to the client
          return res.json(error.toString());
        });
    }
  });
});

// start express server at 3000 port
app.listen(3000, () => {
  console.log("Server listening on port: ", 3000);
});
