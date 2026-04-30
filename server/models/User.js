const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
        type: String,
        enum: ['creator', 'brand', 'admin'],
        required: [true, 'Role is required'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
},
    { timestamps: true }
);

//hash password before saving
userSchema.pre('save', async function () {
    if(!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
});

//compare password method 
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); 
    
}

module.exports = mongoose.model("User", userSchema);