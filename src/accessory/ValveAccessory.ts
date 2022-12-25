import { Service } from 'homebridge';
import { TuyaDeviceSchema, TuyaDeviceSchemaIntegerProperty, TuyaDeviceSchemaType } from '../device/TuyaDevice';
import { limit } from '../util/util';
import BaseAccessory from './BaseAccessory';
import { configureActive } from './characteristic/Active';

const SCHEMA_CODE = {
  ON: ['switch', 'switch_1'],
};

export default class ValveAccessory extends BaseAccessory {

  requiredSchema() {
    return [SCHEMA_CODE.ON];
  }

  configureServices(): void {
    const oldService = this.accessory.getService(this.Service.Valve);
    if (oldService && oldService?.subtype === undefined) {
      this.platform.log.warn('Remove old service:', oldService.UUID);
      this.accessory.removeService(oldService);
    }

    const schema = this.device.schema.filter((schema) => schema.code.startsWith('switch') && schema.type === TuyaDeviceSchemaType.Boolean);
    for (const _schema of schema) {
      const suffix = _schema.code.replace('switch', '');
      const name = (schema.length === 1) ? this.device.name : _schema.code;

      const service = this.accessory.getService(_schema.code)
        || this.accessory.addService(this.Service.Valve, name, _schema.code);

      service.setCharacteristic(this.Characteristic.Name, name);
      if (!service.testCharacteristic(this.Characteristic.ConfiguredName)) {
        service.addOptionalCharacteristic(this.Characteristic.ConfiguredName); // silence warning
        service.setCharacteristic(this.Characteristic.ConfiguredName, name);
      }

      // Required Characteristics
      configureActive(this, service, _schema);
      this.configureInUse(service, _schema);
      service.setCharacteristic(this.Characteristic.ValveType, this.Characteristic.ValveType.IRRIGATION);

      // Optional Characteristics
      this.configureSetDuration(service, this.getSchema('countdown' + suffix));

    }
  }

  configureInUse(service: Service, schema: TuyaDeviceSchema) {
    const { NOT_IN_USE, IN_USE } = this.Characteristic.InUse;
    service.getCharacteristic(this.Characteristic.InUse)
      .onGet(() => {
        const status = this.getStatus(schema.code)!;
        return status.value ? IN_USE : NOT_IN_USE;
      });
  }

  configureSetDuration(service: Service, schema?: TuyaDeviceSchema) {
    if (!schema) {
      return;
    }

    const property = schema.property as TuyaDeviceSchemaIntegerProperty;
    const multiple = Math.pow(10, property ? property.scale : 0);
    const props = {
      minValue: Math.max(0, property.min / multiple),
      maxValue: Math.min(3600, property.max / multiple),
      minStep: Math.max(1, property.step / multiple),
    };
    this.log.debug('Set props for SetDuration:', props);

    service.getCharacteristic(this.Characteristic.SetDuration)
      .onGet(() => {
        const status = this.getStatus(schema.code)!;
        return limit(status.value as number / multiple, props.minValue, props.maxValue);
      })
      .onSet(value => {
        const duration = (value as number) * multiple;
        this.sendCommands([{ code: schema.code, value: duration }]);
      });
  }

}
