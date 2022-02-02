// Copyright 2017-2020 @polkadot/api-derive authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DeriveUnlocking } from '@polkadot/api-derive/types';
import { ExposureT as Exposure, RKT, StakingLedgerT as StakingLedger } from '@darwinia/types/interfaces';
import { TimeDepositItem } from '@darwinia/types/interfaces/darwiniaInject';
import {
  AccountId,
  Balance,
  EraIndex,
  Keys,
  RewardDestination,
  RewardPoint,
  ValidatorPrefs,
} from '@polkadot/types/interfaces';
import { DeriveSessionIndexes } from '../session/types';

export type DeriveEraValPoints = Record<string, RewardPoint>;

export type DeriveEraValPrefs = Record<string, ValidatorPrefs>;

export type DeriveEraValSlash = Record<string, Balance>;

export interface DeriveEraPoints {
  era: EraIndex;
  eraPoints: RewardPoint;
  validators: DeriveEraValPoints;
}

export interface DeriveEraPrefs {
  era: EraIndex;
  validators: DeriveEraValPrefs;
}

export interface DeriveEraRewards {
  era: EraIndex;
  eraReward: Balance;
}

export interface DeriveEraSlashes {
  era: EraIndex;
  nominators: DeriveEraValSlash;
  validators: DeriveEraValSlash;
}

export interface DeriveStakerPoints {
  era: EraIndex;
  eraPoints: RewardPoint;
  points: RewardPoint;
}

export type DeriveEraNominatorExposure = Record<string, DeriveEraExposureNominating[]>;

export type DeriveEraValidatorExposure = Record<string, Exposure>;

export interface DeriveEraExposure {
  era: EraIndex;
  nominators: DeriveEraNominatorExposure;
  validators: DeriveEraValidatorExposure;
}

export interface DeriveOwnExposure {
  clipped: Exposure;
  era: EraIndex;
  exposure: Exposure;
}

export type DeriveOwnSlashes = DeriveStakerSlashes;

export interface DeriveEraExposureNominating {
  validatorId: string;
  validatorIndex: number;
}

export interface DeriveStakerExposure {
  era: EraIndex;
  isEmpty: boolean;
  isValidator: boolean;
  nominating: DeriveEraExposureNominating[];
  validators: DeriveEraValidatorExposure;
}

export interface DeriveStakerRewardValidator {
  total: Balance;
  value: Balance;
}

export interface DeriveStakerReward {
  era: EraIndex;
  eraReward: Balance;
  isStakerPayout?: boolean;
  isEmpty: boolean;
  isValidator: boolean;
  nominating: DeriveEraExposureNominating[];
  validators: Record<string, DeriveStakerRewardValidator>;
  total: Balance;
}

export interface DeriveStakerSlashes {
  era: EraIndex;
  total: RKT;
}

export interface DeriveStakingElected {
  nextElected: AccountId[];
  info: DeriveStakingQuery[];
  activeComminssions: ValidatorPrefs[];
}

export interface DeriveStakingWaiting {
  info: DeriveStakingQuery[];
  waiting: AccountId[];
}

export interface DeriveStakingValidators {
  nextElected: AccountId[];
  validators: AccountId[];
}

export interface DeriveStakingStash {
  controllerId?: AccountId;
  exposure?: Exposure;
  nominators?: AccountId[];
  nominateAt?: EraIndex;
  rewardDestination?: RewardDestination;
  nextKeys?: Keys;
  stashId?: AccountId;
  validatorPrefs?: ValidatorPrefs;
}

export interface DeriveStakingQuery extends DeriveStakingStash {
  accountId: AccountId;
  nextSessionIds: AccountId[];
  sessionIds: AccountId[];
  stakingLedger?: StakingLedger;
}

export interface DeriveStakingAccount extends DeriveStakingQuery {
  redeemable?: Balance;
  unlocking?: DeriveUnlocking[];
  activeDepositItems?: TimeDepositItem[];
  unlockingTotalValue: Balance;
  unlockingKton?: DeriveUnlocking[];
  unlockingKtonTotalValue: Balance;
  activeDepositAmount?: Balance;
}

export interface DeriveStakingOverview extends DeriveSessionIndexes {
  nextElected: AccountId[];
  validators: AccountId[];
}
