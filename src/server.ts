import app from "./app";
import { initDB } from "./db";
import { config } from "./config";

const main = async () => {
  await initDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`)
  });

}


// Start the server
// eslint-disable-next-line @typescript-eslint/no-floating-promises
// eslint-disable-next-line @typescript-eslint/no-misused-promises

main()