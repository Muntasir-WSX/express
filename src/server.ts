import app from "./app";
import { initDB } from "./db";
import { config } from "./config";

const main = async () => {
  await initDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`)
  });

}


main()