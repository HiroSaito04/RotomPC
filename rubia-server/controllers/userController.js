const User = require('../models/User');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const validateUserInput = (data, isUpdate = false) => {
  const errors = [];
  const nameRegex = /^[A-Za-z\s\-']+$/;
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;':",./<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;':",./<>?]{8,72}$/;

  // 1. Personal Information Validation
  if (!isUpdate || data.firstName !== undefined) {
    if (!data.firstName || data.firstName.trim().length < 2 || data.firstName.length > 50 || !nameRegex.test(data.firstName)) 
      errors.push("Invalid First Name (2-50 chars, no numbers).");
  }
  
  if (!isUpdate || data.lastName !== undefined) {
    if (!data.lastName || data.lastName.trim().length < 2 || data.lastName.length > 50 || !nameRegex.test(data.lastName)) 
      errors.push("Invalid Last Name (2-50 chars, no numbers).");
  }
  
  if (!isUpdate || data.age !== undefined) {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) 
      errors.push("Age must be a number between 18 and 100.");
  }
  
  if (!isUpdate || data.gender !== undefined) {
    if (!['male', 'female', 'other'].includes(data.gender?.toLowerCase())) 
      errors.push("Gender must be Male, Female, or Other.");
  }

  // 2. Contact & Account Validation
  if (!isUpdate || data.contactNumber !== undefined) {
    if (!/^09\d{9}$/.test(data.contactNumber)) 
      errors.push("Contact Number must be 11 digits starting with 09.");
  }
  
  if (!isUpdate || data.email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) 
      errors.push("Invalid Email format.");
  }
  
  if (!isUpdate || data.username !== undefined) {
    if (data.username && (data.username.length < 3 || data.username.length > 30 || !usernameRegex.test(data.username)))
      errors.push("Username must be 3-30 alphanumeric characters/dots/underscores.");
  }

  // 3. Conditional Password Validation
  if (isUpdate) {
    if (data.password && data.password.length < 8) {
      errors.push("The new updated password must be at least 8 characters long.");
    }
  } else {
    if (!data.password || !passwordRegex.test(data.password)) {
      errors.push("Password must be 8-72 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
  }

  return errors;
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); 
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    let { firstName, lastName, email, password, username, age, gender, contactNumber } = req.body;

    const validationErrors = validateUserInput(req.body, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(" ") });
    }

    email = email.toLowerCase().trim();
    firstName = firstName.trim();
    lastName = lastName.trim();
    const finalUsername = (username || `${firstName}${lastName}${Math.floor(100 + Math.random() * 900)}`)
                            .toLowerCase().replace(/\s/g, '');

    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      username: finalUsername,
      age: parseInt(age),
      gender: gender.toLowerCase(),
      contactNumber,
      role: req.body.role || 'trainer', 
      address: req.body.address || 'N/A',  
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    res.status(201).json({ message: "User created successfully", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const validationErrors = validateUserInput(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(" ") });
    }

    if (req.body.email) req.body.email = req.body.email.toLowerCase().trim();
    if (req.body.firstName) req.body.firstName = req.body.firstName.trim();
    if (req.body.lastName) req.body.lastName = req.body.lastName.trim();

    if (req.body.password && req.body.password.trim() !== '') {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    } else {
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after'});
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    let requestingUserId = req.headers['x-user-id'];

    if (requestingUserId === 'null' || requestingUserId === 'undefined') {
      requestingUserId = null;
    }

    if (!requestingUserId) {
      return res.status(400).json({ message: "Action Denied: Missing Admin Identity Header." });
    }

    if (requestingUserId === targetUserId) {
      return res.status(400).json({ message: "Action Denied: You cannot delete your own account from this session dashboard." });
    }

    const deletedUser = await User.findByIdAndDelete(targetUserId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User record not found.' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body; 

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email } 
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login successful', 
      token, 
      id: user._id,
      username: user.username,
      role: user.role, 
      firstName: user.firstName,
      gender: user.gender
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, loginUser };