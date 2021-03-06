import { ProofPayload, getFromJws, JWK, DecodedProof } from '../types';
/**
 * Decodes and optionally verifies a JWS, and returns the decoded header, payload.
 * @param jws
 * @param publicJwk - either a public key as a JWK or a function that resolves to a JWK. If not provided, the JWS signature is not verified
 */
export declare function jwsDecode<T extends ProofPayload>(jws: string, publicJwk?: JWK | getFromJws<T>): Promise<DecodedProof<T>>;
//# sourceMappingURL=jwsDecode.d.ts.map