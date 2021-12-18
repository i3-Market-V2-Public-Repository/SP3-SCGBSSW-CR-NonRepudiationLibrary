'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var b64 = require('@juanelas/base64');
var bigintConversion = require('bigint-conversion');
var bigintCryptoUtils = require('bigint-crypto-utils');
var elliptic = require('elliptic');
var jose = require('jose');
var ethers = require('ethers');
var objectSha = require('object-sha');
var signingKey = require('@ethersproject/signing-key');
var wallet = require('@ethersproject/wallet');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var b64__namespace = /*#__PURE__*/_interopNamespace(b64);

class NrError extends Error {
    constructor(error, nrErrors) {
        super(error);
        if (error instanceof NrError) {
            this.nrErrors = error.nrErrors;
            this.add(...nrErrors);
        }
        else {
            this.nrErrors = nrErrors;
        }
    }
    add(...nrErrors) {
        nrErrors.forEach(nrError => this.nrErrors.push(nrError));
    }
}

/**
 * Generates a pair of JWK signing/verification keys
 *
 * @param alg - the signing algorithm to use
 * @param privateKey - an optional private key as a Uint8Array, or a string (hex or base64)
 * @param base - only used when privateKey is a string. Set to true if the privateKey is base64 encoded (standard base64, url-safe bas64 with and without padding are supported)
 * @returns
 */
async function generateKeys(alg, privateKey, base64) {
    const algs = ['ES256', 'ES384', 'ES512'];
    if (!algs.includes(alg))
        throw new NrError(new RangeError(`Invalid signature algorithm '${alg}''. Allowed algorithms are ${algs.toString()}`), ['invalid algorithm']);
    let keyLength;
    let namedCurve;
    switch (alg) {
        case 'ES512':
            namedCurve = 'P-521';
            keyLength = 66;
            break;
        case 'ES384':
            namedCurve = 'P-384';
            keyLength = 48;
            break;
        default:
            namedCurve = 'P-256';
            keyLength = 32;
    }
    let privKeyBuf;
    if (privateKey !== undefined) {
        if (typeof privateKey === 'string') {
            if (base64 === true) {
                privKeyBuf = b64__namespace.decode(privateKey);
            }
            else {
                privKeyBuf = new Uint8Array(bigintConversion.hexToBuf(privateKey));
            }
        }
        else {
            privKeyBuf = privateKey;
        }
    }
    else {
        privKeyBuf = new Uint8Array(await bigintCryptoUtils.randBytes(keyLength));
    }
    const ec = new elliptic.ec('p' + namedCurve.substring(namedCurve.length - 3));
    const ecPriv = ec.keyFromPrivate(privKeyBuf);
    const ecPub = ecPriv.getPublic();
    const xHex = ecPub.getX().toString('hex').padStart(keyLength * 2, '0');
    const yHex = ecPub.getY().toString('hex').padStart(keyLength * 2, '0');
    const dHex = ecPriv.getPrivate('hex').padStart(keyLength * 2, '0');
    const x = b64__namespace.encode(bigintConversion.hexToBuf(xHex), true, false);
    const y = b64__namespace.encode(bigintConversion.hexToBuf(yHex), true, false);
    const d = b64__namespace.encode(bigintConversion.hexToBuf(dHex), true, false);
    const privateJwk = { kty: 'EC', crv: namedCurve, x, y, d, alg };
    const publicJwk = { ...privateJwk };
    delete publicJwk.d;
    return {
        publicJwk,
        privateJwk
    };
}

async function importJwk(jwk, alg) {
    try {
        const key = await jose.importJWK(jwk, alg);
        return key;
    }
    catch (error) {
        throw new NrError(error, ['invalid key']);
    }
}

/**
 * Encrypts a block of data to JWE
 *
 * @param block - the actual block of data
 * @param secret - a one-time secret for encrypting this block
 * @param encAlg - the algorithm for encryption
 * @returns a Compact JWE
 */
async function jweEncrypt(block, secret, encAlg) {
    // const input: Uint8Array = (typeof block === 'string') ? (new TextEncoder()).encode(block) : new Uint8Array(block)
    const key = await importJwk(secret);
    let jwe;
    try {
        jwe = await new jose.CompactEncrypt(block)
            .setProtectedHeader({ alg: 'dir', enc: encAlg, kid: secret.kid })
            .encrypt(key);
        return jwe;
    }
    catch (error) {
        throw new NrError(error, ['encryption failed']);
    }
}
/**
 * Decrypts jwe
 * @param jwe - a JWE
 * @param secret - a JWK with the secret to decrypt this jwe
 * @param encAlg - the algorithm for encryption
 * @returns the plaintext
 */
async function jweDecrypt(jwe, secret, encAlg = 'A256GCM') {
    const key = await importJwk(secret);
    try {
        return await jose.compactDecrypt(jwe, key, { contentEncryptionAlgorithms: [encAlg] });
    }
    catch (error) {
        const nrError = new NrError(error, ['decryption failed']);
        throw nrError;
    }
}

/**
 * Decodes and optionally verifies a JWS, and returns the decoded header, payload.
 * @param jws
 * @param publicJwk - either a public key as a JWK or a function that resolves to a JWK. If not provided, the JWS signature is not verified
 */
async function jwsDecode(jws, publicJwk) {
    const regex = /^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/;
    const match = jws.match(regex);
    if (match === null) {
        throw new NrError(new Error(`${jws} is not a JWS`), ['not a compact jws']);
    }
    let header;
    let payload;
    try {
        header = JSON.parse(b64__namespace.decode(match[1], true));
        payload = JSON.parse(b64__namespace.decode(match[2], true));
    }
    catch (error) {
        throw new NrError(error, ['invalid format', 'not a compact jws']);
    }
    if (publicJwk !== undefined) {
        const pubJwk = (typeof publicJwk === 'function') ? await publicJwk(header, payload) : publicJwk;
        const pubKey = await importJwk(pubJwk);
        try {
            const verified = await jose.jwtVerify(jws, pubKey);
            return {
                header: verified.protectedHeader,
                payload: verified.payload,
                signer: pubJwk
            };
        }
        catch (error) {
            throw new NrError(error, ['jws verification failed']);
        }
    }
    return { header, payload };
}

/**
 * Create a JWK random (high entropy) symmetric secret
 *
 * @param encAlg - the encryption algorithm
 * @param secret - and optional seed as Uint8Array or string (hex or base64)
 * @param base64 - if a secret is provided as a string, sets base64 decoding. It supports standard, url-safe base64 with and without padding (autodetected).
 * @returns a promise that resolves to the secret in JWK and raw hex string
 */
async function oneTimeSecret(encAlg, secret, base64) {
    let key;
    let secretLength;
    switch (encAlg) {
        case 'A128GCM':
            secretLength = 16;
            break;
        case 'A256GCM':
            secretLength = 32;
            break;
        default:
            throw new NrError(new Error(`Invalid encAlg '${encAlg}'. Supported values are: ${['A128GCM', 'A256GCM'].toString()}`), ['invalid algorithm']);
    }
    if (secret !== undefined) {
        if (typeof secret === 'string') {
            if (base64 === true) {
                key = b64__namespace.decode(secret);
            }
            else {
                key = new Uint8Array(bigintConversion.hexToBuf(secret));
            }
        }
        else {
            key = secret;
        }
        if (key.length !== secretLength) {
            throw new NrError(new RangeError(`Expected secret length ${secretLength} does not meet provided one ${key.length}`), ['invalid key']);
        }
    }
    else {
        try {
            key = await jose.generateSecret(encAlg, { extractable: true });
        }
        catch (error) {
            throw new NrError(error, ['unexpected error']);
        }
    }
    const jwk = await jose.exportJWK(key);
    // const thumbprint: string = await calculateJwkThumbprint(jwk)
    // jwk.kid = thumbprint
    jwk.alg = encAlg;
    return { jwk: jwk, hex: bigintConversion.bufToHex(b64.decode(jwk.k)) };
}

