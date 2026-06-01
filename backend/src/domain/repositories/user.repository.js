import User from '../../infrastructure/database/models/user.model.js';

/**
 * UserRepository class encapsulates all direct database access queries and operations 
 * for the User entity, maintaining strict architectural layer boundaries.
 */
class UserRepository {
  /**
   * Resolve a user profile using their email identifier
   * @param {string} email - Targeted email address
   * @param {boolean} [selectPassword=false] - Explicitly fetch hidden password hashes if required
   */
  async findByEmail(email, selectPassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (selectPassword) {
      query.select('+password');
    }
    return query.exec();
  }

  /**
   * Resolve a user profile using their custom high-entropy unique userId
   * @param {string} userId - High-entropy domain identifier
   */
  async findById(userId) {
    return User.findOne({ userId }).exec();
  }

  /**
   * Resolve a user profile using Mongoose ObjectID
   * @param {string} mongoId - Mongoose _id identifier
   */
  async findByMongoId(mongoId) {
    return User.findById(mongoId).exec();
  }

  /**
   * Save a newly created user into the database
   * @param {Object} userData - Input data payload matching user schema requirements
   */
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  /**
   * Update details of an existing user profile
   * @param {string} userId - High-entropy domain identifier
   * @param {Object} updateData - Object containing attributes to update
   */
  async update(userId, updateData) {
    return User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Attach a cryptographically safe refresh token to a user's account session
   * @param {string} userId - High-entropy domain identifier
   * @param {string} token - Cryptographically secure refresh token string
   */
  async saveRefreshToken(userId, token) {
    return User.findOneAndUpdate(
      { userId },
      { $set: { refreshToken: token } },
      { new: true }
    ).exec();
  }

  /**
   * Delete active refresh tokens from a user session (on Logout)
   * @param {string} userId - High-entropy domain identifier
   */
  async clearRefreshToken(userId) {
    return User.findOneAndUpdate(
      { userId },
      { $unset: { refreshToken: 1 } },
      { new: true }
    ).exec();
  }

  /**
   * Retrieve stored refresh token for validation
   * @param {string} userId - High-entropy domain identifier
   */
  async getRefreshToken(userId) {
    const user = await User.findOne({ userId }).select('+refreshToken').exec();
    return user ? user.refreshToken : null;
  }
}

export default new UserRepository();
export { UserRepository };
