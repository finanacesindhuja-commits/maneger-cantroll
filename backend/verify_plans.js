async function testPlans() {
  const centerId = 1; 
  const centerName = 'Test Center';
  const startDate = '2026-05-04'; 
  
  console.log('--- Testing 10k Plan (12 Weeks) ---');
  try {
    const res10 = await fetch('http://localhost:5001/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centerId,
        centerName,
        scheduledDate: startDate,
        amount: 10000
      })
    });
    const data10 = await res10.json();
    console.log('10k Result:', data10.message);
    console.log('Schedules created:', data10.schedules?.length || 0);
  } catch (err) {
    console.error('10k Error:', err.message);
  }

  console.log('\n--- Testing 12k Plan (16 Weeks) ---');
  try {
    const res12 = await fetch('http://localhost:5001/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centerId,
        centerName,
        scheduledDate: '2026-06-01', 
        amount: 12000
      })
    });
    const data12 = await res12.json();
    console.log('12k Result:', data12.message);
    console.log('Schedules created:', data12.schedules?.length || 0);
  } catch (err) {
    console.error('12k Error:', err.message);
  }
}

testPlans();