async function verifyKeyPair(pubJWK, privJWK) {
    if (pubJWK.alg === undefined || privJWK.alg === undefined || pubJWK.alg !== privJWK.alg) {
        throw new Error('alg no present in either pubJwk or privJwk, or pubJWK.alg != privJWK.alg');
    }
    const pubKey = await importJwk(pubJWK);
    const privKey = await importJwk(privJWK);
    try {
        const nonce = await bigintCryptoUtils.randBytes(16);
        const jws = await new jose.GeneralSign(nonce)
            .addSignature(privKey)
            .setProtectedHeader({ alg: privJWK.alg })
            .sign();
        await jose.generalVerify(jws, pubKey); // if verification fails, it throws JWSSignatureVerificationFailed: signature verification failed
    }
    catch (error) {
        throw new NrError(error, ['unexpected error']);
    }
}

var address = "0x8d407A1722633bDD1dcf221474be7a44C05d7c2F";
var abi = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "dataExchangeId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "timestamp",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "secret",
				type: "uint256"
			}
		],
		name: "Registration",
		type: "event"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		name: "registry",
		outputs: [
			{
				internalType: "uint256",
				name: "timestamp",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "secret",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "_dataExchangeId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "_secret",
				type: "uint256"
			}
		],
		name: "setRegistry",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	}
];
var transactionHash = "0x6a3828f8fe232819dc40ca66f93930b3bd1619db31a67ec34b44446b3e7c8289";
var receipt = {
	to: null,
	from: "0x17bd12C2134AfC1f6E9302a532eFE30C19B9E903",
	contractAddress: "0x8d407A1722633bDD1dcf221474be7a44C05d7c2F",
	transactionIndex: 0,
	gasUsed: "253928",
	logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
	blockHash: "0x0118672bb9b27679e616831d056d36291dd20cfe88c3ee2abd8f2dfce579cad4",
	transactionHash: "0x6a3828f8fe232819dc40ca66f93930b3bd1619db31a67ec34b44446b3e7c8289",
	logs: [
	],
	blockNumber: 119389,
	cumulativeGasUsed: "253928",
	status: 1,
	byzantium: true
};
var args = [
];
var solcInputHash = "c528a37588793ef74285d75e08d6b8eb";
var metadata = "{\"compiler\":{\"version\":\"0.8.4+commit.c7e474f2\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"dataExchangeId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"secret\",\"type\":\"uint256\"}],\"name\":\"Registration\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"registry\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"secret\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_dataExchangeId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_secret\",\"type\":\"uint256\"}],\"name\":\"setRegistry\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"devdoc\":{\"kind\":\"dev\",\"methods\":{},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"contracts/NonRepudiation.sol\":\"NonRepudiation\"},\"evmVersion\":\"istanbul\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"ipfs\",\"useLiteralContent\":true},\"optimizer\":{\"enabled\":false,\"runs\":200},\"remappings\":[]},\"sources\":{\"contracts/NonRepudiation.sol\":{\"content\":\"//SPDX-License-Identifier: Unlicense\\npragma solidity ^0.8.0;\\n\\ncontract NonRepudiation {\\n    struct Proof {\\n        uint256 timestamp;\\n        uint256 secret;\\n    }\\n    mapping(address => mapping (uint256 => Proof)) public registry;\\n    event Registration(address sender, uint256 dataExchangeId, uint256 timestamp, uint256 secret);\\n\\n    function setRegistry(uint256 _dataExchangeId, uint256 _secret) public {\\n        require(registry[msg.sender][_dataExchangeId].secret == 0);\\n        registry[msg.sender][_dataExchangeId] = Proof(block.timestamp, _secret);\\n        emit Registration(msg.sender, _dataExchangeId, block.timestamp, _secret);\\n    }\\n}\\n\",\"keccak256\":\"0x8d371257a9b03c9102f158323e61f56ce49dd8489bd92c5a7d8abc3d9f6f8399\",\"license\":\"Unlicense\"}},\"version\":1}";
var bytecode = "0x608060405234801561001057600080fd5b506103a2806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063032439371461003b578063d05cb54514610057575b600080fd5b6100556004803603810190610050919061023a565b610088565b005b610071600480360381019061006c91906101fe565b6101a3565b60405161007f9291906102d9565b60405180910390f35b60008060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600084815260200190815260200160002060010154146100e757600080fd5b6040518060400160405280428152602001828152506000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600084815260200190815260200160002060008201518160000155602082015181600101559050507faa58599838af2e5e0f3251cfbb4eac5d5d447ded49f6b0ac28d6b44098224e63338342846040516101979493929190610294565b60405180910390a15050565b6000602052816000526040600020602052806000526040600020600091509150508060000154908060010154905082565b6000813590506101e38161033e565b92915050565b6000813590506101f881610355565b92915050565b6000806040838503121561021157600080fd5b600061021f858286016101d4565b9250506020610230858286016101e9565b9150509250929050565b6000806040838503121561024d57600080fd5b600061025b858286016101e9565b925050602061026c858286016101e9565b9150509250929050565b61027f81610302565b82525050565b61028e81610334565b82525050565b60006080820190506102a96000830187610276565b6102b66020830186610285565b6102c36040830185610285565b6102d06060830184610285565b95945050505050565b60006040820190506102ee6000830185610285565b6102fb6020830184610285565b9392505050565b600061030d82610314565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b61034781610302565b811461035257600080fd5b50565b61035e81610334565b811461036957600080fd5b5056fea26469706673582212204fd0fc653fb487221da9a14a4ca5d5499f9e9bc7b27ac8ab0f8d397fd6e3148564736f6c63430008040033";
var deployedBytecode = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063032439371461003b578063d05cb54514610057575b600080fd5b6100556004803603810190610050919061023a565b610088565b005b610071600480360381019061006c91906101fe565b6101a3565b60405161007f9291906102d9565b60405180910390f35b60008060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600084815260200190815260200160002060010154146100e757600080fd5b6040518060400160405280428152602001828152506000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600084815260200190815260200160002060008201518160000155602082015181600101559050507faa58599838af2e5e0f3251cfbb4eac5d5d447ded49f6b0ac28d6b44098224e63338342846040516101979493929190610294565b60405180910390a15050565b6000602052816000526040600020602052806000526040600020600091509150508060000154908060010154905082565b6000813590506101e38161033e565b92915050565b6000813590506101f881610355565b92915050565b6000806040838503121561021157600080fd5b600061021f858286016101d4565b9250506020610230858286016101e9565b9150509250929050565b6000806040838503121561024d57600080fd5b600061025b858286016101e9565b925050602061026c858286016101e9565b9150509250929050565b61027f81610302565b82525050565b61028e81610334565b82525050565b60006080820190506102a96000830187610276565b6102b66020830186610285565b6102c36040830185610285565b6102d06060830184610285565b95945050505050565b60006040820190506102ee6000830185610285565b6102fb6020830184610285565b9392505050565b600061030d82610314565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b61034781610302565b811461035257600080fd5b50565b61035e81610334565b811461036957600080fd5b5056fea26469706673582212204fd0fc653fb487221da9a14a4ca5d5499f9e9bc7b27ac8ab0f8d397fd6e3148564736f6c63430008040033";
var devdoc = {
	kind: "dev",
	methods: {
	},
	version: 1
};
var userdoc = {
	kind: "user",
	methods: {
	},
	version: 1
};
var storageLayout = {
	storage: [
		{
			astId: 13,
			contract: "contracts/NonRepudiation.sol:NonRepudiation",
			label: "registry",
			offset: 0,
			slot: "0",
			type: "t_mapping(t_address,t_mapping(t_uint256,t_struct(Proof)6_storage))"
		}
	],
	types: {
		t_address: {
			encoding: "inplace",
			label: "address",
			numberOfBytes: "20"
		},
		"t_mapping(t_address,t_mapping(t_uint256,t_struct(Proof)6_storage))": {
			encoding: "mapping",
			key: "t_address",
			label: "mapping(address => mapping(uint256 => struct NonRepudiation.Proof))",
			numberOfBytes: "32",
			value: "t_mapping(t_uint256,t_struct(Proof)6_storage)"
		},
		"t_mapping(t_uint256,t_struct(Proof)6_storage)": {
			encoding: "mapping",
			key: "t_uint256",
			label: "mapping(uint256 => struct NonRepudiation.Proof)",
			numberOfBytes: "32",
			value: "t_struct(Proof)6_storage"
		},
		"t_struct(Proof)6_storage": {
			encoding: "inplace",
			label: "struct NonRepudiation.Proof",
			members: [
				{
					astId: 3,
					contract: "contracts/NonRepudiation.sol:NonRepudiation",
					label: "timestamp",
					offset: 0,
					slot: "0",
					type: "t_uint256"
				},
				{
					astId: 5,
					contract: "contracts/NonRepudiation.sol:NonRepudiation",
					label: "secret",
					offset: 0,
					slot: "1",
					type: "t_uint256"
				}
			],
			numberOfBytes: "64"
		},
		t_uint256: {
			encoding: "inplace",
			label: "uint256",
			numberOfBytes: "32"
		}
	}
};
var contractConfig = {
	address: address,
	abi: abi,
	transactionHash: transactionHash,
	receipt: receipt,
	args: args,
	solcInputHash: solcInputHash,
	metadata: metadata,
	bytecode: bytecode,
	deployedBytecode: deployedBytecode,
	devdoc: devdoc,
	userdoc: userdoc,
	storageLayout: storageLayout
};

