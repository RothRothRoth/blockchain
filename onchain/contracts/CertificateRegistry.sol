// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CertificateRegistry
/// @notice On-chain record of certificate issuance and revocation for the
/// Certi platform. The Next.js application never calls this contract
/// directly — it always goes through src/lib/blockchain/contract-service.ts
/// (the ContractService abstraction), matching:
///   Next.js Web App -> Contract Service -> Smart Contract -> Blockchain
contract CertificateRegistry {
    struct CertificateRecord {
        string certificateId;
        string recipientName;
        string certificateTitle;
        string issueDate;
        string expirationDate;
        string organization;
        bool revoked;
        bool exists;
        address issuer;
    }

    mapping(string => CertificateRecord) private certificates;

    event CertificateIssued(string indexed certificateId, address indexed issuer);
    event CertificateRevoked(string indexed certificateId, address indexed revoker);
    event CertificateReactivated(string indexed certificateId, address indexed reactivator);

    /// @notice Creates and stores a new certificate record on-chain.
    /// @dev Reverts if a certificate with this ID already exists — this is
    /// the on-chain duplicate-ID guard, in addition to the UNIQUE constraint
    /// already enforced on certificate_number in PostgreSQL.
    function issueCertificate(
        string calldata certificateId,
        string calldata recipientName,
        string calldata certificateTitle,
        string calldata issueDate,
        string calldata expirationDate,
        string calldata organization
    ) external {
        require(bytes(certificateId).length > 0, "certificateId is required");
        require(!certificates[certificateId].exists, "Certificate already exists");

        certificates[certificateId] = CertificateRecord({
            certificateId: certificateId,
            recipientName: recipientName,
            certificateTitle: certificateTitle,
            issueDate: issueDate,
            expirationDate: expirationDate,
            organization: organization,
            revoked: false,
            exists: true,
            issuer: msg.sender
        });

        emit CertificateIssued(certificateId, msg.sender);
    }

    /// @notice Retrieves a certificate by ID as a single struct. Returns
    /// exists = false rather than reverting when the certificate is not
    /// found, so callers (a view function, free to call) can distinguish
    /// "not found" from an error. Returning the whole struct in one tuple
    /// (rather than ~8 loose named return values) avoids a "stack too deep"
    /// compile error from the default codegen.
    function getCertificate(string calldata certificateId)
        external
        view
        returns (CertificateRecord memory)
    {
        return certificates[certificateId];
    }

    /// @notice Marks a certificate as revoked.
    /// @dev Only the address that originally issued the certificate may
    /// revoke it — this is the on-chain access-control guard. Application-
    /// level authorization (which logged-in institution user may trigger
    /// this call at all) is enforced separately in the Next.js Server
    /// Action before this function is ever called.
    function revokeCertificate(string calldata certificateId) external {
        CertificateRecord storage cert = certificates[certificateId];
        require(cert.exists, "Certificate does not exist");
        require(cert.issuer == msg.sender, "Not authorized to revoke this certificate");
        require(!cert.revoked, "Certificate is already revoked");

        cert.revoked = true;
        emit CertificateRevoked(certificateId, msg.sender);
    }

    /// @notice Reverses a revocation. Not part of the original spec, but
    /// mirrors the app's Reactivate feature (src/lib/certificates/actions.ts)
    /// so the on-chain state can stay in sync with PostgreSQL.
    function reactivateCertificate(string calldata certificateId) external {
        CertificateRecord storage cert = certificates[certificateId];
        require(cert.exists, "Certificate does not exist");
        require(cert.issuer == msg.sender, "Not authorized to reactivate this certificate");
        require(cert.revoked, "Certificate is not revoked");

        cert.revoked = false;
        emit CertificateReactivated(certificateId, msg.sender);
    }
}
