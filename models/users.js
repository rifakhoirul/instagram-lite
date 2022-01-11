'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Users.hasOne(models.Profile)
      Users.hasMany(models.Posts)
      Users.hasMany(models.Comments)
      Users.hasMany(models.Notifications)
    }
  };
  Users.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    username: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};