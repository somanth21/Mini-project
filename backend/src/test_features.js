const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function runFeatureTests() {
  console.log('--- STARTING FEEDLINK AI ADDITIONAL FEATURES INTEGRATION TESTS ---');

  // 1. Authenticate as Admin
  let token = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@feedlink.ai',
      password: 'Admin@123'
    });
    token = loginRes.data.token;
    console.log('Auth login (ADMIN): SUCCESS');
  } catch (err) {
    console.error('Auth login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Test GET /api/impact/metrics
  try {
    console.log('\nTesting GET /api/impact/metrics...');
    const res = await axios.get(`${BASE_URL}/api/impact/metrics`, { headers });
    console.log('Dynamic Metrics: SUCCESS');
    console.log('Meals Donated:', res.data.mealsDonated);
    console.log('Active Hotels & Hostels:', res.data.activeHotels);
    console.log('Active NGOs:', res.data.activeNgos);
    console.log('Carbon Impact (kg):', res.data.carbonImpactKg);
    console.log('Success Rate (%):', res.data.successRate);
  } catch (err) {
    console.error('Dynamic Metrics failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Test GET /api/maps/heatmap
  try {
    console.log('\nTesting GET /api/maps/heatmap...');
    const res = await axios.get(`${BASE_URL}/api/maps/heatmap`, { headers });
    console.log('Geospatial Heatmap data: SUCCESS');
    console.log('Coordinates aggregate count:', res.data.length);
    if (res.data.length > 0) {
      console.log('Sample node:', res.data[0]);
    }
  } catch (err) {
    console.error('Geospatial Heatmap failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Test GET /api/analytics/hotspots
  try {
    console.log('\nTesting GET /api/analytics/hotspots...');
    const res = await axios.get(`${BASE_URL}/api/analytics/hotspots`, { headers });
    console.log('Neighborhood Hotspots: SUCCESS');
    console.log('Hotspots count:', res.data.length);
    if (res.data.length > 0) {
      console.log('Sample Hotspot:', res.data[0]);
    }
  } catch (err) {
    console.error('Neighborhood Hotspots failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Test GET /api/analytics/hotel-performance
  try {
    console.log('\nTesting GET /api/analytics/hotel-performance...');
    const res = await axios.get(`${BASE_URL}/api/analytics/hotel-performance`, { headers });
    console.log('Hotel & Hostals Performance Leaderboard: SUCCESS');
    console.log('Hotel list count:', res.data.length);
    if (res.data.length > 0) {
      console.log('Sample Hotel/Hostal performer:', res.data[0]);
    }
  } catch (err) {
    console.error('Hotel Performance Leaderboard failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 6. Test GET /api/ai/demand-forecast
  try {
    console.log('\nTesting GET /api/ai/demand-forecast...');
    const res = await axios.get(`${BASE_URL}/api/ai/demand-forecast`, { headers });
    console.log('AI Demand Forecast: SUCCESS');
    console.log('Forecasted Servings (next 7 days):', res.data.forecastedServings);
    console.log('Forecast confidence:', res.data.confidence);
  } catch (err) {
    console.error('AI Demand Forecast failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 7. Test PDF download report /api/reports/impact?format=pdf
  try {
    console.log('\nTesting GET /api/reports/impact?format=pdf...');
    const res = await axios.get(`${BASE_URL}/api/reports/impact?format=pdf`, { 
      headers, 
      responseType: 'arraybuffer' 
    });
    console.log('PDF Impact Report: SUCCESS');
    console.log('Downloaded bytes:', res.data.length);
  } catch (err) {
    console.error('PDF Impact Report failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 8. Test CSV download report /api/reports/impact?format=csv
  try {
    console.log('\nTesting GET /api/reports/impact?format=csv...');
    const res = await axios.get(`${BASE_URL}/api/reports/impact?format=csv`, { 
      headers, 
      responseType: 'arraybuffer' 
    });
    console.log('CSV Impact Report: SUCCESS');
    console.log('Downloaded bytes:', res.data.length);
  } catch (err) {
    console.error('CSV Impact Report failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 9. Test POST /api/chatbot/chat
  try {
    console.log('\nTesting POST /api/chatbot/chat...');
    const res = await axios.post(`${BASE_URL}/api/chatbot/chat`, {
      message: 'Show active donations',
      conversationId: 'test-convo-id',
      history: []
    }, { headers });
    console.log('AI Chatbot: SUCCESS');
    console.log('Response excerpt:', res.data.response?.substring(0, 150) + '...');
  } catch (err) {
    console.error('AI Chatbot failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n--- ALL ADDITIONAL FEATURES INTEGRATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runFeatureTests();
