const bcrypt = require('bcryptjs') // 載入 bcrypt
const db = require('../models')
const { User, Comment, Restaurant } = db
const { imgurFileHandler } = require('../helpers/file-helpers') // 將 file-helper 載進來
const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => { // 修改這裡
    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')

    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10) // 前面加 return
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！') // 並顯示成功訊息
        res.redirect('/signin')
      })
      .catch(err => next(err)) // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res, next) => {
    Promise.all([
      User.findByPk(req.params.id, {
        raw: true,
        nest: true
      }),
      Comment.findAndCountAll({
        where: { userId: req.params.id },
        include: Restaurant,
        raw: true,
        nest: true
      })
    ])
      .then(([user, comment]) => {
        console.log(user)
        console.log(comment)
        res.render('profile', { user, comment })
      })

      // .then(user => {
      //   console.log(user)
      //   res.render('profile', { user: user.toJSON() })
      // })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id, {
      nest: true,
      raw: true
    })
      .then(user => {
        res.render('edit-profile', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    const { name } = req.body
    console.log(req.body)
    if (!name) throw new Error('User name is required!')

    const { file } = req // 把檔案取出來
    Promise.all([ // 非同步處理
      User.findByPk(req.params.id), // 去資料庫查有沒有這使用者
      imgurFileHandler(file) // 把檔案傳到 file-helper 處理
    ])
      .then(([user, filePath]) => { // 以上兩樣事都做完以後
        if (!user) throw new Error("User didn't exist!")
        return user.update({
          name,
          image: filePath || user.image // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 False (使用者沒有新動作) 就延用原本資料庫內的值
        })
      })
      .then(() => {
        req.flash('success_messages', 'user profile was successfully to update')
        res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  }
}
module.exports = userController
