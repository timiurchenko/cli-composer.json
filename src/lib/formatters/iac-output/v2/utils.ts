import chalk, { Chalk } from 'chalk';
import { SEVERITY } from '../../../snyk-test/common';

interface IacOutputColors {
  severities: SeverityColor;
  failure: Chalk;
  success: Chalk;
  info: Chalk;
  title: Chalk;
  suggestion: Chalk;
}

type SeverityColor = {
  [severity in SEVERITY]: Chalk;
};

export const colors: IacOutputColors = {
  severities: {
    critical: chalk.magenta,
    high: chalk.red,
    medium: chalk.yellow,
    low: chalk.white,
  },
  failure: chalk.red,
  success: chalk.green,
  info: chalk.white,
  title: chalk.white.bold,
  suggestion: chalk.gray,
};

export const contentPadding = ' '.repeat(2);
