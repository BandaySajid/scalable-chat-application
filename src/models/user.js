const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../db_config/mysql');
const bcrypt = require('bcrypt');
const Post = require('./post');
const Like = require('./like');

const User = sequelize.define('user', {
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        unique: true
    },

    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,

        validate: {
            len: [6, 20]
        },
    }

}, {
});

Post.belongsTo(User, {
    foreignKey: {
        name: 'userId'
    }
});

User.hasMany(Post, {
    as: 'posts',
    foreignKey: 'userId'
});

Like.belongsTo(Post, {
    foreignKey: {
        name: 'postId'
    }
});

Like.belongsTo(User, {
    foreignKey: {
        name: 'userId'
    }
});

Post.hasMany(Like, {
    as: 'likes',
    foreignKey: 'postId'
});


User.beforeCreate(async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
});

User.prototype.compareHash = async function (plainPassword) {
    const user = this;
    const isValidPassword = await bcrypt.compare(plainPassword, user.getDataValue('password'));
    if (!isValidPassword) {
        throw new Error('user details are wrong !')
    }

    return user;

};

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
    }
});

(async () => {
    await sequelize.sync({ force: false });
})();
module.exports = User;