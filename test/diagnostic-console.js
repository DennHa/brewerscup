/**
 * Ban List Diagnostic Tools
 * 
 * Run this in the browser console to diagnose ban list sync issues:
 * 
 * Copy & paste into console, then run:
 *   - banListDiagnostics()
 *   - debugBanListSync()
 *   - simulateAdminUpdate()
 */

// Main diagnostic function
async function banListDiagnostics() {
  console.log('%c🔍 Ban List Diagnostic Report', 'font-size: 14px; font-weight: bold; color: #58a6ff;');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check if modules are loaded
    console.log('\n📦 Module Check:');
    console.log('  - getBanList:', typeof window.getBanList);
    console.log('  - updateBanList:', typeof window.updateBanList);
    console.log('  - db:', typeof window.db);
    
    // Step 2: Check Firebase
    console.log('\n🔥 Firebase Status:');
    const { db } = await import('./js/firebase-config.js');
    if (db) {
      console.log('  ✅ Firebase initialized');
      console.log('  - Database reference:', db.constructor.name);
    } else {
      console.error('  ❌ Firebase not initialized');
    }
    
    // Step 3: Test getBanList
    console.log('\n📖 Ban List Fetch Test:');
    console.time('  getBanList() execution time');
    const banList = await window.getBanList();
    console.timeEnd('  getBanList() execution time');
    console.log(`  - Retrieved: ${banList.length} cards`);
    console.log(`  - First 5 cards: ${banList.slice(0, 5).join(', ')}`);
    console.log(`  - Valid structure: ${banList.every(c => typeof c === 'string')}`);
    
    // Step 4: Test cache
    console.log('\n⚡ Cache Performance Test:');
    console.time('  Cached call');
    const cachedList = await window.getBanList();
    console.timeEnd('  Cached call');
    console.log(`  - Returns same data: ${JSON.stringify(banList) === JSON.stringify(cachedList)}`);
    
    // Step 5: Test update capability
    console.log('\n✏️ Update Capability:');
    const testCard = `DIAG-TEST-${Date.now()}`;
    const testList = [...banList, testCard];
    
    try {
      console.time('  updateBanList() execution time');
      await window.updateBanList(testList);
      console.timeEnd('  updateBanList() execution time');
      console.log('  ✅ Update call succeeded');
    } catch (e) {
      console.error('  ❌ Update call failed:', e.message);
    }
    
    // Step 6: Verify update
    console.log('\n🔄 Update Verification:');
    window.clearBanListCache?.();
    const verifiedList = await window.getBanList();
    const testCardPresent = verifiedList.includes(testCard);
    
    if (testCardPresent) {
      console.log(`  ✅ Test card found after update: ${testCard}`);
    } else {
      console.log(`  ❌ Test card NOT found after update`);
      console.log(`     Expected: ${testCard}`);
      console.log(`     List has: ${verifiedList.length} cards`);
    }
    
    // Step 7: Firebase direct test
    console.log('\n🗄️ Firebase Direct Read:');
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
      const banlistDoc = await getDoc(doc(db, 'admin', 'banlist'));
      
      if (banlistDoc.exists()) {
        const data = banlistDoc.data();
        console.log('  ✅ Document exists');
        console.log(`  - Cards in Firebase: ${data.cards?.length || 0}`);
        console.log(`  - Last updated: ${data.updatedAt?.toDate?.() || 'N/A'}`);
      } else {
        console.log('  ⚠️ Document does not exist at admin/banlist');
      }
    } catch (e) {
      console.error('  ❌ Firebase read failed:', e.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('%c✅ Diagnostic complete', 'color: #3fb950; font-weight: bold;');
    
  } catch (e) {
    console.error('%c❌ Diagnostic failed:', 'color: #f85149; font-weight: bold;', e);
  }
}

