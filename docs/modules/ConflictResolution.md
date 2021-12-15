# Namespace: ConflictResolution

## Table of contents

### Classes

- [ConflictResolver](../classes/ConflictResolution.ConflictResolver.md)

### Functions

- [checkCompleteness](ConflictResolution.md#checkcompleteness)
- [checkDecryption](ConflictResolution.md#checkdecryption)
- [generateVerificationRequest](ConflictResolution.md#generateverificationrequest)
- [verifyPor](ConflictResolution.md#verifypor)

## Functions

### checkCompleteness

▸ **checkCompleteness**(`verificationRequest`, `dltContract`): `Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md) ; `vrPayload`: [`VerificationRequestPayload`](../interfaces/VerificationRequestPayload.md)  }\>

Checks the completeness of a given data exchange by verifying the PoR in the verification request using the secret downloaded from the ledger

#### Parameters

| Name | Type |
| :------ | :------ |
| `verificationRequest` | `string` |
| `dltContract` | `Contract` |

#### Returns

`Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md) ; `vrPayload`: [`VerificationRequestPayload`](../interfaces/VerificationRequestPayload.md)  }\>

#### Defined in

[src/ts/conflict-resolution/checkCompleteness.ts:14](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-protocol/-/blob/f58faf3/src/ts/conflict-resolution/checkCompleteness.ts#L14)

___

### checkDecryption

▸ **checkDecryption**(`disputeRequest`, `dltContract`): `Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `drPayload`: [`DisputeRequestPayload`](../interfaces/DisputeRequestPayload.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md)  }\>

Check if the cipherblock in the disputeRequest is the one agreed for the dataExchange, and if it could be decrypted with the secret published on the ledger for that dataExchange.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `disputeRequest` | `string` | a dispute request as a compact JWS |
| `dltContract` | `Contract` |  |

#### Returns

`Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `drPayload`: [`DisputeRequestPayload`](../interfaces/DisputeRequestPayload.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md)  }\>

#### Defined in

[src/ts/conflict-resolution/checkDecryption.ts:16](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-protocol/-/blob/f58faf3/src/ts/conflict-resolution/checkDecryption.ts#L16)

___

### generateVerificationRequest

▸ **generateVerificationRequest**(`iss`, `dataExchangeId`, `por`, `privateJwk`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `iss` | ``"orig"`` \| ``"dest"`` |
| `dataExchangeId` | `string` |
| `por` | `string` |
| `privateJwk` | [`JWK`](../interfaces/JWK.md) |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/ts/conflict-resolution/generateVerificationRequest.ts:4](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-protocol/-/blob/f58faf3/src/ts/conflict-resolution/generateVerificationRequest.ts#L4)

___

### verifyPor

▸ **verifyPor**(`por`, `dltContract`): `Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md) ; `secretHex`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `por` | `string` |
| `dltContract` | `Contract` |

#### Returns

`Promise`<{ `destPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `origPublicJwk`: [`JWK`](../interfaces/JWK.md) ; `pooPayload`: [`PoOPayload`](../interfaces/PoOPayload.md) ; `porPayload`: [`PoRPayload`](../interfaces/PoRPayload.md) ; `secretHex`: `string`  }\>

#### Defined in

[src/ts/conflict-resolution/verifyPor.ts:10](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-protocol/-/blob/f58faf3/src/ts/conflict-resolution/verifyPor.ts#L10)