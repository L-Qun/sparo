import { Sparo, type ILaunchOptions } from 'sparo-lib';
import { SparoPackage } from './SparoPackage';

process.exitCode = 1;

const launchOptions: ILaunchOptions = {
  callerPackageJson: SparoPackage._sparoPackageJson
};

Sparo.launchSparoAsync(launchOptions)
  .then(() => {
    process.exitCode = 0;
  })
  .catch(console.error);
