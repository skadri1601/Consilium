import chalk from 'chalk';
import {
  updateConfig,
  getConfigValue,
  listConfig,
} from '../utils/config';

export function configSetCommand(key: string, value: string): void {
  try {
    updateConfig(key, value);
    console.log(chalk.green(`✓ Set ${key} = ${value}`));
  } catch (error: any) {
    console.error(chalk.red(`Failed to set config: ${error.message}`));
    process.exit(1);
  }
}

export function configGetCommand(key: string): void {
  try {
    const value = getConfigValue(key);
    if (value) {
      console.log(value);
    } else {
      console.log(chalk.yellow(`${key} is not set`));
    }
  } catch (error: any) {
    console.error(chalk.red(`Failed to get config: ${error.message}`));
    process.exit(1);
  }
}

export function configListCommand(): void {
  try {
    const config = listConfig();
    console.log(chalk.bold('\nConsilium Configuration:\n'));

    if (Object.keys(config).length === 0) {
      console.log(chalk.yellow('No configuration set.'));
      console.log(chalk.gray('\nSet config with:'));
      console.log(chalk.gray('  consilium config set apiKey "your-key"'));
      console.log(chalk.gray('  consilium config set apiUrl "http://localhost:4000"\n'));
      return;
    }

    for (const [key, value] of Object.entries(config)) {
      const display =
        key === 'apiKey' && typeof value === 'string' && value.length > 8
          ? `${value.slice(0, 8)}...${value.slice(-4)}`
          : value;
      console.log(`${chalk.cyan(key)}: ${display}`);
    }
    console.log();
  } catch (error: any) {
    console.error(chalk.red(`Failed to list config: ${error.message}`));
    process.exit(1);
  }
}