/** TO-DO: Could the json be imported from an npm package? */
const defaultDltConfig = {
    gasLimit: 12500000,
    rpcProviderUrl: '***REMOVED***',
    disable: false,
    contract: contractConfig
};

function checkTimestamp(timestamp, notBefore, notAfter, tolerance = 2000) {
    if (timestamp < notBefore - tolerance) {
        throw new NrError(new Error(`timestamp ${(new Date(timestamp).toTimeString())} before 'notBefore' ${(new Date(notBefore).toTimeString())} with tolerance of ${tolerance / 1000}s`), ['invalid timestamp']);
    }
    else if (timestamp > notAfter + tolerance) {
        throw new NrError(new Error(`timestamp ${(new Date(timestamp).toTimeString())} after 'notAfter' ${(new Date(notAfter).toTimeString())} with tolerance of ${tolerance / 1000}s`), ['invalid timestamp']);
    }
}

function isObject(v) {
    return Object.prototype.toString.call(v) === '[object Object]';
}
function jsonSort(obj) {
    if (Array.isArray(obj)) {
        return obj.sort().map(jsonSort); // eslint-disable-line
    }
    else if (isObject(obj)) {
        return Object
            .keys(obj)
            .sort()
            .reduce(function (a, k) {
            a[k] = jsonSort(obj[k]);
            return a;
        }, {});
    }
    return obj;
}

function parseHex(a, prefix0x = false) {
    const hexMatch = a.match(/^(0x)?([\da-fA-F]+)$/);
    if (hexMatch == null) {
        throw new NrError(new RangeError('input must be a hexadecimal string, e.g. \'0x124fe3a\' or \'0214f1b2\''), ['invalid format']);
    }
    const hex = hexMatch[2].toLocaleLowerCase();
    return (prefix0x) ? '0x' + hex : hex;
}

async function parseJwk(jwk, stringify) {
    try {
        await importJwk(jwk, jwk.alg);
        const sortedJwk = jsonSort(jwk);
        return (stringify) ? JSON.stringify(sortedJwk) : sortedJwk;
    }
    catch (error) {
        throw new NrError(error, ['invalid key']);
    }
}

async function sha(input, algorithm) {
    const algorithms = ['SHA-256', 'SHA-384', 'SHA-512'];
    if (!algorithms.includes(algorithm)) {
        throw new NrError(new RangeError(`Valid hash algorith values are any of ${JSON.stringify(algorithms)}`), ['invalid algorithm']);
    }
    const encoder = new TextEncoder();
    const hashInput = (typeof input === 'string') ? encoder.encode(input).buffer : input;
    try {
        let digest;
        if (false) ;
        else {
            const nodeAlg = algorithm.toLowerCase().replace('-', '');
            digest = new Uint8Array(require('crypto').createHash(nodeAlg).update(Buffer.from(hashInput)).digest()); // eslint-disable-line
        }
        return digest;
    }
    catch (error) {
        throw new NrError(error, ['unexpected error']);
    }
}

/**
 * Just in case the PoP is not received, the secret can be downloaded from the ledger.
 * The secret should be downloaded before poo.iat + pooToPop max delay.
 * @param contract - an Ethers Contract
 * @param signerAddress - the address (hexadecimal) of the entity publishing the secret.
 * @param exchangeId - the id of the data exchange
 * @param timeout - the timeout in seconds for waiting for the secret to be published on the ledger
 * @returns
 */
async function getSecretFromLedger(contract, signerAddress, exchangeId, timeout = 0) {
    let secretBn = ethers.ethers.BigNumber.from(0);
    let timestampBn = ethers.ethers.BigNumber.from(0);
    const exchangeIdHex = parseHex(bigintConversion.bufToHex(b64__namespace.decode(exchangeId)), true);
    let counter = 0;
    do {
        try {
            ({ secret: secretBn, timestamp: timestampBn } = await contract.registry(parseHex(signerAddress, true), exchangeIdHex));
        }
        catch (error) {
            throw new NrError(error, ['cannot contact the ledger']);
        }
        if (secretBn.isZero()) {
            counter++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } while (secretBn.isZero() && counter < timeout);
    if (secretBn.isZero()) {
        throw new NrError(new Error(`timeout of ${timeout}s exceeded when querying the ledger and secret still not published`), ['secret not published']);
    }
    const hex = parseHex(secretBn.toHexString(), false);
    const iat = timestampBn.toNumber();
    return { hex, iat };
}

/**
 * Returns the exchangeId of the data exchange. The id is computed hashing an object with
 * all the properties of the data exchange but the id.
 *   id = BASE64URL(SHA256(hashable(dataExchangeButId)))
 * @param exchange - a complete data exchange without an id
 * @returns the exchange id in hexadecimal
 */
async function exchangeId(exchange) {
    return b64__namespace.encode(await sha(objectSha.hashable(exchange), 'SHA-256'), true, false);
}

const HASH_ALGS = ['SHA-256', 'SHA-384', 'SHA-512'];
const SIGNING_ALGS = ['ES256', 'ES384', 'ES512']; // ECDSA with secp256k1 (ES256K) Edwards Curve DSA are not supported in browsers
const ENC_ALGS = ['A128GCM', 'A256GCM']; // A192GCM is not supported in browsers

function parseTimestamp(timestamp) {
    if ((new Date(timestamp)).getTime() > 0) {
        return Number(timestamp);
    }
    else {
        throw new NrError(new Error('invalid timestamp'), ['invalid timestamp']);
    }
}
async function parseAgreement(agreement) {
    const parsedAgreement = { ...agreement };
    const agreementClaims = Object.keys(parsedAgreement);
    if (agreementClaims.length < 10 || agreementClaims.length > 11) {
        throw new NrError(new Error('Invalid agreeemt: ' + JSON.stringify(agreement, undefined, 2)), ['invalid format']);
    }
    for (const key of agreementClaims) {
        switch (key) {
            case 'orig':
            case 'dest':
                parsedAgreement[key] = await parseJwk(JSON.parse(agreement[key]), true);
                break;
            case 'ledgerContractAddress':
            case 'ledgerSignerAddress':
                parsedAgreement[key] = parseHex(parsedAgreement[key], true);
                break;
            case 'pooToPorDelay':
            case 'pooToPopDelay':
            case 'pooToSecretDelay':
                parsedAgreement[key] = parseTimestamp(parsedAgreement[key]);
                break;
            case 'hashAlg':
                if (!HASH_ALGS.includes(parsedAgreement[key])) {
                    throw new NrError(new Error('Invalid hash algorithm'), ['invalid algorithm']);
                }
                break;
            case 'encAlg':
                if (!ENC_ALGS.includes(parsedAgreement[key])) {
                    throw new NrError(new Error('Invalid hash algorithm'), ['invalid algorithm']);
                }
                break;
            case 'signingAlg':
                if (!SIGNING_ALGS.includes(parsedAgreement[key])) {
                    throw new NrError(new Error('Invalid hash algorithm'), ['invalid algorithm']);
                }
                break;
            case 'schema':
                break;
            default:
                throw new NrError(new Error(`Property ${key} not allowed in dataAgreement`), ['invalid format']);
        }
    }
    return parsedAgreement;
}

/**
 * Creates a non-repudiable proof for a given data exchange
 * @param payload - the payload to be added to the proof.
 *                  `payload.iss` must be either the origin 'orig' or the destination 'dest' of the data exchange
 *                  `payload.iat` shall be ommitted since it will be automatically added when signing (`Date.now()`)
 * @param privateJwk - The private key in JWK that will sign the proof
 * @returns a proof as a compact JWS formatted JWT string
 */
async function createProof(payload, privateJwk) {
    if (payload.iss === undefined) {
        throw new Error('Payload iss should be set to either "orig" or "dest"');
    }
    // Check that that the privateKey is the complement to the public key of the issuer
    const publicJwk = JSON.parse(payload.exchange[payload.iss]);
    await verifyKeyPair(publicJwk, privateJwk); // if verification fails it throws an error and the following is not executed
    const privateKey = await importJwk(privateJwk);
    const alg = privateJwk.alg; // if alg were undefined verifyKeyPair would have thrown an error
    const proofPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000)
    };
    const jws = await new jose.SignJWT(proofPayload)
        .setProtectedHeader({ alg })
        .setIssuedAt(proofPayload.iat)
        .sign(privateKey);
    return {
        jws,
        payload: proofPayload
    };
}

