import { PlatformConfig } from 'homebridge';

export interface TuyaPlatformCustomConfigOptions {
  projectType: '1';
  endpoint: string;
  accessId: string;
  accessKey: string;
}

export interface TuyaPlatformHomeConfigOptions {
  projectType: '2';
  endpoint: string;
  accessId: string;
  accessKey: string;
}

export type TuyaPlatformConfigOptions = TuyaPlatformCustomConfigOptions | TuyaPlatformHomeConfigOptions;

export interface TuyaPlatformConfig extends PlatformConfig {
  options: TuyaPlatformConfigOptions;
}

export const customOptionsSchema = {
  properties: {
    endpoint: { type: 'string', format: 'url', required: true },
    accessId: { type: 'string', required: true },
    accessKey: { type: 'string', required: true },
  },
};

export const homeOptionsSchema = {
  properties: {
    endpoint: { type: 'string', format: 'url', required: true },
    accessId: { type: 'string', required: true },
    accessKey: { type: 'string', required: true },
  },
};
