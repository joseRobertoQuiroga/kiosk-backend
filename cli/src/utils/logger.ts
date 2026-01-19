// cli/src/utils/logger.ts
import chalk from 'chalk';

export const logger = {
  success: (message: string) => {
    console.log(chalk.green('✅ ' + message));
  },

  error: (message: string) => {
    console.log(chalk.red('❌ ' + message));
  },

  warning: (message: string) => {
    console.log(chalk.yellow('⚠️  ' + message));
  },

  info: (message: string) => {
    console.log(chalk.blue('ℹ️  ' + message));
  },

  header: (message: string) => {
    console.log('');
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(message));
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log('');
  },

  separator: () => {
    console.log(chalk.gray('─'.repeat(60)));
  },

  table: (title: string, data: Record<string, any>) => {
    console.log('');
    console.log(chalk.cyan.bold(title));
    logger.separator();
    Object.entries(data).forEach(([key, value]) => {
      console.log(`${chalk.gray(key + ':')} ${chalk.white(value)}`);
    });
    logger.separator();
    console.log('');
  },
};