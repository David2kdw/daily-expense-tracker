import { Server } from "./rest/Server.js";

export class App {
  async initServer(port) {
    Log.info(`App::initServer( ${port} ) - start`);
    const server = new Server(port);
    try {
      await server.start();
      Log.info(`App::initServer() - server running on port ${port}`);
    } catch (err) {
      Log.error(`App::initServer() - ERROR: ${err.message}`);
    }
  }
}

// bootstrap
const port = Number(process.env.PORT) || 4321;
Log.info("App - starting");
(new App()).initServer(port);