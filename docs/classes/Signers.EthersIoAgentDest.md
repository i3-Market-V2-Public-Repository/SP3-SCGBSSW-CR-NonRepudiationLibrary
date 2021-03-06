# Class: EthersIoAgentDest

[Signers](../modules/Signers.md).EthersIoAgentDest

A DLT agent for the NRP dest using ethers.io.

## Hierarchy

- `EthersIoAgent`

  ↳ **`EthersIoAgentDest`**

  ↳↳ [`I3mWalletAgentDest`](Signers.I3mWalletAgentDest.md)

  ↳↳ [`I3mWalletAgentDest`](I3mWalletAgentDest.md)

## Implements

- [`NrpDltAgentDest`](../interfaces/Signers.NrpDltAgentDest.md)

## Table of contents

### Constructors

- [constructor](Signers.EthersIoAgentDest.md#constructor)

### Properties

- [contract](Signers.EthersIoAgentDest.md#contract)
- [dltConfig](Signers.EthersIoAgentDest.md#dltconfig)
- [provider](Signers.EthersIoAgentDest.md#provider)

### Methods

- [getContractAddress](Signers.EthersIoAgentDest.md#getcontractaddress)
- [getSecretFromLedger](Signers.EthersIoAgentDest.md#getsecretfromledger)

## Constructors

### constructor

• **new EthersIoAgentDest**(`dltConfig`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `dltConfig` | `Partial`<[`DltConfig`](../interfaces/DltConfig.md)\> & `Pick`<[`DltConfig`](../interfaces/DltConfig.md), ``"rpcProviderUrl"``\> |

#### Inherited from

EthersIoAgent.constructor

#### Defined in

[src/ts/dlt/agents/EthersIoAgent.ts:14](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/EthersIoAgent.ts#L14)

## Properties

### contract

• **contract**: `Contract`

#### Inherited from

EthersIoAgent.contract

#### Defined in

[src/ts/dlt/agents/EthersIoAgent.ts:11](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/EthersIoAgent.ts#L11)

___

### dltConfig

• **dltConfig**: [`DltConfig`](../interfaces/DltConfig.md)

#### Inherited from

EthersIoAgent.dltConfig

#### Defined in

[src/ts/dlt/agents/EthersIoAgent.ts:10](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/EthersIoAgent.ts#L10)

___

### provider

• **provider**: `Provider`

#### Inherited from

EthersIoAgent.provider

#### Defined in

[src/ts/dlt/agents/EthersIoAgent.ts:12](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/EthersIoAgent.ts#L12)

## Methods

### getContractAddress

▸ **getContractAddress**(): `Promise`<`string`\>

Returns the address of the smart contract in use

#### Returns

`Promise`<`string`\>

#### Implementation of

[NrpDltAgentDest](../interfaces/Signers.NrpDltAgentDest.md).[getContractAddress](../interfaces/Signers.NrpDltAgentDest.md#getcontractaddress)

#### Inherited from

EthersIoAgent.getContractAddress

#### Defined in

[src/ts/dlt/agents/EthersIoAgent.ts:26](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/EthersIoAgent.ts#L26)

___

### getSecretFromLedger

▸ **getSecretFromLedger**(`signerAddress`, `exchangeId`, `timeout`): `Promise`<{ `hex`: `string` ; `iat`: `number`  }\>

Just in case the PoP is not received, the secret can be downloaded from the ledger.
The secret should be downloaded before poo.iat + pooToPop max delay.

#### Parameters

| Name | Type |
| :------ | :------ |
| `signerAddress` | `string` |
| `exchangeId` | `string` |
| `timeout` | `number` |

#### Returns

`Promise`<{ `hex`: `string` ; `iat`: `number`  }\>

#### Implementation of

[NrpDltAgentDest](../interfaces/Signers.NrpDltAgentDest.md).[getSecretFromLedger](../interfaces/Signers.NrpDltAgentDest.md#getsecretfromledger)

#### Defined in

[src/ts/dlt/agents/dest/EthersIoAgentDest.ts:13](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/agents/dest/EthersIoAgentDest.ts#L13)
