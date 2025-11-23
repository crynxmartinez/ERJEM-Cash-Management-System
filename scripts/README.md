# Data Import Script

This script imports data directly from your Excel file to Firestore.

## Setup

1. **Copy your Excel file** to the `scripts` folder and name it `Remje DashBoard.xlsx`

2. **Update Firebase config** in `importData.js`:
   - Open `.env` file and copy your Firebase values
   - Paste them into the `firebaseConfig` object in `importData.js`

3. **Update USER_ID**:
   - Go to Firebase Console → Authentication
   - Copy your user UID
   - Paste it in `importData.js` where it says `YOUR_USER_ID`

## Run

```bash
node scripts/importData.js
```

## What it does

1. ✅ Clears all old transactions from Firestore
2. ✅ Reads your Excel file
3. ✅ Parses Income Amount, Expenses Amount, Personal Expenses
4. ✅ Creates separate transactions for each
5. ✅ Inserts everything into Firestore

## Excel Format Expected

- **Date** - Transaction date
- **Personal Details** - Description for personal expenses
- **Personal Expenses** - Amount for personal expenses
- **Income details** - Description for income
- **Income Amount** - Amount for income
- **Expenses details** - Description for expenses
- **Expenses Amount** - Amount for expenses
