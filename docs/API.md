# @i3m/non-repudiation-library - v2.0.0

i3-Market implementation of the non-repudiation proofs of a data exchange

## Table of contents

### Namespaces

- [ConflictResolution](modules/ConflictResolution.md)
- [NonRepudiationProtocol](modules/NonRepudiationProtocol.md)
- [Signers](modules/Signers.md)

### Classes

- [EthersIoAgentDest](classes/EthersIoAgentDest.md)
- [EthersIoAgentOrig](classes/EthersIoAgentOrig.md)
- [I3mWalletAgentDest](classes/I3mWalletAgentDest.md)
- [I3mWalletAgentOrig](classes/I3mWalletAgentOrig.md)
- [NrError](classes/NrError.md)

### Interfaces

- [Algs](interfaces/Algs.md)
- [Block](interfaces/Block.md)
- [ConflictResolutionRequestPayload](interfaces/ConflictResolutionRequestPayload.md)
- [ContractConfig](interfaces/ContractConfig.md)
- [DataExchange](interfaces/DataExchange.md)
- [DataExchangeAgreement](interfaces/DataExchangeAgreement.md)
- [DecodedProof](interfaces/DecodedProof.md)
- [DisputeRequestPayload](interfaces/DisputeRequestPayload.md)
- [DisputeResolutionPayload](interfaces/DisputeResolutionPayload.md)
- [DltConfig](interfaces/DltConfig.md)
- [JWK](interfaces/JWK.md)
- [JwkPair](interfaces/JwkPair.md)
- [NrProofPayload](interfaces/NrProofPayload.md)
- [NrpDltAgentDest](interfaces/NrpDltAgentDest.md)
- [NrpDltAgentOrig](interfaces/NrpDltAgentOrig.md)
- [OrigBlock](interfaces/OrigBlock.md)
- [PoOPayload](interfaces/PoOPayload.md)
- [PoPPayload](interfaces/PoPPayload.md)
- [PoRPayload](interfaces/PoRPayload.md)
- [ProofPayload](interfaces/ProofPayload.md)
- [ResolutionPayload](interfaces/ResolutionPayload.md)
- [StoredProof](interfaces/StoredProof.md)
- [TimestampVerifyOptions](interfaces/TimestampVerifyOptions.md)
- [VerificationRequestPayload](interfaces/VerificationRequestPayload.md)
- [VerificationResolutionPayload](interfaces/VerificationResolutionPayload.md)

### Type aliases

