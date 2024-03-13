const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    /* Extracting Authorization header from the request */
    const authHeader = req.headers.authorization;

    /* Check if Authorization header is present */
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    /* Extracting base64 encoded credentials from Authorization header */
    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
    const [email, password] = decodedCredentials.split(':');

    /* Retrieving user from database */
    const user = await dbClient.client.db().collection('users').findOne({ email, password: sha1(password) });

    /* Check if user exists */
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    /* Generate random token using uuidv4 */
    const token = uuidv4();

    /* Create key and store user ID in Redis for 24 hours */
    const key = `auth_${token}`;
    await redisClient.client.set(key, user._id.toString(), 24 * 60 * 60); /* 24 hours expiry */

    /* Return token */
    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.client.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.client.del(key);

    res.status(204).end();
  }
}

module.exports = AuthController;
