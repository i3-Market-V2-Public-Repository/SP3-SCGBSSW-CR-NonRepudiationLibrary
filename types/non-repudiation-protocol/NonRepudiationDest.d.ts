import { NrpDltAgentDest } from '../dlt/';
import { Block, DataExchange, DataExchangeAgreement, DecodedProof, JWK, JwkPair, PoOPayload, PoPPayload, PoRPayload, StoredProof, TimestampVerifyOptions } from './../types';
/**
 * The base class that should be instantiated by the destination of a data
 * exchange when non-repudiation is required. In the i3-MARKET ecosystem it is
 * likely to be a Consumer.
 */
export declare class NonRepudiationDest {
    agreement: DataExchangeAgreement;
    exchange?: DataExchange;
    jwkPairDest: JwkPair;
    publicJwkOrig: JWK;
    block: Block;
    dltAgent: NrpDltAgentDest;
    readonly initialized: Promise<boolean>;
    /**
     * @param agreement - a DataExchangeAgreement
     * @param privateJwk - the private key that will be used to sign the proofs
     * @param dltAgent - a DLT agent providing read connection to the ledger
     */
    constructor(agreement: DataExchangeAgreement, privateJwk: JWK, dltAgent: NrpDltAgentDest);
    private asyncConstructor;
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
    verifyPoO(poo: string, cipherblock: string, options?: Pick<TimestampVerifyOptions, 'timestamp' | 'tolerance'>): Promise<DecodedProof<PoOPayload>>;
    /**
     * Creates the proof of reception (PoR).
     * Besides returning its value, it is also stored in `this.block.por`
     *
     * @returns the PoR as a compact JWS along with its decoded payload
     */
    generatePoR(): Promise<StoredProof<PoRPayload>>;
    /**
     * Verifies a received Proof of Publication (PoP) and returns the secret
     * @param pop - a PoP in compact JWS
     * @param options - time related options for verification
     * @returns the verified payload (that includes the secret that can be used to decrypt the cipherblock) and protected header
     */
    verifyPoP(pop: string, options?: Pick<TimestampVerifyOptions, 'timestamp' | 'tolerance'>): Promise<DecodedProof<PoPPayload>>;
    /**
     * Just in case the PoP is not received, the secret can be downloaded from the ledger.
     * The secret should be downloaded before poo.iat + pooToPop max delay.
     *
     * @returns the secret
     */
    getSecretFromLedger(): Promise<{
        hex: string;
        jwk: JWK;
    }>;
    /**
     * Decrypts the cipherblock once all the previous proofs have been verified
     * @returns the decrypted block
     */
    decrypt(): Promise<Uint8Array>;
    /**
     * Generates a verification request that can be used to query the
     * Conflict-Resolver Service for completeness of the non-repudiation protocol
     *
     * @returns the verification request as a compact JWS signed with 'dest's private key
     */
    generateVerificationRequest(): Promise<string>;
    /**
     * Generates a dispute request that can be used to query the
     * Conflict-Resolver Service regarding impossibility to decrypt the cipherblock with the received secret
     *
     * @returns the dispute request as a compact JWS signed with 'dest's private key
     */
    generateDisputeRequest(): Promise<string>;
}
//# sourceMappingURL=NonRepudiationDest.d.ts.map