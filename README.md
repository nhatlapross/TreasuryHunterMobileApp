# 🏴‍☠️ Treasure Hunt - React Native App

A blockchain-powered treasure hunting mobile application that combines real-world exploration with NFT rewards on the Sui blockchain.

## 📱 Features

### 🎯 Core Functionality
- **QR Code & NFC Scanning**: Discover treasures by scanning QR codes or NFC tags at physical locations
- **Blockchain Integration**: Native Sui wallet creation and NFT minting for treasure discoveries
- **Proof-of-Physical Presence (PoPP)**: Location verification ensures users are physically present at treasure locations
- **Gamification**: Ranking system from Beginner to Master Hunter with streak tracking
- **Real-time Discovery**: Instant NFT minting upon successful treasure discovery

### 🏆 Progression System
- **Hunter Ranks**: Beginner → Explorer → Hunter → Master
- **Treasure Rarity**: Common, Rare, Legendary treasures with different point values
- **Streak System**: Daily hunt streaks with bonus rewards
- **Leaderboards**: Global and friends leaderboards
- **Achievements**: Unlock badges and milestones

### 🔐 Blockchain Features
- **Sui Wallet Integration**: Automatic wallet creation with secure key management
- **NFT Collection**: Each discovered treasure becomes a unique NFT
- **Faucet Support**: Request testnet SUI tokens for gas fees
- **Transaction History**: View all blockchain interactions
- **Explorer Integration**: View NFTs and transactions on Sui Explorer

### 📱 Mobile-First Design
- **Cross-platform**: iOS and Android support
- **Responsive UI**: Optimized for different screen sizes
- **Dark Theme**: Modern dark interface with gradient accents
- **Smooth Animations**: Engaging user experience with transitions
- **Offline Support**: Cache data for limited offline functionality

## 🛠️ Technology Stack

### Frontend
- **React Native** 0.75+ with TypeScript
- **Expo Router** for navigation
- **Expo Camera** for QR code scanning
- **React Native NFC Manager** for NFC tag reading
- **AsyncStorage** for local data persistence
- **Google Sign-In** for authentication
- **Linear Gradient** for UI effects

### Backend & Blockchain
- **Node.js/Express** backend API
- **MongoDB** for treasure and user data
- **Sui Blockchain** for NFT minting and smart contracts
- **JWT Authentication** for secure API access
- **Winston** for comprehensive logging

### Services Integration
- **Google OAuth** for user authentication
- **Sui RPC** for blockchain interactions
- **Location Services** for treasure proximity verification
- **Push Notifications** (planned)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- MongoDB instance
- Sui CLI (for smart contract deployment)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/treasure-hunt-app.git
cd treasure-hunt-app

# Install dependencies
npm install

# iOS only - install pods
cd ios && pod install && cd ..
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Backend API
API_BASE_URL=https://your-backend-url.com/api/v1

# Google OAuth
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id

# Sui Blockchain
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0x...your-package-id
TREASURE_REGISTRY_ID=0x...your-registry-id

# Encryption
ENCRYPTION_MASTER_KEY=your-32-character-encryption-key
```

### 3. Backend Setup

See [Backend Deployment Guide](./backend/README.md) for detailed backend setup instructions.

Quick backend setup:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 4. Smart Contract Deployment

```bash
# Install Sui CLI
curl -fLJO https://github.com/MystenLabs/sui/releases/download/sui-v1.15.0-release/sui-ubuntu-x86_64.tgz
tar -xzf sui-ubuntu-x86_64.tgz
sudo mv sui /usr/local/bin/

# Deploy contract
cd smart-contracts
sui client publish --gas-budget 100000000
```

### 5. Run the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📁 Project Structure

```
treasure-hunt-app/
├── app/                          # App screens (Expo Router)
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── hunt.tsx             # QR/NFC scanning
│   │   ├── gallery.tsx          # NFT collection
│   │   ├── wallet.tsx           # Sui wallet
│   │   └── profile.tsx          # User profile
│   ├── auth/                    # Authentication screens
│   ├── onboarding/              # App introduction
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   └── ui/                      # Basic UI components
├── contexts/                     # React contexts
│   └── AuthContext.tsx          # Authentication state
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication logic
│   ├── useProfile.ts            # User profile management
│   ├── useTreasures.ts          # Treasure hunting logic
│   └── useWallet.ts             # Wallet operations
├── services/                     # External service integrations
│   ├── ApiService.ts            # Backend API client
│   └── NFCService.ts            # NFC functionality
├── backend/                      # Backend API (Node.js)
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── models/              # Database models
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Express middleware
│   └── package.json
└── smart-contracts/              # Sui Move contracts
    └── sources/
        └── treasure_nft.move    # Main treasure contract