/**
 * Verify a proof
 * @param proof - a non-repudiable proof in Compact JWS formatted JWT string
 *
 * @param expectedPayloadClaims - The expected values of the proof's payload claims. An expected value of '' can be use to just check that the claim is in the payload. An example could be:
 * {
 *   proofType: 'PoO',
 *   iss: 'orig',
 *   exchange: {
 *     id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
 *     orig: '{"kty":"EC","x":"rPMP39e-o8cU6m4WL8_qd2wxo-nBTjWXZtPGBiiGCTY","y":"0uvxGEebFDxKOHYUlHREzq4mRULuZvQ6LB2I11yE1E0","crv":"P-256"}', // Public key in JSON.stringify(JWK) of the block origin (sender)
 *     dest: '{"kty":"EC","x":"qf_mNdy57ia1vAq5QLpTPxJUCRhS2003-gL0nLcbXoA","y":"H_8YwSCKJhDbZv17YEgDfAiKTaQ8x0jpLYCC2myxAeY","crv":"P-256"}', // Public key in JSON.stringify(JWK) of the block destination (receiver)
 *     hash_alg: 'SHA-256',
 *     cipherblock_dgst: 'IBUIstf98_afbiuh7UaifkasytNih7as-Jah61ls9UI', // hash of the cipherblock in base64url with no padding
 *     block_commitment: '', // hash of the plaintext block in base64url with no padding
 *     secret_commitment: '' // hash of the secret that can be used to decrypt the block in base64url with no padding
 *   }
 * }
 *
 * @param options - specifies a time window to accept the proof
 *
 * @returns The JWT protected header and payload if the proof is validated
 */
async function verifyProof(proof, expectedPayloadClaims, options) {
    const publicJwk = JSON.parse(expectedPayloadClaims.exchange[expectedPayloadClaims.iss]);
    const verification = await jwsDecode(proof, publicJwk);
    if (verification.payload.iss === undefined) {
        throw new Error('Property "iss" missing');
    }
    if (verification.payload.iat === undefined) {
        throw new Error('Property claim iat missing');
    }
    if (options !== undefined) {
        const timestamp = (options.timestamp === 'iat') ? verification.payload.iat * 1000 : options.timestamp;
        const notBefore = (options.notBefore === 'iat') ? verification.payload.iat * 1000 : options.notBefore;
        const notAfter = (options.notAfter === 'iat') ? verification.payload.iat * 1000 : options.notAfter;
        checkTimestamp(timestamp, notBefore, notAfter, options.tolerance);
    }
    const payload = verification.payload;
    // Check that the publicKey is the public key of the issuer
    const issuer = payload.exchange[payload.iss];
    if (objectSha.hashable(publicJwk) !== objectSha.hashable(JSON.parse(issuer))) {
        throw new Error(`The proof is issued by ${issuer} instead of ${JSON.stringify(publicJwk)}`);
    }
    const expectedClaimsDict = expectedPayloadClaims;
    for (const key in expectedClaimsDict) {
        if (payload[key] === undefined)
            throw new Error(`Expected key '${key}' not found in proof`);
        if (key === 'exchange') {
            const expectedDataExchange = expectedPayloadClaims.exchange;
            const dataExchange = payload.exchange;
            checkDataExchange(dataExchange, expectedDataExchange);
        }
        else if (expectedClaimsDict[key] !== '' && objectSha.hashable(expectedClaimsDict[key]) !== objectSha.hashable(payload[key])) {
            throw new Error(`Proof's ${key}: ${JSON.stringify(payload[key], undefined, 2)} does not meet provided value ${JSON.stringify(expectedClaimsDict[key], undefined, 2)}`);
        }
    }
    return verification;
}
/**
 * Checks whether a dataExchange claims meet the expected ones
 */
function checkDataExchange(dataExchange, expectedDataExchange) {
    // First, let us check that the dataExchange is complete
    const claims = ['id', 'orig', 'dest', 'hashAlg', 'cipherblockDgst', 'blockCommitment', 'blockCommitment', 'secretCommitment', 'schema'];
    for (const claim of claims) {
        if (claim !== 'schema' && (dataExchange[claim] === undefined || dataExchange[claim] === '')) {
            throw new Error(`${claim} is missing on dataExchange.\ndataExchange: ${JSON.stringify(dataExchange, undefined, 2)}`);
        }
    }
    // And now let's check the expected values
    for (const key in expectedDataExchange) {
        if (expectedDataExchange[key] !== '' && objectSha.hashable(expectedDataExchange[key]) !== objectSha.hashable(dataExchange[key])) {
            throw new Error(`dataExchange's ${key}: ${JSON.stringify(dataExchange[key], undefined, 2)} does not meet expected value ${JSON.stringify(expectedDataExchange[key], undefined, 2)}`);
        }
    }
}

async function verifyPor(por, dltContract) {
    const { payload: porPayload } = await jwsDecode(por);
    const exchange = porPayload.exchange;
    const dataExchangePreview = { ...exchange };
    // @ts-expect-error
    delete dataExchangePreview.id;
    const expectedExchangeId = await exchangeId(dataExchangePreview);
    if (expectedExchangeId !== exchange.id) {
        throw new NrError(new Error('data exchange integrity failed'), ['dataExchange integrity violated']);
    }
    const destPublicJwk = JSON.parse(exchange.dest);
    const origPublicJwk = JSON.parse(exchange.orig);
    let pooPayload;
    try {
        const verified = await verifyProof(porPayload.poo, {
            iss: 'orig',
            proofType: 'PoO',
            exchange
        });
        pooPayload = verified.payload;
    }
    catch (error) {
        throw new NrError(error, ['invalid poo']);
    }
    try {
        await verifyProof(por, {
            iss: 'dest',
            proofType: 'PoR',
            exchange
        }, {
            timestamp: 'iat',
            notBefore: pooPayload.iat * 1000,
            notAfter: pooPayload.iat * 1000 + exchange.pooToPorDelay
        });
    }
    catch (error) {
        throw new NrError(error, ['invalid por']);
    }
    let secretHex, iat;
    try {
        const secret = await getSecretFromLedger(dltContract, exchange.ledgerSignerAddress, exchange.id);
        secretHex = secret.hex;
        iat = secret.iat;
    }
    catch (error) {
        throw new NrError(error, ['cannot verify']);
    }
    try {
        checkTimestamp(iat * 1000, porPayload.iat * 1000, pooPayload.iat * 1000 + exchange.pooToSecretDelay);
    }
    catch (error) {
        throw new NrError(`Although the secret has been obtained (and you could try to decrypt the cipherblock), it's been published later than agreed: ${(new Date(iat * 1000)).toUTCString()} > ${(new Date(pooPayload.iat * 1000 + exchange.pooToSecretDelay)).toUTCString()}`, ['secret not published in time']);
    }
    return {
        pooPayload,
        porPayload,
        secretHex,
        destPublicJwk,
        origPublicJwk
    };
}

