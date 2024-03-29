const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    /* Check if email and password are provided */
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      /* Check if the email already exists in the database */
      const existingUser = await dbClient.client.db().collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      /* Hash the password using SHA1 */
      const hashedPassword = sha1(password);

      /* Create the new user document */
      const newUser = {
        email,
        password: hashedPassword,
      };

      /* Insert the new user into the database */
      const result = await dbClient.client.db().collection('users').insertOne(newUser);

      /* Return the new user with only email and id */
      const insertedUser = {
        email: result.ops[0].email,
        id: result.insertedId,
      };

      res.status(201).json(insertedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.client.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.db().collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ email: user.email, id: user._id });

  }
  }

module.exports = UsersController;
