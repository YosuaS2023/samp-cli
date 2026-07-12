const chalkModule = require('chalk');

const chalk = chalkModule.default || chalkModule;

const logger = {
  info: (msg) => console.log(chalk.blue ? chalk.blue(`[INFO] `) + msg : `[INFO] ${msg}`),
  success: (msg) => console.log(chalk.green ? chalk.green(`[SUCCESS] `) + msg : `[SUCCESS] ${msg}`),
  warn: (msg) => console.log(chalk.yellow ? chalk.yellow(`[WARN] `) + msg : `[WARN] ${msg}`),
  error: (msg) => console.error(chalk.red ? chalk.red(`[ERROR] `) + msg : `[ERROR] ${msg}`),
  log: (msg) => console.log(msg)
};

module.exports = { logger };