/**
 * Checks the completeness of a given data exchange by verifying the PoR in the verification request using the secret downloaded from the ledger
 *
 * @param verificationRequest
 * @param dltContract
 * @returns
 */
async function checkCompleteness(verificationRequest, dltContract) {
    let vrPayload;
    try {
        const decoded = await jwsDecode(verificationRequest);
        vrPayload = decoded.payload;
    }
    catch (error) {
        throw new NrError(error, ['invalid verification request']);
    }
    let destPublicJwk, origPublicJwk, pooPayload, porPayload;
    try {
        const verified = await verifyPor(vrPayload.por, dltContract);
        destPublicJwk = verified.destPublicJwk;
        origPublicJwk = verified.origPublicJwk;
        pooPayload = verified.pooPayload;
        porPayload = verified.porPayload;
    }
    catch (error) {
        throw new NrError(error, ['invalid por', 'invalid verification request']);
    }
    try {
        await jwsDecode(verificationRequest, (vrPayload.iss === 'dest') ? destPublicJwk : origPublicJwk);
    }
    catch (error) {
        throw new NrError(error, ['invalid verification request']);
    }
    return {
        pooPayload,
        porPayload,
        vrPayload,
        destPublicJwk,
        origPublicJwk
    };
}

/**
 * Check if the cipherblock in the disputeRequest is the one agreed for the dataExchange, and if it could be decrypted with the secret published on the ledger for that dataExchange.
 *
 * @param disputeRequest a dispute request as a compact JWS
 * @param dltContract
 * @returns
 */
async function checkDecryption(disputeRequest, dltContract) {
    const { payload: drPayload } = await jwsDecode(disputeRequest);
    const { destPublicJwk, origPublicJwk, secretHex, pooPayload, porPayload } = await verifyPor(drPayload.por, dltContract);
    try {
        await jwsDecode(disputeRequest, destPublicJwk);
    }
    catch (error) {
        if (error instanceof NrError) {
            error.add('invalid dispute request');
        }
        throw error;
    }
    const cipherblockDgst = b64__namespace.encode(await sha(drPayload.cipherblock, porPayload.exchange.hashAlg), true, false);
    if (cipherblockDgst !== porPayload.exchange.cipherblockDgst) {
        throw new NrError(new Error('cipherblock does not meet the committed (and already accepted) one'), ['invalid dispute request']);
    }
    await jweDecrypt(drPayload.cipherblock, (await (oneTimeSecret(porPayload.exchange.encAlg, secretHex))).jwk);
    /**
     * TO-DO: check schema!
     */
    return {
        pooPayload,
        porPayload,
        drPayload,
        destPublicJwk,
        origPublicJwk
    };
}

/**
 * The base class that should be instantiated in order to create a Conflict Resolver instance.
 * The Conflict Resolver is an external entity that can:
 *  1. verify the completeness of a data exchange that used the non-repudiation protocol;
 *  2. resolve a dispute when a consumer states that she/he cannot decrypt the data received
 */
class ConflictResolver {
    /**
     *
     * @param jwkPair a pair of public/private keys in JWK format
     * @param dltConfig
     */
    constructor(jwkPair, dltConfig) {
        this.jwkPair = jwkPair;
        this.dltConfig = {
            ...defaultDltConfig,
            ...dltConfig
        };
        this.dltConfig.contract.address = parseHex(this.dltConfig.contract.address, true); // prefix '0x' to the contract address (just in case it is not there)
        this._dltSetup();
        this.initialized = new Promise((resolve, reject) => {
            this.init().then(() => {
                resolve(true);
            }).catch((error) => {
                reject(error);
            });
        });
    }
    _dltSetup() {
        if (!this.dltConfig.disable) {
            const rpcProvider = new ethers.ethers.providers.JsonRpcProvider(this.dltConfig.rpcProviderUrl);
            this.dltContract = new ethers.ethers.Contract(this.dltConfig.contract.address, this.dltConfig.contract.abi, rpcProvider);
        }
    }
    /**
     * Initialize this instance.
     */
    async init() {
        await verifyKeyPair(this.jwkPair.publicJwk, this.jwkPair.privateJwk);
    }
    /**
     * Checks if a give data exchange has completed succesfully
     *
     * @param verificationRequest
     * @returns a signed resolution
     */
    async resolveCompleteness(verificationRequest) {
        await this.initialized;
        const { payload: vrPayload } = await jwsDecode(verificationRequest);
        let porPayload;
        try {
            const decoded = await jwsDecode(vrPayload.por);
            porPayload = decoded.payload;
        }
        catch (error) {
            throw new NrError(error, ['invalid por']);
        }
        const verificationResolution = {
            ...await this._resolution(vrPayload.dataExchangeId, porPayload.exchange[vrPayload.iss]),
            resolution: 'not completed',
            type: 'verification'
        };
        try {
            await checkCompleteness(verificationRequest, this.dltContract);
            verificationResolution.resolution = 'completed';
        }
        catch (error) {
            if (!(error instanceof NrError) ||
                error.nrErrors.includes('invalid verification request') || error.nrErrors.includes('unexpected error')) {
                throw error;
            }
        }
        const privateKey = await jose.importJWK(this.jwkPair.privateJwk);
        return await new jose.SignJWT(verificationResolution)
            .setProtectedHeader({ alg: this.jwkPair.privateJwk.alg })
            .setIssuedAt(verificationResolution.iat)
            .sign(privateKey);
    }
    /**
     * Checks if the cipherblock provided in a data exchange can be decrypted
     * with the published secret.
     *
     * @todo Check also data schema
     *
     * @param disputeRequest
     * @returns a signed resolution
     */
    async resolveDispute(disputeRequest) {
        await this.initialized;
        const { payload: drPayload } = await jwsDecode(disputeRequest);
        let porPayload;
        try {
            const decoded = await jwsDecode(drPayload.por);
            porPayload = decoded.payload;
        }
        catch (error) {
            throw new NrError(error, ['invalid por']);
        }
        const disputeResolution = {
            ...await this._resolution(drPayload.dataExchangeId, porPayload.exchange[drPayload.iss]),
            resolution: 'denied',
            type: 'dispute'
        };
        try {
            await checkDecryption(disputeRequest, this.dltContract);
        }
        catch (error) {
            if (error instanceof NrError && error.nrErrors.includes('decryption failed')) {
                disputeResolution.resolution = 'accepted';
            }
            else {
                throw new NrError(error, ['cannot verify']);
            }
        }
        const privateKey = await jose.importJWK(this.jwkPair.privateJwk);
        return await new jose.SignJWT(disputeResolution)
            .setProtectedHeader({ alg: this.jwkPair.privateJwk.alg })
            .setIssuedAt(disputeResolution.iat)
            .sign(privateKey);
    }
    async _resolution(dataExchangeId, sub) {
        return {
            proofType: 'resolution',
            dataExchangeId,
            iat: Math.floor(Date.now() / 1000),
            iss: await parseJwk(this.jwkPair.publicJwk, true),
            sub
        };
    }
}

async function generateVerificationRequest(iss, dataExchangeId, por, privateJwk) {
    const payload = {
        proofType: 'request',
        iss,
        dataExchangeId,
        por,
        type: 'verificationRequest',
        iat: Math.floor(Date.now() / 1000)
    };
    const privateKey = await jose.importJWK(privateJwk);
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: privateJwk.alg })
        .setIssuedAt(payload.iat)
        .sign(privateKey);
}

async function verifyResolution(resolution, pubJwk) {
    return await jwsDecode(resolution, pubJwk ?? ((header, payload) => {
        return JSON.parse(payload.iss);
    }));
}

var index$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    checkCompleteness: checkCompleteness,
    checkDecryption: checkDecryption,
    ConflictResolver: ConflictResolver,
    generateVerificationRequest: generateVerificationRequest,
    verifyPor: verifyPor,
    verifyResolution: verifyResolution
});

/**
 * The base class that should be instantiated by the destination of a data
 * exchange when non-repudiation is required. In the i3-MARKET ecosystem it is
 * likely to be a Consumer.
 */