```

## 🎮 How to Play

### 1. **Get Started**
- Download and open the app
- Sign in with Google
- Complete the onboarding tutorial
- Your Sui wallet is automatically created

### 2. **Find Treasures**
- Use the map to find nearby treasures
- Travel to treasure locations (within 100m)
- Scan QR codes or NFC tags at the location

### 3. **Discover & Collect**
- Verify your location matches the treasure
- Receive instant NFT reward
- Add treasure to your collection
- Earn points and increase your rank

### 4. **Level Up**
- Hunt daily to maintain streaks
- Unlock higher ranks for rare treasures
- Compete on global leaderboards
- Earn achievements and badges

## 📱 Screen Overview

### 🏠 Home Dashboard
- Daily stats and progress
- Nearby treasures map
- Quick actions and wallet balance
- Achievement highlights

### 🔍 Hunt Screen
- QR code camera scanner
- NFC tag reader interface
- Location verification
- Treasure discovery flow

### 🖼️ Gallery
- NFT collection display
- Treasure details and metadata
- Rarity-based filtering
- Blockchain verification status

### 💰 Wallet
- Sui balance and transactions
- Faucet for testnet tokens
- Address sharing and copying
- Network status indicator

### 👤 Profile
- Hunter rank and progress
- Achievement badges
- Leaderboard position
- Account settings

## 🔧 Development

### Adding New Treasures

1. **Database Entry**: Add treasure to MongoDB via admin API
2. **Smart Contract**: Register treasure in Sui contract
3. **QR/NFC Generation**: Create scannable codes with treasure data

Example treasure data:
```json
{
  "treasureId": "TREASURE_001",
  "name": "Golden Dragon Statue",
  "description": "An ancient golden statue hidden in the mountains",
  "latitude": 21.0285,
  "longitude": 105.8542,
  "rarity": 3,
  "rewardPoints": 500,
  "requiredRank": 2,
  "imageUrl": "https://example.com/treasure.jpg"
}
```

### Custom Hooks Usage

```typescript
// Authentication
const { user, wallet, login, logout } = useAuth();

// Treasure hunting
const { treasures, discoverTreasure, loading } = useTreasures();

// Profile management
const { profileStats, updateProfile } = useProfile();

// Wallet operations
const { balance, transactions, requestFaucet } = useWallet();
```

### API Integration

```typescript
import { apiService } from '@/services/APIService';

// Get nearby treasures
const treasures = await apiService.getNearbyTreasures(lat, lng, radius);

// Discover treasure
const result = await apiService.discoverTreasure(treasureId, location, proof);

// Get NFT collection
const nfts = await apiService.getNFTCollection();
```

## 🔐 Security Features

- **Encrypted Key Storage**: Private keys encrypted with AES-256
- **Location Verification**: GPS + proof-of-presence validation
- **JWT Authentication**: Secure API communication
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: Protection against API abuse

## 🚀 Deployment

### Frontend (React Native)

**Android:**
```bash
cd android
./gradlew assembleRelease
# Upload APK to Google Play Console
```

**iOS:**
```bash
cd ios
open TreasureHunt.xcworkspace
# Archive and upload via Xcode
```

### Backend Deployment

**Using Docker:**
```bash
docker build -t treasure-hunt-api .
docker run -p 3000:3000 --env-file .env treasure-hunt-api
```

**Cloud Platforms:**
- Deploy to Railway, Render, or AWS
- Configure MongoDB Atlas
- Set environment variables
- Enable SSL/HTTPS

### Smart Contract Deployment

```bash
# Deploy to Sui testnet
sui client publish --gas-budget 100000000

# Save package ID and update environment variables
export SUI_PACKAGE_ID="0x..."
export TREASURE_REGISTRY_ID="0x..."
```

## 🧪 Testing

### Backend API Testing

```bash
cd backend
npm test

# Test specific treasure discovery
curl -X POST http://localhost:3000/api/v1/treasures/discover \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "treasureId": "TREASURE_001",
    "location": {"latitude": 21.0285, "longitude": 105.8542},
    "locationProof": "gps_verified"
  }'
```

### Manual Testing Scenarios

1. **New User Registration**
   - Google sign-in flow
   - Wallet creation verification
   - Onboarding completion

2. **Treasure Discovery**
   - QR code scanning
   - Location verification
   - NFT minting process

3. **Wallet Operations**
   - Balance checking
   - Faucet requests
   - Transaction history

## 🐛 Common Issues & Solutions

### NFC Not Working
- Ensure NFC is enabled in device settings
- Check `react-native-nfc-manager` installation
- Verify Android NFC permissions

### Location Issues
- Grant location permissions
- Enable high accuracy GPS
- Check network connectivity

### Blockchain Errors
- Ensure sufficient SUI balance
- Verify network connectivity to Sui RPC
- Check smart contract deployment

### Build Issues
```bash
# Clean builds
cd android && ./gradlew clean && cd ..
cd ios && rm -rf build && cd ..

# Reset Metro cache
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules && npm install
```

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core treasure hunting mechanics
- ✅ Sui blockchain integration
- ✅ QR code scanning
- ✅ Basic NFT collection

### Phase 2 (Next)
- 🔄 NFC tag support enhancement
- 🔄 Social features and friend challenges
- 🔄 Push notifications for nearby treasures
- 🔄 Advanced achievement system

### Phase 3 (Future)
- 📋 AR treasure hunting mode
- 📋 Marketplace for trading NFTs
- 📋 Community-created treasures
- 📋 Cross-chain compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use provided custom hooks for state management
- Implement proper error handling
- Add comprehensive logging
- Write unit tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Telegram**: @AlvinIchikun
- **Email**: Nhatlapross2@gmail.com

## 🙏 Acknowledgments

- Sui Foundation for blockchain infrastructure
- React Native community for excellent tooling
- Expo team for simplifying mobile development
- All beta testers and contributors

---

**Happy Treasure Hunting! 🏴‍☠️⚡**

*Made with ❤️ by the Treasure Hunt Team*
