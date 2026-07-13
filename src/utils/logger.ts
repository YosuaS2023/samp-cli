import chalk from 'chalk';

export const logger = {
  info: (msg: string): void => console.log(chalk.blue ? chalk.blue(`[INFO] `) + msg : `[INFO] ${msg}`),
  success: (msg: string): void => console.log(chalk.green ? chalk.green(`[SUCCESS] `) + msg : `[SUCCESS] ${msg}`),
  warn: (msg: string): void => console.log(chalk.yellow ? chalk.yellow(`[WARN] `) + msg : `[WARN] ${msg}`),
  error: (msg: string): void => console.error(chalk.red ? chalk.red(`[ERROR] `) + msg : `[ERROR] ${msg}`),
  log: (msg: string): void => console.log(msg)
};