class NonRepudiationDest {
    /**
     * @param agreement - a DataExchangeAgreement
     * @param privateJwk - the private key that will be used to sign the proofs
     * @param dltConfig - an object with the necessary configuration for the (Ethereum-like) DLT
     */
    constructor(agreement, privateJwk, dltConfig) {
        this.jwkPairDest = {
            privateJwk: privateJwk,
            publicJwk: JSON.parse(agreement.dest)
        };
        this.publicJwkOrig = JSON.parse(agreement.orig);
        this.block = {};
        this.dltConfig = {
            ...defaultDltConfig,
            ...dltConfig
        };
        this.initialized = new Promise((resolve, reject) => {
            this.init(agreement).then(() => {
                resolve(true);
            }).catch((error) => {
                reject(error);
            });
        });
    }
    _dltSetup() {
        if (!this.dltConfig.disable) {
            const rpcProvider = new ethers.ethers.providers.JsonRpcProvider(this.dltConfig.rpcProviderUrl);
            if (parseHex(this.agreement.ledgerContractAddress) !== parseHex(this.dltConfig.contract.address)) {
                throw new Error(`Contract address ${this.dltConfig.contract.address} does not meet agreed one ${this.agreement.ledgerContractAddress}`);
            }
            this.dltContract = new ethers.ethers.Contract(this.agreement.ledgerContractAddress, this.dltConfig.contract.abi, rpcProvider);
        }
    }
    async init(agreement) {
        this.agreement = await parseAgreement(agreement);
        this._dltSetup();
        await verifyKeyPair(this.jwkPairDest.publicJwk, this.jwkPairDest.privateJwk);
    }
    /**
     * Verifies a proof of origin against the received cipherblock.
     * If verification passes, `pop` and `cipherblock` are added to this.block
     *
     * @param poo - a Proof of Origin (PoO) in compact JWS format
     * @param cipherblock - a cipherblock as a JWE
     * @param options - time verification options
     * @returns the verified payload and protected header
     *
     */
    async verifyPoO(poo, cipherblock, options) {
        await this.initialized;
        const cipherblockDgst = b64__namespace.encode(await sha(cipherblock, this.agreement.hashAlg), true, false);
        const { payload } = await jwsDecode(poo);
        const dataExchangePreview = {
            ...this.agreement,
            cipherblockDgst,
            blockCommitment: payload.exchange.blockCommitment,
            secretCommitment: payload.exchange.secretCommitment
        };
        const dataExchange = {
            ...dataExchangePreview,
            id: await exchangeId(dataExchangePreview)
        };
        const expectedPayloadClaims = {
            proofType: 'PoO',
            iss: 'orig',
            exchange: dataExchange
        };
        const currentTimestamp = Date.now();
        const opts = {
            timestamp: currentTimestamp,
            notBefore: 'iat',
            notAfter: 'iat',
            ...options
        };
        const verified = await verifyProof(poo, expectedPayloadClaims, opts);
        this.block = {
            jwe: cipherblock,
            poo: {
                jws: poo,
                payload: verified.payload
            }
        };
        this.exchange = verified.payload.exchange;
        return verified;
    }
    /**
     * Creates the proof of reception (PoR).
     * Besides returning its value, it is also stored in `this.block.por`
     *
     * @returns the PoR as a compact JWS along with its decoded payload
     */
    async generatePoR() {
        await this.initialized;
        if (this.exchange === undefined || this.block.poo === undefined) {
            throw new Error('Before computing a PoR, you have first to receive a valid cipherblock with a PoO and validate the PoO');
        }
        const payload = {
            proofType: 'PoR',
            iss: 'dest',
            exchange: this.exchange,
            poo: this.block.poo.jws
        };
        this.block.por = await createProof(payload, this.jwkPairDest.privateJwk);
        return this.block.por;
    }
    /**
     * Verifies a received Proof of Publication (PoP) and returns the secret
     * @param pop - a PoP in compact JWS
     * @param options - time related options for verification
     * @returns the verified payload (that includes the secret that can be used to decrypt the cipherblock) and protected header
     */
    async verifyPoP(pop, options) {
        await this.initialized;
        if (this.exchange === undefined || this.block.por === undefined || this.block.poo === undefined) {
            throw new Error('Cannot verify a PoP if not even a PoR have been created');
        }
        const expectedPayloadClaims = {
            proofType: 'PoP',
            iss: 'orig',
            exchange: this.exchange,
            por: this.block.por.jws,
            secret: '',
            verificationCode: ''
        };
        const opts = {
            timestamp: Date.now(),
            notBefore: 'iat',
            notAfter: this.block.poo.payload.iat * 1000 + this.exchange.pooToPopDelay,
            ...options
        };
        const verified = await verifyProof(pop, expectedPayloadClaims, opts);
        const secret = JSON.parse(verified.payload.secret);
        this.block.secret = {
            hex: bigintConversion.bufToHex(b64__namespace.decode(secret.k)),
            jwk: secret
        };
        this.block.pop = {
            jws: pop,
            payload: verified.payload
        };
        return verified;
    }
    /**
     * Just in case the PoP is not received, the secret can be downloaded from the ledger.
     * The secret should be downloaded before poo.iat + pooToPop max delay.
     *
     * @returns the secret
     */
    async getSecretFromLedger() {
        await this.initialized;
        if (this.exchange === undefined || this.block.poo === undefined || this.block.por === undefined) {
            throw new Error('Cannot get secret if a PoR has not been sent before');
        }
        const currentTimestamp = Date.now();
        const maxTimeForSecret = this.block.poo.payload.iat * 1000 + this.agreement.pooToSecretDelay;
        const timeout = Math.round((maxTimeForSecret - currentTimestamp) / 1000);
        const { hex: secretHex, iat } = await getSecretFromLedger(this.dltContract, this.agreement.ledgerSignerAddress, this.exchange.id, timeout);
        this.block.secret = await oneTimeSecret(this.exchange.encAlg, secretHex);
        try {
            checkTimestamp(iat * 1000, this.block.por.payload.iat * 1000, this.block.poo.payload.iat * 1000 + this.exchange.pooToSecretDelay);
        }
        catch (error) {
            throw new NrError(`Although the secret has been obtained (and you could try to decrypt the cipherblock), it's been published later than agreed: ${(new Date(iat * 1000)).toUTCString()} > ${(new Date(this.block.poo.payload.iat * 1000 + this.agreement.pooToSecretDelay)).toUTCString()}`, ['secret not published in time']);
        }
        return this.block.secret;
    }
    /**
     * Decrypts the cipherblock once all the previous proofs have been verified
     * @returns the decrypted block
     */
    async decrypt() {
        await this.initialized;
        if (this.exchange === undefined) {
            throw new Error('No agreed exchange');
        }
        if (this.block.secret?.jwk === undefined) {
            throw new Error('Cannot decrypt without the secret');
        }
        if (this.block.jwe === undefined) {
            throw new Error('No cipherblock to decrypt');
        }
        const decryptedBlock = (await jweDecrypt(this.block.jwe, this.block.secret.jwk)).plaintext;
        const decryptedDgst = b64__namespace.encode(await sha(decryptedBlock, this.agreement.hashAlg), true, false);
        if (decryptedDgst !== this.exchange.blockCommitment) {
            throw new Error('Decrypted block does not meet the committed one');
        }
        this.block.raw = decryptedBlock;
        return decryptedBlock;
    }
    /**
     * Generates a verification request that can be used to query the
     * Conflict-Resolver Service for completeness of the non-repudiation protocol
     *
     * @returns the verification request as a compact JWS signed with 'dest's private key
     */
    async generateVerificationRequest() {
        await this.initialized;
        if (this.block.por === undefined || this.exchange === undefined) {
            throw new Error('Before generating a VerificationRequest, you have first to hold a valid PoR for the exchange');
        }
        return await generateVerificationRequest('dest', this.exchange.id, this.block.por.jws, this.jwkPairDest.privateJwk);
    }
    /**
     * Generates a dispute request that can be used to query the
     * Conflict-Resolver Service regarding impossibility to decrypt the cipherblock with the received secret
     *
     * @returns the dispute request as a compact JWS signed with 'dest's private key
     */
    async generateDisputeRequest() {
        await this.initialized;
        if (this.block.por === undefined || this.block.jwe === undefined || this.exchange === undefined) {
            throw new Error('Before generating a VerificationRequest, you have first to hold a valid PoR for the exchange and have received the cipherblock');
        }
        const payload = {
            proofType: 'request',
            iss: 'dest',
            por: this.block.por.jws,
            type: 'disputeRequest',
            cipherblock: this.block.jwe,
            iat: Math.floor(Date.now() / 1000),
            dataExchangeId: this.exchange.id
        };
        const privateKey = await importJwk(this.jwkPairDest.privateJwk);
        try {
            const jws = await new jose.SignJWT(payload)
                .setProtectedHeader({ alg: this.jwkPairDest.privateJwk.alg })
                .setIssuedAt(payload.iat)
                .sign(privateKey);
            return jws;
        }
        catch (error) {
            throw new NrError(error, ['unexpected error']);
        }
    }
}

