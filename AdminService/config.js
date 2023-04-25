module.exports = {
    port: process.env.PORT || 6001,
    dbAccess: "local",
    database: {
      server: {
        username: "",
        password: "",
        authDb: "admin",
        port: 35000,
        host: "",
        dbName: "",
      },
      local: {
        port: 27017,
        host: "localhost",
        dbName: "scalableAssignment",
      },
    },
    secret: "hyrgqwjdfbw4534efqrwer2q38945892",
    dev_mode: true
  };
  