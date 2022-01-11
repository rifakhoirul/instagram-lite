var express = require('express');
var router = express.Router();
var models = require('../models');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

router.get('/', async function (req, res, next) {
  if (req.session.user) {
    res.redirect("/home")
  }
  res.render('index', {
    infoFailed: req.flash('infoFailed')
  });
});

router.post('/signup', async function (req, res, next) {
  bcrypt.hash(req.body.newPassword, saltRounds, async function (err, hash) {
    if (err) return res.send(err)
    try {
      await models.Users.create({
        email: req.body.newEmail,
        password: hash,
        username: req.body.newUsername
      });
      const profileUserId = await models.Users.findAll({
        where: {
          username: req.body.newUsername
        }
      })
      await models.Profile.create({
        UserId: profileUserId[0].dataValues.id
      })
    } catch (error) {
      console.log(error)
      res.status(500).json(error)
    }
  });
  return;
})

router.post('/auth', async function (req, res, next) {
  try {
    const users = await models.Users.findAll({
      where: {
        email: req.body.inputEmail
      }
    });
    if (users.length == 0) {
      req.flash('infoFailed', 'User not found.');
      return res.redirect('/')
    }
    bcrypt.compare(req.body.inputPassword, users[0].dataValues.password, function (err, result) {
      if (err) return res.send('Login failed')
      if (!result) {
        req.flash('infoFailed', 'Wrong password.');
        return res.redirect('/');
      }
      req.session.user = users[0].dataValues;
      res.redirect('/home')
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

router.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    res.redirect('/');
  })
});

let limitter,offsetter
router.get('/home', checkLogIn, async function (req, res, next) {
  limitter = 3
  offsetter = 0
  try {
    let posts = await models.Posts.findAll({
      include: {
        model: models.Users,
        include: {
          model: models.Profile,
        }
      },
      order: [['id', 'DESC']],
      limit: limitter,
      offset: offsetter
    });
    let comments = await models.Comments.findAll({
      include: [{
        model: models.Users,
        include: {
          model: models.Profile,
        }
      }],
      order: [['id', 'ASC']]
    })
    let profilePic = await models.Profile.findAll({
      where:{
        UserId: req.session.user.id
      }
    });
    res.render('home', {
      title: 'Home',
      posts,
      comments,
      usernameLogged: req.session.user.username,
      useridLogged: req.session.user.id,
      url: req.url,
      commentLimitter:0,
      profilePic:profilePic[0].dataValues.profilepic.location
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.get('/timeline', checkLogIn, async function (req, res, next) {
  offsetter += 3;
  try {
    let posts = await models.Posts.findAll({
      include: {
        model: models.Users,
        include: {
          model: models.Profile,
        }
      },
      order: [['id', 'DESC']],
      limit: limitter,
      offset: offsetter
    });
    let comments = await models.Comments.findAll({
      include: [{
        model: models.Users,
        include: {
          model: models.Profile,
        }
      }],
      order: [['id', 'ASC']]
    })
    res.json({
      title: 'Home',
      posts,
      comments,
      usernameLogged: req.session.user.username,
      useridLogged: req.session.user.id,
      url: req.url,
      offsetter,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.post('/add', checkLogIn, async function (req, res, next) {
  let jsonFiles = [];
  if (!req.files || Object.keys(req.files).length === 0) {
    jsonFiles = null
  } else {
    for (let i = 0; i < Object.keys(req.files).length; i++) {
      let uploadFile = Object.values(req.files)[i];
      let fileName = Date.now() + uploadFile.name;
      let jsonFile = { name: fileName, type: uploadFile.mimetype, location: `/uploads/${fileName}` };
      jsonFiles.push(jsonFile);
      let uploadPath = path.join(__dirname, `../public/uploads/`) + fileName;
      uploadFile.mv(uploadPath, function (err) {
        if (err)
          return res.status(500).send(err);
      });
    }
  }
  try {
    await models.Posts.create({
      caption: req.body.caption,
      file: jsonFiles,
      UserId: req.session.user.id
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
  res.redirect('/home');
});

router.get('/profile/:id', checkLogIn, async function (req, res, next) {
  try {
    let posts = await models.Posts.findAll({
      include: [{
        model: models.Users,
        where: {
          username: req.params.id
        }
      }],
      order: [['id', 'DESC']]
    });
    let profile = await models.Profile.findAll({
      include: [{
        model: models.Users,
        where: {
          username: req.params.id
        }
      }],
    });
    console.log(profile[0].dataValues.id)
    console.log(profile[0].dataValues.name)
    let profilePic = await models.Profile.findAll({
      where:{
        UserId: req.session.user.id
      }
    });
    res.render('profile', {
      title: req.params.id,
      posts,
      profile,
      username: req.params.id,
      usernameLogged: req.session.user.username,
      url: req.url,
      profilePic:profilePic[0].dataValues.profilepic.location
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.post('/profile/:id', checkLogIn, async function (req, res, next) {
  let jsonFile;
  if (!req.files || Object.keys(req.files).length === 0) {
    jsonFile = {
      name: 'default-profile-picture.png',
      type: 'image/png',
      location: '/images/default-profile-picture.png'
    };
  } else {
    let uploadFile = Object.values(req.files)[0];
    let fileName = Date.now() + uploadFile.name;
    jsonFile = { name: fileName, type: uploadFile.mimetype, location: `/uploads/${fileName}` };
    let uploadPath = path.join(__dirname, `../public/uploads/`) + fileName;
    uploadFile.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);
    });
  }

  try {
    await models.Profile.update({
      name: req.body.editName,
      bio: req.body.editBio,
      website: req.body.editWebsite,
      profilepic: jsonFile,
    }, {
      where: {
        UserId: req.session.user.id
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
  res.redirect(`/profile/${req.params.id}`);
});

router.get('/posts/:id', checkLogIn, async function (req, res, next) {
  limitter = 5
  offsetter = 0
  try {
    let posts = await models.Posts.findAll({
      where: {
        id: req.params.id
      },
      include: [{
        model: models.Users,
        include: {
          model: models.Profile,
        }
      }],
    });
    let comments = await models.Comments.findAll({
      where: {
        PostId: req.params.id
      },
      include: [{
        model: models.Users,
        include: {
          model: models.Profile,
        },
      }],
      limit:limitter,
      offset:offsetter,
      order: [['id', 'DESC']]
    })
    let commentsLength = await models.Comments.findAll({
      where: {
        PostId: req.params.id
      },
    })
    commentsLength = commentsLength.length
    let profilePic = await models.Profile.findAll({
      where:{
        UserId: req.session.user.id
      }
    });
    res.render('posts', {
      title: 'Post',
      usernameLogged: req.session.user.username,
      useridLogged: req.session.user.id,
      posts: posts[0],
      comments,
      commentsLength,
      url: req.url,
      profilePic:profilePic[0].dataValues.profilepic.location
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.get('/commentpage/:id', checkLogIn, async function (req, res, next) {
  offsetter += 5;
  try {
    let comments = await models.Comments.findAll({
      where: {
        PostId: req.params.id
      },
      include: [{
        model: models.Users,
        include: {
          model: models.Profile,
        },
      }],
      limit:limitter,
      offset:offsetter,
      order: [['id', 'DESC']]
    })
    
    res.json({
      comments,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.get('/likes', checkLogIn, async function (req, res, next) {
  try {
    let posts = await models.Posts.findAll({
      where: {
        id: req.query.postId
      },
    });
    let editLikes = posts[0].dataValues.likes
    if (req.query.option == 'remove') {
      editLikes.splice(editLikes.indexOf(req.session.user.id), 1)
    } else {
      if (editLikes) {
        editLikes.push(req.session.user.id)
      } else {
        editLikes = [req.session.user.id]
      }
    }
    await models.Posts.update({
      likes: editLikes,
    }, {
      where: {
        id: req.query.postId
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.get('/comment', checkLogIn, async function (req, res, next) {
  try {
    await models.Comments.create({
      comment: req.query.addComment,
      PostId: req.query.postId,
      UserId: req.session.user.id,
    });
    let user = await models.Profile.findAll({
      where:{
        UserId: req.session.user.id
      }
    });
    res.json({
      username: req.session.user.username,
      user
    })
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

router.get('/deletepost/:id', checkLogIn, async function (req, res, next) {
  try {
    await models.Posts.destroy({
      where: {
        id: req.params.id
      }
    });
    res.redirect('/home')
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
});

module.exports = router;

function checkLogIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }

};