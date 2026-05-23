// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ArcWill — On-chain digital will & last message
contract ArcWill {
    struct Will {
        string message;
        string[] recipientNotes; // "0xAddr: gets my NFTs"
        bool locked;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(address => Will) private wills;
    address[] public willOwners;
    uint256 public totalWills;

    event WillCreated(address indexed owner, uint256 timestamp);
    event WillUpdated(address indexed owner, uint256 timestamp);
    event WillLocked(address indexed owner, uint256 timestamp);

    function setWill(string calldata message, string[] memory recipientNotes) external {
        require(!wills[msg.sender].locked, "Will is locked");
        require(bytes(message).length > 0, "Empty message");
        if (wills[msg.sender].createdAt == 0) {
            willOwners.push(msg.sender);
            totalWills++;
            emit WillCreated(msg.sender, block.timestamp);
        } else {
            emit WillUpdated(msg.sender, block.timestamp);
        }
        wills[msg.sender].message = message;
        wills[msg.sender].recipientNotes = recipientNotes;
        wills[msg.sender].updatedAt = block.timestamp;
        if (wills[msg.sender].createdAt == 0) wills[msg.sender].createdAt = block.timestamp;
    }

    function lockWill() external {
        require(wills[msg.sender].createdAt > 0, "No will found");
        require(!wills[msg.sender].locked, "Already locked");
        wills[msg.sender].locked = true;
        emit WillLocked(msg.sender, block.timestamp);
    }

    function getWill(address owner) external view returns (
        string memory message, string[] memory recipientNotes,
        bool locked, uint256 createdAt, uint256 updatedAt
    ) {
        Will storage w = wills[owner];
        return (w.message, w.recipientNotes, w.locked, w.createdAt, w.updatedAt);
    }

    function hasWill(address owner) external view returns (bool) {
        return wills[owner].createdAt > 0;
    }

    function getRecentOwners(uint256 count) external view returns (address[] memory) {
        uint256 len = willOwners.length;
        uint256 n = count > len ? len : count;
        address[] memory result = new address[](n);
        for (uint256 i = 0; i < n; i++) result[i] = willOwners[len - 1 - i];
        return result;
    }
}
