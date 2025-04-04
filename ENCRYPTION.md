# End-to-End Encryption Implementation

This document explains the end-to-end encryption mechanism implemented in the Chat App to secure user messages.

## Overview

All messages sent through the chat application are encrypted before being stored in Firebase and decrypted only on the recipient's device. This ensures that messages cannot be read by anyone who gains access to the database, including database administrators.

## Technical Implementation

### Encryption Algorithm

The application uses the Advanced Encryption Standard (AES) provided by the crypto-js library to encrypt and decrypt messages.

### Key Generation

For each conversation between two users, a unique encryption key is generated:

1. The key is deterministically derived from both users' IDs to ensure the same key is used on both ends
2. User IDs are sorted before generation to ensure the same key regardless of which user initiates the conversation
3. The key is generated using SHA-256 for additional security

### Message Flow

1. **Sending a message**:
   - User composes a message
   - Message is encrypted using the conversation-specific key
   - Encrypted message is stored in Firebase with an `encrypted: true` flag
   - Only the encrypted version of the message exists in the database

2. **Receiving a message**:
   - Encrypted message is fetched from Firebase
   - Application checks for the `encrypted` flag
   - If message is encrypted, it's decrypted using the conversation key
   - Decrypted message is displayed to the recipient

### Security Considerations

- Encryption keys are never stored in the database
- Keys are generated on-demand in the client application
- Messages cannot be decrypted without the specific key
- Even if the database is compromised, messages remain encrypted

## Code Structure

- `src/utils/encryption.js`: Contains all encryption/decryption utilities
- Updated Chat and Message components to handle encrypted content

## Future Improvements

1. Implement perfect forward secrecy by periodically rotating encryption keys
2. Add option to manually verify encryption keys between users
3. Implement encrypted media messages (images, files)
4. Add option to automatically delete messages after they've been read

## Installation

The encryption functionality requires the crypto-js library:

```bash
npm install crypto-js
```

## Testing Encryption

To verify that encryption is working properly:

1. Open the application in two different browsers or devices
2. Login with two different accounts
3. Send messages between accounts
4. Check the Firebase database to confirm that messages are stored in encrypted form
5. Verify that messages display correctly for authorized recipients