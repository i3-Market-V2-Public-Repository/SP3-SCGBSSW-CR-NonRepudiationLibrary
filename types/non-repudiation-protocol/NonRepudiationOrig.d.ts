import { DataExchange, DataExchangeAgreement, JWK, JwkPair, OrigBlock, PoOPayload, PoPPayload, PoRPayload, StoredProof, TimestampVerifyOptions } from '../types';
import { NrpDltAgentOrig } from '../dlt/agents';
/**
 * The base class that should be instantiated by the origin of a data
 * exchange when non-repudiation is required. In the i3-MARKET ecosystem it is
 * likely to be a Provider.
 */
export declare class NonRepudiationOrig {
    agreement: DataExchangeAgreement;
    exchange: DataExchange;
    jwkPairOrig: JwkPair;
    publicJwkDest: JWK;
    block: OrigBlock;
    dltAgent: NrpDltAgentOrig;
    readonly initialized: Promise<boolean>;
    /**
     * @param agreement - a DataExchangeAgreement
     * @param privateJwk - the private key that will be used to sign the proofs
     * @param block - the block of data to transmit in this data exchange
     * @param dltAgent - a DLT agent providing read-write connection to NRP smart contract
     */
    constructor(agreement: DataExchangeAgreement, privateJwk: JWK, block: Uint8Array, dltAgent: NrpDltAgentOrig);
    private init;
    private _dltSetup;
    /**
     * Creates the proof of origin (PoO).
     * Besides returning its value, it is also stored in this.block.poo
     *
     * @returns a compact JWS with the PoO along with its decoded payload
     */
    generatePoO(): Promise<StoredProof<PoOPayload>>;
    /**
     * Verifies a proof of reception.
     * If verification passes, `por` is added to `this.block`
     *
     * @param por - A PoR in caompact JWS format
     * @param options - time-related verifications
     * @returns the verified payload and protected header
     */
    verifyPoR(por: string, options?: Pick<TimestampVerifyOptions, 'timestamp' | 'tolerance'>): Promise<StoredProof<PoRPayload>>;
    /**
     * Creates the proof of publication (PoP).
     * Besides returning its value, it is also stored in `this.block.pop`
     *
     * @returns a compact JWS with the PoP
     */
    generatePoP(): Promise<StoredProof<PoPPayload>>;
    /**
     * Generates a verification request that can be used to query the
     * Conflict-Resolver Service for completeness of the non-repudiation protocol
     *
     * @returns the verification request as a compact JWS signed with 'orig's private key
     */
    generateVerificationRequest(): Promise<string>;
}
//# sourceMappingURL=NonRepudiationOrig.d.ts.map