- [ContractInterface](API.md#contractinterface)
- [Dict](API.md#dict)
- [EncryptionAlg](API.md#encryptionalg)
- [HashAlg](API.md#hashalg)
- [KeyLike](API.md#keylike)
- [NrErrorName](API.md#nrerrorname)
- [SigningAlg](API.md#signingalg)
- [getFromJws](API.md#getfromjws)

### Variables

- [ENC\_ALGS](API.md#enc_algs)
- [HASH\_ALGS](API.md#hash_algs)
- [SIGNING\_ALGS](API.md#signing_algs)
- [defaultDltConfig](API.md#defaultdltconfig)

### Functions

- [checkTimestamp](API.md#checktimestamp)
- [createProof](API.md#createproof)
- [exchangeId](API.md#exchangeid)
- [generateKeys](API.md#generatekeys)
- [importJwk](API.md#importjwk)
- [jsonSort](API.md#jsonsort)
- [jweDecrypt](API.md#jwedecrypt)
- [jweEncrypt](API.md#jweencrypt)
- [jwsDecode](API.md#jwsdecode)
- [oneTimeSecret](API.md#onetimesecret)
- [parseAgreement](API.md#parseagreement)
- [parseHex](API.md#parsehex)
- [parseJwk](API.md#parsejwk)
- [sha](API.md#sha)
- [verifyKeyPair](API.md#verifykeypair)
- [verifyProof](API.md#verifyproof)

## Type aliases

### ContractInterface

?? **ContractInterface**: `string` \| `ReadonlyArray`<`Fragment` \| `JsonFragment` \| `string`\> \| `Interface`

#### Defined in

node_modules/@ethersproject/contracts/lib/index.d.ts:77

___

### Dict

?? **Dict**<`T`\>: `T` & { `[key: string | symbol | number]`: `any` \| `undefined`;  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[src/ts/types.ts:12](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L12)

___

### EncryptionAlg

?? **EncryptionAlg**: typeof [`ENC_ALGS`](API.md#enc_algs)[`number`]

#### Defined in

[src/ts/types.ts:10](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L10)

___

### HashAlg

?? **HashAlg**: typeof [`HASH_ALGS`](API.md#hash_algs)[`number`]

#### Defined in

[src/ts/types.ts:8](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L8)

___

### KeyLike

?? **KeyLike**: `Object`

KeyLike are runtime-specific classes representing asymmetric keys or symmetric secrets.
These are instances of
[CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) and additionally
[KeyObject](https://nodejs.org/api/crypto.html#crypto_class_keyobject)
in Node.js runtime.
[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
instances are also accepted as symmetric secret representation only.

[Key Import Functions](../modules/key_import.md#readme) can be used to import PEM,
or JWK formatted asymmetric keys and certificates to these runtime-specific representations.

In Node.js the
[Buffer](https://nodejs.org/api/buffer.html#buffer_buffer) class is a subclass of Uint8Array
and so Buffer can be provided for symmetric secrets as well.

---

[KeyObject](https://nodejs.org/api/crypto.html#crypto_class_keyobject) is a representation of a
key/secret available in the Node.js runtime.
In addition to the import functions of this library you may use the
runtime APIs
[crypto.createPublicKey](https://nodejs.org/api/crypto.html#crypto_crypto_createpublickey_key),
[crypto.createPrivateKey](https://nodejs.org/api/crypto.html#crypto_crypto_createprivatekey_key), and
[crypto.createSecretKey](https://nodejs.org/api/crypto.html#crypto_crypto_createsecretkey_key_encoding)
to obtain a KeyObject from your existing key material.

[CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) is a representation of a
key/secret available in the Browser and Deno runtimes.
In addition to the import functions of this library you may use the
[SubtleCrypto.importKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey) API
to obtain a CryptoKey from your existing key material.

---

**`example`** Import a PEM-encoded SPKI Public Key
```js
const algorithm = 'ES256'
const spki = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEFlHHWfLk0gLBbsLTcuCrbCqoHqmM
YJepMC+Q+Dd6RBmBiA41evUsNMwLeN+PNFqib+xwi9JkJ8qhZkq8Y/IzGg==
-----END PUBLIC KEY-----`
const ecPublicKey = await jose.importSPKI(spki, algorithm)
```

**`example`** Import a X.509 Certificate
```js
const algorithm = 'ES256'
const x509 = `-----BEGIN CERTIFICATE-----
MIIBXjCCAQSgAwIBAgIGAXvykuMKMAoGCCqGSM49BAMCMDYxNDAyBgNVBAMMK3Np
QXBNOXpBdk1VaXhXVWVGaGtjZXg1NjJRRzFyQUhXaV96UlFQTVpQaG8wHhcNMjEw
OTE3MDcwNTE3WhcNMjIwNzE0MDcwNTE3WjA2MTQwMgYDVQQDDCtzaUFwTTl6QXZN
VWl4V1VlRmhrY2V4NTYyUUcxckFIV2lfelJRUE1aUGhvMFkwEwYHKoZIzj0CAQYI
KoZIzj0DAQcDQgAE8PbPvCv5D5xBFHEZlBp/q5OEUymq7RIgWIi7tkl9aGSpYE35
UH+kBKDnphJO3odpPZ5gvgKs2nwRWcrDnUjYLDAKBggqhkjOPQQDAgNIADBFAiEA
1yyMTRe66MhEXID9+uVub7woMkNYd0LhSHwKSPMUUTkCIFQGsfm1ecXOpeGOufAh
v+A1QWZMuTWqYt+uh/YSRNDn
-----END CERTIFICATE-----`
const ecPublicKey = await jose.importX509(x509, algorithm)
```

**`example`** Import a PEM-encoded PKCS8 Private Key
```js
const algorithm = 'ES256'
const pkcs8 = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiyvo0X+VQ0yIrOaN
nlrnUclopnvuuMfoc8HHly3505OhRANCAAQWUcdZ8uTSAsFuwtNy4KtsKqgeqYxg
l6kwL5D4N3pEGYGIDjV69Sw0zAt43480WqJv7HCL0mQnyqFmSrxj8jMa
-----END PRIVATE KEY-----`
const ecPrivateKey = await jose.importPKCS8(pkcs8, algorithm)
```

**`example`** Import a JSON Web Key (JWK)
```js
const ecPublicKey = await jose.importJWK({
  crv: 'P-256',
  kty: 'EC',
  x: 'ySK38C1jBdLwDsNWKzzBHqKYEE5Cgv-qjWvorUXk9fw',
  y: '_LeQBw07cf5t57Iavn4j-BqJsAD1dpoz8gokd3sBsOo'
}, 'ES256')

const rsaPublicKey = await jose.importJWK({
  kty: 'RSA',
  e: 'AQAB',
  n: '12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ'
}, 'PS256')
```

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Defined in

node_modules/jose/dist/types/types.d.ts:89

___

### NrErrorName

?? **NrErrorName**: ``"not a compact jws"`` \| ``"invalid key"`` \| ``"encryption failed"`` \| ``"decryption failed"`` \| ``"jws verification failed"`` \| ``"invalid algorithm"`` \| ``"invalid poo"`` \| ``"invalid por"`` \| ``"invalid pop"`` \| ``"invalid dispute request"`` \| ``"invalid verification request"`` \| ``"invalid dispute request"`` \| ``"data exchange not as expected"`` \| ``"dataExchange integrity violated"`` \| ``"secret not published"`` \| ``"secret not published in time"`` \| ``"received too late"`` \| ``"unexpected error"`` \| ``"invalid timestamp"`` \| ``"invalid format"`` \| ``"cannot contact the ledger"`` \| ``"cannot verify"``

#### Defined in

[src/ts/types.ts:170](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L170)

___

### SigningAlg

?? **SigningAlg**: typeof [`SIGNING_ALGS`](API.md#signing_algs)[`number`]

#### Defined in

[src/ts/types.ts:9](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L9)

___

### getFromJws

?? **getFromJws**<`T`\>: (`header`: `JWEHeaderParameters`, `payload`: `T`) => `Promise`<[`JWK`](interfaces/JWK.md)\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

??? (`header`, `payload`): `Promise`<[`JWK`](interfaces/JWK.md)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `header` | `JWEHeaderParameters` |
| `payload` | `T` |

##### Returns

`Promise`<[`JWK`](interfaces/JWK.md)\>

#### Defined in

[src/ts/types.ts:168](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/types.ts#L168)

## Variables

### ENC\_ALGS

??? `Const` **ENC\_ALGS**: readonly [``"A128GCM"``, ``"A256GCM"``]

#### Defined in

[src/ts/constants.ts:3](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/constants.ts#L3)

___

### HASH\_ALGS

??? `Const` **HASH\_ALGS**: readonly [``"SHA-256"``, ``"SHA-384"``, ``"SHA-512"``]

#### Defined in

[src/ts/constants.ts:1](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/constants.ts#L1)

___

### SIGNING\_ALGS

??? `Const` **SIGNING\_ALGS**: readonly [``"ES256"``, ``"ES384"``, ``"ES512"``]

#### Defined in

[src/ts/constants.ts:2](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/constants.ts#L2)

___

### defaultDltConfig

??? `Const` **defaultDltConfig**: `Omit`<[`DltConfig`](interfaces/DltConfig.md), ``"rpcProviderUrl"``\>

#### Defined in

[src/ts/dlt/defaultDltConfig.ts:4](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/dlt/defaultDltConfig.ts#L4)

## Functions

### checkTimestamp

??? **checkTimestamp**(`timestamp`, `notBefore`, `notAfter`, `tolerance?`): `void`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `timestamp` | `number` | `undefined` |
| `notBefore` | `number` | `undefined` |
| `notAfter` | `number` | `undefined` |
| `tolerance` | `number` | `2000` |

#### Returns

`void`

#### Defined in

[src/ts/utils/timestamps.ts:3](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/timestamps.ts#L3)

___

### createProof

??? **createProof**<`T`\>(`payload`, `privateJwk`): `Promise`<[`StoredProof`](interfaces/StoredProof.md)<`T`\>\>

Creates a non-repudiable proof for a given data exchange

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`NrProofPayload`](interfaces/NrProofPayload.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `payload` | `Omit`<`T`, ``"iat"``\> | the payload to be added to the proof.                  `payload.iss` must be either the origin 'orig' or the destination 'dest' of the data exchange                  `payload.iat` shall be ommitted since it will be automatically added when signing (`Date.now()`) |
| `privateJwk` | [`JWK`](interfaces/JWK.md) | The private key in JWK that will sign the proof |

#### Returns

`Promise`<[`StoredProof`](interfaces/StoredProof.md)<`T`\>\>

a proof as a compact JWS formatted JWT string

#### Defined in

[src/ts/proofs/createProof.ts:14](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/proofs/createProof.ts#L14)

___

### exchangeId

??? **exchangeId**(`exchange`): `Promise`<`string`\>

Returns the exchangeId of the data exchange. The id is computed hashing an object with
all the properties of the data exchange but the id.
  id = BASE64URL(SHA256(hashable(dataExchangeButId)))

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchange` | `Omit`<[`DataExchange`](interfaces/DataExchange.md), ``"id"``\> | a complete data exchange without an id |

#### Returns

`Promise`<`string`\>

the exchange id in hexadecimal

#### Defined in

[src/ts/exchange/exchangeId.ts:13](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/exchange/exchangeId.ts#L13)

___

### generateKeys

??? **generateKeys**(`alg`, `privateKey?`, `base64?`): `Promise`<[`JwkPair`](interfaces/JwkPair.md)\>

Generates a pair of JWK signing/verification keys

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `alg` | ``"ES256"`` \| ``"ES384"`` \| ``"ES512"`` | the signing algorithm to use |
| `privateKey?` | `string` \| `Uint8Array` | an optional private key as a Uint8Array, or a string (hex or base64) |
| `base64?` | `boolean` | - |

#### Returns

`Promise`<[`JwkPair`](interfaces/JwkPair.md)\>

#### Defined in

[src/ts/crypto/generateKeys.ts:16](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/generateKeys.ts#L16)

___

### importJwk

??? **importJwk**(`jwk`, `alg?`): `Promise`<[`KeyLike`](API.md#keylike) \| `Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `jwk` | [`JWK`](interfaces/JWK.md) |
| `alg?` | `string` |

#### Returns

`Promise`<[`KeyLike`](API.md#keylike) \| `Uint8Array`\>

#### Defined in

[src/ts/crypto/importJwk.ts:5](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/importJwk.ts#L5)

___

### jsonSort

??? **jsonSort**(`obj`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`any`

#### Defined in

[src/ts/utils/jsonSort.ts:5](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/jsonSort.ts#L5)

___

### jweDecrypt

??? **jweDecrypt**(`jwe`, `secret`, `encAlg?`): `Promise`<`CompactDecryptResult`\>

Decrypts jwe

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `jwe` | `string` | `undefined` | a JWE |
| `secret` | [`JWK`](interfaces/JWK.md) | `undefined` | a JWK with the secret to decrypt this jwe |
| `encAlg` | ``"A128GCM"`` \| ``"A256GCM"`` | `'A256GCM'` | the algorithm for encryption |

#### Returns

`Promise`<`CompactDecryptResult`\>

the plaintext

#### Defined in

[src/ts/crypto/jwe.ts:37](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/jwe.ts#L37)

___

### jweEncrypt

??? **jweEncrypt**(`block`, `secret`, `encAlg`): `Promise`<`string`\>

Encrypts a block of data to JWE

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `block` | `Uint8Array` | the actual block of data |
| `secret` | [`JWK`](interfaces/JWK.md) | a one-time secret for encrypting this block |
| `encAlg` | ``"A128GCM"`` \| ``"A256GCM"`` | the algorithm for encryption |

#### Returns

`Promise`<`string`\>

a Compact JWE

#### Defined in

[src/ts/crypto/jwe.ts:14](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/jwe.ts#L14)

___

### jwsDecode

??? **jwsDecode**<`T`\>(`jws`, `publicJwk?`): `Promise`<[`DecodedProof`](interfaces/DecodedProof.md)<`T`\>\>

Decodes and optionally verifies a JWS, and returns the decoded header, payload.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ProofPayload`](interfaces/ProofPayload.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `jws` | `string` |  |
| `publicJwk?` | [`JWK`](interfaces/JWK.md) \| [`getFromJws`](API.md#getfromjws)<`T`\> | either a public key as a JWK or a function that resolves to a JWK. If not provided, the JWS signature is not verified |

#### Returns

`Promise`<[`DecodedProof`](interfaces/DecodedProof.md)<`T`\>\>

#### Defined in

[src/ts/crypto/jwsDecode.ts:12](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/jwsDecode.ts#L12)

___

### oneTimeSecret

??? **oneTimeSecret**(`encAlg`, `secret?`, `base64?`): `Promise`<`Exclude`<[`Block`](interfaces/Block.md)[``"secret"``], `undefined`\>\>

Create a JWK random (high entropy) symmetric secret

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `encAlg` | ``"A128GCM"`` \| ``"A256GCM"`` | the encryption algorithm |
| `secret?` | `string` \| `Uint8Array` | and optional seed as Uint8Array or string (hex or base64) |
| `base64?` | `boolean` | if a secret is provided as a string, sets base64 decoding. It supports standard, url-safe base64 with and without padding (autodetected). |

#### Returns

`Promise`<`Exclude`<[`Block`](interfaces/Block.md)[``"secret"``], `undefined`\>\>

a promise that resolves to the secret in JWK and raw hex string

#### Defined in

[src/ts/crypto/oneTimeSecret.ts:18](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/oneTimeSecret.ts#L18)

___

### parseAgreement

??? **parseAgreement**(`agreement`): `Promise`<[`DataExchangeAgreement`](interfaces/DataExchangeAgreement.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `agreement` | [`DataExchangeAgreement`](interfaces/DataExchangeAgreement.md) |

#### Returns

`Promise`<[`DataExchangeAgreement`](interfaces/DataExchangeAgreement.md)\>

#### Defined in

[src/ts/exchange/checkAgreement.ts:14](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/exchange/checkAgreement.ts#L14)

___

### parseHex

??? **parseHex**(`a`, `prefix0x?`, `byteLength?`): `string`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `a` | `string` | `undefined` |
| `prefix0x` | `boolean` | `false` |
| `byteLength?` | `number` | `undefined` |

#### Returns

`string`

#### Defined in

[src/ts/utils/parseHex.ts:3](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/parseHex.ts#L3)

___

### parseJwk

??? **parseJwk**(`jwk`, `stringify`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `jwk` | [`JWK`](interfaces/JWK.md) |
| `stringify` | ``true`` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/ts/utils/parseJwk.ts:6](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/parseJwk.ts#L6)

??? **parseJwk**(`jwk`, `stringify`): `Promise`<[`JWK`](interfaces/JWK.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `jwk` | [`JWK`](interfaces/JWK.md) |
| `stringify` | ``false`` |

#### Returns

`Promise`<[`JWK`](interfaces/JWK.md)\>

#### Defined in

[src/ts/utils/parseJwk.ts:7](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/parseJwk.ts#L7)

___

### sha

??? **sha**(`input`, `algorithm`): `Promise`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` \| `Uint8Array` |
| `algorithm` | ``"SHA-256"`` \| ``"SHA-384"`` \| ``"SHA-512"`` |

#### Returns

`Promise`<`Uint8Array`\>

#### Defined in

[src/ts/utils/sha.ts:4](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/utils/sha.ts#L4)

___

### verifyKeyPair

??? **verifyKeyPair**(`pubJWK`, `privJWK`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pubJWK` | [`JWK`](interfaces/JWK.md) |
| `privJWK` | [`JWK`](interfaces/JWK.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/ts/crypto/verifyKeyPair.ts:7](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/crypto/verifyKeyPair.ts#L7)

___

### verifyProof

??? **verifyProof**<`T`\>(`proof`, `expectedPayloadClaims`, `options?`): `Promise`<[`DecodedProof`](interfaces/DecodedProof.md)<`T`\>\>

Verify a proof

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`NrProofPayload`](interfaces/NrProofPayload.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `proof` | `string` | a non-repudiable proof in Compact JWS formatted JWT string |
| `expectedPayloadClaims` | `Partial`<`T`\> & { `exchange`: [`Dict`](API.md#dict)<`T`[``"exchange"``]\> ; `iss`: `T`[``"iss"``] ; `proofType`: `T`[``"proofType"``]  } | The expected values of the proof's payload claims. An expected value of '' can be use to just check that the claim is in the payload. An example could be: {   proofType: 'PoO',   iss: 'orig',   exchange: {     id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',     orig: '{"kty":"EC","x":"rPMP39e-o8cU6m4WL8_qd2wxo-nBTjWXZtPGBiiGCTY","y":"0uvxGEebFDxKOHYUlHREzq4mRULuZvQ6LB2I11yE1E0","crv":"P-256"}', // Public key in JSON.stringify(JWK) of the block origin (sender)     dest: '{"kty":"EC","x":"qf_mNdy57ia1vAq5QLpTPxJUCRhS2003-gL0nLcbXoA","y":"H_8YwSCKJhDbZv17YEgDfAiKTaQ8x0jpLYCC2myxAeY","crv":"P-256"}', // Public key in JSON.stringify(JWK) of the block destination (receiver)     hash_alg: 'SHA-256',     cipherblock_dgst: 'IBUIstf98_afbiuh7UaifkasytNih7as-Jah61ls9UI', // hash of the cipherblock in base64url with no padding     block_commitment: '', // hash of the plaintext block in base64url with no padding     secret_commitment: '' // hash of the secret that can be used to decrypt the block in base64url with no padding   } } |
| `options?` | [`TimestampVerifyOptions`](interfaces/TimestampVerifyOptions.md) | specifies a time window to accept the proof |

#### Returns

`Promise`<[`DecodedProof`](interfaces/DecodedProof.md)<`T`\>\>

The JWT protected header and payload if the proof is validated

#### Defined in

[src/ts/proofs/verifyProof.ts:29](https://gitlab.com/i3-market/code/wp3/t3.2/conflict-resolution/non-repudiation-library/-/blob/ef637a6/src/ts/proofs/verifyProof.ts#L29)
