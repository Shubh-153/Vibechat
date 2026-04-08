
export default function handler(request, response) {
module.exports = function handler(request, response) {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  }

  return response.status(200).json(firebaseConfig);
}
};
