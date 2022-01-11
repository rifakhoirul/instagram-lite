'use strict';

const users = require("../models/users");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      bio: {
        type: Sequelize.TEXT
      },
      following: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
      },
      followers: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
      },
      website: {
        type: Sequelize.STRING
      },
      profilepic: {
        type: Sequelize.JSON,
        defaultValue: {
          name:'default-profile-picture.png',
          type:'image/png',
          location:'/images/default-profile-picture.png'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'cascade',
        onDelete: 'cascade'
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Profiles');
  }
};