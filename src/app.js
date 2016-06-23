import * as Path from "path";
import * as Hapi from "hapi";
import * as Inert from "inert";
import * as Vision from "vision";
import * as Jade from "Jade";
import {serverRoutes as serverRoutes} from "../lib/myRoute";
import {initServer as initServer} from "../lib/myServer";

const server = new Hapi.Server ();
server.connection ({port: process.env.PORT || 3000});

/** Static files support*/
server.register (Inert, (err) => {
  if (err) {
    throw err;
  }
});

/** Add templates rendering support by vision plugin*/
server.register (Vision, (err) => {
  if (err) {
    throw err;
  }

  /** Enables Jade*/
  server.views ({
    /** Registers the Jade as responsible for rendering of .jade files*/
    engines: {
      jade: Jade
    },
    /** Shows server where templates are located in */
    path: __dirname + "/views",
    /** For correct page rendering: https://github.com/hapijs/vision#jade */
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

  initServer (server.listener, function () {
    /** Callback after my server's running */
    console.log ("SERVER: app running at ", server.info.uri);
  });
});

export {server}
