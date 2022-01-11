'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Profile.belongsTo(models.Users)
    }
  };
  Profile.init({
    name: DataTypes.STRING,
    bio: DataTypes.TEXT,
    following: DataTypes.ARRAY(DataTypes.INTEGER),
    followers: DataTypes.ARRAY(DataTypes.INTEGER),
    website: DataTypes.STRING,
    profilepic: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Profile',
  });
  return Profile;
};