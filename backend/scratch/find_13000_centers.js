const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function find13000Centers() {
  // Get all loans where amount_sanctioned is 13000
  const { data: loans, error: loansErr } = await supabase
    .from('loans')
    .select('center_id')
    .eq('amount_sanctioned', 13000);
    
  if (loansErr) {
    console.error("Error fetching loans:", loansErr);
    return;
  }
  
  // Get unique center IDs
  const centerIds = [...new Set(loans.map(l => l.center_id))].filter(id => id != null);
  
  if (centerIds.length === 0) {
    console.log("No centers found with 13000 loan amount.");
    return;
  }
  
  // Get center names
  const { data: centers, error: centerErr } = await supabase
    .from('centers')
    .select('id, name')
    .in('id', centerIds);
    
  if (centerErr) {
    console.error("Error fetching centers:", centerErr);
    return;
  }
  
  console.log(`Total Centers with 13,000 Loan: ${centers.length}\n`);
  
  centers.forEach((c, index) => {
    console.log(`${index + 1}. ${c.name}`);
  });
}

find13000Centers();
