import { CompactDecryptResult } from 'jose';
import { EncryptionAlg, JWK } from '../types';
/**
 * Encrypts a block of data to JWE
 *
 * @param block - the actual block of data
 * @param secret - a one-time secret for encrypting this block
 * @param encAlg - the algorithm for encryption
 * @returns a Compact JWE
 */
export declare function jweEncrypt(block: Uint8Array, secret: JWK, encAlg: EncryptionAlg): Promise<string>;
/**
 * Decrypts jwe
 * @param jwe - a JWE
 * @param secret - a JWK with the secret to decrypt this jwe
 * @param encAlg - the algorithm for encryption
 * @returns the plaintext
 */
export declare function jweDecrypt(jwe: string, secret: JWK, encAlg?: EncryptionAlg): Promise<CompactDecryptResult>;
//# sourceMappingURL=jwe.d.ts.map