/**
 * A ledger signer using an ethers.io Wallet.
 */
class EthersSigner {
    /**
     *
     * @param provider
     * @param privateKey the private key as an hexadecimal string ot Uint8Array
     */
    constructor(provider, privateKey) {
        const privKey = (typeof privateKey === 'string') ? new Uint8Array(bigintConversion.hexToBuf(privateKey)) : privateKey;
        const signingKey$1 = new signingKey.SigningKey(privKey);
        this.signer = new wallet.Wallet(signingKey$1, provider);
    }
    async signTransaction(transaction) {
        return await this.signer.signTransaction(transaction);
    }
}

/**
 * An abstract class that should be implemeneted by any signer for the ledger.
 * A SW-based ethers.io Walllet is provided (EthersSigner) as a reference implementation
 */
class DltSigner {
    async signTransaction(transaction) {
        throw new Error('not implemented');
    }
}

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    EthersSigner: EthersSigner,
    DltSigner: DltSigner
});

/**
 * The base class that should be instantiated by the origin of a data
 * exchange when non-repudiation is required. In the i3-MARKET ecosystem it is
 * likely to be a Provider.
 */
class NonRepudiationOrig {
    /**
     * @param agreement - a DataExchangeAgreement
     * @param privateJwk - the private key that will be used to sign the proofs
     * @param block - the block of data to transmit in this data exchange
     * @param dltConfig - an object with the necessary configuration for the (Ethereum-like) DLT
     * @param privateLedgerKeyHex - the private key (d parameter) as a hexadecimal string used to sign transactions to the ledger. If not provided, it is assumed that a DltSigner is provided in the dltConfig
     */
    constructor(agreement, privateJwk, block, dltConfig, privateLedgerKeyHex) {
        this.jwkPairOrig = {
            privateJwk: privateJwk,
            publicJwk: JSON.parse(agreement.orig)
        };
        this.publicJwkDest = JSON.parse(agreement.dest);
        // @ts-expect-error I will end assigning the complete Block in the async init()
        this.block = {
            raw: block
        };
        // @ts-expect-error I will end assigning the complete dltConfig in the async init()
        this.dltConfig = {
            ...defaultDltConfig,
            ...dltConfig
        };
        this.initialized = new Promise((resolve, reject) => {
            this.init(agreement, privateLedgerKeyHex).then(() => {
                resolve(true);
            }).catch((error) => {
                reject(error);
            });
        });
    }
    async init(agreement, privateLedgerKeyHex) {
        this.agreement = await parseAgreement(agreement);
        await verifyKeyPair(this.jwkPairOrig.publicJwk, this.jwkPairOrig.privateJwk);
        const secret = await oneTimeSecret(this.agreement.encAlg);
        this.block = {
            ...this.block,
            secret,
            jwe: await jweEncrypt(this.block.raw, secret.jwk, this.agreement.encAlg)
        };
        const cipherblockDgst = b64__namespace.encode(await sha(this.block.jwe, this.agreement.hashAlg), true, false);
        const blockCommitment = b64__namespace.encode(await sha(this.block.raw, this.agreement.hashAlg), true, false);
        const secretCommitment = b64__namespace.encode(await sha(new Uint8Array(bigintConversion.hexToBuf(this.block.secret.hex)), this.agreement.hashAlg), true, false);
        const dataExchangePreview = {
            ...this.agreement,
            cipherblockDgst,
            blockCommitment,
            secretCommitment
        };
        const id = await exchangeId(dataExchangePreview);
        this.exchange = {
            ...dataExchangePreview,
            id
        };
        await this._dltSetup(privateLedgerKeyHex);
    }
    async _dltSetup(privateLedgerKeyHex) {
        if (!this.dltConfig.disable) {
            const rpcProvider = new ethers.ethers.providers.JsonRpcProvider(this.dltConfig.rpcProviderUrl);
            if (this.jwkPairOrig.privateJwk.d === undefined) {
                throw new Error('INVALID SIGNING ALGORITHM: No d property found on private key');
            }
            if (privateLedgerKeyHex !== undefined) {
                this.dltConfig.signer = new EthersSigner(rpcProvider, privateLedgerKeyHex);
            }
            if (this.dltConfig.signer === undefined) {
                throw new Error('Either a dltConfig.signer or a privateLedgerKeyHex MUST be provided.');
            }
            // TO-DO: we need an implementation on DltSigner class:
            // const signerAddress: string = parseHex(await signer.getAddress())
            // if (signerAddress !== this.exchange.ledgerSignerAddress) {
            //   throw new Error(`ledgerSignerAddress: ${this.exchange.ledgerSignerAddress} does not meet the address associated to the provided private key ${signerAddress}`)
            // }
            if (parseHex(this.agreement.ledgerContractAddress) !== parseHex(this.dltConfig.contract.address)) {
                throw new Error(`Contract address ${this.dltConfig.contract.address} does not meet agreed one ${this.agreement.ledgerContractAddress}`);
            }
            this.dltContract = new ethers.ethers.Contract(this.agreement.ledgerContractAddress, this.dltConfig.contract.abi, rpcProvider);
        }
    }
    /**
     * Creates the proof of origin (PoO).
     * Besides returning its value, it is also stored in this.block.poo
     *
     * @returns a compact JWS with the PoO along with its decoded payload
     */
    async generatePoO() {
        await this.initialized;
        this.block.poo = await createProof({
            proofType: 'PoO',
            iss: 'orig',
            exchange: this.exchange
        }, this.jwkPairOrig.privateJwk);
        return this.block.poo;
    }
    /**
     * Verifies a proof of reception.
     * If verification passes, `por` is added to `this.block`
     *
     * @param por - A PoR in caompact JWS format
     * @param options - time-related verifications
     * @returns the verified payload and protected header
     */
    async verifyPoR(por, options) {
        await this.initialized;
        if (this.block.poo === undefined) {
            throw new Error('Cannot verify a PoR if not even a PoO have been created');
        }
        const expectedPayloadClaims = {
            proofType: 'PoR',
            iss: 'dest',
            exchange: this.exchange,
            poo: this.block.poo.jws
        };
        const pooTs = this.block.poo.payload.iat * 1000;
        const opts = {
            timestamp: Date.now(),
            notBefore: pooTs,
            notAfter: pooTs + this.exchange.pooToPorDelay,
            ...options
        };
        const verified = await verifyProof(por, expectedPayloadClaims, opts);
        this.block.por = {
            jws: por,
            payload: verified.payload
        };
        return this.block.por;
    }
    /**
     * Creates the proof of publication (PoP).
     * Besides returning its value, it is also stored in `this.block.pop`
     *
     * @returns a compact JWS with the PoP
     */
    async generatePoP() {
        await this.initialized;
        if (this.block.por === undefined) {
            throw new Error('Before computing a PoP, you have first to have received and verified the PoR');
        }
        let verificationCode = 'verificationCode';
        if (!this.dltConfig.disable) {
            const secret = ethers.ethers.BigNumber.from(`0x${this.block.secret.hex}`);
            const exchangeIdHex = parseHex(bigintConversion.bufToHex(b64__namespace.decode(this.exchange.id)), true);
            const tx = await this.dltContract.populateTransaction.setRegistry(exchangeIdHex, secret, { gasLimit: this.dltConfig.gasLimit });
            // ethers.utils.serializeTransaction(tx)
            tx.nonce = await this.dltContract.provider.getTransactionCount(this.exchange.ledgerSignerAddress);
            tx.gasPrice = await this.dltContract.provider.getGasPrice();
            tx.chainId = (await this.dltContract.provider.getNetwork()).chainId;
            const signedTx = await this.dltConfig.signer.signTransaction(tx);
            const setRegistryTx = await this.dltContract.provider.sendTransaction(signedTx);
            // TO-DO: it fails with a random account since it hasn't got any funds (ethers). Do we have a faucet? Set gas prize to 0?
            // const setRegistryTx = await this.dltContract.setRegistry(`0x${this.exchange.id}`, secret, { gasLimit: this.dltConfig.gasLimit })
            verificationCode = setRegistryTx.hash;
            // TO-DO: I would say that we can remove the next wait
            // await setRegistryTx.wait()
        }
        const payload = {
            proofType: 'PoP',
            iss: 'orig',
            exchange: this.exchange,
            por: this.block.por.jws,
            secret: JSON.stringify(this.block.secret.jwk),
            verificationCode
        };
        this.block.pop = await createProof(payload, this.jwkPairOrig.privateJwk);
        return this.block.pop;
    }
    /**
     * Generates a verification request that can be used to query the
     * Conflict-Resolver Service for completeness of the non-repudiation protocol
     *
     * @returns the verification request as a compact JWS signed with 'orig's private key
     */
    async generateVerificationRequest() {
        await this.initialized;
        if (this.block.por === undefined) {
            throw new Error('Before generating a VerificationRequest, you have first to hold a valid PoR for the exchange');
        }
        return await generateVerificationRequest('orig', this.exchange.id, this.block.por.jws, this.jwkPairOrig.privateJwk);
    }
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    NonRepudiationDest: NonRepudiationDest,
    NonRepudiationOrig: NonRepudiationOrig
});

