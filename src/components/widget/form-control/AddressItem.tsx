import { AutoComplete, Form, Input, InputProps } from 'antd';
import { isString, upperFirst } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks';
import { CustomFormItemProps } from '../../../model';
import { isValidAddress } from '../../../utils';

export function AddressItem({ label, name, disabled, rules = [], ...rest }: CustomFormItemProps & InputProps) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    network,
  } = useApi();

  return (
    <Form.Item
      {...rest}
      name={name}
      label={isString(label) ? t(label) : label}
      rules={[
        { required: true },
        {
          validator(_, value) {
            return isValidAddress(value, network.name, true) ? Promise.resolve() : Promise.reject();
          },
          message: t('Please enter a valid {{network}} address', { network: upperFirst(network.name) }),
        },
        ...rules,
      ]}
    >
      <AutoComplete
        options={accounts.map((item) => ({ label: `${item.meta?.name} - ${item.address}`, value: item.address }))}
        placeholder={t('Enter or select one from these below')}
        disabled={disabled}
      >
        <Input size="large" disabled={disabled} />
      </AutoComplete>
    </Form.Item>
  );
}
