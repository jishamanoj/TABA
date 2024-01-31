const express= require('express');
const router= express.Router();
const jwt= require('jsonwebtoken');
const signup= require('../model/signup');
const admin= require('../model/admin');
require("dotenv").config();
const bcrypt= require("bcrypt");
const multer= require("multer");
const { MongoClient } = require('mongodb');
const axios = require('axios');
const verifyToken = require('../verifyToken');
const about = require('../model/about');


router.post('/login', async (req, res) => {
  try {
    console.log("login")
    const {userName, password } = req.body;
    console.log(req.body.userName,req.body.password)

    const user = await admin.findOne({ userName });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    
    return res.status(200).json({ message: 'login successful'});
   
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/list-new-users', async (req, res) => {
  try {
    console.log("listing users")
    const users = await signup.find({isRegisteredUser:false}, 'regNo phone image firstName lastName email DOB address officeAddress clerkName clerkPhone bloodGroup welfareMember pincode district state whatsAppno enrollmentDate');

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        DOB: user.DOB,
        address: user.address,
        officeAddress: user.officeAddress,
        clerkName: user.clerkName,
        clerkPhone: user.clerkPhone,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        enrollmentDate: user.enrollmentDate,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        whatsAppno: user.whatsAppno,
        
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/list-valid-users', async (req, res) => {
  try {
    console.log("listing users")
    const users = await signup.find({isRegisteredUser:true}, 'regNo phone image firstName lastName email DOB address officeAddress clerkName clerkPhone bloodGroup welfareMember pincode district state whatsAppno enrollmentDate');

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        DOB: user.DOB,
        address: user.address,
        officeAddress: user.officeAddress,
        clerkName: user.clerkName,
        clerkPhone: user.clerkPhone,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        enrollmentDate: user.enrollmentDate,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        whatsAppno: user.whatsAppno,
        
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/delete/:regNo', async (req, res) => {
  const regNoToDelete = req.params.regNo;

  try {
    const deletedUser = await signup.findOneAndDelete({ regNo: regNoToDelete });

    if (deletedUser) {
      return res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/validUsers', async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty user IDs' });
  }

  try {
    const updateResult = await signup.updateMany(
      { _id: { $in: userIds } },
      { $set: { isRegisteredUser: true } }
    );

    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    res.status(200).json({ message: 'User validation successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5000 * 1024, // 50 KB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are allowed'), false)
    }
  },
});
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      console.log("uploading............waiting for response....");
      const {name,description} = req.body;

  
      const newUser = new about({
        name,
        description
      });

      
      if (req.file) {
        newUser.image = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          name: req.file.originalname, 
        };
      }

      await newUser.save();

      res.status(200).json({ message: 'data added successfully'});
    } catch (error) {

      if (err instanceof multer.MulterError == false) {
        console.log("...........error..................." ,err);
        return res.status(404).json({ message: 'Only JPEG images are allowed',err});
       
        
      } else if (err instanceof multer.MulterError == true) {
        return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
});

module.exports=router;