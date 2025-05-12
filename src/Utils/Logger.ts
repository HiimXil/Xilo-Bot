// Logger.ts
export class Logger {
  static info(message: string) {
    console.log(`${new Date().toLocaleString("fr-FR")} : [INFO] ${message}`);
  }

  static error(message: string) {
    console.error(`${new Date().toLocaleString("fr-FR")} : [ERROR] ${message}`);
  }

  static debug(message: string) {
    if (process.env.NODE_ENV !== "development") return;
    console.debug(`${new Date().toLocaleString("fr-FR")} : [DEBUG] ${message}`);
  }
}