exports.ConflictResolution = index$2;
exports.ENC_ALGS = ENC_ALGS;
exports.HASH_ALGS = HASH_ALGS;
exports.NonRepudiationProtocol = index;
exports.NrError = NrError;
exports.SIGNING_ALGS = SIGNING_ALGS;
exports.Signers = index$1;
exports.checkTimestamp = checkTimestamp;
exports.createProof = createProof;
exports.defaultDltConfig = defaultDltConfig;
exports.exchangeId = exchangeId;
exports.generateKeys = generateKeys;
exports.getSecretFromLedger = getSecretFromLedger;
exports.importJwk = importJwk;
exports.jsonSort = jsonSort;
exports.jweDecrypt = jweDecrypt;
exports.jweEncrypt = jweEncrypt;
exports.jwsDecode = jwsDecode;
exports.oneTimeSecret = oneTimeSecret;
exports.parseAgreement = parseAgreement;
exports.parseHex = parseHex;
exports.parseJwk = parseJwk;
exports.sha = sha;
exports.verifyKeyPair = verifyKeyPair;
exports.verifyProof = verifyProof;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubm9kZS5janMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cy9lcnJvcnMvTnJFcnJvci50cyIsIi4uLy4uL3NyYy90cy9jcnlwdG8vZ2VuZXJhdGVLZXlzLnRzIiwiLi4vLi4vc3JjL3RzL2NyeXB0by9pbXBvcnRKd2sudHMiLCIuLi8uLi9zcmMvdHMvY3J5cHRvL2p3ZS50cyIsIi4uLy4uL3NyYy90cy9jcnlwdG8vandzRGVjb2RlLnRzIiwiLi4vLi4vc3JjL3RzL2NyeXB0by9vbmVUaW1lU2VjcmV0LnRzIiwiLi4vLi4vc3JjL3RzL2NyeXB0by92ZXJpZnlLZXlQYWlyLnRzIiwiLi4vLi4vc3JjL3RzL2RsdC9kZWZhdWx0RGx0Q29uZmlnLnRzIiwiLi4vLi4vc3JjL3RzL3V0aWxzL3RpbWVzdGFtcHMudHMiLCIuLi8uLi9zcmMvdHMvdXRpbHMvanNvblNvcnQudHMiLCIuLi8uLi9zcmMvdHMvdXRpbHMvcGFyc2VIZXgudHMiLCIuLi8uLi9zcmMvdHMvdXRpbHMvcGFyc2VKd2sudHMiLCIuLi8uLi9zcmMvdHMvdXRpbHMvc2hhLnRzIiwiLi4vLi4vc3JjL3RzL2RsdC9nZXRTZWNyZXRGcm9tTGVkZ2VyLnRzIiwiLi4vLi4vc3JjL3RzL2V4Y2hhbmdlL2V4Y2hhbmdlSWQudHMiLCIuLi8uLi9zcmMvdHMvY29uc3RhbnRzLnRzIiwiLi4vLi4vc3JjL3RzL2V4Y2hhbmdlL2NoZWNrQWdyZWVtZW50LnRzIiwiLi4vLi4vc3JjL3RzL3Byb29mcy9jcmVhdGVQcm9vZi50cyIsIi4uLy4uL3NyYy90cy9wcm9vZnMvdmVyaWZ5UHJvb2YudHMiLCIuLi8uLi9zcmMvdHMvY29uZmxpY3QtcmVzb2x1dGlvbi92ZXJpZnlQb3IudHMiLCIuLi8uLi9zcmMvdHMvY29uZmxpY3QtcmVzb2x1dGlvbi9jaGVja0NvbXBsZXRlbmVzcy50cyIsIi4uLy4uL3NyYy90cy9jb25mbGljdC1yZXNvbHV0aW9uL2NoZWNrRGVjcnlwdGlvbi50cyIsIi4uLy4uL3NyYy90cy9jb25mbGljdC1yZXNvbHV0aW9uL0NvbmZsaWN0UmVzb2x2ZXIudHMiLCIuLi8uLi9zcmMvdHMvY29uZmxpY3QtcmVzb2x1dGlvbi9nZW5lcmF0ZVZlcmlmaWNhdGlvblJlcXVlc3QudHMiLCIuLi8uLi9zcmMvdHMvY29uZmxpY3QtcmVzb2x1dGlvbi92ZXJpZnlSZXNvbHV0aW9uLnRzIiwiLi4vLi4vc3JjL3RzL25vbi1yZXB1ZGlhdGlvbi1wcm90b2NvbC9Ob25SZXB1ZGlhdGlvbkRlc3QudHMiLCIuLi8uLi9zcmMvdHMvc2lnbmVycy9FdGhlcnNTaWduZXIudHMiLCIuLi8uLi9zcmMvdHMvc2lnbmVycy9TaWduZXIudHMiLCIuLi8uLi9zcmMvdHMvbm9uLXJlcHVkaWF0aW9uLXByb3RvY29sL05vblJlcHVkaWF0aW9uT3JpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6bnVsbCwibmFtZXMiOlsiYjY0IiwiaGV4VG9CdWYiLCJyYW5kQnl0ZXMiLCJFYyIsImltcG9ydEpXS2pvc2UiLCJDb21wYWN0RW5jcnlwdCIsImNvbXBhY3REZWNyeXB0Iiwiand0VmVyaWZ5IiwiZ2VuZXJhdGVTZWNyZXQiLCJleHBvcnRKV0siLCJidWZUb0hleCIsImJhc2U2NGRlY29kZSIsIkdlbmVyYWxTaWduIiwiZ2VuZXJhbFZlcmlmeSIsImV0aGVycyIsImhhc2hhYmxlIiwiU2lnbkpXVCIsImltcG9ydEpXSyIsInNpZ25pbmdLZXkiLCJTaWduaW5nS2V5IiwiV2FsbGV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BRWEsT0FBUSxTQUFRLEtBQUs7SUFHaEMsWUFBYSxLQUFVLEVBQUUsUUFBdUI7UUFDOUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ1osSUFBSSxLQUFLLFlBQVksT0FBTyxFQUFFO1lBQzVCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQTtZQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUE7U0FDdEI7YUFBTTtZ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
