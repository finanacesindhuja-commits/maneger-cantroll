const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function fixAllCreditedLoans() {
  console.log("Fetching loans with disbursement_status='CREDITED' and status='SANCTIONED'...");
  const { data: loansToFix, error: fetchErr } = await supabase
    .from('loans')
    .select('id, center_name, member_name')
    .eq('disbursement_status', 'CREDITED')
    .eq('status', 'SANCTIONED');

  if (fetchErr) {
    console.error("Error fetching:", fetchErr);
    return;
  }

  if (!loansToFix || loansToFix.length === 0) {
    console.log("No loans found that need fixing.");
    return;
  }

  console.log(`Found ${loansToFix.length} loans to fix.`);
  
  const ids = loansToFix.map(l => l.id);
  const { data: updated, error: updateErr } = await supabase
    .from('loans')
    .update({ status: 'CREDITED' })
    .in('id', ids)
    .select('id, center_name');

  if (updateErr) {
    console.error("Error updating:", updateErr);
  } else {
    console.log(`Successfully fixed ${updated.length} loans.`);
    // Group by center
    const centers = [...new Set(updated.map(l => l.center_name))];
    console.log("Fixed centers:", centers);
  }
}

fixAllCreditedLoans();
