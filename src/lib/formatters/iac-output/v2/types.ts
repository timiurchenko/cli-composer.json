import { IacTestResponse } from '../../../snyk-test/iac-test-result';
import { IacFileInDirectory } from '../../../types';

export interface IacTestData {
  ignoreCount: number;
  results: IacTestResponse[];
  failures?: IacFileInDirectory[];
}

export type IaCTestFailure = {
  filePath: string;
  failureReason: string | undefined;
};
