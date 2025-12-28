import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyC1Wn3sbMSxDwJ4kbT6PZEX5vmc9RXznP4",
  authDomain: "erjem-9722c.firebaseapp.com",
  projectId: "erjem-9722c",
  storageBucket: "erjem-9722c.firebasestorage.app",
  messagingSenderId: "193501059904",
  appId: "1:193501059904:web:99e2bb7d92e836615638a5",
  measurementId: "G-0MFXCSCYDH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to export
const COLLECTIONS = ['users', 'branches', 'transactions', 'userBranches'];

// Convert Firestore data to JSON-safe format
function convertToJSON(data) {
  if (data === null || data === undefined) return data;
  
  // Handle Firestore Timestamp
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertToJSON(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = convertToJSON(value);
    }
    return result;
  }
  
  return data;
}

async function exportCollection(collectionName) {
  console.log(`📦 Exporting ${collectionName}...`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...convertToJSON(doc.data())
      });
    });
    
    console.log(`   Found ${documents.length} documents`);
    return documents;
  } catch (error) {
    console.error(`   Error exporting ${collectionName}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔥 Firebase Data Export Tool');
  console.log('============================\n');
  
  const exportData = {};
  
  for (const collectionName of COLLECTIONS) {
    exportData[collectionName] = await exportCollection(collectionName);
  }
  
  // Create output directory
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }
  
  // Save each collection to separate file
  for (const [name, data] of Object.entries(exportData)) {
    const filename = `./data/${name}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${filename} (${data.length} records)`);
  }
  
  // Save combined export
  const combinedFilename = './data/all-data.json';
  fs.writeFileSync(combinedFilename, JSON.stringify(exportData, null, 2));
  console.log(`\n📁 Combined export saved to ${combinedFilename}`);
  
  // Summary
  console.log('\n============================');
  console.log('📊 Export Summary:');
  for (const [name, data] of Object.entries(exportData)) {
    console.log(`   ${name}: ${data.length} records`);
  }
  console.log('\n🎉 Export complete!');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});
