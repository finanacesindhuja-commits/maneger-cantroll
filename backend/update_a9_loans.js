const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function performUpdate() {
  console.log("Updating KUDAVASAL -A9 loans to 12000...");

  // Update loans
  const { data: updatedLoans, error: updateError } = await supabase
    .from('loans')
    .update({ amount_sanctioned: 12000 })
    .eq('center_name', 'KUDAVASAL -A9')
    .select('id, member_name, center_name, amount_sanctioned');

  if (updateError) {
    console.error("Error updating loans:", updateError);
  } else {
    console.log(`Successfully updated ${updatedLoans.length} loans in KUDAVASAL -A9 to 12000.`);
    console.log(updatedLoans);
  }
}

performUpdate().catch(console.error);
