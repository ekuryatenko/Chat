import * as Path from "path";
import * as Hapi from "hapi";
import * as Inert from "inert";
import * as Vision from "vision";
import * as Pug from "pug";
import {serverRoutes as serverRoutes} from "./myRoute";
import {initServer as initServer} from "./myServer";

const server = new Hapi.Server ();

server.connection({port: process.env.PORT});

// Static files support
server.register (Inert, (err) => {
  if (err) {
    throw err;
  }
});

// Adds templates rendering support by vision plugin
server.register (Vision, (err) => {
  if (err) {
    throw err;
  }

  // Enables Pug
  server.views ({
    // Registers the Pug as responsible for rendering of .pug files
    engines: {
      pug: Pug
    },
    // Shows server where templates are located in
    path:  __dirname + "/views",
    // For correct page rendering: https://github.com/hapijs/vision#jade
    compileOptions: {
      pretty: true
    }
  });
});

server.route (serverRoutes);

server.start ((err) => {
  if (err) {
    throw err;
  }

  initServer (server.listener, () => {
    // Callback after my server's running
    console.log ("SERVER: app running at ", server.info.uri);
  });
});
