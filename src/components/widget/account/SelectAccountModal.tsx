import React from 'react';
import BaseIdentityIcon from '@polkadot/react-identicon';
import { Empty, Modal, Radio, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useApi, useAssets, useWallet } from '../../../hooks';
import { EllipsisMiddle } from '../EllipsisMiddle';
import { Account } from '../../../model';
import { PrettyAmount } from '../PrettyAmount';
import { fromWei, prettyNumber } from '../../../utils';
import { AccountName } from './AccountName';

type Props = {
  visible: boolean;
  defaultValue: string;
  title: React.ReactNode;
  footer: React.ReactNode;
  onSelect: (address: string) => void;
  onCancel: () => void;
};

const iconSize = 36;

const AccountWithIdentify = ({ value }: { value: Account }) => {
  const { assets } = useAssets(value.displayAddress);

  return (
    <>
      <BaseIdentityIcon
        theme="substrate"
        size={iconSize}
        className="mr-2 rounded-full border border-solid border-gray-100"
        value={value.displayAddress}
      />
      <span className="flex flex-col leading-5 overflow-hidden w-full">
        <div className="flex items-center justify-between">
          <AccountName account={value.displayAddress} />
          <Spin className="flex items-center" spinning={!assets.length} size="small">
            {assets.map((item, index) => (
              <React.Fragment key={item.token.symbol}>
                {index > 0 && <span className="inline-flex justify-center w-3">|</span>}
                <PrettyAmount amount={fromWei({ value: item.total }, prettyNumber)} />
                <span>{item.token.symbol}</span>
              </React.Fragment>
            ))}
          </Spin>
        </div>
        <EllipsisMiddle className="opacity-60 w-full" value={value.displayAddress} />
      </span>
    </>
  );
};

export const SelectAccountModal: React.FC<Props> = ({ visible, defaultValue, title, footer, onSelect, onCancel }) => {
  const { network } = useApi();
  const { accounts } = useWallet();
  const { t } = useTranslation();

  return (
    <Modal
      title={title}
      destroyOnClose
      visible={visible}
      onCancel={onCancel}
      bodyStyle={{
        maxHeight: '70vh',
        overflow: 'scroll',
      }}
      footer={footer}
    >
      {accounts?.length ? (
        <Radio.Group className="w-full" defaultValue={defaultValue} onChange={(event) => onSelect(event.target.value)}>
          {accounts.map((item) => (
            <Radio.Button
              value={item.address}
              key={item.address}
              className={`radio-list network-radio-button-${network.name}`}
            >
              <AccountWithIdentify value={item} />
            </Radio.Button>
          ))}
        </Radio.Group>
      ) : (
        <Empty description={t('You haven’t created an address yet, please create a address first.')} />
      )}
    </Modal>
  );
};
