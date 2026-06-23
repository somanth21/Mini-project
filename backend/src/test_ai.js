const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:8080';

async function runAiTests() {
  console.log('--- STARTING AI MODULE INTEGRATION TESTS ---');

  // Let's first log in as Admin to get an access token
  let token = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@feedlink.ai',
      password: 'Admin@123'
    });
    token = loginRes.data.token;
    console.log('Auth login: SUCCESS');
  } catch (err) {
    console.error('Auth login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Create a dummy image file for testing upload if one doesn't exist
  const dummyImgPath = path.join(__dirname, 'dummy_food.jpg');
  if (!fs.existsSync(dummyImgPath)) {
    // Write 100 bytes of dummy data as a mock JPEG file
    fs.writeFileSync(dummyImgPath, Buffer.alloc(100));
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Test /api/ai/analyze-food
  try {
    console.log('\nTesting POST /api/ai/analyze-food...');
    const form = new FormData();
    form.append('file', fs.createReadStream(dummyImgPath));
    
    const res = await axios.post(`${BASE_URL}/api/ai/analyze-food`, form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      }
    });
    console.log('Food Analysis: SUCCESS');
    console.log('Response Food Type:', res.data.foodType);
    console.log('Response Category:', res.data.category);
    console.log('Response Confidence:', res.data.confidence);
    console.log('Response Freshness:', res.data.freshnessScore);
  } catch (err) {
    console.error('Food Analysis failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Test /api/ai/estimate-servings
  try {
    console.log('\nTesting POST /api/ai/estimate-servings...');
    const form = new FormData();
    form.append('file', fs.createReadStream(dummyImgPath));
    form.append('quantity', '15 kg');
    form.append('foodType', 'Biryani');

    const res = await axios.post(`${BASE_URL}/api/ai/estimate-servings`, form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      }
    });
    console.log('Serving Estimation: SUCCESS');
    console.log('Estimated Servings:', res.data.estimatedServings);
    console.log('Confidence:', res.data.confidence);
  } catch (err) {
    console.error('Serving Estimation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Test /api/ai/recommend-ngos
  try {
    console.log('\nTesting POST /api/ai/recommend-ngos...');
    const res = await axios.post(`${BASE_URL}/api/ai/recommend-ngos`, {
      latitude: 12.9716,
      longitude: 77.5946,
      foodType: 'Biryani',
      estimatedServings: 50
    }, { headers });
    console.log('NGO Recommendations: SUCCESS');
    console.log('Top recommendations count:', res.data.recommendedNgos?.length);
    console.log('NGO Recommendations list:', res.data.recommendedNgos);
  } catch (err) {
    console.error('NGO Recommendations failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Test /api/ai/analytics
  try {
    console.log('\nTesting GET /api/ai/analytics...');
    const res = await axios.get(`${BASE_URL}/api/ai/analytics`, { headers });
    console.log('AI Analytics: SUCCESS');
    console.log('Total predictions logged:', res.data.totalPredictions);
    console.log('Most donated food types:', res.data.mostDonatedFoodTypes);
    console.log('Average servings:', res.data.averageServings);
    console.log('Most active NGOs:', res.data.mostActiveNgos);
    console.log('Trends data keys count:', Object.keys(res.data.wasteTrends || {}).length);
  } catch (err) {
    console.error('AI Analytics failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n--- ALL AI MODULE INTEGRATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runAiTests();
