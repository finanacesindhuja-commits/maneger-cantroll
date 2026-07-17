const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function performUpdate() {
  console.log("Updating Kodavasal A9 schedules...");

  // Update schedules
  const { data: updatedSchedules, error: updateError } = await supabase
    .from('collection_schedules')
    .update({ amount: 12000 })
    .ilike('center_name', '%kodavasal%A9%')
    .select();

  if (updateError) {
    console.error("Error updating schedules:", updateError);
  } else {
    console.log(`Successfully updated ${updatedSchedules.length} schedules matching Kodavasal A9 to amount 12000.`);
    console.log(updatedSchedules);
  }
}

performUpdate().catch(console.error);
