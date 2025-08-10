var admin = require("firebase-admin");

var serviceAccount = require("../firepageadmin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


///////////////////////////////////////////////
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // attach user data to request
    next(); // proceed to next middleware/route
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = verifyToken;