import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});

// Format the object before sending it to the frontend
userSchema.set('toJSON', {
  transform: (document, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // CRITICAL: The password hash must NEVER be revealed to the frontend!
    delete returnedObject.passwordHash;
  }
});

const User = mongoose.model('User', userSchema);
export default User;