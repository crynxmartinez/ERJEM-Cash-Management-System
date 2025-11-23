import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config - UPDATE THESE WITH YOUR VALUES
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '../Remje DashBoard.xlsx'); // Put your Excel file in the scripts folder
const BRANCH_ID = 'erjem-glass';
const USER_ID = 'YOUR_USER_ID'; // Your Firebase user ID

async function clearOldData() {
  console.log('🗑️  Clearing old transactions...');
  const querySnapshot = await getDocs(collection(db, 'transactions'));
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`✅ Deleted ${querySnapshot.size} old transactions`);
}

async function importData() {
  try {
    console.log('📂 Reading Excel file...');
    
    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${jsonData.length} rows`);

    // Clear old data first
    await clearOldData();

    console.log('💾 Importing new data...');
    
    let totalTransactions = 0;
    const batchSize = 50; // Firestore batch limit
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      
      const promises = [];
      
      for (const row of batch) {
        const date = row.Date || row.date || '';
        const personalDetails = row['Personal Details'] || '';
        const personalExpenses = parseFloat(row['Personal Expenses'] || '0');
        const incomeDetails = row['Income details'] || '';
        const incomeAmount = parseFloat(row['Income Amount'] || '0');
        const expensesDetails = row['Expenses details'] || '';
        const expensesAmount = parseFloat(row['Expenses Amount'] || '0');

        // Add income transaction if amount exists
        if (incomeAmount > 0) {
          promises.push(
            addDoc(collection(db, 'transactions'), {
              date,
              type: 'income',
              category: 'Income',
              amount: incomeAmount,
              source: incomeDetails,
              description: incomeDetails,
              isPersonal: false,
              branchId: BRANCH_ID,
              userId: USER_ID,
              uploadedAt: new Date()
            })
          );
          totalTransactions++;
        }

        // Add expense transaction if amount exists
        if (expensesAmount > 0) {
          promises.push(
            addDoc(collection(db, 'transactions'), {
              date,
              type: 'expense',
              category: 'Expense',
              amount: expensesAmount,
              source: expensesDetails,
              description: expensesDetails,
              isPersonal: false,
              branchId: BRANCH_ID,
              userId: USER_ID,
              uploadedAt: new Date()
            })
          );
          totalTransactions++;
        }

        // Add personal expense if amount exists
        if (personalExpenses > 0) {
          promises.push(
            addDoc(collection(db, 'transactions'), {
              date,
              type: 'expense',
              category: 'Personal',
              amount: personalExpenses,
              source: personalDetails,
              description: personalDetails,
              isPersonal: true,
              branchId: BRANCH_ID,
              userId: USER_ID,
              uploadedAt: new Date()
            })
          );
          totalTransactions++;
        }
      }

      await Promise.all(promises);
      console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${promises.length} transactions)`);
    }

    console.log(`\n🎉 SUCCESS! Imported ${totalTransactions} transactions`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the import
importData();
