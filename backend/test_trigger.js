const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function testTrigger() {
  console.log("Looking for a loan to test the trigger...");
  
  // Find a loan to test
  const { data: loanToTest, error: fetchErr } = await supabase
    .from('loans')
    .select('id, status, disbursement_status, credited_at')
    .eq('status', 'SANCTIONED')
    .neq('disbursement_status', 'CREDITED')
    .limit(1)
    .single();

  if (fetchErr || !loanToTest) {
    console.error("Could not find a suitable loan to test.", fetchErr);
    return;
  }

  console.log(`Found Test Loan ID: ${loanToTest.id}`);
  console.log(`Initial State -> Status: ${loanToTest.status}, Disbursement Status: ${loanToTest.disbursement_status}`);

  // Update disbursement_status to 'CREDITED'
  console.log("\nUpdating disbursement_status to 'CREDITED'...");
  const { error: updateErr } = await supabase
    .from('loans')
    .update({ disbursement_status: 'CREDITED' })
    .eq('id', loanToTest.id);

  if (updateErr) {
    console.error("Update failed:", updateErr);
    return;
  }

  // Fetch it back to see if the trigger changed the main 'status'
  const { data: afterUpdate, error: fetchErr2 } = await supabase
    .from('loans')
    .select('id, status, disbursement_status, credited_at')
    .eq('id', loanToTest.id)
    .single();

  console.log(`\nState After Update -> Status: ${afterUpdate.status}, Disbursement Status: ${afterUpdate.disbursement_status}`);
  
  if (afterUpdate.status === 'CREDITED') {
    console.log("✅ TRIGGER WORKED PERFECTLY! The main status automatically changed to CREDITED.");
  } else {
    console.log("❌ TRIGGER FAILED! The main status is still", afterUpdate.status);
  }

  // Revert back to original state
  console.log("\nReverting the loan back to its original state...");
  await supabase
    .from('loans')
    .update({ 
      status: loanToTest.status, 
      disbursement_status: loanToTest.disbursement_status,
      credited_at: loanToTest.credited_at 
    })
    .eq('id', loanToTest.id);
    
  console.log("Revert complete.");
}

testTrigger();
