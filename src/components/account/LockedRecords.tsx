import { Table, Progress, Button, Modal } from 'antd';
import { format } from 'date-fns';
import { useState, useCallback, useEffect } from 'react';
import { BN } from '@polkadot/util';
import type { Balance } from '@polkadot/types/interfaces';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';
import type { ColumnsType } from 'antd/lib/table';

import { DarwiniaAsset } from 'src/model';
import { useApi, useQueue, useStaking, useAssets } from '../../hooks';
import { DATE_FORMAT, THIRTY_DAYS_IN_MILLISECOND } from '../../config';
import { fromWei, prettyNumber, ringToKton, processTime, toWei } from '../../utils';
import type { DarwiniaStakingStructsTimeDepositItem, TsInMs } from '../../api-derive/types';

enum LockStatus {
  LOCKING,
  EXPIRED,
}

interface DataSourceState {
  index: number;
  value: Balance;
  reward: string;
  duration: {
    startTime: TsInMs;
    expireTime: TsInMs;
  };
  status: LockStatus;
}

const calcFine = (record: DataSourceState): string => {
  const {
    value,
    duration: { startTime, expireTime },
  } = record;

  const month = expireTime.sub(startTime.toBn()).div(new BN(THIRTY_DAYS_IN_MILLISECOND)).toNumber();

  const rewardOrigin = new BigNumber(ringToKton(value.toString(), month));
  const rewardMonth = Math.floor((new Date().getTime() - startTime.toNumber()) / THIRTY_DAYS_IN_MILLISECOND);
  const rewardActual = new BigNumber(ringToKton(value.toString(), rewardMonth));
  const times = 3;

  return fromWei({ value: rewardOrigin.minus(rewardActual).multipliedBy(times).toString() });
};

export const LockedRecords = ({
  locks,
  loading,
}: {
  locks: DarwiniaStakingStructsTimeDepositItem[];
  loading: boolean;
}) => {
  const { api, network } = useApi();
  const { queueExtrinsic } = useQueue();
  const { controllerAccount, stashAccount, updateStakingDerive } = useStaking();
  const { assets: stashAssets } = useAssets(stashAccount);
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState<DataSourceState[]>([]);

  const handleUnlockEarlier = useCallback(
    (record: DataSourceState) => {
      const extrinsic = api.tx.staking.tryClaimDepositsWithPunish(record.duration.expireTime);
      queueExtrinsic({
        signAddress: controllerAccount,
        extrinsic,
        txSuccessCb: () => {
          updateStakingDerive();
        },
      });
    },
    [api, controllerAccount, queueExtrinsic, updateStakingDerive]
  );

  useEffect(() => {
    setDataSource(
      locks.map((lock, index) => {
        const { value, startTime, expireTime } = lock;

        const month = expireTime
          .unwrap()
          .sub(startTime.unwrap().toBn())
          // eslint-disable-next-line no-magic-numbers
          .div(new BN(THIRTY_DAYS_IN_MILLISECOND))
          .toNumber();

        return {
          index,
          value: value.unwrap(),
          reward: ringToKton(value.unwrap().toString(), month),
          duration: {
            startTime: lock.startTime.unwrap(),
            expireTime: lock.expireTime.unwrap(),
          },
          status: expireTime.unwrap().toNumber() < Date.now() ? LockStatus.EXPIRED : LockStatus.LOCKING,
        };
      })
    );
  }, [locks]);

  const columns: ColumnsType<DataSourceState> = [
    {
      title: 'No.',
      key: 'index',
      dataIndex: 'index',
      width: '6%',
      align: 'center',
      render: (value) => value + 1,
    },
    {
      title: 'Amount',
      key: 'value',
      dataIndex: 'value',
      align: 'center',
      render: (value) => (
        <span>
          {fromWei({ value }, prettyNumber)} {network.tokens.ring.symbol}
        </span>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      dataIndex: 'duration',
      width: '30%',
      align: 'center',
      render: (value: { startTime: TsInMs; expireTime: TsInMs }) => (
        <div className="px-4">
          <div className="flex justify-between items-center">
            <span>{format(new Date(value.startTime.toNumber()), DATE_FORMAT)}</span>
            <span className="mx-2">-</span>
            <span>{format(new Date(value.expireTime.toNumber()), DATE_FORMAT)}</span>
          </div>
          <Progress
            percent={processTime(value.startTime.toNumber(), value.expireTime.toNumber())}
            showInfo={false}
            status="normal"
            strokeWidth={4}
            trailColor="#EBEBEB"
          />
        </div>
      ),
    },
    {
      title: 'Reward',
      key: 'reward',
      dataIndex: 'reward',
      align: 'center',
      render: (value) => (
        <span>
          {fromWei({ value }, prettyNumber)} {network.tokens.kton.symbol}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'status',
      dataIndex: 'status',
      align: 'center',
      render: (value: LockStatus, record: DataSourceState) => (
        <div className="flex justify-center">
          {value === LockStatus.LOCKING ? (
            <Button
              onClick={() => {
                const penalty = calcFine(record);
                const isInsufficient = new BN(
                  stashAssets.find((asset) => asset.asset === DarwiniaAsset.kton)?.max || '0'
                ).lt(new BN(toWei({ value: penalty })));

                Modal.confirm({
                  title: t('Confirm to continue'),
                  onOk: () => handleUnlockEarlier(record),
                  content: (
                    <>
                      <p>
                        {t(
                          'Currently in lock-up period, you will be charged a penalty of 3 times the {{KTON}} reward. Are you sure to continue?',
                          { KTON: network.tokens.kton.symbol }
                        )}
                      </p>
                      <p className="mt-2 font-bold">
                        {t('Total Fines')}: {penalty}
                      </p>
                      {isInsufficient ? (
                        <span className="text-red-400 text-xs">
                          {t('Insufficient {{kton}} balance in stash account', { kton: network.tokens.kton.symbol })}
                        </span>
                      ) : null}
                    </>
                  ),
                  okButtonProps: {
                    disabled: isInsufficient,
                  },
                });
              }}
              className="p-0 flex items-center justify-center w-28"
            >
              {t('Unlock earlier')}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const extrinsic = api.tx.staking.claimMatureDeposits();
                queueExtrinsic({
                  signAddress: controllerAccount,
                  extrinsic,
                  txSuccessCb: () => {
                    updateStakingDerive();
                  },
                });
              }}
              className="p-0 flex items-center justify-center w-28"
            >
              {t('Release')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table rowKey={'index'} columns={columns} dataSource={dataSource} loading={loading} className="whitespace-nowrap" />
  );
};
