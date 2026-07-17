const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateA9() {
  console.log("Updating Kodavasal A9 schedule to 12000...");
  
  // Update collection_schedules
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('collection_schedules')
    .select('id, center_name, member_name, amount')
    .ilike('center_name', '%kodavasal%')
    .ilike('member_name', '%A9%');

  if (scheduleError) {
    console.error("Error fetching schedules:", scheduleError);
    return;
  }

  if (scheduleData && scheduleData.length > 0) {
    console.log(`Found ${scheduleData.length} matching schedule(s):`);
    for (const record of scheduleData) {
      console.log(`- ID: ${record.id}, Center: ${record.center_name}, Member: ${record.member_name}, Old Amount: ${record.amount}`);
      
      const { error: updateError } = await supabase
        .from('collection_schedules')
        .update({ amount: 12000 })
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`Failed to update schedule ID ${record.id}:`, updateError);
      } else {
        console.log(`Successfully updated schedule ID ${record.id} to 12000.`);
      }
    }
  } else {
    console.log("No exact match found in collection_schedules. Searching broader...");
    const { data: allSchedules } = await supabase
        .from('collection_schedules')
        .select('id, center_name, member_name, amount')
        .ilike('member_name', '%A9%');
    console.log("Found members with A9 in any center:", allSchedules);
  }

  // Also check loans table just in case they meant the sanction amount or EMI amount
  const { data: loanData, error: loanError } = await supabase
    .from('loans')
    .select('id, center_id, member_name, amount_sanctioned')
    .ilike('member_name', '%A9%');
    
  if (loanData && loanData.length > 0) {
    console.log(`\nFound ${loanData.length} matching loan(s) for A9:`);
    for (const record of loanData) {
        console.log(`- ID: ${record.id}, Member: ${record.member_name}, Old Amount Sanctioned: ${record.amount_sanctioned}`);
        // We will update this too if it's related to the "schedule" or we can prompt. 
        // For now, let's update collection_schedules.
    }
  }
}

updateA9().catch(console.error);
