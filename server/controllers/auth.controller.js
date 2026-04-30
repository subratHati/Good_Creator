const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { validationResult } = require("express-validator");

//POST /api/auth/register
const register = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { email, password, role} = req.body;

    try {
        const userExist = await User.findOne({email});
        if(userExist){
            return res.status(400).json({message: 'User already exists with this email'});

        }

        const user = await User.create({
            email,
            password,
            role,
        });

        res.status(201).json({
            message:"Account created successfully",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error('Register error:', error.message);
          console.error('Full stack:', error.stack);
        res.status(500).json({message: 'Server error during user registration'});
    }
}

//POST /api/auth/login
const login = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user){
            return res.status(401).json({ message: 'Invalid email address'});
        }

        if(!user.isActive){
            return res.status(403).json({ message: 'Account has been deactivated'});

        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(401).json({ message: 'Invalid email or password'});
        }

        res.json({
            message: 'Login Successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

//GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { register, login, getMe };