// Detailed sync debugging
async function debugBanListSync() {
  console.log('%c🔄 Ban List Sync Debug', 'font-size: 14px; font-weight: bold; color: #d29922;');
  console.log('='.repeat(60));
  
  try {
    // Get initial state
    console.log('\n1️⃣ Initial State:');
    window.clearBanListCache?.();
    const initial = await window.getBanList();
    console.log(`   - Ban list size: ${initial.length}`);
    console.log(`   - Sample: ${initial.slice(0, 3).join(', ')}...`);
    
    // Prepare test data
    const testCards = [
      `SYNC-A-${Date.now()}`,
      `SYNC-B-${Date.now()}`,
      `SYNC-C-${Date.now()}`
    ];
    console.log(`\n2️⃣ Test Cards to Add:`);
    testCards.forEach(c => console.log(`   - ${c}`));
    
    // Attempt update
    console.log(`\n3️⃣ Attempting Update:`);
    console.time('   Update duration');
    const updated = [...initial, ...testCards];
    await window.updateBanList(updated);
    console.timeEnd('   Update duration');
    console.log('   ✅ Update call completed');
    
    // Immediate verification (should hit cache)
    console.log(`\n4️⃣ Immediate Verification (cached):`);
    const immediate = await window.getBanList();
    const immediateMatch = testCards.every(c => immediate.includes(c));
    console.log(`   - All test cards present: ${immediateMatch ? '✅' : '❌'}`);
    
    // Force refresh
    console.log(`\n5️⃣ Fresh Verification (cache cleared):`);
    window.clearBanListCache?.();
    console.time('   Fresh fetch duration');
    const fresh = await window.getBanList();
    console.timeEnd('   Fresh fetch duration');
    const freshMatch = testCards.every(c => fresh.includes(c));
    console.log(`   - All test cards present: ${freshMatch ? '✅' : '❌'}`);
    
    // Detail any mismatches
    if (!freshMatch) {
      console.log(`\n   ⚠️ Mismatch Details:`);
      testCards.forEach(c => {
        const found = fresh.includes(c);
        console.log(`      ${found ? '✅' : '❌'} ${c}`);
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    if (immediateMatch && freshMatch) {
      console.log('%c✅ Sync is working correctly', 'color: #3fb950; font-weight: bold;');
    } else if (immediateMatch && !freshMatch) {
      console.log('%c⚠️ Sync issue detected:', 'color: #d29922; font-weight: bold;');
      console.log('   Updates are cached but not persisting to Firebase');
    } else {
      console.log('%c❌ Update failed', 'color: #f85149; font-weight: bold;');
    }
    
  } catch (e) {
    console.error('%c❌ Debug failed:', 'color: #f85149; font-weight: bold;', e);
    console.error('Full error:', e);
  }
}

// Simulate admin update
async function simulateAdminUpdate() {
  console.log('%c👤 Simulating Admin Update', 'font-size: 14px; font-weight: bold; color: #79c0ff;');
  console.log('='.repeat(60));
  
  try {
    const { db } = await import('./js/firebase-config.js');
    const { doc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    
    // Simulate adding cards like admin.js does
    console.log('\n📝 Simulating admin card addition:');
    
    const testCard = `ADMIN-SIM-${Date.now()}`;
    console.log(`\n1. Adding card: "${testCard}"`);
    
    const banlistRef = doc(db, 'admin', 'banlist');
    console.time('   Firebase update');
    await updateDoc(banlistRef, {
      cards: arrayUnion(testCard)
    });
    console.timeEnd('   Firebase update');
    console.log('   ✅ Firebase update completed');
    
    // Check immediately
    console.log(`\n2. Checking with getBanList():`);
    window.clearBanListCache?.();
    const banList = await window.getBanList();
    
    if (banList.includes(testCard)) {
      console.log(`   ✅ Card found: "${testCard}"`);
    } else {
      console.log(`   ❌ Card not found: "${testCard}"`);
      console.log(`   - List size: ${banList.length}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (e) {
    console.error('%c❌ Simulation failed:', 'color: #f85149; font-weight: bold;', e);
  }
}

// Quick cache status
async function checkCacheStatus() {
  console.log('%c💾 Cache Status', 'font-size: 12px; font-weight: bold; color: #79c0ff;');
  console.log('Run getBanList twice and check timing:');
  
  console.log('\n  First call:');
  console.time('    First');
  const list1 = await window.getBanList();
  console.timeEnd('    First');
  console.log(`    Cards: ${list1.length}`);
  
  console.log('\n  Second call (should be much faster):');
  console.time('    Second');
  const list2 = await window.getBanList();
  console.timeEnd('    Second');
  console.log(`    Cards: ${list2.length}`);
  
  console.log('\n  Cache working:', list1.length === list2.length);
}

// Clear everything and start fresh
async function resetAndTest() {
  console.log('%c🔄 Reset and Test', 'font-size: 14px; font-weight: bold; color: #d29922;');
  
  window.clearBanListCache?.();
  console.log('✅ Cache cleared');
  
  // Wait a moment then test
  await new Promise(r => setTimeout(r, 500));
  
  const banList = await window.getBanList();
  console.log(`✅ Fresh fetch: ${banList.length} cards`);
  console.log(`   Sample: ${banList.slice(0, 5).join(', ')}`);
}

// Print help
function banListTestHelp() {
  console.clear();
  console.log('%c🚫 Ban List Test Commands', 'font-size: 16px; font-weight: bold; color: #58a6ff;');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Full Diagnostic:');
  console.log('  banListDiagnostics()');
  console.log('  - Runs complete system check');
  
  console.log('\n🔄 Sync Debug:');
  console.log('  debugBanListSync()');
  console.log('  - Tests update sync with before/after verification');
  
  console.log('\n👤 Admin Simulation:');
  console.log('  simulateAdminUpdate()');
  console.log('  - Simulates what admin.js does');
  
  console.log('\n💾 Cache Check:');
  console.log('  checkCacheStatus()');
  console.log('  - Tests cache performance');
  
  console.log('\n🔄 Reset:');
  console.log('  resetAndTest()');
  console.log('  - Clears cache and fetches fresh');
  
  console.log('\n' + '='.repeat(60));
}

// Auto-show help
console.log('%c🚫 Ban List Debug Tools Loaded', 'color: #3fb950; font-weight: bold;');
console.log('Run: banListTestHelp() for available commands');

// Export for use
window.banListDiagnostics = banListDiagnostics;
window.debugBanListSync = debugBanListSync;
window.simulateAdminUpdate = simulateAdminUpdate;
window.checkCacheStatus = checkCacheStatus;
window.resetAndTest = resetAndTest;
window.banListTestHelp = banListTestHelp;
