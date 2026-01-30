const base64Key = 'eyJhcGlfa2V5IjoieGtleXNpYi0wNmY3YzM5NWVjNzU4M2RmN2Q5NDk2ODQ3MzNiMzk3Njg2MzRiNWEyMzQzMTA3OTI2ZmRhOTc4YjRhZjhiNjc2LXRlVlFQanJ5WEhsbXBYWksifQ==';
const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
console.log('Decoded:', decoded);

try {
  const json = JSON.parse(decoded);
  console.log('Parsed JSON:', json);
  console.log('API Key:', json.api_key);
} catch (e) {
  console.error('Not valid JSON');
}
