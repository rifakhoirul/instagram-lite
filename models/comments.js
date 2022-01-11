'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comments.belongsTo(models.Users)
      Comments.belongsTo(models.Users)
    }
  };
  Comments.init({
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Comments',
  });
  return Comments;
};